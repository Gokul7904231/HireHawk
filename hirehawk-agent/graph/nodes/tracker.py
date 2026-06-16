from mcp_clients.tracker_client import TrackerClient
from graph.state import HireHawkState

async def track_application_node(state: HireHawkState) -> dict:
    jd_signals = state.get("jd_signals") or {}
    company = jd_signals.get("company_name", "unknown")
    role = jd_signals.get("role_title", "unknown")
    fit_score = state.get("fit_score", 0.0)
    
    client = TrackerClient()
    res = await client.add_application(
        company=company,
        role=role,
        fit_score=fit_score,
        resume_version="Copilot LangGraph v1.0"
    )
    
    return {
        "tracker_id": res.get("id")
    }
