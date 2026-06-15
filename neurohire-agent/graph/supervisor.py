from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from graph.state import NeuroHireState
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("graph.supervisor")

# Import nodes
from graph.nodes.jd_parser import parse_jd_node
from graph.nodes.resume_tailor import tailor_resume_node
from graph.nodes.company_intel import get_company_intel_node
from graph.nodes.fit_scorer import score_fit_node
from graph.nodes.outreach import write_outreach_node
from graph.nodes.tracker import track_application_node

def wrap_node(node_fn, node_name):
    async def wrapped(state: NeuroHireState):
        logger.info(f"Executing node: {node_name}")
        state["current_phase"] = node_name
        attempts = 0
        max_retries = 2
        last_error = None
        
        while attempts <= max_retries:
            try:
                res = await node_fn(state)
                if isinstance(res, dict):
                    res["current_phase"] = node_name
                
                # Trace node execution in Langfuse
                try:
                    from observability.langfuse_client import LangfuseTraceLogger
                    run_id = state.get("run_id") or "default_run_id"
                    LangfuseTraceLogger().log_node_execution(run_id, node_name, state, res or {})
                except Exception as trace_err:
                    logger.warning(f"Failed to log trace for node {node_name}: {trace_err}")

                return res
            except Exception as e:
                attempts += 1
                last_error = e
                logger.warning(f"Error in node '{node_name}' (attempt {attempts}): {str(e)}")
                if attempts > max_retries:
                    break
                time.sleep(0.1 * attempts)
                
        error_msg = f"Node '{node_name}' failed after {max_retries} retries: {str(last_error)}"
        err_log = list(state.get("error_log") or [])
        err_log.append(error_msg)
        return {"error_log": err_log, "current_phase": f"{node_name}_failed"}
        
    return wrapped

# Create state graph
workflow = StateGraph(NeuroHireState)

# Add wrapped nodes
workflow.add_node("parse_jd", wrap_node(parse_jd_node, "parse_jd"))
workflow.add_node("tailor_resume", wrap_node(tailor_resume_node, "tailor_resume"))
workflow.add_node("get_company_intel", wrap_node(get_company_intel_node, "get_company_intel"))
workflow.add_node("score_fit", wrap_node(score_fit_node, "score_fit"))
workflow.add_node("write_outreach", wrap_node(write_outreach_node, "write_outreach"))
workflow.add_node("track_application", wrap_node(track_application_node, "track_application"))

# Edge mappings
workflow.set_entry_point("parse_jd")

# Parallel fan-out
workflow.add_edge("parse_jd", "tailor_resume")
workflow.add_edge("parse_jd", "get_company_intel")
workflow.add_edge("parse_jd", "score_fit")

# Fan-in join to write_outreach
workflow.add_edge("tailor_resume", "write_outreach")
workflow.add_edge("get_company_intel", "write_outreach")
workflow.add_edge("score_fit", "write_outreach")

# Next phase: track_application (FastAPI will check breakpoint here)
workflow.add_edge("write_outreach", "track_application")
workflow.add_edge("track_application", END)

# In-memory checkpointer
checkpointer = MemorySaver()

# Compile graph with breakpoint before database track
app = workflow.compile(
    checkpointer=checkpointer,
    interrupt_before=["track_application"]
)
