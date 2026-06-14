import os
from fastapi import FastAPI, HTTPException
from mcp.server.fastmcp import FastMCP
import tools

# Initialize FastAPI application
app = FastAPI(title="jd-parser-mcp", version="1.0.0")

# Initialize FastMCP server
mcp = FastMCP("jd-parser-mcp")

# --- FastMCP Tool Registrations ---

@mcp.tool(name="parse_jd_url")
async def parse_jd_url_tool(url: str) -> dict:
    """
    Scrape a job posting URL and parse it into structured JD signals.
    """
    return await tools.parse_jd_url(url=url)

@mcp.tool(name="parse_jd_text")
async def parse_jd_text_tool(text: str) -> dict:
    """
    Parse raw job description text into structured JD signals.
    """
    return await tools.parse_jd_text(text=text)

@mcp.tool(name="extract_skills")
async def extract_skills_tool(jd_text: str) -> dict:
    """
    Extract required and nice-to-have skills from job description text.
    """
    return await tools.extract_skills(jd_text=jd_text)

@mcp.tool(name="detect_seniority")
async def detect_seniority_tool(jd_text: str) -> dict:
    """
    Detect the seniority level (intern, junior, mid, senior) and confidence of a JD.
    """
    return await tools.detect_seniority(jd_text=jd_text)

@mcp.tool(name="get_culture_keywords")
async def get_culture_keywords_tool(jd_text: str) -> dict:
    """
    Extract culture keywords and environment signals from job description text.
    """
    return await tools.get_culture_keywords(jd_text=jd_text)


# --- Standard REST Endpoints for Integration ---

@app.post("/parse_jd_url")
async def parse_jd_url_endpoint(payload: dict):
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="Missing 'url' parameter in body.")
    res = await tools.parse_jd_url(url=url)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/parse_jd_text")
async def parse_jd_text_endpoint(payload: dict):
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Missing 'text' parameter in body.")
    res = await tools.parse_jd_text(text=text)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/extract_skills")
async def extract_skills_endpoint(payload: dict):
    jd_text = payload.get("jd_text")
    if not jd_text:
        raise HTTPException(status_code=400, detail="Missing 'jd_text' parameter in body.")
    res = await tools.extract_skills(jd_text=jd_text)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/detect_seniority")
async def detect_seniority_endpoint(payload: dict):
    jd_text = payload.get("jd_text")
    if not jd_text:
        raise HTTPException(status_code=400, detail="Missing 'jd_text' parameter in body.")
    res = await tools.detect_seniority(jd_text=jd_text)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/get_culture_keywords")
async def get_culture_keywords_endpoint(payload: dict):
    jd_text = payload.get("jd_text")
    if not jd_text:
        raise HTTPException(status_code=400, detail="Missing 'jd_text' parameter in body.")
    res = await tools.get_culture_keywords(jd_text=jd_text)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "server": "jd-parser-mcp",
        "circuit_breakers": {
            "firecrawl": tools.firecrawl_breaker.state,
            "llm": tools.llm_breaker.state
        }
    }

@app.get("/")
async def health():
    """
    Standard HTTP health check endpoint.
    """
    return {"status": "ok", "server": "jd-parser-mcp"}

# Mount FastMCP SSE application onto FastAPI AFTER standard routes to avoid shadowing
app.mount("/", mcp.sse_app())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
