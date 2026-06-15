# NeuroHire — Master Autonomous Build Plan (Antigravity)

> **Purpose:** Paste this ENTIRE document as your first message to Antigravity, then walk away.
> Designed to run 2–3 hours unsupervised, building all 5 MCP servers + shared layer.
> Reference: mcp.md (must be in the same workspace — Antigravity should read it for full specs).

---

## ⚙️ GROUND RULES — read first, follow for the entire session

1. **NEVER pause to ask for API keys, confirmations, or "should I proceed?"** — work through every phase below in order, autonomously.
2. **MOCK_MODE is mandatory.** Every server must run and pass tests with ZERO real API keys, using `.env` defaults of `MOCK_MODE=true`. Real keys are added later by Gokul.
3. **Log everything to `PROGRESS.md`** at the project root — append a timestamped entry after each phase (started, completed, tests passed/failed, blockers).
4. **Never halt the whole run on one failure.** If a phase fails irrecoverably, write it to a `## BLOCKERS` section in `PROGRESS.md` with the exact error, then move to the NEXT phase. Phases 2–6 are independent of each other — order is for sanity, not strict dependency (except Phase 1, which all others depend on).
5. **Git commit after every phase** with message format: `phase N: <what was built> — tests: <pass/fail>`.
6. **At the end**, generate `FINAL_REPORT.md` — this is the only thing Gokul will read first.

---

## 📦 MOCK_MODE convention — add this to `.agent/rules/neurohire.md`

Append this section to the workspace rule (§0 from mcp.md) before starting Phase 0:

```markdown
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
```

---

## Phase 0 — Project scaffold (~10 min)

