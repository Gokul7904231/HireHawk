import pytest
from mcp_servers.resume_mcp import tools
from mcp_servers.resume_mcp import models

@pytest.mark.asyncio
async def test_get_profile():
    res = await tools.get_profile()
    assert res["name"] == "Gokul"
    assert res["email"] == "gokul32499@gmail.com"
    models.ProfileOutput(**res)

@pytest.mark.asyncio
async def test_get_education():
    res = await tools.get_education()
    assert res["college"] == "Crescent College of Engineering"
    models.EducationOutput(**res)

@pytest.mark.asyncio
async def test_get_experience():
    res = await tools.get_experience()
    assert isinstance(res, list)
    assert len(res) == 2
    assert res[0]["company"] == "Infosys Limited"
    for item in res:
        models.ExperienceItem(**item)
        
    filtered = await tools.get_experience(role_filter="Full Stack")
    assert isinstance(filtered, list)
    assert len(filtered) == 1
    assert filtered[0]["company"] == "Zidio Development"

@pytest.mark.asyncio
async def test_get_projects():
    res = await tools.get_projects()
    assert isinstance(res, list)
    assert len(res) == 4
    for item in res:
        models.ProjectItem(**item)
        
    ai_projects = await tools.get_projects(tags=["ai"])
    assert isinstance(ai_projects, list)
    project_names = [p["name"] for p in ai_projects]
    assert "Sentixcare" in project_names
    assert "CineRAG" in project_names
    assert "Planetopia" not in project_names

@pytest.mark.asyncio
async def test_get_skills():
    res = await tools.get_skills()
    models.SkillsOutput(**res)
    assert "Python" in res["languages"]
    
    languages = await tools.get_skills(category="languages")
    assert languages == {"languages": ["Python", "JavaScript", "TypeScript", "SQL"]}

@pytest.mark.asyncio
async def test_get_publications():
    res = await tools.get_publications()
    assert isinstance(res, list)
    assert len(res) == 2
    for item in res:
        models.PublicationItem(**item)

@pytest.mark.asyncio
async def test_get_certifications():
    res = await tools.get_certifications()
    assert isinstance(res, list)
    assert len(res) == 2
    for item in res:
        models.CertificationItem(**item)

@pytest.mark.asyncio
async def test_get_sih_achievement():
    res = await tools.get_sih_achievement()
    assert res["achievement"] == "Finalist — Smart India Hackathon 2025 (National Level) | Won Internal College Round"
