import os
from fastapi import FastAPI, HTTPException
from mcp.server.fastmcp import FastMCP
import tools

# Initialize FastAPI application
app = FastAPI(title="outreach-mcp", version="1.0.0")

# Initialize FastMCP server
mcp = FastMCP("outreach-mcp")

# --- FastMCP Tool Registrations ---

@mcp.tool(name="get_voice_sample")
async def get_voice_sample_tool() -> dict:
    """
    Get Gokul's writing voice sample instruction.
    """
    return await tools.get_voice_sample()

@mcp.tool(name="generate_cold_email")
async def generate_cold_email_tool(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    tone: str = "direct_casual"
) -> dict:
    """
    Generate a tailored cold email for a job posting in Gokul's voice.
    """
    return await tools.generate_cold_email(
        jd_signals=jd_signals,
        company_intel=company_intel,
        profile=profile,
        tone=tone
    )

@mcp.tool(name="generate_referral_message")
async def generate_referral_message_tool(
    jd_signals: dict,
    company_intel: dict,
    profile: dict
) -> dict:
    """
    Generate a brief referral request message for a contact.
    """
    return await tools.generate_referral_message(
        jd_signals=jd_signals,
        company_intel=company_intel,
        profile=profile
    )

@mcp.tool(name="generate_cover_letter")
async def generate_cover_letter_tool(
    jd_signals: dict,
    company_intel: dict,
    profile: dict
) -> dict:
    """
    Generate a 3-paragraph cover letter tailored to the company and role.
    """
    return await tools.generate_cover_letter(
        jd_signals=jd_signals,
        company_intel=company_intel,
        profile=profile
    )

@mcp.tool(name="save_draft")
async def save_draft_tool(draft_type: str, content: str, app_id: str) -> dict:
    """
    Save the outreach draft back to the tracker-mcp database.
    """
    return await tools.save_draft(draft_type=draft_type, content=content, app_id=app_id)


# --- Standard REST Endpoints for Integration ---

@app.get("/voice_sample")
async def voice_sample_endpoint():
    res = await tools.get_voice_sample()
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/generate_cold_email")
async def generate_cold_email_endpoint(payload: dict):
    # Payload elements: jd_signals, company_intel, profile, tone
    res = await tools.generate_cold_email(
        jd_signals=payload.get("jd_signals", {}),
        company_intel=payload.get("company_intel", {}),
        profile=payload.get("profile", {}),
        tone=payload.get("tone", "direct_casual")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/generate_referral_message")
async def generate_referral_message_endpoint(payload: dict):
    res = await tools.generate_referral_message(
        jd_signals=payload.get("jd_signals", {}),
        company_intel=payload.get("company_intel", {}),
        profile=payload.get("profile", {})
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/generate_cover_letter")
async def generate_cover_letter_endpoint(payload: dict):
    res = await tools.generate_cover_letter(
        jd_signals=payload.get("jd_signals", {}),
        company_intel=payload.get("company_intel", {}),
        profile=payload.get("profile", {})
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res

@app.post("/save_draft")
async def save_draft_endpoint(payload: dict):
    res = await tools.save_draft(
        draft_type=payload.get("draft_type", ""),
        content=payload.get("content", ""),
        app_id=payload.get("app_id", "")
    )
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "server": "outreach-mcp",
        "circuit_breakers": {
            "llm": tools.llm_breaker.state
        }
    }

@app.get("/")
async def health():
    """
    Standard HTTP health check endpoint.
    """
    return {"status": "ok", "server": "outreach-mcp"}

# Mount FastMCP SSE application onto FastAPI
app.mount("/", mcp.sse_app())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8005))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
