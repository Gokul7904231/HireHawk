# Shared Resiliency & Intelligence Layer

This directory contains the shared modules and decorators that provide self-healing, semantic caching, tool registration, and routing features across all five HireHawk Model Context Protocol (MCP) servers.

## Modules

### 1. `self_healing.py` (Resiliency Mechanics)
- **F1/F2/F3 Error Taxonomy**:
  - **F1 (Schema/Hallucination errors)**: Retried by passing a corrective instruction (`_corrective_context`) dynamically to the tool.
  - **F2 (Timeout/Rate limits)**: Handled using exponential backoff retries.
  - **F3 (Service offline/Fatal errors)**: Instantly trips the associated `CircuitBreaker` to protect downstream dependencies.
- **`@self_healing` Decorator**: Inspects target signatures, handles retries, and injects corrective context dynamically.
- **`CircuitBreaker` Class**: Protects integrations (Supabase, Firecrawl, OpenAI LLM) with customizable failure thresholds and cool-off/recovery periods.

### 2. `tool_registry.py` (Tool Database)
- Indexes and catalogs all **29 active tools** across the 5 MCP servers.
- Exposes metadata, descriptions, and server mappings for semantic dispatch.

### 3. `semantic_router.py` (Intelligent Dispatch)
- Routes unstructured user requests to the most appropriate MCP tool.
- Supports semantic similarity matching using vector embeddings (via OpenAI) or falls back automatically to keyword-based routing in mock environments.

### 4. `semantic_cache.py` (Response Caching)
- Provides semantic caching via Upstash Redis (`HireHawkSemanticCache`).
- Compares semantic vector proximity of input parameters to skip duplicate scraping or generation operations.
- Gracefully falls back to a pass-through in `MOCK_MODE` or when Upstash Redis is not connected.

### 5. `config.py`
- Shared environment variable configurations and settings.

## Running Tests

You can run unit tests for the shared layer directly using `pytest`:
```bash
# Run self-healing and routing unit tests
pytest test_self_healing.py
pytest test_routing.py
```
