# HireHawk — Autonomous AI Job Application Copilot

[![CI](https://github.com/gokulbalagopal/hirepros/actions/workflows/ci.yml/badge.svg)](https://github.com/gokulbalagopal/hirepros/actions)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-0.2+-green)](https://github.com/langchain-ai/langgraph)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-purple)](https://github.com/jlowin/fastmcp)
[![Chrome Extension](https://img.shields.io/badge/Chrome-MV3%20Extension-yellow?logo=googlechrome)](hirehawk-copilot/extension)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render)](https://render.com)
[![Azure Functions](https://img.shields.io/badge/MCP%20on-Azure%20Functions-0078D4?logo=microsoftazure)](https://azure.microsoft.com/en-us/products/functions)

> **HireHawk** turns any job posting into a full application package in seconds — tailored bullets, verified outreach, company intelligence, and a fit score — all streamed live to a Chrome Extension via a multi-agent LangGraph pipeline.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension (MV3)                       │
│          React + TypeScript + WXT · hirehawk-copilot/extension     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP / SSE
┌──────────────────────────▼──────────────────────────────────────────┐
│              Cloudflare Worker · hirehawk-copilot/worker           │
│    /extract → POST /run → pipe /stream SSE back to extension        │
│    /tailor  → POST /approve → pipe resuming SSE stream              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP / SSE
┌──────────────────────────▼──────────────────────────────────────────┐
│         FastAPI LangGraph Backend (port 8000) · hirehawk-agent     │
│                                                                     │
│   parse_jd ─┬─► tailor_resume  (CrewAI A2A :8001)                  │
│             ├─► get_company_intel                                   │
│             └─► score_fit                                           │
│                      └──── write_outreach                           │
│                               │                                     │
│                    ── HITL BREAKPOINT ──                            │
│                               │  POST /approve/{run_id}            │
│                       track_application (Supabase)                 │
└──────────┬──────────────────────────────────────────────────────────┘
           │ HTTP (MCP protocol)
┌──────────▼──────────────────────────────────────────────────────────┐
│              5 MCP Servers · hirehawk/mcp_servers                  │
│   resume-mcp :8001 · jd-parser-mcp :8002 · tracker-mcp :8003       │
│   company-intel-mcp :8004 · outreach-mcp :8005                     │
│   Each: FastAPI + FastMCP + circuit breakers + semantic cache       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Full Stack

| Layer | Component | Technology | Location |
|---|---|---|---|
| **UI** | Chrome Extension | React, TypeScript, WXT (MV3) | `hirehawk-copilot/extension/` |
| **Edge** | Cloudflare Worker | TypeScript, Hono | `hirehawk-copilot/worker/` |
| **Orchestration** | LangGraph Backend | Python, FastAPI, LangGraph | `hirehawk-agent/` |
| **Agents** | 6 node StateGraph | LangGraph, MemorySaver | `hirehawk-agent/graph/` |
| **A2A** | CrewAI Tailor | CrewAI, FastAPI | `hirehawk-agent/crew/` |
| **Memory** | Candidate context | Mem0 (4D-scoped) | `hirehawk-agent/memory/` |
| **Observability** | Trace + eval | Langfuse, DeepEval | `hirehawk-agent/observability/` |
| **Tools** | JD Parser MCP | Python, FastMCP | `hirehawk/mcp_servers/jd_parser_mcp/` |
| **Tools** | Resume MCP | Python, FastMCP | `hirehawk/mcp_servers/resume_mcp/` |
| **Tools** | Company Intel MCP | Python, FastMCP | `hirehawk/mcp_servers/company_intel_mcp/` |
| **Tools** | Outreach MCP | Python, FastMCP | `hirehawk/mcp_servers/outreach_mcp/` |
| **Tools** | Tracker MCP | Python, FastMCP | `hirehawk/mcp_servers/tracker_mcp/` |
| **Database** | Application tracker | Supabase (PostgreSQL) | Cloud |
| **Deployment** | Backend | Render | `render.yaml` |
| **Deployment** | Worker | Cloudflare Workers | `hirehawk-copilot/worker/wrangler.jsonc` |
| **Deployment** | MCP servers | Azure Functions | `deploy_azure_mcp.ps1` |

---

## 🧪 Tests

| Suite | Count | Command |
|---|---|---|
| Python backend (pytest) | 8 | `cd hirehawk-agent && python -m pytest -v` |
| Cloudflare Worker (Vitest) | 21 | `cd hirehawk-copilot/worker && npx vitest run` |
| MCP shared layer (pytest) | varies | `cd hirehawk && python -m pytest mcp_servers/shared/` |

All tests run in **mock mode** — no API keys required.

---

## 🚀 Local Development

### Prerequisites
- Python 3.11+
- Node.js 20+
- PowerShell (Windows) or bash (Unix)

### 1. Clone and set up Python environments

```bash
# MCP servers
cd hirehawk
python -m venv venv
.\venv\Scripts\Activate.ps1   # Windows
pip install -r mcp_servers/shared/requirements.txt

# LangGraph backend
cd hirehawk-agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Set up Worker

```bash
cd hirehawk-copilot/worker
npm install
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your keys
```

### 3. Start everything (mock mode)

```powershell
# Terminal 1 — MCP servers
cd hirehawk && .\run_all_mock.ps1 start

# Terminal 2 — LangGraph backend
cd hirehawk-agent && .venv\Scripts\uvicorn main:app --port 8000 --reload

# Terminal 3 — CrewAI A2A
cd hirehawk-agent && .venv\Scripts\uvicorn crew.server:app --port 8001

# Terminal 4 — Worker
cd hirehawk-copilot/worker && npx wrangler dev --port 8787
```

### 4. Run the demo

```powershell
cd hirehawk-agent
.venv\Scripts\python ..\demo\demo_runner.py --mock
```

---

## 🌐 Deployment

| Target | Command |
|---|---|
| Cloudflare Worker | `cd hirehawk-copilot/worker && npx wrangler deploy` |
| Render (FastAPI + CrewAI) | Push to `master` — Render auto-deploys from `render.yaml` |
| Azure Functions (5 MCPs) | `.\deploy_azure_mcp.ps1 -ResourceGroup hirehawk-rg -StorageAccount hirehawkstorage` |

After deploying:
1. Set `AGENT_BACKEND_URL` Cloudflare secret to your Render URL
2. Set MCP server URLs in Render env vars with Azure Function URLs

---

## ⚙️ Environment Variables

### Worker (`.dev.vars` / Cloudflare secrets)
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `AGENT_BACKEND_URL` | LangGraph FastAPI URL (blank = direct Gemini mode) |
| `GEMINI_MOCK` | `true` to use fixture data |
| `SUPABASE_MOCK` | `true` to use in-memory store |

### Backend (`hirehawk-agent/.env`)
| Variable | Description |
|---|---|
| `MCP_MOCK` | `true` to use fixture data |
| `A2A_MOCK` | `true` to use CrewAI fixture |
| `GEMINI_API_KEY` | Gemini key for live nodes |
| `SUPABASE_URL` / `SUPABASE_KEY` | Live database |
| `JD_PARSER_MCP_URL` ... | Azure Function URLs |
| `LANGFUSE_*` | Observability keys |
| `MEM0_API_KEY` | Memory service key |

---

## 👤 Author

**Gokul A** — AI Engineer & Full Stack Developer  
Built HireHawk across demonstrating end-to-end AI systems engineering.
