# HireHawk Copilot — Chrome Extension Build Plan (Antigravity)

> **Paste this whole document as your first message to Antigravity.**
> Reference `mcp.md` in the same workspace — it's still needed for profile data, prompts, and the self-healing pattern (now ported to TypeScript).
> Designed for ~2.5–3 hr unsupervised run, following the same conventions that produced 27/27 passing tests last session.

---

## ⚙️ GROUND RULES (same as before)

1. Work through phases in order, autonomously. Never pause for confirmation.
2. Log every phase to `PROGRESS.md` (timestamped, append-only).
3. Git commit after every phase: `phase N: <what> — tests: <pass/fail>`.
4. Never halt the whole run on one failure — log to `## BLOCKERS`, move on.
5. `GEMINI_MOCK=true` by default — all Gemini-dependent code must run and pass tests with canned fixture responses. Real keys (already obtained) are used ONLY in the Phase 8 live smoke test.
6. At the end, generate `FINAL_REPORT.md` — the only thing Gokul reads first.

---

## 📐 Architecture overview

```
User on a job posting (LinkedIn, Naukri, Wellfound, company career page)
       ↓ clicks extension icon
Content script captures the page via Turndown.js (bypasses login walls —
runs in the user's authenticated session)
       ↓
Extension → Cloudflare Worker POST /extract  (Call 1: Gemini Flash)
       ↓ returns JDSignals (same shape as mcp.md §2)
Extension checks local vector cache (Orama + Xenova MiniLM) —
if cosine similarity > 0.95 to a previous JD, reuse cached tailoring instantly
       ↓ (cache miss)
Extension → Cloudflare Worker POST /tailor   (Call 2: Gemini Flash,
includes claim-extraction + adjudication fact-check trace)
       ↓ returns tailored bullets, cover letter, cold email, claim verification
Extension → Cloudflare Worker GET /company-intel  (Wikidata + DuckDuckGo +
Logo.dev — NO LLM call, fully deterministic)
       ↓
Popup UI shows everything — HITL review screen
       ↓ user clicks "Fill form"
Content script: heuristic DOM matcher autofills the form,
DataTransfer API injects the resume PDF
       ↓ user reviews, clicks submit themselves (or extension clicks
         after explicit "I've reviewed" confirmation)
       ↓ user clicks "Log application"
Extension → Cloudflare Worker POST /tracker/add_application (Supabase —
same tables Gokul already created)
```

Two packages, one repo:

```
hirehawk-copilot/
├── extension/                       # Chrome Extension, Manifest V3, WXT framework
│   ├── wxt.config.ts
│   ├── entrypoints/
│   │   ├── popup/
│   │   │   ├── index.html
│   │   │   └── main.ts
│   │   ├── content.ts                # injected into job posting pages
│   │   └── background.ts             # service worker — message bus + Worker calls
│   ├── lib/
│   │   ├── profile.ts                # loads fixtures/profile.json
│   │   ├── vector-cache.ts           # Orama + Xenova MiniLM, IndexedDB
│   │   ├── dom-extractor.ts          # Turndown.js capture
│   │   ├── heuristic-matcher.ts      # fuzzy field matching for autofill
│   │   ├── file-upload.ts            # DataTransfer resume injection
│   │   ├── ocr.ts                    # Tesseract.js for screenshot JDs
│   │   ├── resume-render.ts          # HTML/CSS resume + window.print()
│   │   └── api-client.ts             # talks to Cloudflare Worker
│   ├── fixtures/
│   │   ├── profile.json              # ported from mcp.md §1
│   │   ├── sample-job-posting.html
│   │   └── sample-jd-signals.json
│   └── tests/
│       ├── heuristic-matcher.test.ts
│       ├── vector-cache.test.ts
│       ├── dom-extractor.test.ts
│       └── e2e/extension.spec.ts     # Playwright
├── worker/                            # Cloudflare Worker, TypeScript
│   ├── wrangler.toml
│   ├── .dev.vars.example
│   ├── src/
│   │   ├── index.ts                   # router
│   │   ├── types.ts                   # JDSignals, TailorOutput, etc.
│   │   ├── lib/
│   │   │   ├── self-healing.ts        # TS port of mcp.md §9
│   │   │   ├── gemini.ts
│   │   │   ├── wikidata.ts
│   │   │   ├── duckduckgo.ts
│   │   │   ├── logo.ts
│   │   │   └── supabase.ts
│   │   └── routes/
│   │       ├── extract.ts             # Call 1
│   │       ├── tailor.ts              # Call 2
│   │       ├── company-intel.ts       # Wikidata/DDG/Logo — no LLM
│   │       └── tracker.ts             # ported from tracker-mcp
│   └── tests/
│       ├── extract.test.ts
│       ├── tailor.test.ts
│       ├── company-intel.test.ts
│       └── tracker.test.ts
├── PROGRESS.md
├── FINAL_REPORT.md
└── README.md
```