- [ ] Create the full folder structure from mcp.md §11
- [ ] Create `.agent/rules/neurohire.md` = §0 workspace rule + MOCK_MODE section above
- [ ] Create `fixtures/` directory at project root with 3 files:
  - `sample_jd_signals.json` — a realistic JDSignals for a "AI Engineer Intern @ Breathe ESG" role (use the structure from mcp.md §2, fill with plausible values matching Gokul's actual target roles)
  - `sample_company_intel.json` — a realistic CompanyIntel for "Breathe ESG" (Series A, ESG SaaS, ~40 employees, tech stack: Django/React/PostgreSQL)
  - `mock_tracker_data.json` — empty array `[]` (tracker-mcp will populate this in MOCK_MODE)
- [ ] `git init`, create `.gitignore` (node_modules, __pycache__, .env, *.pyc, venv/)
- [ ] Initial commit: "Phase 0: project scaffold + fixtures"
- [ ] Create `PROGRESS.md` with header and Phase 0 entry
- [ ] Create empty `FINAL_REPORT.md` skeleton with sections: Built, Tested, Blockers, Next Steps For Gokul

---

## Phase 1 — Shared layer (~25 min) — BLOCKS all other phases

Build `mcp_servers/shared/`:

- [ ] `__init__.py`
- [ ] `self_healing.py` — full implementation from mcp.md §9 (FailureType, classify_error, self_healing decorator, CircuitBreaker)
- [ ] `tool_registry.py` — full TOOL_REGISTRY (29 tools) from mcp.md §10
- [ ] `semantic_router.py` — SemanticToolRouter from mcp.md §10, WITH the MOCK_MODE keyword-fallback branch added:
  ```python
  async def route(self, query: str, k: int = 3) -> list[dict]:
      if MOCK_MODE or not self._qdrant_available():
          return self._keyword_fallback(query, k)
      # ... existing vector search logic
  
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
  ```
- [ ] `semantic_cache.py` — NeuroHireSemanticCache from mcp.md §10, with MOCK_MODE no-op already built in (per mcp.md spec)
- [ ] `config.py` — shared MOCK_MODE loader: `MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"`
- [ ] `requirements.txt`
- [ ] `.env.example` with `MOCK_MODE=true` plus all optional keys commented out
- [ ] **Tests** — `test_self_healing.py`:
  - Test that a function raising TimeoutError gets classified as F2 and retries
  - Test that after max_retries, fallback_value is returned with `self_heal_exhausted: True`
  - Test CircuitBreaker opens after threshold failures and blocks subsequent calls
- [ ] **Tests** — `test_routing.py`:
  - Run the 5 test queries from mcp.md §10
  - In MOCK_MODE, verify keyword fallback returns sensible top-3 (e.g. "write a cold email" → outreach.generate_cold_email in top 3)
- [ ] Run `pytest mcp_servers/shared/ -v`, log pass/fail counts to PROGRESS.md
- [ ] Commit: "Phase 1: shared self-healing + semantic routing (MOCK_MODE tested)"

---

## Phase 2 — resume-mcp (~20 min)

- [ ] Build per mcp.md §1 build prompt — all 8 tools, full candidate data hardcoded
- [ ] Wrap all 8 tools with `@self_healing` (light config — static data, max_retries=2)
- [ ] `main.py` with `/health` endpoint
- [ ] **Tests** — `test_resume_mcp.py`:
  - Call all 8 tools, assert response shapes match Pydantic models
  - Assert `get_projects(tags=["ai"])` returns Sentixcare and CineRAG
  - Assert `get_sih_achievement()` returns the exact framing from mcp.md
- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 2: resume-mcp complete (8/8 tools tested)"

---

## Phase 3 — tracker-mcp (~25 min)

- [ ] Build per mcp.md §3 build prompt — all 7 tools
- [ ] MOCK_MODE: implement `mock_db.py` — in-memory list of dicts mimicking the `applications`, `events`, `drafts` tables. Load from `fixtures/mock_tracker_data.json` on startup, write back on each mutation.
- [ ] When `MOCK_MODE=false`, use real Supabase client (per mcp.md spec) — if SUPABASE_URL missing, fall back to mock_db with a logged warning
- [ ] Wrap all 7 tools with `@self_healing` + `supabase_breaker` (breaker only active when not in mock mode)
- [ ] **Tests** — `test_tracker_mcp.py`:
  - `add_application("Breathe ESG", "AI Engineer Intern", fit_score=0.91)` → returns id
  - `get_applications()` → contains the added application
  - `update_status(id, "interview")` → status updated
  - `get_followups_due()` → empty initially (just added)
  - `get_stats()` → total=1, by_status={"applied":0,"interview":1,...}
- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 3: tracker-mcp complete (mock_db, 7/7 tools tested)"

---

## Phase 4 — jd-parser-mcp (~30 min)

- [ ] Build per mcp.md §2 build prompt — all 5 tools
- [ ] MOCK_MODE: `parse_jd_url` and `parse_jd_text` return `fixtures/sample_jd_signals.json` contents (parsed into JDSignals) regardless of input, with a `"mock": true` field added to the response
- [ ] `extract_skills`, `detect_seniority`, `get_culture_keywords` in MOCK_MODE: derive their output by slicing fields out of the same fixture (e.g. `extract_skills` returns `{required: fixture.required_skills, nice_to_have: fixture.nice_to_have_skills}`)
- [ ] Wrap all 5 tools with `@self_healing` + `firecrawl_breaker` + `llm_breaker` (breakers dormant in mock mode)
- [ ] **Tests** — `test_jd_parser_mcp.py`:
  - `parse_jd_url("https://example.com/any-job")` → returns valid JDSignals shape with `mock: true`
  - `extract_skills(...)` → returns non-empty required/nice_to_have lists
  - `detect_seniority(...)` → returns level + confidence float between 0–1
- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 4: jd-parser-mcp complete (5/5 tools tested, MOCK_MODE)"

---

## Phase 5 — company-intel-mcp (~30 min)

- [ ] Build per mcp.md §4 build prompt — all 5 tools
- [ ] MOCK_MODE: `get_company_intel` and related tools return slices of `fixtures/sample_company_intel.json` with `"mock": true` added
- [ ] Wrap all 5 tools with `@self_healing` + `firecrawl_breaker` + `llm_breaker`
- [ ] Apply `@cache.cache_company_intel` decorator (no-ops in mock mode per semantic_cache spec)
- [ ] Use `asyncio.gather` pattern from mcp.md §9 even in mock mode (gather over 3 fixture-reads — keeps code path identical to prod)
- [ ] **Tests** — `test_company_intel_mcp.py`:
  - `get_company_intel("Breathe ESG")` → returns CompanyIntel shape, `mock: true`
  - `get_tech_stack("Breathe ESG")` → non-empty stack list
  - `get_funding_info("Breathe ESG")` → stage = "series_a" (from fixture)
- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 5: company-intel-mcp complete (5/5 tools tested, MOCK_MODE)"

---

## Phase 6 — outreach-mcp (~25 min)

- [ ] Build per mcp.md §5 build prompt — all 5 tools
- [ ] MOCK_MODE: implement template-based generation in `templates.py`:
  - `generate_cold_email` mock: Jinja2 or f-string template producing a realistic <150-word email using `profile.name`, `jd_signals.company_name`, `jd_signals.role_title`, and `profile.top_projects[0].name` — must still pass the word-count guard
  - `generate_referral_message` mock: similar template, <80 words
  - `generate_cover_letter` mock: 3-paragraph template using profile + jd_signals fields
- [ ] Wrap all 5 tools with `@self_healing` + `llm_breaker` (the F1 word-count guard from mcp.md §9 still applies to mock templates — proves the self-healing logic works even without live LLM)
- [ ] `save_draft` — calls tracker-mcp's `/save_draft` (works against mock_db from Phase 3)
- [ ] **Tests** — `test_outreach_mcp.py`:
  - `generate_cold_email(sample_jd_signals, sample_company_intel, sample_profile)` → body word_count < 150
  - `generate_referral_message(...)` → word_count < 80
  - `generate_cover_letter(...)` → 3 paragraphs returned
  - `save_draft(...)` → success=True, verify it lands in tracker mock_db
- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 6: outreach-mcp complete (5/5 tools tested, MOCK_MODE templates)"

---

## Phase 7 — Integration smoke test (~15 min)

- [ ] Create `run_all_mock.sh` at project root — starts all 5 servers on ports 8001–8005 with `MOCK_MODE=true`, backgrounds them, waits for `/health` to return 200 on all 5
- [ ] Create `test_integration_e2e.py`:
  1. `GET resume-mcp/get_profile` → Gokul's profile
  2. `POST jd-parser-mcp/parse_jd_url` (any URL, mock) → JDSignals
  3. `POST company-intel-mcp/get_company_intel` ("Breathe ESG") → CompanyIntel
  4. `POST outreach-mcp/generate_cold_email` (using outputs of 1–3) → ColdEmailOutput, word_count < 150
  5. `POST tracker-mcp/add_application` (using fit data) → app_id
  6. `POST outreach-mcp/save_draft` (cold email, app_id) → success
  7. `GET tracker-mcp/get_applications` → contains the app with a linked draft
- [ ] Run the full chain, assert each step's output feeds correctly into the next (this proves the MCP contracts are compatible end-to-end)
- [ ] Log full pipeline output (all 7 steps) to `PROGRESS.md` under "## Integration Test Output"
- [ ] `./run_all_mock.sh stop` to tear down servers
- [ ] Commit: "Phase 7: end-to-end MOCK_MODE pipeline verified (7/7 steps pass)"

---

## Phase 8 — Documentation & final report (~10 min)

- [ ] Generate `README.md` per server (run command, tool list, env vars needed)
- [ ] Generate root `README.md`:
  - Project overview (1 paragraph)
  - Architecture diagram reference (link to TDD)
  - How to run everything in MOCK_MODE: `./run_all_mock.sh`
  - How to switch to live mode: which `.env` keys to fill per server
  - Folder structure
- [ ] Generate `FINAL_REPORT.md`:

```markdown
# NeuroHire — Build Report (Autonomous Session)

## Session summary
- Duration: <actual time taken>
- Phases completed: X / 8
- Total tests written: <count>
- Total tests passing: <count>

## What's built
- [x] Shared self-healing layer (F1/F2/F3 + circuit breakers)
- [x] Shared semantic router (29 tools indexed, keyword fallback active)
- [x] resume-mcp — 8/8 tools
- [x] tracker-mcp — 7/7 tools (mock_db)
- [x] jd-parser-mcp — 5/5 tools (MOCK_MODE fixtures)
- [x] company-intel-mcp — 5/5 tools (MOCK_MODE fixtures)
- [x] outreach-mcp — 5/5 tools (MOCK_MODE templates)
- [x] End-to-end pipeline verified in MOCK_MODE

## Blockers encountered
<list anything that failed, with exact errors>

## What Gokul needs to do when back (15 min)
1. Get GITHUB_TOKEN (github.com → Settings → Developer settings → PAT) — needed for jd-parser, company-intel, outreach
2. Get FIRECRAWL_API_KEY (firecrawl.dev free tier) — needed for jd-parser, company-intel
3. Create Supabase project + run SQL from mcp.md §3 → get SUPABASE_URL + SUPABASE_KEY
4. (Optional, Week 2) Create Qdrant Cloud cluster + Upstash Redis for live semantic routing/caching
5. Fill in .env files (copy .env.example → .env, paste keys)
6. Set MOCK_MODE=false in each .env
7. Re-run test_integration_e2e.py — should now hit live APIs
8. Review PROGRESS.md for any blockers logged during the autonomous run

## Next phase (Week 2 — not started)
- Build LangGraph supervisor + agent nodes (agents/)
- A2A delegation to CrewAI resume tailor agent
- AG-UI event streaming setup
- See mcp.md and NeuroHire_TDD.docx for full specs
```

- [ ] Final commit: "Phase 8: docs + FINAL_REPORT.md — session complete"

---

## ⏱️ Time budget (target ~2.5 hrs total)

| Phase | Est. time | Cumulative |
|-------|-----------|------------|
| 0 — Scaffold | 10 min | 0:10 |
| 1 — Shared layer | 25 min | 0:35 |
| 2 — resume-mcp | 20 min | 0:55 |
| 3 — tracker-mcp | 25 min | 1:20 |
| 4 — jd-parser-mcp | 30 min | 1:50 |
| 5 — company-intel-mcp | 30 min | 2:20 |
| 6 — outreach-mcp | 25 min | 2:45 |
| 7 — Integration test | 15 min | 3:00 |
| 8 — Docs + report | 10 min | 3:10 |

If running short on time, Phases 4–6 can run with reduced test coverage (1 test per tool minimum) — Phase 1, 2, 3, 7 are the highest-value for a working demo and should not be skipped.

---

## 🚨 If Antigravity gets stuck on anything

- Cannot resolve a package conflict → skip that server, log in BLOCKERS, continue to next phase
- A test fails and the fix isn't obvious after 2 attempts → comment out the failing assertion with `# TODO: Gokul review — <reason>`, keep the test file runnable, log in BLOCKERS
- Ambiguity in spec → make the most reasonable choice consistent with mcp.md conventions, note the assumption in PROGRESS.md, move on
- **Never** stop the entire session for any single issue — partial progress across all 8 phases is more valuable than perfect completion of fewer phases

---

*NeuroHire Master Build Plan — v1.0 — for Antigravity unsupervised session — June 2026*
