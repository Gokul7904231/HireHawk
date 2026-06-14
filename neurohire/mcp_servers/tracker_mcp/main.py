import os
from fastapi import FastAPI, HTTPException
from mcp.server.fastmcp import FastMCP
from typing import Optional
import tools

# Initialize FastAPI application
app = FastAPI(title="tracker-mcp", version="1.0.0")

# Initialize FastMCP server
mcp = FastMCP("tracker-mcp")

# --- FastMCP Tool Registrations ---

@mcp.tool(name="add_application")
async def add_application_tool(
    company: str,
    role: str,
    jd_url: str = None,
    fit_score: float = None,
    resume_version: str = None,
    notes: str = None
) -> dict:
    """
    Add a new job application to the tracker database.
    """
    return await tools.add_application(
        company=company,
        role=role,
        jd_url=jd_url,
        fit_score=fit_score,
        resume_version=resume_version,
        notes=notes
    )

@mcp.tool(name="update_status")
async def update_status_tool(app_id: str, status: str) -> dict:
    """
    Update the status of an existing job application.
    Expected status values: 'applied', 'interview', 'rejected', 'offer', 'follow_up_due'.
    """
    return await tools.update_status(app_id=app_id, status=status)

@mcp.tool(name="get_applications")
async def get_applications_tool(status_filter: str = None, limit: int = 50) -> list:
    """
    List job applications, optionally filtered by status (e.g. 'interview', 'applied').
    """
    return await tools.get_applications(status_filter=status_filter, limit=limit)

@mcp.tool(name="get_followups_due")
async def get_followups_due_tool(days_threshold: int = 7) -> list:
    """
    Get applications that are overdue for a follow-up, based on days since last activity.
    """
    return await tools.get_followups_due(days_threshold=days_threshold)

@mcp.tool(name="log_event")
async def log_event_tool(app_id: str, event_type: str, note: str = None) -> dict:
    """
    Log an event (like email_sent or phone_screen) associated with an application.
    """
    return await tools.log_event(app_id=app_id, event_type=event_type, note=note)

@mcp.tool(name="save_draft")
async def save_draft_tool(app_id: str, draft_type: str, content: str) -> dict:
    """
    Save generated outreach materials as a draft.
    Expected draft_type values: 'cold_email', 'referral_message', 'cover_letter'.
    """
    return await tools.save_draft(app_id=app_id, draft_type=draft_type, content=content)

@mcp.tool(name="get_stats")
async def get_stats_tool() -> dict:
    """
    Get aggregated application metrics (totals, counts by status, average fit score).
    """
    return await tools.get_stats()


# --- Standard REST Endpoints for Integration ---

@app.post("/add_application")
async def add_application_endpoint(payload: dict):
    res = await tools.add_application(
        company=payload.get("company", ""),
        role=payload.get("role", ""),
        jd_url=payload.get("jd_url"),
        fit_score=payload.get("fit_score"),
        resume_version=payload.get("resume_version"),
        notes=payload.get("notes")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/update_status")
async def update_status_endpoint(payload: dict):
    res = await tools.update_status(
        app_id=payload.get("app_id", ""),
        status=payload.get("status", "")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/applications")
async def get_applications_endpoint(status_filter: Optional[str] = None, limit: int = 50):
    res = await tools.get_applications(status_filter=status_filter, limit=limit)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/followups_due")
async def get_followups_due_endpoint(days_threshold: int = 7):
    res = await tools.get_followups_due(days_threshold=days_threshold)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/log_event")
async def log_event_endpoint(payload: dict):
    res = await tools.log_event(
        app_id=payload.get("app_id", ""),
        event_type=payload.get("event_type", ""),
        note=payload.get("note")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/save_draft")
async def save_draft_endpoint(payload: dict):
    res = await tools.save_draft(
        app_id=payload.get("app_id", ""),
        draft_type=payload.get("draft_type", ""),
        content=payload.get("content", "")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/stats")
async def get_stats_endpoint():
    res = await tools.get_stats()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "server": "tracker-mcp",
        "circuit_breakers": {
            "supabase": tools.supabase_breaker.state
        }
    }

@app.get("/")
async def health():
    """
    Standard HTTP health check endpoint.
    """
    return {"status": "ok", "server": "tracker-mcp"}

# Mount FastMCP SSE application onto FastAPI AFTER standard routes to avoid shadowing
app.mount("/", mcp.sse_app())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8003))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
