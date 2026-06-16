# HireHawk — Demo Script

This document is the step-by-step demo script for interviews, portfolio reviews, and live demos.

---

## 🎯 What You're Showing

HireHawk is a **multi-agent AI job application copilot** built entirely from scratch across 3 sessions:

| Layer | Technology | Purpose |
|---|---|---|
| Chrome Extension | React + TypeScript + WXT (MV3) | Popup UI on any job page |
| Cloudflare Worker | TypeScript | SSE proxy + direct Gemini fallback |
| LangGraph Backend | Python + FastAPI | Multi-agent orchestration |
| Agent Nodes | LangGraph StateGraph | JD parsing, tailoring, intel, scoring, outreach |
| CrewAI A2A | CrewAI + FastAPI | Resume customization sub-service |
| MCP Servers | Python + FastMCP | 5 purpose-built tool servers |
| Memory | Mem0 | 4D-scoped candidate context |
| Database | Supabase | Application tracking |

---

## 🚀 Quick Demo (5 minutes)

### Step 1 — Start the backend

```powershell
# Terminal 1 — MCP servers
cd hirehawk
.\run_all_mock.ps1 start

# Terminal 2 — FastAPI LangGraph backend
cd hirehawk-agent
.venv\Scripts\uvicorn main:app --port 8000 --reload

# Terminal 3 — CrewAI A2A
cd hirehawk-agent
.venv\Scripts\uvicorn crew.server:app --port 8001

# Terminal 4 — Cloudflare Worker
cd hirehawk-copilot/worker
npx wrangler dev --port 8787
```

### Step 2 — Run the demo pipeline

```powershell
# From project root — runs all 3 demo jobs in mock mode
cd hirehawk-agent
.venv\Scripts\python ..\demo\demo_runner.py --mock
```

**What you'll see:**
```
══════════════════════[ HIREHAWK DEMO PIPELINE ]══════════════════════
  Running 3 job(s) through the full agentic pipeline
  Mock mode: MCP=true | Gemini=true

══════[ JOB: AI Engineer Intern @ Breathe ESG ]══════
  → parse_jd
  → get_company_intel
  → score_fit
  → tailor_resume
  → write_outreach
  ⏸  HITL BREAKPOINT: paused before 'track_application'
     Fit score: 87.5

──────[ CLAIMS ADJUDICATION — AI Engineer Intern ]──────
  Total claims: 4 | Supported: 4 | Unsupported: 0
  ✅ Claim 1: Built LLM pipelines for ESG data extraction
  ✅ Claim 2: Developed FastAPI microservices
  ...

  ▶ Auto-approving (demo mode)...
  → track_application (post-approval)
  ✅ Pipeline complete!
     Fit score  : 87.5
     Tracker ID : TRK-abc123
```

### Step 3 — Show the Chrome Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable Developer Mode → **Load Unpacked** → select `hirehawk-copilot/extension/dist/`
3. Navigate to any job posting (LinkedIn, Greenhouse, Lever)
4. Click the HireHawk icon in the toolbar
5. Click **Extract JD** — watch the SSE stream events appear live
6. Review the tailored bullets and outreach draft
7. Click **Save Application** — the HITL approval dialog appears
8. Click **Approve** — the application is tracked in Supabase

---

## 🧠 Key Talking Points

### 1. Architecture Depth
> "The extension talks to a Cloudflare Worker via HTTP. The Worker proxies to a FastAPI server running a LangGraph StateGraph. The graph fans out in parallel to 3 agents — resume tailor, company intel, and fit scorer — then joins at the outreach writer. Before writing to Supabase, it pauses at a Human-in-the-loop breakpoint and waits for approval."

### 2. Claims Adjudication
> "Every claim the AI writes about the candidate is extracted, adjudicated for truthfulness against the real resume baseline, and rewritten if unsupported. The full trace is visible in the UI. No hallucinations ship."

### 3. MCP Architecture
> "There are 5 Model Context Protocol servers, each with its own FastAPI + FastMCP stack, circuit breakers, semantic caching, and retry logic. They're designed to be independently deployable to Azure Functions."

### 4. Engineering Discipline
> "41 tests across 3 test suites — pytest for Python, Vitest for TypeScript — all running offline in mock mode with no API keys. CI runs on every PR."

---

## 📊 By the Numbers

| Metric | Value |
|---|---|
| Total sessions | 3 |
| Total test count | 41 (20 pytest + 21 Vitest) — Session 3 adds more |
| Lines of code | ~6,000+ |
| MCP servers | 5 |
| LangGraph nodes | 6 |
| Languages | Python, TypeScript |
| Deployment targets | Render (FastAPI), Cloudflare (Worker), Azure (MCPs) |

---

## ❓ Common Interview Questions

**Q: Why LangGraph instead of plain Python?**  
A: LangGraph gives us a checkpointed StateGraph with built-in breakpoints, parallel fan-out, and thread-safe state management. The HITL pattern (interrupt_before) is one line of config.

**Q: Why MCP instead of direct API calls?**  
A: MCP gives us a standardized tool contract any agent can call. Each server is independently deployable, versioned, and testable. It's the right abstraction for multi-agent systems.

**Q: Why Cloudflare Workers instead of a regular Node server?**  
A: Workers run on the edge — sub-50ms cold starts globally. They also proxy SSE streams natively, which is critical for the live event feed from LangGraph to the extension.

**Q: What happens if a node fails?**  
A: Each node is wrapped in a retry decorator with exponential backoff and a max of 2 retries. Failures append to `error_log` in the state, and the graph continues. Langfuse traces every node execution.
