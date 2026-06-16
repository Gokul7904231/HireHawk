# Application Tracker MCP Server (tracker-mcp)

The `tracker-mcp` server manages the database operations for candidate job applications, communication history events, and outreach templates/drafts. 

## Configuration & Specs

- **Port**: `8003`
- **Default Port HTTP Endpoint**: `http://localhost:8003`
- **Mock Mode Support**: Fully supported. When `MOCK_MODE=true`, it skips external Supabase writes and uses `mock_db.py` to persist data in memory and read/write mutations directly to the local JSON fixture file (`fixtures/mock_tracker_data.json`).
- **Integrations**:
  - **Supabase PostgreSQL**: Used in production mode to store and query rows. Protected by a `CircuitBreaker` (`supabase_breaker`).

## Exposed Tools

All tools are decorated with `@self_healing` to guarantee resilience and smooth failures.

### 1. `add_application`
- **Description**: Creates a new job application row in the tracker DB.
- **Arguments**:
  - `company` (Required `str`): The name of the company.
  - `role` (Required `str`): The title of the job.
  - `jd_url` (Optional `str`): Job description URL.
  - `fit_score` (Optional `float`): RAG/profile alignment matching score.
  - `resume_version` (Optional `str`): Tag for the resume version sent.
  - `notes` (Optional `str`): General application notes.
- **Returns**: `{id: str, success: bool}`

### 2. `update_status`
- **Description**: Updates the status of an application and writes an entry in the events table.
- **Arguments**:
  - `app_id` (Required `str`): Target application UUID.
  - `status` (Required `str`): New status (e.g. `applied`, `interview`, `offer`, `rejected`).
- **Returns**: `{success: bool}`

### 3. `get_applications`
- **Description**: Retrieves application lists, ordered by last activity.
- **Arguments**:
  - `status_filter` (Optional `str`): Filter applications by status value.
  - `limit` (Optional `int`): Max records to retrieve (default: 50).
- **Returns**: List of applications or dictionary error.

### 4. `get_followups_due`
- **Description**: Finds active applications where the last activity is older than a specified threshold.
- **Arguments**:
  - `days_threshold` (Optional `int`): Limit in days since last update (default: 7).
- **Returns**: List of applications requiring followups.

### 5. `log_event`
- **Description**: Creates an event record (e.g., email sent, call scheduled, interview completed) linked to a parent application.
- **Arguments**:
  - `app_id` (Required `str`): Parent application UUID.
  - `event_type` (Required `str`): Event category name.
  - `note` (Optional `str`): Additional context description.
- **Returns**: `{success: bool}`

### 6. `save_draft`
- **Description**: Saves tailored emails, cover letters, or referral text drafts.
- **Arguments**:
  - `app_id` (Required `str`): Parent application UUID.
  - `draft_type` (Required `str`): Type of template (`cold_email`, `referral`, `cover_letter`).
  - `content` (Required `str`): Text content of the draft.
- **Returns**: `{id: str, success: bool}`

### 7. `get_stats`
- **Description**: Aggregates application counts, interview progress, and average profile-JD fit scores.
- **Arguments**: None
- **Returns**: Dictionary containing tracker metrics.

## Running the Server

Make sure the parent directory virtual environment is active:
```bash
# Activate virtual environment
..\..\venv\Scripts\Activate.ps1 # On Windows
source ../../venv/bin/activate  # On Linux/macOS

# Run with uvicorn
uvicorn main:app --port 8003
```
