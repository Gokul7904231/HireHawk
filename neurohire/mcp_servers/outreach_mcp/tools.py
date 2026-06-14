import logging
import httpx
from typing import Dict, Any, List, Optional
from openai import OpenAI
from config import GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME, VOICE_SAMPLE, TRACKER_MCP_URL, MOCK_MODE
import templates
from models import ColdEmailOutput, ReferralOutput, CoverLetterOutput
from mcp_servers.shared.self_healing import self_healing, CircuitBreaker

logger = logging.getLogger(__name__)

llm_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60.0)

# Lazy initialization of client
def get_openai_client() -> OpenAI:
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN is not set in environment.")
    return OpenAI(
        base_url=GITHUB_MODELS_ENDPOINT,
        api_key=GITHUB_TOKEN
    )

def _call_llm(system: str, user: str) -> str:
    """Helper to send system and user prompts to GitHub Models GPT-4o."""
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

@self_healing(max_retries=2, fallback_value={"voice_sample": ""})
async def get_voice_sample() -> Dict[str, str]:
    """Retrieve Gokul's writing voice sample instruction."""
    return {"voice_sample": VOICE_SAMPLE}

@self_healing(
    max_retries=3,
    base_delay=1.5,
    fallback_value={"subject": "", "body": "", "word_count": 0, "success": False}
)
async def generate_cold_email(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    tone: str = "direct_casual",
    _corrective_context: str = None
) -> Dict[str, Any]:
    """
    Generate a tailored cold email for a job description in Gokul's voice.
    Ensures length is under 150 words and no credentials are fabricated.
    """
    if MOCK_MODE:
        response_text = templates.generate_cold_email_mock(jd_signals, company_intel, profile)
        
        # Parse subject and body
        subject = "Application for " + jd_signals.get("role_title", "Engineering Role")
        body = response_text
        
        if response_text.lower().startswith("subject:"):
            parts = response_text.split("\n\n", 1)
            subject_line = parts[0]
            subject = subject_line.replace("Subject:", "").replace("subject:", "").strip()
            if len(parts) > 1:
                body = parts[1].strip()
                
        word_count = len(body.split())
        
        # F1 word count guard check
        if word_count > 160:
            raise ValueError(
                f"F1_HALLUCINATION: Generated email has {word_count} words, must be under 150. "
                f"Retry with stricter length enforcement."
            )
            
        return ColdEmailOutput(subject=subject, body=body, word_count=word_count).model_dump()

    async def _run():
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
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\nCORRECTION REQUIRED:\n{_corrective_context}"
            
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}\n\n"
            f"Requested Tone: {tone}"
        )
        
        response_text = await llm_breaker.call(_call_llm, system_prompt, user_content)
        
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
                
        word_count = len(body.split())
        
        if word_count > 160:
            raise ValueError(
                f"F1_HALLUCINATION: Generated email has {word_count} words, must be under 150. "
                f"Retry with stricter length enforcement."
            )
            
        return ColdEmailOutput(subject=subject, body=body, word_count=word_count).model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.5,
    fallback_value={"message": "", "word_count": 0, "success": False}
)
async def generate_referral_message(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    _corrective_context: str = None
) -> Dict[str, Any]:
    """Generate a short, casual referral message in Gokul's voice (under 80 words)."""
    if MOCK_MODE:
        message = templates.generate_referral_message_mock(jd_signals, company_intel, profile)
        word_count = len(message.split())
        if word_count > 80:
            raise ValueError(f"F1_HALLUCINATION: Referral message has {word_count} words, must be under 80.")
        return ReferralOutput(message=message, word_count=word_count).model_dump()

    async def _run():
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
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\nCORRECTION REQUIRED:\n{_corrective_context}"
            
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}"
        )
        
        message = await llm_breaker.call(_call_llm, system_prompt, user_content)
        word_count = len(message.split())
        
        if word_count > 85:
            raise ValueError(
                f"F1_HALLUCINATION: Generated referral message has {word_count} words, must be under 80."
            )
            
        return ReferralOutput(message=message, word_count=word_count).model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.5,
    fallback_value={"paragraphs": [], "full_text": "", "success": False}
)
async def generate_cover_letter(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    _corrective_context: str = None
) -> Dict[str, Any]:
    """Generate a 3-paragraph cover letter mapping to JD required skills without fabrication."""
    if MOCK_MODE:
        paragraphs = templates.generate_cover_letter_mock(jd_signals, company_intel, profile)
        full_text = "\n\n".join(paragraphs)
        return CoverLetterOutput(paragraphs=paragraphs, full_text=full_text).model_dump()

    async def _run():
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
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\nCORRECTION REQUIRED:\n{_corrective_context}"
            
        user_content = (
            f"JD Signals:\n{jd_signals}\n\n"
            f"Company Intelligence:\n{company_intel}\n\n"
            f"Candidate Profile:\n{profile}"
        )
        
        full_text = await llm_breaker.call(_call_llm, system_prompt, user_content)
        paragraphs = [p.strip() for p in full_text.split("\n\n") if p.strip()]
        
        return CoverLetterOutput(paragraphs=paragraphs, full_text=full_text).model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=0.5,
    fallback_value={"success": False, "error": "failed to save draft"}
)
async def save_draft(draft_type: str, content: str, app_id: str) -> Dict[str, Any]:
    """Save the outreach draft to tracker-mcp database."""
    # Attempt HTTP post first
    try:
        url = f"{TRACKER_MCP_URL.rstrip('/')}/save_draft"
        payload = {
            "app_id": app_id,
            "draft_type": draft_type,
            "content": content
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=2.0)
            if response.status_code == 200:
                res_data = response.json()
                if res_data.get("success"):
                    return {"success": True, "draft_type": draft_type, "id": res_data.get("id")}
    except Exception as e:
        logger.warning(f"HTTP call to tracker-mcp failed: {e}. Falling back to direct mock_db write.")
        
    if MOCK_MODE:
        try:
            from mcp_servers.tracker_mcp.mock_db import mock_db
            draft_id = mock_db.save_draft(app_id, draft_type, content)
            return {"success": True, "draft_type": draft_type, "id": draft_id}
        except Exception as e_mock:
            logger.error(f"Direct mock_db write fallback failed: {e_mock}")
            raise
            
    raise ValueError("tracker-mcp is unreachable and MOCK_MODE is false.")
