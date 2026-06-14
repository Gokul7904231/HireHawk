import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List
from firecrawl import FirecrawlApp
import instructor
from openai import OpenAI
from config import FIRECRAWL_API_KEY, GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME
from models import (
    CompanyIntel, TechStackResult, CultureResult, NewsResult, FundingInfo
)

logger = logging.getLogger(__name__)

# Lazy initialization of clients
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

def _web_search_company(company_name: str, query_suffix: str) -> str:
    """
    Synchronous helper to run web search using Firecrawl.
    """
    query = f"{company_name} {query_suffix}"
    try:
        client = get_firecrawl_client()
        try:
            results = client.search(query, limit=3)
        except TypeError:
            results = client.search(query, params={"limit": 3})
            
        markdowns = []
        if isinstance(results, list):
            for r in results:
                if isinstance(r, dict):
                    markdowns.append(r.get("markdown", r.get("content", "")))
                elif hasattr(r, "markdown"):
                    markdowns.append(r.markdown)
        elif isinstance(results, dict):
            data = results.get("data", results.get("results", []))
            for r in data:
                if isinstance(r, dict):
                    markdowns.append(r.get("markdown", r.get("content", "")))
                    
        return "\n\n---\n\n".join(m for m in markdowns if m)
    except Exception as e:
        logger.error(f"Firecrawl search failed for query '{query}': {e}")
        return f"Search error for query '{query}': {str(e)}"

def _llm_extract(prompt: str, text: str, response_model) -> Any:
    """
    Uses instructor and GPT-4o to extract structured info from text.
    """
    client = get_instructor_client()
    truncated_text = text[:15000]
    
    response = client.chat.completions.create(
        model=GITHUB_MODEL_NAME,
        response_model=response_model,
        messages=[
            {
                "role": "system",
                "content": "You are a precise company research extraction assistant. Extract structured data from the provided company research text. Only return what is explicitly found — never fabricate."
            },
            {
                "role": "user",
                "content": f"{prompt}\n\nCompany Research Text:\n\n{truncated_text}"
            }
        ]
    )
    return response

async def get_company_intel(company_name: str) -> Dict[str, Any]:
    """
    Retrieve comprehensive intelligence on a company.
    Runs three web searches in parallel and compiles the results into a single object.
    """
    try:
        # Run three searches in parallel using thread pool executors
        tech_task = asyncio.to_thread(_web_search_company, company_name, "tech stack engineering")
        funding_task = asyncio.to_thread(_web_search_company, company_name, "funding round series crunchbase")
        culture_task = asyncio.to_thread(_web_search_company, company_name, "culture glassdoor reviews news")
        
        tech_text, funding_text, culture_text = await asyncio.gather(tech_task, funding_task, culture_task)
        
        combined_text = (
            f"--- TECH STACK INFO ---\n{tech_text}\n\n"
            f"--- FUNDING INFO ---\n{funding_text}\n\n"
            f"--- CULTURE & NEWS ---\n{culture_text}"
        )
        
        prompt = (
            f"Extract comprehensive intelligence profile for the company '{company_name}'. "
            f"Current year is {datetime.now().year}. "
            "Ensure you extract funding stage, headcount, hq location, tech stack, glassdoor rating, "
            "key culture signals, and any relevant recent news articles with title, summary, date, and source."
        )
        
        intel = _llm_extract(prompt, combined_text, CompanyIntel)
        return intel.model_dump()
    except Exception as e:
        logger.error(f"Error in get_company_intel: {e}")
        return {"error": str(e), "success": False}

async def get_tech_stack(company_name: str) -> Dict[str, Any]:
    """
    Retrieve tech stack intelligence for a company.
    """
    try:
        tech_text = await asyncio.to_thread(_web_search_company, company_name, "engineering tech stack")
        prompt = f"Extract the technology stack used by '{company_name}' for its engineering and development teams."
        result = _llm_extract(prompt, tech_text, TechStackResult)
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error in get_tech_stack: {e}")
        return {"error": str(e), "success": False}

async def get_culture_signals(company_name: str) -> Dict[str, Any]:
    """
    Retrieve cultural signals and Glassdoor rating for a company.
    """
    try:
        culture_text = await asyncio.to_thread(_web_search_company, company_name, "glassdoor culture reviews")
        prompt = f"Extract cultural signals (work-life balance, values, team speed) and Glassdoor ratings for '{company_name}'."
        result = _llm_extract(prompt, culture_text, CultureResult)
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error in get_culture_signals: {e}")
        return {"error": str(e), "success": False}

async def get_recent_news(company_name: str, days: int = 90) -> Dict[str, Any]:
    """
    Retrieve recent news articles from the last N days (default 90) for a company.
    """
    try:
        news_text = await asyncio.to_thread(_web_search_company, company_name, f"news {datetime.now().year}")
        prompt = (
            f"Extract recent news articles about '{company_name}'. "
            f"Current date is {datetime.now().strftime('%Y-%m-%d')}. "
            f"Filter articles to only include those from the last {days} days."
        )
        result = _llm_extract(prompt, news_text, NewsResult)
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error in get_recent_news: {e}")
        return {"error": str(e), "success": False}

async def get_funding_info(company_name: str) -> Dict[str, Any]:
    """
    Retrieve funding stage, amount, investors, and year for a company.
    """
    try:
        funding_text = await asyncio.to_thread(_web_search_company, company_name, "funding round crunchbase series")
        prompt = f"Extract the funding round history, stages, amount, investors, and year for '{company_name}'."
        result = _llm_extract(prompt, funding_text, FundingInfo)
        return result.model_dump()
    except Exception as e:
        logger.error(f"Error in get_funding_info: {e}")
        return {"error": str(e), "success": False}
