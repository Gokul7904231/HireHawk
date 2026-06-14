# mcp_servers/shared/semantic_router.py
import asyncio
import json
from typing import Optional
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from .tool_registry import TOOL_REGISTRY
from .config import MOCK_MODE

COLLECTION_NAME = "neurohire_tool_index"
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_DIM = 1536

class SemanticToolRouter:
    """
    Implements vector-based semantic tool routing.
    Embeds all MCP tools once at startup, then does sub-100ms
    similarity search to find top-K tools for any agent query.
    
    If MOCK_MODE=true or Qdrant is unreachable, falls back to keyword matching.
    """
    def __init__(self, qdrant_url: Optional[str] = None, github_token: Optional[str] = None, github_endpoint: Optional[str] = None):
        self.qdrant = None
        self.openai = None
        self._indexed = False
        
        if not MOCK_MODE and qdrant_url and github_token and github_endpoint:
            try:
                self.qdrant = QdrantClient(url=qdrant_url)
                self.openai = AsyncOpenAI(
                    base_url=github_endpoint,
                    api_key=github_token
                )
            except Exception as e:
                print(f"[ROUTER] Error initializing Qdrant/OpenAI clients: {e}. Falling back to mock/keyword mode.")

    def _qdrant_available(self) -> bool:
        return self.qdrant is not None

    async def index_all_tools(self, force_reindex: bool = False):
        """Embed all tools in TOOL_REGISTRY and store in Qdrant."""
        if MOCK_MODE or not self._qdrant_available():
            self._indexed = True
            print("[ROUTER] Running in MOCK_MODE or Qdrant unavailable. Skipping vector index.")
            return

        try:
            # Check if already indexed
            try:
                collection = self.qdrant.get_collection(COLLECTION_NAME)
                if collection.points_count == len(TOOL_REGISTRY) and not force_reindex:
                    print(f"[ROUTER] Tool index already has {len(TOOL_REGISTRY)} tools. Skipping re-index.")
                    self._indexed = True
                    return
            except Exception:
                pass
            
            # Create collection with binary quantization
            self.qdrant.recreate_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.DOT),
                quantization_config={
                    "binary": {
                        "always_ram": True  # Keep compressed index in RAM
                    }
                }
            )
            
            print(f"[ROUTER] Indexing {len(TOOL_REGISTRY)} tools...")
            
            texts = [
                f"{tool['description']}. Keywords: {', '.join(tool['tags'])}"
                for tool in TOOL_REGISTRY
            ]
            
            batch_size = 20
            all_embeddings = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = await self.openai.embeddings.create(
                    model=EMBEDDING_MODEL,
                    input=batch
                )
                all_embeddings.extend([e.embedding for e in response.data])
            
            points = [
                PointStruct(
                    id=idx,
                    vector=embedding,
                    payload={
                        "tool_id": tool["tool_id"],
                        "server": tool["server"],
                        "port": tool["port"],
                        "description": tool["description"],
                        "tags": tool["tags"]
                    }
                )
                for idx, (tool, embedding) in enumerate(zip(TOOL_REGISTRY, all_embeddings))
            ]
            
            self.qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
            self._indexed = True
            print(f"[ROUTER] Indexed {len(points)} tools successfully.")
        except Exception as e:
            print(f"[ROUTER] Error indexing tools: {e}. Defaulting to keyword search.")
            self._indexed = True

    async def route(self, query: str, k: int = 3) -> list[dict]:
        """Find top-K most relevant tools for a given agent query."""
        if MOCK_MODE or not self._qdrant_available():
            return self._keyword_fallback(query, k)
            
        if not self._indexed:
            await self.index_all_tools()
            
        try:
            response = await self.openai.embeddings.create(
                model=EMBEDDING_MODEL,
                input=[query]
            )
            query_vector = response.data[0].embedding
            
            oversample_k = k * 3
            results = self.qdrant.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=oversample_k,
                with_payload=True
            )
            
            tools = [
                {
                    "tool_id": hit.payload["tool_id"],
                    "server": hit.payload["server"],
                    "port": hit.payload["port"],
                    "description": hit.payload["description"],
                    "score": round(hit.score, 4)
                }
                for hit in results[:k]
            ]
            return tools
        except Exception as e:
            print(f"[ROUTER] Vector routing failed: {e}. Falling back to keyword matching.")
            return self._keyword_fallback(query, k)

    def _keyword_fallback(self, query: str, k: int) -> list[dict]:
        """Score tools by counting matching words between query and tool tags/description."""
        query_words = set(query.lower().split())
        scored = []
        for tool in TOOL_REGISTRY:
            tool_words = set(" ".join(tool["tags"] + [tool["description"]]).lower().split())
            overlap = len(query_words & tool_words)
            scored.append((overlap, tool))
        scored.sort(key=lambda x: -x[0])
        return [{"tool_id": t["tool_id"], "server": t["server"], "port": t["port"],
                 "description": t["description"], "score": float(s)} for s, t in scored[:k]]

    async def get_tool_context(self, query: str, k: int = 3) -> str:
        """Returns a formatted string of top-K tools for injection into LLM context."""
        tools = await self.route(query, k)
        
        lines = ["AVAILABLE TOOLS FOR THIS TASK (semantic top-K selection):"]
        for tool in tools:
            lines.append(
                f"- {tool['tool_id']} (score: {tool['score']})\n"
                f"  Server: {tool['server']} | Port: {tool['port']}\n"
                f"  {tool['description']}"
            )
        
        return "\n".join(lines)

# Singleton instance
_router: Optional[SemanticToolRouter] = None

def get_router(qdrant_url: Optional[str] = None, github_token: Optional[str] = None, github_endpoint: Optional[str] = None) -> SemanticToolRouter:
    global _router
    if _router is None:
        _router = SemanticToolRouter(qdrant_url, github_token, github_endpoint)
    return _router
