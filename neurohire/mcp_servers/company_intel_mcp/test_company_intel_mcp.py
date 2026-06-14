import pytest
from mcp_servers.company_intel_mcp import tools
from mcp_servers.company_intel_mcp import models

@pytest.mark.asyncio
async def test_get_company_intel():
    res = await tools.get_company_intel("Breathe ESG")
    assert res["mock"] is True
    assert res["company_name"] == "Breathe ESG"
    assert res["funding_stage"] == "series_a"
    models.CompanyIntel(**res)

@pytest.mark.asyncio
async def test_get_tech_stack():
    res = await tools.get_tech_stack("Breathe ESG")
    assert isinstance(res["stack"], list)
    assert len(res["stack"]) > 0
    assert "Django" in res["stack"]
    models.TechStackResult(**res)

@pytest.mark.asyncio
async def test_get_funding_info():
    res = await tools.get_funding_info("Breathe ESG")
    assert res["stage"] == "series_a"
    models.FundingInfo(**res)

@pytest.mark.asyncio
async def test_get_culture_signals():
    res = await tools.get_culture_signals("Breathe ESG")
    assert isinstance(res["signals"], list)
    assert len(res["signals"]) > 0
    models.CultureResult(**res)

@pytest.mark.asyncio
async def test_get_recent_news():
    res = await tools.get_recent_news("Breathe ESG")
    assert isinstance(res["articles"], list)
    assert len(res["articles"]) > 0
    models.NewsResult(**res)
