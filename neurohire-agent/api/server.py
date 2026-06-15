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

server_app = FastAPI(title="HireHawk LangGraph Agentic Backend", version="1.0.0")

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

@server_app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "hirehawk-agent",
        "version": "1.0.0",
        "mock_mode": {
            "gemini": os.getenv("GEMINI_MOCK", "true"),
            "supabase": os.getenv("SUPABASE_MOCK", "true"),
            "mcp": os.getenv("MCP_MOCK", "true"),
            "a2a": os.getenv("A2A_MOCK", "true"),
        }
    }

@server_app.get("/profile")
async def get_profile():
    fixture_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "neurohire-copilot",
        "extension",
        "fixtures",
        "profile.json"
    )
    if os.path.exists(fixture_path):
        try:
            with open(fixture_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read profile fixture: {str(e)}")
            
    # Default fallback profile matching Gokul
    return {
        "name": "Gokul",
        "email": "gokul32499@gmail.com",
        "github": "https://github.com/Gokul7904231",
        "portfolio": "https://gokul-portfolio.vercel.app",
        "top_projects": [
            {
                "name": "Sentixcare",
                "description": "Multi-agent RAG workflow for analyzing medical records.",
                "live_url": "https://huggingface.co/spaces/Gokul7904231/sentixcare",
                "tags": ["FastAPI", "LangChain", "Qdrant", "Python", "RAG"]
            }
        ],
        "top_skills": ["Python", "Django", "FastAPI", "React", "TypeScript", "LangChain"],
        "experience_summary": "AI/ML Intern at Infosys, Full Stack Intern at Zidio"
    }

@server_app.post("/profile")
async def update_profile(payload: dict):
    fixture_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "neurohire-copilot",
        "extension",
        "fixtures",
        "profile.json"
    )
    try:
        os.makedirs(os.path.dirname(fixture_path), exist_ok=True)
        with open(fixture_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile fixture: {str(e)}")

    # Add experience summary and skills to mem0 memory
    try:
        from memory.mem0_client import Mem0Client
        mem0 = Mem0Client()
        name = payload.get("name", "Gokul")
        skills = payload.get("top_skills", [])
        if skills:
            skills_str = ", ".join(skills)
            mem0.add_memory(f"Candidate {name} top skills: {skills_str}", user_id="default_user")
            
        summary = payload.get("experience_summary", "")
        if summary:
            mem0.add_memory(f"Candidate {name} experience: {summary}", user_id="default_user")
    except Exception as e:
        # Don't fail the request if mem0 fails
        print(f"Mem0 client update failed: {e}")
        
    return {"success": True}

@server_app.get("/mcp_status")
async def mcp_status():
    import httpx
    # 5 local uvicorn servers setup in run_all_mock.ps1
    servers = {
        "resume-mcp": "http://localhost:8001/health",
        "jd-parser-mcp": "http://localhost:8002/health",
        "tracker-mcp": "http://localhost:8003/health",
        "company-intel-mcp": "http://localhost:8004/health",
        "outreach-mcp": "http://localhost:8005/health",
    }
    
    results = {}
    async with httpx.AsyncClient() as client:
        for name, url in servers.items():
            try:
                resp = await client.get(url, timeout=1.0)
                if resp.status_code == 200:
                    results[name] = "healthy"
                else:
                    results[name] = "unhealthy"
            except Exception:
                results[name] = "offline"
                
    return results

# Alias app for uvicorn lookup
app = server_app

