import os
from fastapi import FastAPI, HTTPException, Query
from mcp.server.fastmcp import FastMCP
from typing import List, Optional
import tools

# Initialize FastAPI application
app = FastAPI(title="resume-mcp", version="1.0.0")

# Initialize FastMCP server
mcp = FastMCP("resume-mcp")

# --- FastMCP Tool Registrations ---

@mcp.tool(name="get_profile")
async def get_profile_tool() -> dict:
    """
    Get Gokul's core candidate profile contact details.
    """
    return await tools.get_profile()

@mcp.tool(name="get_education")
async def get_education_tool() -> dict:
    """
    Get Gokul's education details, degrees, GPAs, and graduation.
    """
    return await tools.get_education()

@mcp.tool(name="get_experience")
async def get_experience_tool(role_filter: str = None) -> list:
    """
    Get Gokul's internship and work experiences. Optional role filter.
    """
    return await tools.get_experience(role_filter=role_filter)

@mcp.tool(name="get_projects")
async def get_projects_tool(tags: list[str] = None) -> list:
    """
    Get Gokul's projects. Optional tags filter (match any).
    """
    return await tools.get_projects(tags=tags)

@mcp.tool(name="get_skills")
async def get_skills_tool(category: str = None) -> dict:
    """
    Get Gokul's technical skills by category or all.
    """
    return await tools.get_skills(category=category)

@mcp.tool(name="get_publications")
async def get_publications_tool() -> list:
    """
    Get Gokul's conference and journal publications.
    """
    return await tools.get_publications()

@mcp.tool(name="get_certifications")
async def get_certifications_tool() -> list:
    """
    Get Gokul's professional certifications.
    """
    return await tools.get_certifications()

@mcp.tool(name="get_sih_achievement")
async def get_sih_achievement_tool() -> dict:
    """
    Get Gokul's Smart India Hackathon 2025 results.
    """
    return await tools.get_sih_achievement()


# --- Standard REST Endpoints for Integration ---

@app.get("/profile")
async def profile_endpoint():
    res = await tools.get_profile()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/education")
async def education_endpoint():
    res = await tools.get_education()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/experience")
async def experience_endpoint(role_filter: Optional[str] = None):
    res = await tools.get_experience(role_filter=role_filter)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/projects")
async def projects_endpoint(tags: Optional[List[str]] = Query(None)):
    res = await tools.get_projects(tags=tags)
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/skills")
async def skills_endpoint(category: Optional[str] = None):
    res = await tools.get_skills(category=category)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/publications")
async def publications_endpoint():
    res = await tools.get_publications()
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/certifications")
async def certifications_endpoint():
    res = await tools.get_certifications()
    if isinstance(res, dict) and "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/sih_achievement")
async def sih_achievement_endpoint():
    res = await tools.get_sih_achievement()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/")
async def health():
    """
    Standard HTTP health check endpoint.
    """
    return {"status": "ok", "server": "resume-mcp"}

# Mount FastMCP SSE application onto FastAPI AFTER standard routes to avoid shadowing
app.mount("/", mcp.sse_app())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
