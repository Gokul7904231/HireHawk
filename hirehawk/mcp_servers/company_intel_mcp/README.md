# Company Intelligence MCP Server (company-intel-mcp)

The `company-intel-mcp` server retrieves, parses, and caches deep-dive intelligence about target companies. It utilizes parallel web searching via Firecrawl, structures research text using LLMs (Instructor + OpenAI / GitHub Models), and caches results using Upstash Redis semantic routing.

## Configuration & Specs

- **Port**: `8004`
- **Default Port HTTP Endpoint**: `http://localhost:8004`
- **Mock Mode Support**: Fully supported. When `MOCK_MODE=true`, it skips external search/LLM APIs and returns structured company intelligence from `fixtures/sample_company_intel.json`.
- **Integrations**:
  - **Firecrawl Search**: Used to search for technical profile, funding details, and reviews online. Protected by `CircuitBreaker` (`firecrawl_breaker`).
  - **LLM Engine**: Uses Instructor with GitHub Models GPT-4o to parse combined search pages. Protected by `CircuitBreaker` (`llm_breaker`).
  - **Upstash Redis Semantic Caching**: Configured via `HireHawkSemanticCache` in `main.py`. Wraps `get_company_intel` to check semantic proximity of requests against past runs before invoking external calls. Falls back gracefully when Upstash is unconfigured.

## Exposed Tools

All tools are decorated with `@self_healing` for exception safety.

### 1. `get_company_intel`
- **Description**: Compiles tech stack, recent news, funding stage, culture, and headquarters locations in parallel.
- **Arguments**:
  - `company_name` (Required `str`): The name of the company to investigate.
- **Returns**: A structured JSON object conforming to `CompanyIntel` schema.

### 2. `get_tech_stack`
- **Description**: Returns technical software and infrastructure components detected for the company.
- **Arguments**:
  - `company_name` (Required `str`): The company name.
- **Returns**: `{stack: List[str], confidence: str, source: str}`

### 3. `get_culture_signals`
- **Description**: Extracts Glassdoor ratings, reviews, work-life balance feedback, and culture tags.
- **Arguments**:
  - `company_name` (Required `str`): The company name.
- **Returns**: `{signals: List[str], glassdoor_rating: float}`

### 4. `get_recent_news`
- **Description**: Returns relevant headlines and summaries from the past N days.
- **Arguments**:
  - `company_name` (Required `str`): The company name.
  - `days` (Optional `int`): Search window in days (default: 90).
- **Returns**: `{articles: List[dict]}`

### 5. `get_funding_info`
- **Description**: Returns funding round series, investment size, lead investors, and year.
- **Arguments**:
  - `company_name` (Required `str`): The company name.
- **Returns**: `{stage: str, amount: str, investors: List[str], year: int}`

## Running the Server

Make sure the parent directory virtual environment is active:
```bash
# Activate virtual environment
..\..\venv\Scripts\Activate.ps1 # On Windows
source ../../venv/bin/activate  # On Linux/macOS

# Run with uvicorn
uvicorn main:app --port 8004
```
