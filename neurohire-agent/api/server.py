import os
import json
import uuid
import asyncio
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

load_dotenv()

# Import the LangGraph application
from graph.supervisor import app as graph_app

server_app = FastAPI(title="NeuroHire LangGraph Agentic Backend", version="1.0.0")

# Enable CORS for worker/extension origin
server_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for queues and latest state snapshots
active_queues = {}
active_states = {}

async def run_graph_task(run_id: str, jd_raw: str, user_id: str):
    inputs = {
        "jd_raw": jd_raw,
        "jd_signals": None,
        "resume_profile": None,
        "tailored_bullets": None,
        "company_intel": None,
        "outreach_draft": None,
        "fit_score": None,
        "tracker_id": None,
        "claims_trace": None,
        "hitl_approved": False,
        "error_log": [],
        "current_phase": "start"
    }
    config = {"configurable": {"thread_id": run_id}}
    
    try:
        # Stream the nodes execution in LangGraph
        async for event in graph_app.astream(inputs, config):
            node_name = list(event.keys())[0]
            node_data = event[node_name]
            
            # Emit event to the SSE queue
            await active_queues[run_id].put({
                "event": "node_complete",
                "node": node_name,
                "data": node_data
            })
            
            state = await graph_app.aget_state(config)
            active_states[run_id] = state.values

        # Check if we hit the breakpoint pause
        state = await graph_app.aget_state(config)
        if state.next:
            await active_queues[run_id].put({
                "event": "hitl_paused",
                "node": state.next[0],
                "data": state.values
            })
        else:
            await active_queues[run_id].put({
                "event": "graph_complete",
                "data": state.values
            })
            await active_queues[run_id].put(None)
            
    except Exception as e:
        await active_queues[run_id].put({
            "event": "graph_error",
            "error": str(e)
        })
        await active_queues[run_id].put(None)

@server_app.post("/run")
async def run_graph(payload: dict, background_tasks: BackgroundTasks):
    jd_raw = payload.get("jd_raw")
    user_id = payload.get("user_id", "default_user")
    
    if not jd_raw:
        raise HTTPException(status_code=400, detail="Missing 'jd_raw' parameter in request body.")
        
    run_id = str(uuid.uuid4())
    active_queues[run_id] = asyncio.Queue()
    active_states[run_id] = {
        "jd_raw": jd_raw,
        "current_phase": "starting",
        "hitl_approved": False,
        "error_log": []
    }
    
    background_tasks.add_task(run_graph_task, run_id, jd_raw, user_id)
    return {"run_id": run_id}

@server_app.get("/stream/{run_id}")
async def stream_run(run_id: str):
    if run_id not in active_queues:
        raise HTTPException(status_code=404, detail="Run ID not found.")
        
    async def event_generator():
        queue = active_queues[run_id]
        while True:
            item = await queue.get()
            if item is None:
                # End of stream
                yield {"event": "close", "data": "stream complete"}
                break
            yield {
                "event": item["event"],
                "data": json.dumps(item)
            }
            
    return EventSourceResponse(event_generator())

@server_app.post("/approve/{run_id}")
async def approve_run(run_id: str, payload: dict, background_tasks: BackgroundTasks):
    if run_id not in active_queues:
        raise HTTPException(status_code=404, detail="Run ID not found.")
        
    approved = payload.get("approved", True)
    config = {"configurable": {"thread_id": run_id}}
    
    # Update state in checkpointer
    await graph_app.aupdate_state(config, {"hitl_approved": approved})
    
    async def resume_task():
        try:
            # Resume LangGraph streaming from breakpoint
            async for event in graph_app.astream(None, config):
                node_name = list(event.keys())[0]
                node_data = event[node_name]
                
                await active_queues[run_id].put({
                    "event": "node_complete",
                    "node": node_name,
                    "data": node_data
                })
                
                state = await graph_app.aget_state(config)
                active_states[run_id] = state.values
                
            state = await graph_app.aget_state(config)
            await active_queues[run_id].put({
                "event": "graph_complete",
                "data": state.values
            })
            await active_queues[run_id].put(None)
        except Exception as e:
            await active_queues[run_id].put({
                "event": "graph_error",
                "error": str(e)
            })
            await active_queues[run_id].put(None)
            
    background_tasks.add_task(resume_task)
    return {"success": True}

@server_app.get("/status/{run_id}")
async def status_run(run_id: str):
    if run_id not in active_states:
        raise HTTPException(status_code=404, detail="Run ID not found.")
    return active_states[run_id]

# Alias app for uvicorn lookup
app = server_app
