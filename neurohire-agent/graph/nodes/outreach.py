from mcp_clients.outreach_client import OutreachClient
from graph.state import NeuroHireState

async def write_outreach_node(state: NeuroHireState) -> dict:
    jd_signals = state.get("jd_signals") or {}
    company_intel = state.get("company_intel") or {}
    profile = state.get("resume_profile") or {}
    
    # We pass the tailored_bullets as part of the profile or description to guide generation
    custom_profile = {**profile}
    if state.get("tailored_bullets"):
        custom_profile["tailored_bullets"] = state["tailored_bullets"]

    client = OutreachClient()
    outreach = await client.generate_outreach(jd_signals, company_intel, custom_profile)
    
    return {
        "outreach_draft": outreach
    }