---

## Phase 0 — Scaffold (~15 min)

- [ ] `git init`, `.gitignore` (node_modules, dist, .dev.vars, .env, .wrangler)
- [ ] `extension/`: scaffold with WXT (`npx wxt@latest init extension` or equivalent MV3 + Vite + TS template — if WXT unavailable, use `@crxjs/vite-plugin`)
- [ ] `worker/`: scaffold with `npm create cloudflare@latest worker -- --type=hello-world-ts`
- [ ] Port profile data from **mcp.md §1** (PROFILE, EDUCATION, EXPERIENCE, PROJECTS, SKILLS, PUBLICATIONS, CERTIFICATIONS, SIH_ACHIEVEMENT) into `extension/fixtures/profile.json` — same data, JSON instead of Python dict
- [ ] Create `extension/fixtures/sample-job-posting.html` — a static HTML page mimicking a real job posting (use the "AI Engineer Intern @ Breathe ESG" example from earlier, with realistic nested divs/spans to test Turndown extraction)
- [ ] Create `extension/fixtures/sample-jd-signals.json` — expected JDSignals output for the above fixture (reuse from old `fixtures/sample_jd_signals.json` if it exists in the repo)
- [ ] `PROGRESS.md` + `FINAL_REPORT.md` skeleton
- [ ] Commit: "Phase 0: scaffold + ported profile data"

---

## Phase 1 — Worker: self-healing + Gemini client + Call 1 (extract) (~25 min)

### `worker/src/lib/self-healing.ts` — TS port of mcp.md §9

```typescript
export enum FailureType {
  F1_HALLUCINATION = "hallucination",
  F2_EXECUTION = "execution_error",
  F3_REASONING = "reasoning_inconsistency",
}

export class SelfHealingError extends Error {
  constructor(public failureType: FailureType, public original: Error, public attempts: number) {
    super(`${failureType} after ${attempts} attempts: ${original.message}`);
  }
}

function classify(e: Error): FailureType {
  const m = e.message.toLowerCase();
  if (/timeout|rate limit|429|503|fetch failed|network/.test(m)) return FailureType.F2_EXECUTION;
  if (/hallucinat|fabricat|not supported by evidence|schema/.test(m)) return FailureType.F1_HALLUCINATION;
  return FailureType.F3_REASONING;
}

export async function selfHealing<T>(
  fn: (correctiveContext?: string) => Promise<T>,
  opts: { maxRetries?: number; baseDelay?: number; fallback?: T } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, fallback } = opts;
  let corrective: string | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(corrective);
    } catch (e: any) {
      const type = classify(e);
      if (attempt < maxRetries) {
        corrective = `PREVIOUS ATTEMPT FAILED (${type}): ${e.message}. Fix this in your next response — do not repeat the mistake.`;
        const isRateLimit = /429|rate limit/.test(e.message.toLowerCase());
        const delay = isRateLimit ? Math.max(baseDelay * 2 ** (attempt - 1), 10000) : baseDelay * 2 ** (attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        if (fallback !== undefined) return fallback;
        throw new SelfHealingError(type, e, maxRetries);
      }
    }
  }
  throw new Error("unreachable");
}

// Simple circuit breaker — same CLOSED/OPEN/HALF_OPEN states as mcp.md §9
export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  constructor(private threshold = 3, private recoveryMs = 60000) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailure > this.recoveryMs) this.state = "HALF_OPEN";
      else throw new Error(`Circuit OPEN — retry in ${this.recoveryMs}ms`);
    }
    try {
      const result = await fn();
      if (this.state === "HALF_OPEN") { this.state = "CLOSED"; this.failures = 0; }
      return result;
    } catch (e) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= this.threshold) this.state = "OPEN";
      throw e;
    }
  }
}
```

