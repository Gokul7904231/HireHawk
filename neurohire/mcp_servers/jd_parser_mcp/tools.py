import logging
from typing import Dict, Any, List
from firecrawl import FirecrawlApp
import instructor
from openai import OpenAI
from config import FIRECRAWL_API_KEY, GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME
from models import (
    JDSignals, ExtractSkillsOutput, DetectSeniorityOutput, GetCultureKeywordsOutput
)

logger = logging.getLogger(__name__)

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
    """
    Scrapes the URL using Firecrawl and extracts markdown content.
    """
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

def _parse_with_llm(text: str) -> JDSignals:
    """
    Parses the JD text into structured JDSignals using GitHub Models GPT-4o.
    """
    client = get_instructor_client()
    # If the text is extremely long, truncate it to avoid token limit errors
    truncated_text = text[:15000]
    
    response = client.chat.completions.create(
        model=GITHUB_MODEL_NAME,
        response_model=JDSignals,
        messages=[
            {
                "role": "system", 
                "content": "You are a precise JD parser. Extract structured signals from job descriptions. Return only what is explicitly stated — do not infer or fabricate."
            },
            {
                "role": "user", 
                "content": f"Extract JD signals from this job description:\n\n{truncated_text}"
            }
        ]
    )
    return response

async def parse_jd_url(url: str) -> Dict[str, Any]:
    """
    Scrapes the job description from a URL and parses it into structured JDSignals.
    """
    try:
        markdown_text = _scrape_url(url)
        signals = _parse_with_llm(markdown_text)
        # Store original scraped markdown as raw_text in output
        signals.raw_text = markdown_text
        return signals.model_dump()
    except Exception as e:
        logger.error(f"Error in parse_jd_url: {e}")
        return {"error": str(e), "success": False}

async def parse_jd_text(text: str) -> Dict[str, Any]:
    """
    Parses the job description raw text directly into structured JDSignals.
    """
    try:
        signals = _parse_with_llm(text)
        signals.raw_text = text
        return signals.model_dump()
    except Exception as e:
        logger.error(f"Error in parse_jd_text: {e}")
        return {"error": str(e), "success": False}

async def extract_skills(jd_text: str) -> Dict[str, Any]:
    """
    Extracts required and nice-to-have skills from the job description text.
    """
    try:
        client = get_instructor_client()
        response = client.chat.completions.create(
            model=GITHUB_MODEL_NAME,
            response_model=ExtractSkillsOutput,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise skill extraction assistant. Identify and categorize technical skills from the provided job description. Categorize into required and nice_to_have."
                },
                {
                    "role": "user",
                    "content": f"Extract and group skills from this JD:\n\n{jd_text[:10000]}"
                }
            ]
        )
        return response.model_dump()
    except Exception as e:
        logger.error(f"Error in extract_skills: {e}")
        return {"error": str(e), "success": False}

async def detect_seniority(jd_text: str) -> Dict[str, Any]:
    """
    Detects the seniority level (intern, junior, mid, senior) and outputs a confidence score.
    """
    try:
        client = get_instructor_client()
        response = client.chat.completions.create(
            model=GITHUB_MODEL_NAME,
            response_model=DetectSeniorityOutput,
            messages=[
                {
                    "role": "system",
                    "content": "Analyze the job description to determine the experience and seniority level requested (intern, junior, mid, senior) along with your confidence level (0.0 to 1.0)."
                },
                {
                    "role": "user",
                    "content": f"Determine seniority level for this JD:\n\n{jd_text[:10000]}"
                }
            ]
        )
        return response.model_dump()
    except Exception as e:
        logger.error(f"Error in detect_seniority: {e}")
        return {"error": str(e), "success": False}

async def get_culture_keywords(jd_text: str) -> Dict[str, Any]:
    """
    Extracts culture-related keywords (e.g. fast-paced, remote-first, high autonomy) from the JD.
    """
    try:
        client = get_instructor_client()
        response = client.chat.completions.create(
            model=GITHUB_MODEL_NAME,
            response_model=GetCultureKeywordsOutput,
            messages=[
                {
                    "role": "system",
                    "content": "Identify cultural indicators and workplace environment keywords mentioned in the job description."
                },
                {
                    "role": "user",
                    "content": f"Extract culture keywords from this JD:\n\n{jd_text[:10000]}"
                }
            ]
        )
        return response.model_dump()
    except Exception as e:
        logger.error(f"Error in get_culture_keywords: {e}")
        return {"error": str(e), "success": False}
