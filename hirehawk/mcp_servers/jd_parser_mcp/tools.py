import os
import json
import logging
from typing import Dict, Any, List
from firecrawl import FirecrawlApp
import instructor
from openai import OpenAI
from config import FIRECRAWL_API_KEY, GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME, MOCK_MODE
from models import (
    JDSignals, ExtractSkillsOutput, DetectSeniorityOutput, GetCultureKeywordsOutput
)
from mcp_servers.shared.self_healing import self_healing, CircuitBreaker

logger = logging.getLogger(__name__)

# Circuit Breakers
firecrawl_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=120.0)
llm_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60.0)

# Mock file resolver
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "fixtures"))
if not os.path.exists(FIXTURES_DIR):
    FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "fixtures"))

MOCK_JD_PATH = os.path.join(FIXTURES_DIR, "sample_jd_signals.json")

def load_mock_jd_signals() -> dict:
    with open(MOCK_JD_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

# Lazy initialization of clients to avoid crashing on import if keys are missing
def get_firecrawl_client() -> FirecrawlApp:
    if not FIRECRAWL_API_KEY:
        raise ValueError("FIRECRAWL_API_KEY is not set in environment.")
    return FirecrawlApp(api_key=FIRECRAWL_API_KEY)

def get_instructor_client() -> instructor.Instructor:
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN is not set in environment.")
    return instructor.from_openai(
        OpenAI(
            base_url=GITHUB_MODELS_ENDPOINT,
            api_key=GITHUB_TOKEN
        )
    )

def _scrape_url(url: str) -> str:
    """Scrapes the URL using Firecrawl and extracts markdown content."""
    client = get_firecrawl_client()
    try:
        response = client.scrape_url(url, params={"formats": ["markdown"]})
        if isinstance(response, dict) and "markdown" in response:
            return response["markdown"]
        elif hasattr(response, "markdown") and response.markdown:
            return response.markdown
        elif isinstance(response, dict) and "data" in response and "markdown" in response["data"]:
            return response["data"]["markdown"]
        else:
            raise ValueError(f"Could not find markdown in Firecrawl response: {response}")
    except Exception as e:
        logger.error(f"Firecrawl scrape failed for {url}: {e}")
        raise ValueError(f"Failed to scrape URL with Firecrawl: {str(e)}")

def _parse_with_llm(text: str, _corrective_context: str = None) -> JDSignals:
    """Parses the JD text into structured JDSignals using GitHub Models GPT-4o."""
    client = get_instructor_client()
    truncated_text = text[:15000]
    
    system_prompt = "You are a precise JD parser. Extract structured signals from job descriptions. Return only what is explicitly stated — do not infer or fabricate."
    if _corrective_context:
        system_prompt = f"{system_prompt}\n\n{_corrective_context}"

    response = client.chat.completions.create(
        model=GITHUB_MODEL_NAME,
        response_model=JDSignals,
        messages=[
            {
                "role": "system", 
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": f"Extract JD signals from this job description:\n\n{truncated_text}"
            }
        ]
    )
    return response

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "JD parsing failed", "success": False, "company_name": "unknown", "role_title": "unknown"}
)
async def parse_jd_url(url: str, _corrective_context: str = None) -> Dict[str, Any]:
    """
    Scrapes the job description from a URL and parses it into structured JDSignals.
    Self-heals on timeouts (F2) and LLM schema errors (F1).
    """
    if MOCK_MODE:
        mock_data = load_mock_jd_signals()
        signals = JDSignals(**mock_data)
        res = signals.model_dump()
        res["mock"] = True
        return res

    async def _run():
        markdown_text = await firecrawl_breaker.call(_scrape_url, url)
        signals = await llm_breaker.call(_parse_with_llm, markdown_text, _corrective_context)
        signals.raw_text = markdown_text
        return signals.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "JD parsing failed", "success": False, "company_name": "unknown", "role_title": "unknown"}
)
async def parse_jd_text(text: str, _corrective_context: str = None) -> Dict[str, Any]:
    """
    Parses the job description raw text directly into structured JDSignals.
    Self-heals on LLM errors.
    """
    if MOCK_MODE:
        mock_data = load_mock_jd_signals()
        signals = JDSignals(**mock_data)
        res = signals.model_dump()
        res["mock"] = True
        return res

    async def _run():
        signals = await llm_breaker.call(_parse_with_llm, text, _corrective_context)
        signals.raw_text = text
        return signals.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "Skill extraction failed", "success": False, "required": [], "nice_to_have": []}
)
async def extract_skills(jd_text: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Extracts required and nice-to-have skills from the job description text."""
    if MOCK_MODE:
        mock_data = load_mock_jd_signals()
        return {
            "required": mock_data["required_skills"],
            "nice_to_have": mock_data["nice_to_have_skills"]
        }

    async def _run():
        client = get_instructor_client()
        system_prompt = "You are a precise skill extraction assistant. Identify and categorize technical skills from the provided job description. Categorize into required and nice_to_have."
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\n{_corrective_context}"

        response = await llm_breaker.call(
            client.chat.completions.create,
            model=GITHUB_MODEL_NAME,
            response_model=ExtractSkillsOutput,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract and group skills from this JD:\n\n{jd_text[:10000]}"}
            ]
        )
        return response.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "Seniority detection failed", "success": False, "level": "junior", "confidence": 0.0}
)
async def detect_seniority(jd_text: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Detects the seniority level (intern, junior, mid, senior) and outputs a confidence score."""
    if MOCK_MODE:
        mock_data = load_mock_jd_signals()
        return {
            "level": mock_data["seniority"],
            "confidence": 0.95
        }

    async def _run():
        client = get_instructor_client()
        system_prompt = "Analyze the job description to determine the experience and seniority level requested (intern, junior, mid, senior) along with your confidence level (0.0 to 1.0)."
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\n{_corrective_context}"

        response = await llm_breaker.call(
            client.chat.completions.create,
            model=GITHUB_MODEL_NAME,
            response_model=DetectSeniorityOutput,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Determine seniority level for this JD:\n\n{jd_text[:10000]}"}
            ]
        )
        return response.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "Culture keyword extraction failed", "success": False, "keywords": []}
)
async def get_culture_keywords(jd_text: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Extracts culture-related keywords (e.g. fast-paced, remote-first, high autonomy) from the JD."""
    if MOCK_MODE:
        mock_data = load_mock_jd_signals()
        return {
            "keywords": mock_data["culture_keywords"]
        }

    async def _run():
        client = get_instructor_client()
        system_prompt = "Identify cultural indicators and workplace environment keywords mentioned in the job description."
        if _corrective_context:
            system_prompt = f"{system_prompt}\n\n{_corrective_context}"

        response = await llm_breaker.call(
            client.chat.completions.create,
            model=GITHUB_MODEL_NAME,
            response_model=GetCultureKeywordsOutput,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract culture keywords from this JD:\n\n{jd_text[:10000]}"}
            ]
        )
        return response.model_dump()

    return await _run()