### `worker/src/lib/gemini.ts`

```typescript
export async function callGemini(
  apiKey: string,
  model: string, // "gemini-3-flash" primary, "gemini-2.5-flash" fallback
  systemPrompt: string,
  userPrompt: string,
  responseSchema: object,
  mock: boolean,
  mockFixture: any
): Promise<any> {
  if (mock) return mockFixture;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json", responseSchema },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}
```

### `worker/src/types.ts` — JDSignals (same shape as mcp.md §2)

```typescript
export interface JDSignals {
  company_name: string;
  role_title: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  culture_keywords: string[];
  seniority: "intern" | "junior" | "mid" | "senior";
  domain: "ai" | "fullstack" | "devops" | "data" | "other";
  remote_status: "remote" | "hybrid" | "onsite" | "unknown";
  location?: string;
  salary_range?: string;
}
```

### `worker/src/routes/extract.ts` — Call 1

- Input: `{ jd_markdown: string }` (already converted to markdown client-side by Turndown)
- Build `responseSchema` matching `JDSignals` (Gemini structured output)
- System prompt: *"You are a precise JD parser. Extract structured signals from the provided job description markdown. Return only what is explicitly stated — do not infer or fabricate."*
- Wrap with `selfHealing(...)`, `GEMINI_MOCK` returns `fixtures/sample-jd-signals.json`
- `fallback`: a minimal JDSignals with all fields empty/unknown + `"extraction_failed": true`

### Tests — `worker/tests/extract.test.ts`

- Mock mode: POST sample markdown → returns valid JDSignals matching fixture
- Self-healing: inject a function that throws twice then succeeds → assert 3rd attempt result returned, with `[SELF-HEAL]` logged

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 1: self-healing + Gemini client + /extract (mock tested)"

---

## Phase 2 — Worker: Call 2 (tailor + fact-check trace) (~30 min)

This is the most important phase — it's the actual implementation of the trace-based fact-checking from the third doc (§5.2), done in a **single Gemini call** using structured output so it stays within the "max 2 calls" budget.

### `TailorOutput` type

```typescript
export interface ClaimVerification {
  claim: string;
  supported_by_baseline: boolean;
  reasoning: string;
}

export interface TailorOutput {
  tailored_bullets: { project_or_role: string; bullet: string }[];
  cover_letter_paragraphs: string[]; // 3 paragraphs
  cold_email: { subject: string; body: string };
  referral_message: string;
  claims: ClaimVerification[];
  any_unsupported_claims: boolean; // true if any claims.supported_by_baseline === false
}
```

### System prompt structure (single call, 4-step trace embedded in the prompt)

```
You are tailoring a candidate's resume bullets, cover letter, and outreach
messages for a specific job. Follow these steps IN ORDER within your response:

STEP 1 — DRAFT: Generate tailored_bullets, cover_letter_paragraphs (3 paragraphs),
cold_email, and referral_message, mapping the candidate's baseline experience
(provided below) onto the job's required_skills and culture_keywords.

STEP 2 — CLAIM EXTRACTION: List every distinct factual claim about the
candidate's experience present in your STEP 1 output (e.g. "built X using Y",
"led Z", "improved performance by N%").

STEP 3 — ADJUDICATION: For each claim from STEP 2, determine whether it is
EXPLICITLY supported by the baseline resume data provided below. Output
{claim, supported_by_baseline: boolean, reasoning: string} for each.

STEP 4 — REWRITE: If any claim has supported_by_baseline=false, rewrite the
offending bullet/paragraph to strictly match the baseline truth (e.g.
"led the architecture" → "contributed to the architecture" if baseline only
says "contributed to"). Your FINAL tailored_bullets/cover_letter/etc. must
contain ONLY claims that are supported_by_baseline=true.

VOICE: <insert VOICE_SAMPLE from mcp.md §5>

BASELINE RESUME DATA (ground truth — never go beyond this):
<insert profile.json experience + projects + skills>

JOB SIGNALS:
<insert JDSignals from Call 1>

Return the FINAL (post-rewrite) tailored_bullets, cover_letter_paragraphs,
cold_email, referral_message, AND the full claims array from STEP 3 (for
transparency in the UI), AND any_unsupported_claims (true only if STEP 4
rewrites were needed).
```

