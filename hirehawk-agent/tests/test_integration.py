import pytest
import httpx
import asyncio
from httpx import ASGITransport
from api.server import app

@pytest.mark.asyncio
async def test_api_endpoints():
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Trigger the graph run
        print("\nTriggering graph run via API /run...")
        res = await client.post("/run", json={"jd_raw": "FastAPI developer needed"})
        assert res.status_code == 200
        data = res.json()
        assert "run_id" in data
        run_id = data["run_id"]
        
        # Wait for background execution to hit breakpoint
        await asyncio.sleep(3.0)
        
        # 2. Retrieve status
        print("Retrieving status via API /status...")
        status_res = await client.get(f"/status/{run_id}")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert status_data["current_phase"] in [
            "write_outreach", "track_application", "starting",
            "parse_jd", "tailor_resume", "get_company_intel", "score_fit", "start"
        ]
        
        # 3. Approve HITL checkpoint
        print("Approving execution via API /approve...")
        approve_res = await client.post(f"/approve/{run_id}", json={"approved": True})
        assert approve_res.status_code == 200
        assert approve_res.json()["success"] is True
