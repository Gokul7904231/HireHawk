# Job Description Parser MCP Server (jd-parser-mcp)

The `jd-parser-mcp` server is responsible for retrieving and analyzing job descriptions (JDs) using Firecrawl for web scraping and structured LLM parsing (via Instructor + OpenAI API / GitHub Models) into standardized signals.

## Configuration & Specs

- **Port**: `8002`
- **Default Port HTTP Endpoint**: `http://localhost:8002`
- **Mock Mode Support**: Fully supported. When `MOCK_MODE=true`, it skips external scrapers and LLM calls and returns data extracted from `fixtures/sample_jd_signals.json`.
- **Integrations**:
  - **Firecrawl**: Used to scrape job board URLs into raw markdown text. Protected by a `CircuitBreaker` (`firecrawl_breaker`).
  - **LLM Engine**: Uses Instructor with GitHub Models GPT-4o for structured extraction. Protected by a `CircuitBreaker` (`llm_breaker`).

## Exposed Tools

All tools are decorated with `@self_healing` to provide automated retry logic and schema fallback protection.

### 1. `parse_jd_url`
- **Description**: Scrapes a job description webpage from a URL and extracts structural parameters (company name, role title, seniority, domain, required skills, etc.).
- **Arguments**:
  - `url` (Required `str`): The web page URL containing the job posting.
- **Returns**: A structured JSON object conforming to `JDSignals` schema.

### 2. `parse_jd_text`
- **Description**: Parses raw job description text directly into structured signals without scraping.
- **Arguments**:
  - `text` (Required `str`): The raw text contents of the job description.
- **Returns**: A structured JSON object conforming to `JDSignals` schema.

### 3. `extract_skills`
- **Description**: Analyzes job description text and returns arrays of required and nice-to-have skills.
- **Arguments**:
  - `jd_text` (Required `str`): Job description text.
- **Returns**: `{required: List[str], nice_to_have: List[str]}`

### 4. `detect_seniority`
- **Description**: Evaluates the experience requirements and maps them to seniority levels (`intern`, `junior`, `mid`, `senior`) with confidence scores.
- **Arguments**:
  - `jd_text` (Required `str`): Job description text.
- **Returns**: `{level: str, confidence: float}`

### 5. `get_culture_keywords`
- **Description**: Detects indicators of work environment/culture (e.g. `remote-first`, `fast-paced`, `high autonomy`).
- **Arguments**:
  - `jd_text` (Required `str`): Job description text.
- **Returns**: `{keywords: List[str]}`

## Running the Server

Make sure the parent directory virtual environment is active:
```bash
# Activate virtual environment
..\..\venv\Scripts\Activate.ps1 # On Windows
source ../../venv/bin/activate  # On Linux/macOS

# Run with uvicorn
uvicorn main:app --port 8002
```
