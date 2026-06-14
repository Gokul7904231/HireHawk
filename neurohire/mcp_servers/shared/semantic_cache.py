# mcp_servers/shared/semantic_cache.py
import json
import hashlib
from typing import Optional, Any
from openai import AsyncOpenAI
from .config import MOCK_MODE

try:
    from redisvl.extensions.llmcache import SemanticCache
    REDISVL_AVAILABLE = True
except ImportError:
    REDISVL_AVAILABLE = False

class NeuroHireSemanticCache:
    """
    Semantic cache for company intel and JD parsing results.
    If MOCK_MODE=true or redisvl is not available, cache silently does nothing (no-op).
    """
    def __init__(self, redis_url: Optional[str] = None, github_token: Optional[str] = None, github_endpoint: Optional[str] = None):
        self.redis_url = redis_url
        self._cache = None
        
        if REDISVL_AVAILABLE and not MOCK_MODE and redis_url and github_token and github_endpoint:
            try:
                self.openai = AsyncOpenAI(base_url=github_endpoint, api_key=github_token)
                self._cache = SemanticCache(
                    name="neurohire_cache",
                    redis_url=redis_url,
                    distance_threshold=0.1,
                    ttl=86400
                )
            except Exception as e:
                print(f"[CACHE] Initialization failed: {e}. Running in cache no-op mode.")

    async def get(self, query: str) -> Optional[Any]:
        """Check cache for a semantically similar query."""
        if not self._cache:
            return None
        
        try:
            results = self._cache.check(prompt=query, num_results=1)
            if results:
                cached = results[0]
                print(f"[CACHE HIT] Semantic match (distance: {cached.get('vector_distance', 'N/A')})")
                return json.loads(cached["response"])
        except Exception as e:
            print(f"[CACHE] Check failed: {e}")
        
        return None
    
    async def set(self, query: str, response: Any, ttl: Optional[int] = None):
        """Store a query-response pair in semantic cache."""
        if not self._cache:
            return
        
        try:
            self._cache.store(
                prompt=query,
                response=json.dumps(response),
                ttl=ttl
            )
            print(f"[CACHE SET] Stored result for: {query[:50]}...")
        except Exception as e:
            print(f"[CACHE] Store failed: {e}")
    
    def cache_company_intel(self, func):
        """Decorator to add semantic caching to company intel tool calls."""
        from functools import wraps
        
        @wraps(func)
        async def wrapper(company_name: str, **kwargs):
            cache_key = f"company_intel: {company_name}"
            
            # Check cache first
            cached = await self.get(cache_key)
            if cached is not None:
                return {**cached, "from_cache": True}
            
            # Cache miss — run full pipeline
            result = await func(company_name, **kwargs)
            
            # Store in cache (only successful results)
            if isinstance(result, dict) and result.get("success", True) and "error" not in result:
                await self.set(cache_key, result)
            
            return result
        
        return wrapper