### `worker/src/routes/tailor.ts`

- Input: `{ jd_signals: JDSignals, profile: object }`
- `responseSchema` matching `TailorOutput`
- Self-healing: if `any_unsupported_claims === true` on the FIRST attempt, that's expected (rewrite happened) — NOT an error. Only retry if `claims.length === 0` (model skipped the trace) — corrective context: *"You did not include the claims verification array. Repeat the full 4-step process and include it."*
- Word-count guard (from mcp.md §9): cold_email.body > 160 words → retry with corrective context
- `GEMINI_MOCK`: returns a fixture `tailor-output.json` with a realistic claims array (include at least one `supported_by_baseline: false` entry that got rewritten, so the popup UI has something to show)

### Tests — `worker/tests/tailor.test.ts`

- Mock mode: valid TailorOutput shape, claims array present, cold_email under 160 words
- Self-healing: missing-claims-array scenario triggers retry with corrective context

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 2: /tailor with fact-check trace (mock tested)"

---

## Phase 3 — Worker: company-intel (zero LLM calls) (~25 min)

### `worker/src/lib/wikidata.ts`

```typescript
export async function queryWikidata(companyName: string) {
  const sparql = `
    SELECT ?companyLabel ?inception ?industryLabel ?website WHERE {
      ?company wdt:P31/wdt:P279* wd:Q4830453 ;
               rdfs:label "${companyName}"@en ;
               wdt:P571 ?inception ;
               wdt:P452 ?industry ;
               wdt:P856 ?website .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    } LIMIT 1`;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": "HireHawkCopilot/1.0" } });
  if (!res.ok) throw new Error(`Wikidata error ${res.status}`);
  const data = await res.json();
  return data.results.bindings[0] ?? null; // null = no match, NOT an error
}
```

### `worker/src/lib/duckduckgo.ts`

- `fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(companyName + " news 2026"))`
- Parse static HTML response with regex/lightweight HTML parsing (e.g. `linkedom` or simple regex on `result__snippet` class) — extract top 3 result titles + snippets
- Self-healing: F2 on fetch failure, fallback = `[]`

### `worker/src/lib/logo.ts`

- `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}` if token provided
- Else fallback to Hunter.io keyless: `https://logo.clearbit.com` is dead — use `https://logo.dev` public endpoint without token (lower rate limit) or Hunter's documented keyless pattern

### `worker/src/routes/company-intel.ts`

- `GET /company-intel?name=X&domain=Y`
- Runs Wikidata + DuckDuckGo + Logo in parallel (`Promise.allSettled` — partial results OK, this is the Map-Reduce pattern from doc 1, still valid here)
- Returns `{ founding_year, hq_location, industry, website, logo_url, recent_news: [...], data_availability: "full" | "partial" | "none" }`
- `data_availability: "none"` → extension's prompt for Call 2 should avoid referencing company specifics (directly fixes the hallucination downfall)

### Tests — `worker/tests/company-intel.test.ts`

- Mock `fetch` globally, test with a fixture Wikidata response (use a real company that exists in Wikidata, e.g. "Infosys" — should return real founding_year=1981, hq=Bangalore)
- Test `data_availability: "none"` path with empty fixture responses

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 3: /company-intel via Wikidata+DDG+Logo, zero LLM calls (tested)"

---

## Phase 4 — Worker: tracker (port from tracker-mcp) (~20 min)

The Supabase tables already exist from the previous session — reuse them as-is.

- [ ] `worker/src/lib/supabase.ts` using `@supabase/supabase-js`
- [ ] `worker/src/routes/tracker.ts` — port these 7 functions from mcp.md §3, same signatures/shapes:
  - `add_application`, `update_status`, `get_applications`, `get_followups_due`, `log_event`, `save_draft`, `get_stats`
