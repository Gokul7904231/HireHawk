import os
from fastapi import FastAPI, HTTPException
from mcp.server.fastmcp import FastMCP
import tools

# Initialize FastAPI application
app = FastAPI(title="company-intel-mcp", version="1.0.0")

# Initialize FastMCP server
mcp = FastMCP("company-intel-mcp")

# --- FastMCP Tool Registrations ---

@mcp.tool(name="get_company_intel")
async def get_company_intel_tool(company_name: str) -> dict:
    """
    Fetch comprehensive intelligence about a company (funding, headcount, tech stack, culture, recent news).
    """
    return await tools.get_company_intel(company_name=company_name)

@mcp.tool(name="get_tech_stack")
async def get_tech_stack_tool(company_name: str) -> dict:
    """
    Fetch tech stack intelligence for a company.
    """
    return await tools.get_tech_stack(company_name=company_name)

@mcp.tool(name="get_culture_signals")
async def get_culture_signals_tool(company_name: str) -> dict:
    """
    Fetch culture reviews and glassdoor rating for a company.
    """
    return await tools.get_culture_signals(company_name=company_name)

@mcp.tool(name="get_recent_news")
async def get_recent_news_tool(company_name: str, days: int = 90) -> dict:
    """
    Fetch recent news articles about a company from the last N days (default 90).
    """
    return await tools.get_recent_news(company_name=company_name, days=days)

@mcp.tool(name="get_funding_info")
async def get_funding_info_tool(company_name: str) -> dict:
    """
    Fetch funding details (round, amount, investors, year) for a company.
    """
    return await tools.get_funding_info(company_name=company_name)


# --- Standard REST Endpoints for Integration ---

@app.post("/get_company_intel")
async def get_company_intel_endpoint(payload: dict):
    company_name = payload.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Missing 'company_name' parameter in body.")
    res = await tools.get_company_intel(company_name=company_name)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/get_tech_stack")
async def get_tech_stack_endpoint(payload: dict):
    company_name = payload.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Missing 'company_name' parameter in body.")
    res = await tools.get_tech_stack(company_name=company_name)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/get_culture_signals")
async def get_culture_signals_endpoint(payload: dict):
    company_name = payload.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Missing 'company_name' parameter in body.")
    res = await tools.get_culture_signals(company_name=company_name)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/get_recent_news")
async def get_recent_news_endpoint(payload: dict):
    company_name = payload.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Missing 'company_name' parameter in body.")
    days = payload.get("days", 90)
    res = await tools.get_recent_news(company_name=company_name, days=days)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/get_funding_info")
async def get_funding_info_endpoint(payload: dict):
    company_name = payload.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="Missing 'company_name' parameter in body.")
    res = await tools.get_funding_info(company_name=company_name)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.get("/")
async def health():
    """
    Standard HTTP health check endpoint.
    """
    return {"status": "ok", "server": "company-intel-mcp"}


# Mount FastMCP SSE application onto FastAPI AFTER standard routes to avoid shadowing
app.mount("/", mcp.sse_app())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8004))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
