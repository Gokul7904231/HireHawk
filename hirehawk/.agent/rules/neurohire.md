# HireHawk workspace rule

## Stack
- Language: Python 3.12
- MCP servers: FastAPI + mcp[server] SDK
- Validation: Pydantic v2 (strict mode)
- Deployment target: Azure Functions (free tier)
- All servers live in mcp_servers/<name>_mcp/

## Conventions
- Every tool must have a Pydantic input model and a Pydantic output model
- Every tool must have a docstring — this becomes the MCP tool description
- Use async def for all route handlers and tool functions
- Never hardcode secrets — use python-dotenv and .env file
- Return structured dicts, never plain strings
- Each server has its own requirements.txt and .env.example

## File structure per server
mcp_servers/<name>_mcp/
├── main.py          ← FastAPI app + MCP server init
├── tools.py         ← All tool definitions
├── models.py        ← Pydantic input/output models
├── config.py        ← Settings loaded from .env
├── requirements.txt
├── .env.example
└── host.json        ← Azure Functions config

## Error handling
- All tools must catch exceptions and return {"error": str(e), "success": False}
- Never let an unhandled exception propagate to the agent

## No fabrication rule (critical)
- resume-mcp must only return data that exists in the candidate's actual profile
- outreach-mcp must only use data provided by resume-mcp and company-intel-mcp
- No tool may invent or hallucinate candidate experience

## MOCK_MODE (critical for unsupervised builds)

Every MCP server reads MOCK_MODE from .env (default: true).

When MOCK_MODE=true:
- jd-parser-mcp: parse_jd_url and parse_jd_text return a hardcoded JDSignals fixture
  (see fixtures/sample_jd_signals.json) instead of calling Firecrawl/GitHub Models
- company-intel-mcp: get_company_intel and related tools return a hardcoded
  CompanyIntel fixture (see fixtures/sample_company_intel.json)
- outreach-mcp: generate_cold_email etc. use Python string templates instead of
  calling GitHub Models — still produce valid ColdEmailOutput/etc. shaped responses
- tracker-mcp: uses an in-memory Python dict as the "database" instead of Supabase
  (persisted to fixtures/mock_tracker_data.json on shutdown, loaded on startup)
- semantic_router: if Qdrant unreachable OR MOCK_MODE=true, falls back to simple
  keyword substring matching over TOOL_REGISTRY tags (still returns top-K)
- semantic_cache: if MOCK_MODE=true OR redisvl unavailable, no-ops (cache always misses)
- resume-mcp: unaffected — always static data, no external deps

Every tool function must check MOCK_MODE at the top and branch accordingly.
This allows 100% of the test suite to pass with zero API keys configured.

When MOCK_MODE=false, all real integrations activate IF the corresponding
.env keys are present. If MOCK_MODE=false but a key is missing, fall back
to MOCK_MODE behavior for that specific tool and log a warning.
