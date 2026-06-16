import pytest
from mcp_servers.shared.semantic_router import get_router

@pytest.mark.asyncio
async def test_semantic_routing_keyword_fallback():
    router = get_router()
    # In MOCK_MODE, index_all_tools is a no-op
    await router.index_all_tools()
    
    # Query 1: write a cold email
    r1 = await router.route("write a cold email for a machine learning role", k=3)
    tool_ids_1 = [t["tool_id"] for t in r1]
    assert "outreach.generate_cold_email" in tool_ids_1
    
    # Query 2: funding stage
    r2 = await router.route("what is the funding stage of Breathe ESG", k=3)
    tool_ids_2 = [t["tool_id"] for t in r2]
    assert "company_intel.get_funding_info" in tool_ids_2 or "company_intel.get_company_intel" in tool_ids_2
    
    # Query 3: log application
    r3 = await router.route("log that I applied to Cognizant today", k=3)
    tool_ids_3 = [t["tool_id"] for t in r3]
    assert "tracker.add_application" in tool_ids_3 or "tracker.log_event" in tool_ids_3
    
    # Query 4: parse job description
    r4 = await router.route("parse this job description URL", k=3)
    tool_ids_4 = [t["tool_id"] for t in r4]
    assert "jd_parser.parse_jd_url" in tool_ids_4
    
    # Query 5: strongest AI skills
    r5 = await router.route("what are my strongest AI skills", k=3)
    tool_ids_5 = [t["tool_id"] for t in r5]
    assert "resume.get_skills" in tool_ids_5 or "resume.get_projects" in tool_ids_5
