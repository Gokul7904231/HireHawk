import os
import httpx
from mcp_clients.fixtures import MOCK_TAILOR_OUTPUT

class OutreachClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("OUTREACH_MCP_URL", "http://localhost:8005")

    async def generate_outreach(self, jd_signals: dict, company_intel: dict, profile: dict) -> dict:
        if os.getenv("MCP_MOCK", "true").lower() == "true":
            # Map fixtures matching expected outreach shape
            return {
                "cold_email": MOCK_TAILOR_OUTPUT["cold_email"],
                "cover_letter_paragraphs": MOCK_TAILOR_OUTPUT["cover_letter_paragraphs"],
                "referral_message": MOCK_TAILOR_OUTPUT["referral_message"]
            }
            
        async with httpx.AsyncClient() as client:
            payload = {
                "jd_signals": jd_signals,
                "company_intel": company_intel,
                "profile": profile
            }
            res = await client.post(f"{self.base_url}/generate_cold_email", json=payload)
            res.raise_for_status()
            cold_email = res.json()
            
            # Follow-up requests for cover letter and referral message
            cl_res = await client.post(f"{self.base_url}/generate_cover_letter", json=payload)
            cover_letter = cl_res.json() if cl_res.status_code == 200 else {"paragraphs": []}
            
            ref_res = await client.post(f"{self.base_url}/generate_referral_request", json=payload)
            referral = ref_res.json() if ref_res.status_code == 200 else {"body": ""}
            
            return {
                "cold_email": cold_email,
                "cover_letter_paragraphs": cover_letter.get("paragraphs", []),
                "referral_message": referral.get("body", "")
            }
