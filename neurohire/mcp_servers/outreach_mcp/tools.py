import logging
import httpx
from typing import Dict, Any, List, Optional
from openai import OpenAI
from config import GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME, VOICE_SAMPLE, TRACKER_MCP_URL
from models import ColdEmailOutput, ReferralOutput, CoverLetterOutput

logger = logging.getLogger(__name__)

# Lazy initialization of client
def get_openai_client() -> OpenAI:
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN is not set in environment.")
    return OpenAI(
        base_url=GITHUB_MODELS_ENDPOINT,
        api_key=GITHUB_TOKEN
    )

def _call_llm(system: str, user: str) -> str:
    """
    Helper to send system and user prompts to GitHub Models GPT-4o.
    """
    client = get_openai_client()
    try:
        response = client.chat.completions.create(
            model=GITHUB_MODEL_NAME,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise ValueError(f"LLM generation failed: {str(e)}")

async def get_voice_sample() -> Dict[str, str]:
    """
    Retrieve Gokul's writing voice sample instruction.
    """
    return {"voice_sample": VOICE_SAMPLE}

async def generate_cold_email(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    tone: str = "direct_casual"
) -> Dict[str, Any]:
    """
    Generate a tailored cold email for a job description in Gokul's voice.
    Ensures length is under 150 words and no credentials are fabricated.
    """
    try:
        system_prompt = (
            f"You are writing a cold email for {profile.get('name', 'Gokul')} applying to {jd_signals.get('role_title', 'AI/Fullstack position')} at {jd_signals.get('company_name', 'target company')}.\n\n"
            f"VOICE SAMPLE AND GUIDELINE:\n{VOICE_SAMPLE}\n\n"
            "RULES:\n"
            "- The body text of the email MUST be under 150 words.\n"
            "- Reference one specific thing from company_intel.recent_news or company_intel.tech_stack.\n"
            "- Reference one specific project from profile.top_projects by name and live URL.\n"
            "- End with one clear, direct call to action (e.g. asking for a 15-minute call or referral).\n"
            "- STRICTLY NO FABRICATION. Do not invent any skills, projects, or experiences. Only use facts in the profile.\n"
            "- STRICTLY NO corporate openers like 'I am writing to express my interest'. Start directly.\n"
            "- Return ONLY in the format: Subject: <subject>\n\n<body>"
        )
        
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}\n\n"
            f"Requested Tone: {tone}"
        )
        
        response_text = _call_llm(system_prompt, user_content)
        
        # Parse subject and body
        subject = "Application for " + jd_signals.get("role_title", "Engineering Role")
        body = response_text
        
        if response_text.lower().startswith("subject:"):
            parts = response_text.split("\n\n", 1)
            subject_line = parts[0]
            subject = subject_line.replace("Subject:", "").replace("subject:", "").strip()
            if len(parts) > 1:
                body = parts[1].strip()
        elif response_text.startswith("Subject:"):
            parts = response_text.split("\n\n", 1)
            subject_line = parts[0]
            subject = subject_line.replace("Subject:", "").strip()
            if len(parts) > 1:
                body = parts[1].strip()
        elif "\n" in response_text and (response_text.split("\n")[0].lower().startswith("subject:")):
            parts = response_text.split("\n", 1)
            subject = parts[0].replace("Subject:", "").replace("subject:", "").strip()
            body = parts[1].strip()

        word_count = len(body.split())
        
        output = ColdEmailOutput(
            subject=subject,
            body=body,
            word_count=word_count
        )
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in generate_cold_email: {e}")
        return {"error": str(e), "success": False}

async def generate_referral_message(
    jd_signals: dict,
    company_intel: dict,
    profile: dict
) -> Dict[str, Any]:
    """
    Generate a short, casual referral message in Gokul's voice (under 80 words).
    """
    try:
        system_prompt = (
            f"Write a casual referral request message for {profile.get('name', 'Gokul')} to send to a contact at {jd_signals.get('company_name', 'the company')}.\n\n"
            f"VOICE SAMPLE AND GUIDELINE:\n{VOICE_SAMPLE}\n\n"
            "RULES:\n"
            "- The message body MUST be under 80 words.\n"
            "- Explicitly mention the specific role title: " + jd_signals.get("role_title", "the position") + ".\n"
            "- Include a one-line credential hook based on the profile (e.g. SIH Finalist, or Sentixcare project on HuggingFace).\n"
            "- Direct ask: would you be willing to refer me or forward my resume?\n"
            "- STRICTLY NO FABRICATION. Do not invent details.\n"
            "- Return only the generated message content."
        )
        
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}"
        )
        
        message = _call_llm(system_prompt, user_content)
        word_count = len(message.split())
        
        output = ReferralOutput(
            message=message,
            word_count=word_count
        )
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in generate_referral_message: {e}")
        return {"error": str(e), "success": False}

async def generate_cover_letter(
    jd_signals: dict,
    company_intel: dict,
    profile: dict
) -> Dict[str, Any]:
    """
    Generate a 3-paragraph cover letter mapping to JD required skills without fabrication.
    """
    try:
        system_prompt = (
            f"Write a 3-paragraph cover letter for {profile.get('name', 'Gokul')} applying for {jd_signals.get('role_title', 'role')} at {jd_signals.get('company_name', 'company')}.\n\n"
            "STRUCTURE:\n"
            "- Paragraph 1 (Hook, ~60 words): Why this company specifically — reference real company news or tech stack.\n"
            "- Paragraph 2 (Proof, ~80 words): Most relevant project + internship bullet that maps to JD required_skills.\n"
            "- Paragraph 3 (Close, ~40 words): Clear call to action + enthusiasm. No corporate fluff.\n\n"
            "RULES:\n"
            "- STRICTLY NO FABRICATION. Only use data from the profile and company intelligence.\n"
            "- Return only the cover letter paragraphs separated by double newlines."
        )
        
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}"
        )
        
        full_text = _call_llm(system_prompt, user_content)
        # Split into paragraphs, filtering out empty items
        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        
        output = CoverLetterOutput(
            paragraphs=paragraphs,
            full_text=full_text
        )
        return output.model_dump()
    except Exception as e:
        logger.error(f"Error in generate_cover_letter: {e}")
        return {"error": str(e), "success": False}

async def save_draft(draft_type: str, content: str, app_id: str) -> Dict[str, Any]:
    """
    Save the outreach draft to tracker-mcp database.
    """
    try:
        url = f"{TRACKER_MCP_URL.rstrip('/')}/save_draft"
        payload = {
            "app_id": app_id,
            "draft_type": draft_type,
            "content": content
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            res_data = response.json()
            if res_data.get("success"):
                return {"success": True, "draft_type": draft_type, "id": res_data.get("id")}
            else:
                return {"success": False, "error": res_data.get("error", "Failed to save draft")}
    except Exception as e:
        logger.error(f"Error in save_draft call to tracker: {e}")
        return {"error": f"Failed to save draft to tracker-mcp: {str(e)}", "success": False}