- [ ] Wrap with `selfHealing` + `CircuitBreaker` for Supabase calls
- [ ] Tests — `worker/tests/tracker.test.ts`: since Supabase is LIVE (already set up), run real CRUD against it:
  - `add_application("Breathe ESG", "AI Engineer Intern", fit_score=0.91)` → returns id
  - `get_stats()` → total ≥ 1

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 4: /tracker ported to Worker, tested against live Supabase"

---

## Phase 5 — Worker wrangler config + local dev smoke test (~15 min)

- [ ] `wrangler.toml` — routes for all 4 endpoints, environment vars: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `LOGO_DEV_TOKEN` (optional), `GEMINI_MOCK`
- [ ] `.dev.vars.example` with placeholders
- [ ] `.dev.vars` (gitignored) — Antigravity should create this using the REAL keys (already obtained) for local testing only
- [ ] Run `wrangler dev` in background, curl all 4 routes:
  - `POST /extract` with `fixtures/sample-job-posting.html` converted to markdown
  - `POST /tailor` with the JDSignals from above + `fixtures/profile.json`
  - `GET /company-intel?name=Infosys`
  - `POST /tracker/add_application`
- [ ] Log full responses to `PROGRESS.md` under "## Worker Smoke Test"
- [ ] Commit: "Phase 5: wrangler config + local smoke test (4/4 routes respond)"

---

## Phase 6 — Extension: profile + vector cache (~25 min)

- [ ] `extension/lib/profile.ts` — loads `fixtures/profile.json`, exposes typed accessors mirroring resume-mcp's tools (`getProjects(tags?)`, `getExperience()`, etc.) — same logic, just TS functions over a JSON object instead of an MCP server
- [ ] `extension/lib/vector-cache.ts`:
  - Use `@xenova/transformers` (Transformers.js) with `Xenova/all-MiniLM-L6-v2` (384-dim, ~23MB, ~170ms/embedding per doc 3 §3.3)
  - Use `@orama/orama` for the local vector index, persisted to IndexedDB via `@orama/plugin-data-persistence`
  - `cacheGet(jdMarkdown: string): Promise<TailorOutput | null>` — embed input, search Orama, return cached `TailorOutput` if cosine similarity > 0.95, else null
  - `cacheSet(jdMarkdown: string, output: TailorOutput): Promise<void>`
- [ ] Tests — `extension/tests/vector-cache.test.ts` (Vitest):
  - Cache miss on first call → null
  - After `cacheSet`, querying with the SAME text → cache hit
  - Querying with a DIFFERENT-domain JD (e.g. "Frontend Engineer" vs "Data Scientist") → cache miss (similarity < 0.95)
  - Note: model download on first test run may take time — cache the ONNX model file locally after first download

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 6: profile accessor + local vector cache (Orama+Xenova, tested)"

---

## Phase 7 — Extension: content script (DOM capture, heuristic matcher, file upload) (~35 min)

### `extension/lib/dom-extractor.ts`

- `turndown` + `turndown-plugin-gfm` to convert `document.body.innerHTML` → clean markdown
- Strip nav/footer/script/style elements before conversion (heuristic: remove elements matching `nav, footer, script, style, [class*="cookie"], [class*="banner"]`)

### `extension/lib/heuristic-matcher.ts` — the core ATS-agnostic autofill engine

Field patterns (from doc 3 §2.2, expand this list):

```typescript
export const FIELD_PATTERNS: Record<string, RegExp> = {
  first_name: /(first.?name|fname|given.?name)/i,
  last_name: /(last.?name|surname|lname|family.?name)/i,
  full_name: /(^name$|full.?name|your.?name)/i,
  email: /(e-?mail)/i,
  phone: /(phone|mobile|contact.?number)/i,
  linkedin: /(linkedin)/i,
  github: /(github|portfolio.?url|website)/i,
  resume_upload: /(resume|cv|attach.*resume)/i,
  cover_letter: /(cover.?letter|why.*interested|motivation)/i,
  location: /(location|city|address)/i,
  experience_years: /(years.*experience|yoe)/i,
};

export function matchField(input: HTMLInputElement | HTMLTextAreaElement): string | null {
  const haystack = [
    input.labels?.[0]?.textContent,
    input.placeholder,
    input.getAttribute("aria-label"),
    input.name,
    input.id,
  ].filter(Boolean).join(" ").toLowerCase();

  for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
    if (pattern.test(haystack)) return field;
  }
  return null;
}

export function autofillForm(profile: ProfileData, tailorOutput: TailorOutput) {
  const inputs = document.querySelectorAll("input, textarea, select");
  let filled = 0;
  for (const el of inputs) {
    const field = matchField(el as HTMLInputElement);
    if (!field) continue;
    const value = resolveFieldValue(field, profile, tailorOutput);
    if (value && el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      (el as HTMLInputElement).value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      filled++;
    }
  }
  return { filled, total: inputs.length };
}
```

