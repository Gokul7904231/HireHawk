import pytest
import os
import json
from mcp_servers.outreach_mcp import tools
from mcp_servers.outreach_mcp import models
from mcp_servers.resume_mcp.config import PROFILE

# Resolve fixtures
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "fixtures"))
if not os.path.exists(FIXTURES_DIR):
    FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "fixtures"))

with open(os.path.join(FIXTURES_DIR, "sample_jd_signals.json"), "r") as f:
    sample_jd_signals = json.load(f)
    
with open(os.path.join(FIXTURES_DIR, "sample_company_intel.json"), "r") as f:
    sample_company_intel = json.load(f)

# Format profile matching ProfileInput model
sample_profile = {
    "name": PROFILE["name"],
    "email": PROFILE["email"],
    "github": PROFILE["github"],
    "portfolio": PROFILE["portfolio"],
    "top_projects": [
        {"name": "Sentixcare", "live_url": "huggingface.co/spaces/Gokul7904231/sentixcare", "github_url": "github.com/Gokul7904231/sentixcare"}
    ],
    "top_skills": ["Python", "Django", "React", "LangChain"],
    "experience_summary": "AI/ML Intern at Infosys, Full Stack Intern at Zidio"
}

@pytest.mark.asyncio
async def test_generate_cold_email():
    res = await tools.generate_cold_email(
        jd_signals=sample_jd_signals,
        company_intel=sample_company_intel,
        profile=sample_profile
    )
    assert res["word_count"] < 150
    assert "Sentixcare" in res["body"]
    models.ColdEmailOutput(**res)

@pytest.mark.asyncio
async def test_generate_referral_message():
    res = await tools.generate_referral_message(
        jd_signals=sample_jd_signals,
        company_intel=sample_company_intel,
        profile=sample_profile
    )
    assert res["word_count"] < 80
    assert "Sentixcare" in res["message"]
    models.ReferralOutput(**res)

@pytest.mark.asyncio
async def test_generate_cover_letter():
    res = await tools.generate_cover_letter(
        jd_signals=sample_jd_signals,
        company_intel=sample_company_intel,
        profile=sample_profile
    )
    assert len(res["paragraphs"]) == 3
    assert "Sentixcare" in res["full_text"]
    models.CoverLetterOutput(**res)

@pytest.mark.asyncio
async def test_save_draft_mock():
    # In mock mode, it will save directly to mock_db
    app_id = "test-app-uuid"
    res = await tools.save_draft(
        draft_type="cold_email",
        content="This is a test cold email content",
        app_id=app_id
    )
    assert res["success"] is True
    assert res["draft_type"] == "cold_email"
    assert res["id"] is not None
    
    # Verify it lands in tracker mock_db
    from mcp_servers.tracker_mcp.mock_db import mock_db
    drafts = mock_db.data.get("drafts", [])
    found = [d for d in drafts if d["id"] == res["id"]]
    assert len(found) == 1
    assert found[0]["app_id"] == app_id
    assert found[0]["content"] == "This is a test cold email content"
