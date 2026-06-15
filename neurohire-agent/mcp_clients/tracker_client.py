import os
import httpx
from mcp_clients.fixtures import MOCK_TRACKER_RESPONSE

class TrackerClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("TRACKER_MCP_URL", "http://localhost:8003")

    async def add_application(self, company: str, role: str, fit_score: float, resume_version: str) -> dict:
        if os.getenv("MCP_MOCK", "true").lower() == "true":
            return MOCK_TRACKER_RESPONSE
            
        async with httpx.AsyncClient() as client:
            payload = {
                "company": company,
                "role": role,
                "fit_score": fit_score,
                "resume_version": resume_version
            }
            res = await client.post(f"{self.base_url}/add_application", json=payload)
            res.raise_for_status()
            return res.json()
