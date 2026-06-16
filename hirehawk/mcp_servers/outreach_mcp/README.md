# Outreach MCP Server (outreach-mcp)

The `outreach-mcp` server is responsible for generating personalized professional communication drafts (cold emails, LinkedIn referral messages, and cover letters) in candidate **Gokul's** writing voice, and linking those drafts to tracker applications.

## Configuration & Specs

- **Port**: `8005`
- **Default Port HTTP Endpoint**: `http://localhost:8005`
- **Mock Mode Support**: Fully supported. When `MOCK_MODE=true`, it generates templates via `templates.py` containing Gokul's voice parameters and checks F1 constraints locally.
- **Integrations**:
  - **LLM Engine**: Uses OpenAI API / GitHub Models GPT-4o with structured guidelines to tailor messages without fabricating facts. Protected by `CircuitBreaker` (`llm_breaker`).
  - **Tracker MCP Integration**: Communicates via HTTP with `tracker-mcp` on port 8003 to link drafts. Under mock mode, if `tracker-mcp` is offline, it falls back to writing directly to the in-memory shared database (`tracker_mcp.mock_db`).

## Exposed Tools

All tools are decorated with `@self_healing` for robust error taxonomy checks.

### 1. `get_voice_sample`
- **Description**: Returns Gokul's writing style instructions used by LLMs to customize outputs.
- **Arguments**: None
- **Returns**: `{voice_sample: str}`

### 2. `generate_cold_email`
- **Description**: Creates a customized cold email under 150 words based on company tech, profile highlights, and news.
- **Arguments**:
  - `jd_signals` (Required `dict`): Outputs from `jd-parser-mcp`.
  - `company_intel` (Required `dict`): Outputs from `company-intel-mcp`.
  - `profile` (Required `dict`): Candidate profile information.
  - `tone` (Optional `str`): Writing tone (default: `"direct_casual"`).
- **Returns**: A structured JSON object conforming to `ColdEmailOutput` schema.

### 3. `generate_referral_message`
- **Description**: Generates a LinkedIn or platform referral message under 80 words.
- **Arguments**: Same as `generate_cold_email` (excluding tone).
- **Returns**: A structured JSON object conforming to `ReferralOutput` schema.

### 4. `generate_cover_letter`
- **Description**: Creates a 3-paragraph cover letter targeting specific JD requirements.
- **Arguments**: Same as `generate_referral_message`.
- **Returns**: A structured JSON object conforming to `CoverLetterOutput` schema.

### 5. `save_draft`
- **Description**: Connects to `tracker-mcp` to register the generated template content against a specific application record.
- **Arguments**:
  - `draft_type` (Required `str`): E.g. `cold_email`, `referral`, `cover_letter`.
  - `content` (Required `str`): The message text.
  - `app_id` (Required `str`): Target application UUID.
- **Returns**: `{success: bool, draft_type: str, id: str}`

## Running the Server

Make sure the parent directory virtual environment is active:
```bash
# Activate virtual environment
..\..\venv\Scripts\Activate.ps1 # On Windows
source ../../venv/bin/activate  # On Linux/macOS

# Run with uvicorn
uvicorn main:app --port 8005
```