### `extension/lib/file-upload.ts` — DataTransfer resume injection (doc 3 §2.3)

```typescript
export async function injectResumeFile(input: HTMLInputElement, pdfBlob: Blob, filename: string) {
  const file = new File([pdfBlob], filename, { type: "application/pdf" });
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
```

### `extension/lib/ocr.ts`

- `tesseract.js` — context menu item "Extract job description from image" → `Tesseract.recognize(imageUrl, 'eng')` → pass result text to `/extract` as `jd_markdown`
- Keep this minimal — single function, no UI polish needed for MVP

### Tests — jsdom-based, `extension/tests/heuristic-matcher.test.ts` and `dom-extractor.test.ts`

- Build 3 mock form HTML fixtures simulating different ATS naming conventions:
  - "Workday-style": `<input name="legalNameSection_firstName">`
  - "Greenhouse-style": `<input aria-label="First Name">`
  - "Generic": `<label>First Name</label><input id="fname">`
- Assert `matchField` returns `"first_name"` for ALL THREE variants — this is the test that proves the ATS-agnostic claim
- `dom-extractor.test.ts`: run against `fixtures/sample-job-posting.html`, assert output markdown contains the job title and required skills text, and does NOT contain nav/footer junk

- [ ] Run tests, log to PROGRESS.md
- [ ] Commit: "Phase 7: content script — DOM capture, heuristic autofill (3/3 ATS variants pass), file upload, OCR stub"

---

## Phase 8 — Extension: popup UI, resume render, E2E test, LIVE smoke test (~35 min)

### `extension/lib/resume-render.ts`

- HTML template (CSS Grid/Flexbox, `@media print` rules per doc 3 §8.1) populated with `TailorOutput.tailored_bullets` + `profile.json` data
- `renderAndPrint()` opens the template in a new tab/window and calls `window.print()`

### Popup UI (`entrypoints/popup/`)

- Shows: captured JD summary, company-intel card (logo, founding year, HQ — or "limited data available" if `data_availability !== "full"`), tailored bullets, claims verification list (green check / red flag per claim — this is the fact-check trace made visible, a genuinely good UI feature), cover letter, cold email, referral message
- Buttons: "Fill form" (calls `autofillForm`), "Download resume" (calls `resume-render`), "Log application" (calls `/tracker/add_application`)
- HITL framing: NO auto-submit button. Footer text: *"HireHawk Copilot fills the form — you review and submit."*

### `extension/tests/e2e/extension.spec.ts` — Playwright

