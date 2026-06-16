from mcp_clients.outreach_client import OutreachClient
from graph.state import HireHawkState

async def write_outreach_node(state: HireHawkState) -> dict:
    from memory.mem0_client import Mem0Client
    mem0 = Mem0Client()
    # Search memories for tone / style preferences
    memories = mem0.search_memories("communication style outreach tone", user_id="gokul_user")
    print(f"[write_outreach_node] Retrieved {len(memories)} memories from Mem0.")

    jd_signals = state.get("jd_signals") or {}
    company_intel = state.get("company_intel") or {}
    profile = state.get("resume_profile") or {}
    
    # We pass the tailored_bullets as part of the profile or description to guide generation
    custom_profile = {**profile}
    if state.get("tailored_bullets"):
        custom_profile["tailored_bullets"] = state["tailored_bullets"]
    
    # Append memory preferences if any exist
    if memories:
        custom_profile["memories"] = memories

    client = OutreachClient()
    outreach = await client.generate_outreach(jd_signals, company_intel, custom_profile)
    
    return {
        "outreach_draft": outreach
    }
