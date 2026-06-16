import pytest
from graph.nodes.jd_parser import parse_jd_node
from graph.nodes.resume_tailor import tailor_resume_node
from graph.nodes.company_intel import get_company_intel_node
from graph.nodes.fit_scorer import score_fit_node
from graph.nodes.outreach import write_outreach_node
from graph.nodes.tracker import track_application_node

@pytest.mark.asyncio
async def test_parse_jd_node():
    state = {"jd_raw": "Looking for React developer"}
    res = await parse_jd_node(state)
    assert "jd_signals" in res
    assert "resume_profile" in res
    assert res["jd_signals"]["company_name"] == "Breathe ESG"

@pytest.mark.asyncio
async def test_tailor_resume_node():
    state = {
        "jd_signals": {"company_name": "Breathe ESG"},
        "resume_profile": {"name": "Gokul"}
    }
    res = await tailor_resume_node(state)
    assert "tailored_bullets" in res
    assert "claims_trace" in res

@pytest.mark.asyncio
async def test_get_company_intel_node():
    state = {"jd_signals": {"company_name": "Breathe ESG"}}
    res = await get_company_intel_node(state)
    assert "company_intel" in res
    assert res["company_intel"]["hq_location"] == "Bangalore, India"

@pytest.mark.asyncio
async def test_score_fit_node():
    state = {
        "jd_signals": {"required_skills": ["Python", "React"]},
        "resume_profile": {"top_skills": ["Python"]}
    }
    res = await score_fit_node(state)
    assert "fit_score" in res
    assert res["fit_score"] == 50.0

@pytest.mark.asyncio
async def test_write_outreach_node():
    state = {
        "jd_signals": {},
        "company_intel": {},
        "resume_profile": {}
    }
    res = await write_outreach_node(state)
    assert "outreach_draft" in res

@pytest.mark.asyncio
async def test_track_application_node():
    state = {
        "jd_signals": {"company_name": "Breathe ESG"},
        "fit_score": 85.0
    }
    res = await track_application_node(state)
    assert "tracker_id" in res
