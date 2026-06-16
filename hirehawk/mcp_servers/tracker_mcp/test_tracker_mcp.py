import pytest
import os
import json
from mcp_servers.tracker_mcp import tools
from mcp_servers.tracker_mcp.mock_db import MOCK_DB_PATH

@pytest.fixture(autouse=True)
def clean_mock_db():
    # Clear mock DB before each test
    if os.path.exists(MOCK_DB_PATH):
        try:
            os.remove(MOCK_DB_PATH)
        except Exception:
            pass
    # Reset tools.mock_db state directly to avoid dual-module import mismatch
    if hasattr(tools, 'mock_db'):
        tools.mock_db.data = {"applications": [], "events": [], "drafts": []}
        tools.mock_db.save()

@pytest.mark.asyncio
async def test_tracker_flow():
    # 1. add_application
    add_res = await tools.add_application(
        company="Breathe ESG",
        role="AI Engineer Intern",
        fit_score=0.91
    )
    assert add_res["success"] is True
    app_id = add_res["id"]
    assert app_id is not None
    
    # 2. get_applications
    apps = await tools.get_applications()
    assert isinstance(apps, list)
    assert len(apps) == 1
    assert apps[0]["id"] == app_id
    assert apps[0]["company"] == "Breathe ESG"
    assert apps[0]["role"] == "AI Engineer Intern"
    assert apps[0]["fit_score"] == 0.91
    assert apps[0]["status"] == "applied"
    
    # 3. update_status to interview
    update_res = await tools.update_status(app_id, "interview")
    assert update_res["success"] is True
    
    # Verify status is updated
    apps_updated = await tools.get_applications()
    assert apps_updated[0]["status"] == "interview"
    
    # 4. get_followups_due (empty initially because it's just added)
    followups = await tools.get_followups_due(days_threshold=7)
    assert isinstance(followups, list)
    assert len(followups) == 0
    
    # 5. get_stats
    stats = await tools.get_stats()
    assert stats["total"] == 1
    assert stats["by_status"] == {"interview": 1}
    assert stats["avg_fit_score"] == 0.91
    assert stats["interviews"] == 1
