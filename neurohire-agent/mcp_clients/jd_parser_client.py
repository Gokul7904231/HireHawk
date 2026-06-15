import os
import httpx
from mcp_clients.fixtures import MOCK_JD_SIGNALS

class JDParserClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("JD_PARSER_MCP_URL", "http://localhost:8002")

    async def parse_jd_text(self, text: str) -> dict:
        if os.getenv("MCP_MOCK", "true").lower() == "true":
            return MOCK_JD_SIGNALS
            
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{self.base_url}/parse_jd_text", json={"text": text})
            res.raise_for_status()
            return res.json()
