import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List
from firecrawl import FirecrawlApp
import instructor
from openai import OpenAI
from config import FIRECRAWL_API_KEY, GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT, GITHUB_MODEL_NAME, MOCK_MODE
from models import (
    CompanyIntel, TechStackResult, CultureResult, NewsResult, FundingInfo
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

MOCK_COMPANY_INTEL_PATH = os.path.join(FIXTURES_DIR, "sample_company_intel.json")

def load_mock_company_intel() -> dict:
    with open(MOCK_COMPANY_INTEL_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

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
    """Synchronous helper to run web search using Firecrawl."""
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

def _llm_extract(prompt: str, text: str, response_model, _corrective_context: str = None) -> Any:
    """Uses instructor and GPT-4o to extract structured info from text."""
    client = get_instructor_client()
    truncated_text = text[:15000]
    
    system_prompt = "You are a precise company research extraction assistant. Extract structured data from the provided company research text. Only return what is explicitly found — never fabricate."
    if _corrective_context:
        system_prompt = f"{system_prompt}\n\n{_corrective_context}"

    response = client.chat.completions.create(
        model=GITHUB_MODEL_NAME,
        response_model=response_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{prompt}\n\nCompany Research Text:\n\n{truncated_text}"}
        ]
    )
    return response

@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"company_name": "unknown", "tech_stack": [], "recent_news": [], "culture_signals": [], "success": False}
)
async def get_company_intel(company_name: str, _corrective_context: str = None) -> Dict[str, Any]:
    """
    Retrieve comprehensive intelligence on a company.
    Runs three web searches in parallel and compiles the results into a single object.
    """
    if MOCK_MODE:
        # Keep gather pattern identical to prod
        await asyncio.gather(
            asyncio.sleep(0.01),
            asyncio.sleep(0.01),
            asyncio.sleep(0.01)
        )
        mock_data = load_mock_company_intel()
        intel = CompanyIntel(**mock_data)
        res = intel.model_dump()
        res["mock"] = True
        return res

    async def _run():
        tech_task = asyncio.to_thread(_web_search_company, company_name, "tech stack engineering")
        funding_task = asyncio.to_thread(_web_search_company, company_name, "funding round series crunchbase")
        culture_task = asyncio.to_thread(_web_search_company, company_name, "culture glassdoor reviews news")
        
        results = await asyncio.gather(
            firecrawl_breaker.call(lambda: tech_task),
            firecrawl_breaker.call(lambda: funding_task),
            firecrawl_breaker.call(lambda: culture_task),
            return_exceptions=True
        )
        
        valid_results = [r for r in results if not isinstance(r, Exception)]
        combined_text = "\n\n".join(valid_results)
        
        if not combined_text:
            raise ValueError("All web searches failed — triggering self-heal retry")
            
        prompt = (
            f"Extract comprehensive intelligence profile for the company '{company_name}'. "
            f"Current year is {datetime.now().year}. "
            "Ensure you extract funding stage, headcount, hq location, tech stack, glassdoor rating, "
            "key culture signals, and any relevant recent news articles with title, summary, date, and source."
        )
        
        intel = await llm_breaker.call(_llm_extract, prompt, combined_text, CompanyIntel, _corrective_context)
        return intel.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"stack": [], "confidence": "low", "source": "error", "success": False}
)
async def get_tech_stack(company_name: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Retrieve tech stack intelligence for a company."""
    if MOCK_MODE:
        mock_data = load_mock_company_intel()
        return {
            "stack": mock_data["tech_stack"],
            "confidence": "high",
            "source": "mock fixture"
        }

    async def _run():
        tech_text = await firecrawl_breaker.call(_web_search_company, company_name, "engineering tech stack")
        prompt = f"Extract the technology stack used by '{company_name}' for its engineering and development teams."
        result = await llm_breaker.call(_llm_extract, prompt, tech_text, TechStackResult, _corrective_context)
        return result.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"signals": [], "glassdoor_rating": None, "success": False}
)
async def get_culture_signals(company_name: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Retrieve cultural signals and Glassdoor rating for a company."""
    if MOCK_MODE:
        mock_data = load_mock_company_intel()
        return {
            "signals": mock_data["culture_signals"],
            "glassdoor_rating": mock_data["glassdoor_rating"]
        }

    async def _run():
        culture_text = await firecrawl_breaker.call(_web_search_company, company_name, "glassdoor culture reviews")
        prompt = f"Extract cultural signals (work-life balance, values, team speed) and Glassdoor ratings for '{company_name}'."
        result = await llm_breaker.call(_llm_extract, prompt, culture_text, CultureResult, _corrective_context)
        return result.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"articles": [], "success": False}
)
async def get_recent_news(company_name: str, days: int = 90, _corrective_context: str = None) -> Dict[str, Any]:
    """Retrieve recent news articles from the last N days (default 90) for a company."""
    if MOCK_MODE:
        mock_data = load_mock_company_intel()
        return {
            "articles": mock_data["recent_news"]
        }

    async def _run():
        news_text = await firecrawl_breaker.call(_web_search_company, company_name, f"news {datetime.now().year}")
        prompt = (
            f"Extract recent news articles about '{company_name}'. "
            f"Current date is {datetime.now().strftime('%Y-%m-%d')}. "
            f"Filter articles to only include those from the last {days} days."
        )
        result = await llm_breaker.call(_llm_extract, prompt, news_text, NewsResult, _corrective_context)
        return result.model_dump()

    return await _run()

@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"stage": None, "amount": None, "investors": [], "year": None, "success": False}
)
async def get_funding_info(company_name: str, _corrective_context: str = None) -> Dict[str, Any]:
    """Retrieve funding stage, amount, investors, and year for a company."""
    if MOCK_MODE:
        mock_data = load_mock_company_intel()
        return {
            "stage": mock_data["funding_stage"],
            "amount": "$5M",
            "investors": ["VC Fund A", "VC Fund B"],
            "year": 2026
        }

    async def _run():
        funding_text = await firecrawl_breaker.call(_web_search_company, company_name, "funding round crunchbase series")
        prompt = f"Extract the funding round history, stages, amount, investors, and year for '{company_name}'."
        result = await llm_breaker.call(_llm_extract, prompt, funding_text, FundingInfo, _corrective_context)
        return result.model_dump()

    return await _run()
