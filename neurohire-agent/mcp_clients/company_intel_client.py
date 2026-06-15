import os
import httpx
from mcp_clients.fixtures import MOCK_COMPANY_INTEL

class CompanyIntelClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("COMPANY_INTEL_MCP_URL", "http://localhost:8004")

    async def get_company_intel(self, company_name: str) -> dict:
        if os.getenv("MCP_MOCK", "true").lower() == "true":
            return MOCK_COMPANY_INTEL
            
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{self.base_url}/get_company_intel", json={"company_name": company_name})
            res.raise_for_status()
            return res.json()
