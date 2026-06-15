from mcp_clients.company_intel_client import CompanyIntelClient
from graph.state import NeuroHireState

async def get_company_intel_node(state: NeuroHireState) -> dict:
    jd_signals = state.get("jd_signals") or {}
    company_name = jd_signals.get("company_name", "unknown")
    
    client = CompanyIntelClient()
    intel = await client.get_company_intel(company_name)
    
    return {
        "company_intel": intel
    }
