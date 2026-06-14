import pytest
from mcp_servers.jd_parser_mcp import tools
from mcp_servers.jd_parser_mcp import models

@pytest.mark.asyncio
async def test_parse_jd_url():
    res = await tools.parse_jd_url("https://example.com/any-job")
    assert res["mock"] is True
    assert res["company_name"] == "Breathe ESG"
    assert res["role_title"] == "AI Engineer Intern"
    # Verify shape matches
    models.JDSignals(**res)

@pytest.mark.asyncio
async def test_extract_skills():
    res = await tools.extract_skills("Some random job text")
    assert isinstance(res["required"], list)
    assert len(res["required"]) > 0
    assert isinstance(res["nice_to_have"], list)
    assert len(res["nice_to_have"]) > 0
    models.ExtractSkillsOutput(**res)

@pytest.mark.asyncio
async def test_detect_seniority():
    res = await tools.detect_seniority("Some random job text")
    assert res["level"] == "intern"
    assert 0.0 <= res["confidence"] <= 1.0
    models.DetectSeniorityOutput(**res)

@pytest.mark.asyncio
async def test_get_culture_keywords():
    res = await tools.get_culture_keywords("Some random job text")
    assert isinstance(res["keywords"], list)
    assert len(res["keywords"]) > 0
    models.GetCultureKeywordsOutput(**res)
