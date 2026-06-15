import os
import httpx
from graph.state import NeuroHireState
from mcp_clients.fixtures import MOCK_TAILOR_OUTPUT

async def tailor_resume_node(state: NeuroHireState) -> dict:
    from memory.mem0_client import Mem0Client
    mem0 = Mem0Client()
    # Scoped search using default mock user
    memories = mem0.search_memories("resume preferences", user_id="gokul_user")
    print(f"[resume_tailor_node] Retrieved {len(memories)} memories from Mem0.")

    if os.getenv("A2A_MOCK", "true").lower() == "true":
        return {
            "tailored_bullets": MOCK_TAILOR_OUTPUT["tailored_bullets"],
            "claims_trace": MOCK_TAILOR_OUTPUT["claims"],
            "hitl_approved": False
        }
        
    crew_port = os.getenv("CREW_PORT", "8001")
    url = f"http://localhost:{crew_port}/tailor"
    
    async with httpx.AsyncClient() as client:
        payload = {
            "jd_signals": state.get("jd_signals"),
            "profile": state.get("resume_profile"),
            "memories": memories
        }
        res = await client.post(url, json=payload, timeout=60.0)
        res.raise_for_status()
        data = res.json()
        return {
            "tailored_bullets": data.get("tailored_bullets"),
            "claims_trace": data.get("claims_trace") or data.get("claims"),
            "hitl_approved": False
        }