- Load the unpacked extension in Chromium (`launchPersistentContext` with `--load-extension` / `--disable-extensions-except` flags)
- Open `fixtures/sample-job-posting.html` as a local file
- Trigger the extension (simulate clicking the action icon or use the extension's exposed test hook)
- Assert: JD captured → `/extract` called (against local `wrangler dev`) → JDSignals returned → `/tailor` called → tailored bullets appear in popup → "Fill form" populates the fixture form's inputs correctly

### LIVE smoke test (uses real GEMINI_API_KEY + SUPABASE — both already configured)

- [ ] Run ONE full pipeline with `GEMINI_MOCK=false`:
  1. `/extract` on the real sample job posting → real JDSignals from Gemini 3 Flash
  2. `/tailor` with that output + real profile.json → real tailored bullets + claims array
  3. `/company-intel?name=Infosys` → real Wikidata data (Infosys is a known entity, good test case)
  4. `/tracker/add_application` → writes to live Supabase
- [ ] Log the FULL output of this live run to `PROGRESS.md` under "## LIVE Smoke Test Output" — this is what Gokul reviews first to sanity-check Gemini's real output quality
- [ ] Commit: "Phase 8: popup UI + resume render + E2E (mock) + LIVE smoke test (1 real pipeline run)"

---

## Phase 9 — Docs + FINAL_REPORT.md (~15 min)

- [ ] `README.md` (root): how to run `wrangler dev`, how to load the unpacked extension in `chrome://extensions`, how to set `.dev.vars`
- [ ] `FINAL_REPORT.md`:

```markdown
# HireHawk Copilot — Build Report

## Session summary
- Phases completed: X / 9
- Tests written / passing: X / X
- Live smoke test: pass/fail (see PROGRESS.md for full output)

## What's built
- [x] Worker: /extract (Call 1, Gemini Flash, JDSignals)
- [x] Worker: /tailor (Call 2, fact-check trace, claims verification)
- [x] Worker: /company-intel (Wikidata + DuckDuckGo + Logo.dev, zero LLM)
- [x] Worker: /tracker (ported to Supabase, live tested)
- [x] Extension: local vector cache (Orama + Xenova MiniLM)
- [x] Extension: heuristic ATS-agnostic autofill (3/3 naming conventions pass)
- [x] Extension: DataTransfer resume upload
- [x] Extension: HTML/CSS resume + print-to-PDF
- [x] Extension: popup UI with HITL review + claims display

## What Gokul needs to do when back
1. `cd worker && wrangler deploy` — deploy to Cloudflare (free tier, 0ms cold start)
2. Update `extension/lib/api-client.ts` with the deployed Worker URL
3. `cd extension && npm run build`, then load `extension/dist` as unpacked in chrome://extensions
4. Test on a REAL job posting (try Wellfound — most permissive)
5. Review the claims array in the popup on that real run — verify no fabrication
6. Optional: get LOGO_DEV_TOKEN for better logo coverage

## Known limitations (own these in interviews)
- OCR (Tesseract.js) is stubbed/minimal — works but UI is basic
- Heuristic matcher covers ~11 common field types — edge-case forms may need manual fill
- E2E Playwright test covers the fixture page only, not live ATS sites (by design —
  testing against real LinkedIn/Naukri would itself look like automation)

## v3 roadmap (talking points, not built)
- A2A/CrewAI/AG-UI multi-agent orchestration — original HireHawk design,
  kept as a separate "AI/ML agentic systems" portfolio piece (see mcp.md)
- Chrome Web Store publication
- Voice interface (Pipecat)
```

- [ ] Final commit: "Phase 9: docs + FINAL_REPORT — session complete"

---

## ⏱️ Time budget (~2.5-3 hrs)

| Phase | Est. time | Cumulative |
|-------|-----------|------------|
| 0 — Scaffold | 15 min | 0:15 |
| 1 — Worker: self-healing + /extract | 25 min | 0:40 |
| 2 — Worker: /tailor + fact-check trace | 30 min | 1:10 |
| 3 — Worker: /company-intel | 25 min | 1:35 |
| 4 — Worker: /tracker | 20 min | 1:55 |
| 5 — Wrangler config + smoke test | 15 min | 2:10 |
| 6 — Extension: profile + vector cache | 25 min | 2:35 |
| 7 — Extension: content script | 35 min | 3:10 |
| 8 — Extension: popup + E2E + LIVE test | 35 min | 3:45 |
| 9 — Docs | 15 min | 4:00 |

If running short: Phases 6-7 (vector cache, OCR) can be reduced to stubs with passing-but-minimal tests — Phases 1-5 and 8 (the Worker + the live smoke test) are the highest-value and prove the actual pipeline works end-to-end.

---

## 🔑 Keys (all already obtained)

| Key | Used by |
|-----|---------|
| `GEMINI_API_KEY` | Worker — `/extract`, `/tailor` |
| `SUPABASE_URL` + `SUPABASE_KEY` | Worker — `/tracker` |
| `LOGO_DEV_TOKEN` (optional) | Worker — `/company-intel` (works without it, lower rate limit) |

No GitHub token or Firecrawl key needed for this build — they remain useful only if Gokul revisits the original LangGraph/MCP backend as a separate artifact.

---

*HireHawk Copilot Build Plan — v1.0 — Path B — June 2026*
