# HireHawk Recruiter Workspace (Session 4 Final Report)

A standalone, responsive, dark-themed React recruitment portal demonstrating real-time recruiter agent executions, candidate profile configurations, and automated claims adjudication validation.

---

## What Was Built

### 1. Standalone React Dashboard (`hirehawk-dashboard`)
Created a high-fidelity dashboard built using React 18, Vite, TypeScript, and Tailwind CSS. The workspace includes three primary views managed via client state routing:
- **Workspace Home (`/`)**: Displays candidate pipeline counters and stats, a searchable and sortable table of all applications, and a live agent console.
- **Application Details (`/app/:id`)**: Shows tailored cold outreach materials (email, cover letter, referral), side-by-side tailored resume bullet comparisons, and a claims validation list.
- **Settings & Cluster Status (`/settings`)**: Provides a live JSON editor for editing candidate profile fixtures and a status grid verifying connectivity for the five core MCP servers.

### 2. Live Agent SSE Panel (`AgentPanel.tsx`)
Connects to the FastAPI `/stream/{run_id}` SSE endpoint. In Mock Mode (`VITE_MOCK=true`), it simulates the multi-agent recruitment workflow:
- `parse_jd` (JD Analyzer) -> `tailor_resume` (Resume Tailor) -> `get_company_intel` (Company Intel) -> `score_fit` (Fit Scorer) -> `write_outreach` (Outreach Writer) -> `HITL` (Human-in-the-Loop review breakpoint).
- Renders a purple awaiting confirmation banner during `HITL` pausing, allowing candidates to approve or reject the draft.
- Clicking approve posts to `/approve/{run_id}` to log the application and complete the sequence.

### 3. Backend Extensions (`server.py`)
Extended the FastAPI backend server with the following endpoints:
- `GET /profile`: Loads candidate profile data from `fixtures/profile.json`.
- `POST /profile`: Overwrites the profile fixture and updates candidate memories inside `mem0` using semantic chunks.
- `GET /mcp_status`: Checks health by hitting local `/health` endpoints on all 5 uvicorn MCP servers (`resume-mcp`, `jd-parser-mcp`, `tracker-mcp`, `company-intel-mcp`, `outreach-mcp`).

---

## Test Suite Results

Comprehensive unit tests were written to verify card summaries, table filters, search parameters, streaming stages, and HITL banner clicks. All tests run in JSDOM environments using scaled timeouts to prevent promise execution blocks.

### Vitest Execution Output:
```bash
> vitest run

 RUN  v1.6.1 C:/Users/ASUS/OneDrive/Desktop/123/Hirepros/hirehawk-dashboard

 ✓ tests/MetricCards.test.tsx  (1 test) 139ms
 ✓ tests/AppTable.test.tsx  (1 test) 502ms
 ✓ tests/AgentPanel.test.tsx  (1 test) 465ms

 Test Files  3 passed (3)
      Tests  3 passed (3)
   Start at  22:18:11
   Duration  4.37s
```

---

## Deployment Configuration

- **`vercel.json`**: Configured redirects and SPA routing rewrites to ensure clean path handling.
- **Mock Mode**: Bypasses offline servers using local fixtures and polling overrides, allowing the portal to run fully self-sufficiently in deployment.
