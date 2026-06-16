# HireHawk — MCP Server Reference

> **Tool:** Google Antigravity (Agy)  
> **Config location:** `~/.gemini/config/mcp_config.json`  
> **Workspace rules:** `hirehawk/.agent/rules/`  
> **All servers:** FastAPI + Python + Azure Functions (free tier)  
> **Total servers:** 5

---

## Project folder structure

```
hirehawk/
├── .agent/
│   └── rules/
│       └── hirehawk.md          ← Antigravity workspace rule (paste from §0)
├── mcp_servers/
│   ├── resume_mcp/               ← Server 1
│   ├── jd_parser_mcp/            ← Server 2
│   ├── tracker_mcp/              ← Server 3
│   ├── company_intel_mcp/        ← Server 4
│   └── outreach_mcp/             ← Server 5
├── agents/                       ← LangGraph agents (built later)
├── frontend/                     ← React dashboard (built later)
└── README.md
```

---

## §0 — Antigravity workspace rule

Create this file at `hirehawk/.agent/rules/hirehawk.md` before starting any build:

```markdown
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
```

---

## §1 — resume-mcp

### What it does
Exposes Gokul's candidate profile as structured, queryable tools. This is the **single source of truth** for all resume data. No agent or MCP server may fabricate candidate details — everything flows from here.

### Tools

| Tool | Input | Output |
|------|-------|--------|
| `get_profile()` | none | name, email, phone, github, linkedin, portfolio, location |
| `get_education()` | none | degree, college, university, cgpa, hsc, sslc, grad_year |
| `get_experience(role_filter?)` | optional role string | list of internships with bullets, stack, dates |
| `get_projects(tags?)` | optional tag list: `["ai","fullstack","rag"]` | filtered project list with description, tech, live_url |
| `get_skills(category?)` | optional: `languages/frameworks/cloud/ml/certifications` | filtered skill list |
| `get_publications()` | none | list of research publications with title, venue, year |
| `get_certifications()` | none | list of certs with issuer, score, date |
| `get_sih_achievement()` | none | SIH 2025 result accurately framed |

### Candidate data (hardcoded in config.py — no DB needed)

```python
# This is Gokul's actual profile — never modify without his approval
PROFILE = {
    "name": "Gokul",
    "email": "gokul32499@gmail.com",
    "phone": "+91-7904231738",
    "github": "github.com/Gokul7904231",
    "linkedin": "linkedin.com/in/gokul1234",
    "portfolio": "gokul-builds.vercel.app",
    "location": "Chennai, Tamil Nadu, India"
}

EDUCATION = {
    "degree": "B.Tech Computer Science",
    "college": "Crescent College of Engineering",
    "university": "Anna University",
    "cgpa": "7.5/10",
    "hsc": "80.8%",
    "sslc": "88%",
    "school": "Vani Vidyalaya Matric Hr Sec School, Erode",
    "grad_year": 2026
}

EXPERIENCE = [
    {
        "role": "AI/ML Intern",
        "company": "Infosys Limited",
        "duration": "Aug–Oct 2025",
        "bullets": [
            "Built and fine-tuned ML pipelines using Python, TensorFlow, and PyTorch",
            "Implemented RAG-based document Q&A using LangChain and FAISS",
            "Deployed models as REST APIs with FastAPI on AWS EC2"
        ],
        "stack": ["Python", "TensorFlow", "PyTorch", "LangChain", "FAISS", "FastAPI", "AWS"]
    },
    {
        "role": "Full Stack Developer Intern",
        "company": "Zidio Development",
        "duration": "Jul–Sep 2024",
        "bullets": [
            "Built full-stack features using React.js, Node.js, and MongoDB",
            "Designed RESTful APIs and integrated third-party payment and auth services",
            "Improved frontend load time by 40% through code splitting and lazy loading"
        ],
        "stack": ["React.js", "Node.js", "MongoDB", "Express.js", "REST APIs"]
    }
]

PROJECTS = [
    {
        "name": "Sentixcare",
        "tags": ["ai", "ml", "multimodal"],
        "description": "Multimodal emotion recognition AI using CNN/TensorFlow, OpenCV, NLP with custom ERMA and AEISA algorithms. Mood-driven recommendation system.",
        "tech": ["Python", "TensorFlow", "OpenCV", "NLP", "HuggingFace"],
        "live_url": "huggingface.co/spaces/Gokul7904231/sentixcare",
        "github_url": "github.com/Gokul7904231/sentixcare",
        "highlight": "Live on HuggingFace Spaces"
    },
    {
        "name": "CineRAG",
        "tags": ["ai", "rag", "llm", "agentic"],
        "description": "Conversational movie recommendation agent using LangChain, LangGraph, LlamaIndex, FAISS, Ollama, LLaMA/Mistral/Qwen3 on TMDB dataset.",
        "tech": ["LangChain", "LangGraph", "LlamaIndex", "FAISS", "Ollama", "Python"],
        "live_url": None,
        "github_url": "github.com/Gokul7904231/CineRAG"
    },
    {
        "name": "Planetopia",
        "tags": ["fullstack", "gamification"],
        "description": "MERN-stack gamified sustainability platform. SIH 2025 National Finalist.",
        "tech": ["React.js", "Node.js", "MongoDB", "Express.js"],
        "live_url": None,
        "github_url": "github.com/Gokul7904231/planetopia",
        "highlight": "SIH 2025 National Finalist"
    },
    {
        "name": "Apex Shopify Analytics",
        "tags": ["fullstack", "dashboard", "analytics"],
        "description": "Full-stack e-commerce analytics dashboard with real-time sales data, charts, and inventory management.",
        "tech": ["React.js", "Node.js", "MongoDB", "Chart.js", "REST APIs"],
        "live_url": "apex-shopify.onrender.com",
        "github_url": "github.com/Gokul7904231/apex-shopify-analytics"
    }
]

PUBLICATIONS = [
    {
        "title": "Mood-Driven Multimodal Recommendation Systems using Late-Fusion Architecture",
        "venue": "ICRIT '26",
        "year": 2026,
        "type": "Conference Paper"
    },
    {
        "title": "Early Diabetic Retinopathy Detection using Deep Learning",
        "venue": "International Journal",
        "year": 2025,
        "type": "Journal Paper"
    }
]

CERTIFICATIONS = [
    {"name": "AWS Certified Cloud Practitioner", "issuer": "Amazon Web Services", "year": 2025},
    {"name": "Certified LLM Security Professional (CLLMSP)", "issuer": "LLMSP", "score": "95%", "year": 2025}
]

SIH_ACHIEVEMENT = "Finalist — Smart India Hackathon 2025 (National Level) | Won Internal College Round"
```

### Antigravity build prompt

```
Build the resume-mcp MCP server for the HireHawk project.

LOCATION: mcp_servers/resume_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK (pip install mcp[server]), Pydantic v2, python-dotenv

FOLLOW the workspace rule in .agent/rules/hirehawk.md exactly.

BUILD these files:

1. models.py
   - ProfileOutput, EducationOutput, ExperienceItem, ProjectItem, SkillsOutput, PublicationItem, CertificationItem
   - All Pydantic BaseModel with proper types
   - ProjectItem must have: name, tags, description, tech (list), live_url (Optional[str]), github_url, highlight (Optional[str])

2. config.py
   - Load all candidate data from the hardcoded PROFILE, EDUCATION, EXPERIENCE, PROJECTS, PUBLICATIONS, CERTIFICATIONS, SIH_ACHIEVEMENT constants (paste from mcp.md §1)
   - No .env needed for this server — data is static

3. tools.py
   Define these 8 async tool functions:
   - get_profile() → ProfileOutput
   - get_education() → EducationOutput
   - get_experience(role_filter: Optional[str] = None) → list[ExperienceItem]
     - If role_filter given, filter by role name (case-insensitive)
   - get_projects(tags: Optional[list[str]] = None) → list[ProjectItem]
     - If tags given, return projects that match ANY of the tags
   - get_skills(category: Optional[str] = None) → dict
     - Categories: languages, frameworks, cloud, ml, certifications
     - Returns all if no category
   - get_publications() → list[PublicationItem]
   - get_certifications() → list[CertificationItem]
   - get_sih_achievement() → dict with {"achievement": str}
   
   SKILLS data to use:
   languages = ["Python", "JavaScript", "TypeScript", "SQL"]
   frameworks = ["React.js", "Node.js", "FastAPI", "Flask", "Django", "LangChain", "LangGraph", "LlamaIndex"]
   cloud = ["AWS (CCP Certified)", "Azure Functions", "Docker", "Render", "Vercel"]
   ml = ["PyTorch", "TensorFlow", "Ollama", "LLaMA", "Mistral", "Qwen3", "FAISS", "Qdrant", "RAG pipelines"]
   certifications = ["AWS Certified Cloud Practitioner", "CLLMSP (95%)"]

4. main.py
   - Init FastAPI app
   - Init MCP server using mcp[server] SDK
   - Register all 8 tools from tools.py
   - Add health check GET / endpoint returning {"status": "ok", "server": "resume-mcp"}
   - Run with uvicorn on port 8001

5. requirements.txt
   fastapi, uvicorn, mcp[server], pydantic, python-dotenv

6. .env.example
   # No secrets needed for resume-mcp
   PORT=8001

7. host.json (Azure Functions)
   Standard Azure Functions v4 host.json

After building, show me how to run it locally:
uvicorn main:app --port 8001 --reload

Then show me the mcp_config.json entry to add to ~/.gemini/config/mcp_config.json for Antigravity.
```

---

## §2 — jd-parser-mcp

### What it does
Takes a raw JD URL or text. Scrapes it via Firecrawl, parses the content using an LLM, and returns a structured `JDSignals` object. This is the first agent called in every HireHawk pipeline run.

### Tools

| Tool | Input | Output |
|------|-------|--------|
| `parse_jd_url(url)` | job posting URL | JDSignals object |
| `parse_jd_text(text)` | raw JD text | JDSignals object |
| `extract_skills(jd_text)` | raw text | `{required: [], nice_to_have: []}` |
| `detect_seniority(jd_text)` | raw text | `{level: "intern/junior/mid/senior", confidence: float}` |
| `get_culture_keywords(jd_text)` | raw text | list of culture signal strings |

### JDSignals schema

```python
class JDSignals(BaseModel):
    company_name: str
    role_title: str
    required_skills: list[str]
    nice_to_have_skills: list[str]
    culture_keywords: list[str]
    seniority: str          # intern | junior | mid | senior
    domain: str             # ai | fullstack | devops | data | other
    remote_status: str      # remote | hybrid | onsite
    location: Optional[str]
    salary_range: Optional[str]
    raw_text: str
```

### Dependencies
- `firecrawl-py` — for URL scraping
- `openai` — for LLM parsing (GitHub Models endpoint)
- `instructor` — for structured LLM output (Pydantic from LLM)

### Antigravity build prompt

```
Build the jd-parser-mcp MCP server for the HireHawk project.

LOCATION: mcp_servers/jd_parser_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, Firecrawl, OpenAI SDK (pointed at GitHub Models), instructor, python-dotenv

FOLLOW the workspace rule in .agent/rules/hirehawk.md exactly.

BUILD these files:

1. models.py
   Define JDSignals(BaseModel):
   - company_name: str
   - role_title: str
   - required_skills: list[str]
   - nice_to_have_skills: list[str]
   - culture_keywords: list[str]
   - seniority: Literal["intern", "junior", "mid", "senior"]
   - domain: Literal["ai", "fullstack", "devops", "data", "other"]
   - remote_status: Literal["remote", "hybrid", "onsite", "unknown"]
   - location: Optional[str] = None
   - salary_range: Optional[str] = None
   - raw_text: str

2. config.py
   Load from .env:
   - FIRECRAWL_API_KEY
   - GITHUB_TOKEN (for GitHub Models)
   - GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com"
   - GITHUB_MODEL_NAME = "gpt-4o"
   - PORT = 8002

3. tools.py
   Implement:

   a) _scrape_url(url: str) -> str
      - Use firecrawl_client.scrape_url(url, params={"formats": ["markdown"]})
      - Return markdown text
      - Raise ValueError if scrape fails

   b) _parse_with_llm(text: str) -> JDSignals
      - Use instructor + OpenAI client pointed at GitHub Models endpoint
      - System prompt: "You are a precise JD parser. Extract structured signals from job descriptions. Return only what is explicitly stated — do not infer or fabricate."
      - Use instructor's client.chat.completions.create with response_model=JDSignals
      - Model: gpt-4o

   c) async parse_jd_url(url: str) -> dict
      - Scrape URL, parse with LLM, return JDSignals.model_dump()

   d) async parse_jd_text(text: str) -> dict
      - Parse raw text directly with LLM

   e) async extract_skills(jd_text: str) -> dict
      - Use LLM to extract just skills (lighter prompt, no full JDSignals)
      - Return {"required": [...], "nice_to_have": [...]}

   f) async detect_seniority(jd_text: str) -> dict
      - Return {"level": "intern|junior|mid|senior", "confidence": 0.0-1.0}

   g) async get_culture_keywords(jd_text: str) -> dict
      - Return {"keywords": [...]} — e.g. "fast-paced", "ownership", "remote-first"

4. main.py
   - Register all 5 tools
   - Health check GET / → {"status": "ok", "server": "jd-parser-mcp"}
   - Port 8002

5. requirements.txt
   fastapi, uvicorn, mcp[server], pydantic, firecrawl-py, openai, instructor, python-dotenv

6. .env.example
   FIRECRAWL_API_KEY=your_key_here
   GITHUB_TOKEN=your_github_token_here
   GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com
   GITHUB_MODEL_NAME=gpt-4o
   PORT=8002

After building, show me how to test parse_jd_url with a sample Wellfound job URL and print the full JDSignals output.
Then show me the mcp_config.json entry for Antigravity.
```

---

## §3 — tracker-mcp

### What it does
Full CRUD for the HireHawk application tracker. Backed by Supabase (PostgreSQL free tier). Every application, status update, outreach event, and follow-up reminder goes through this server. The Tracker Agent in LangGraph is the only writer.

### Supabase schema

```sql
-- Run this in Supabase SQL editor before building the server

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  jd_url TEXT,
  fit_score FLOAT,
  resume_version TEXT,
  status TEXT DEFAULT 'applied',  -- applied | interview | rejected | offer | follow_up_due
  applied_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,   -- applied | email_sent | interview_scheduled | rejected | offer
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL,   -- cold_email | referral_message | cover_letter
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tools

| Tool | Input | Output |
|------|-------|--------|
| `add_application(company, role, jd_url, fit_score, resume_version)` | application fields | `{id: uuid, success: bool}` |
| `update_status(app_id, status)` | uuid + status string | `{success: bool}` |
| `get_applications(status_filter?, limit?)` | optional filter | list of ApplicationRecord |
| `get_followups_due(days_threshold?)` | days since last activity (default 7) | list of overdue apps |
| `log_event(app_id, event_type, note?)` | event fields | `{success: bool}` |
| `save_draft(app_id, draft_type, content)` | draft fields | `{id: uuid, success: bool}` |
| `get_stats()` | none | `{total, by_status: dict, avg_fit_score, interviews}` |

### Antigravity build prompt

```
Build the tracker-mcp MCP server for the HireHawk project.

LOCATION: mcp_servers/tracker_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, supabase-py, python-dotenv

FOLLOW the workspace rule in .agent/rules/hirehawk.md exactly.

BEFORE building: create the Supabase tables by running the SQL from mcp.md §3. Then set SUPABASE_URL and SUPABASE_KEY in .env.

BUILD these files:

1. models.py
   - ApplicationRecord(BaseModel): id, company, role, jd_url, fit_score, resume_version, status, applied_at, last_activity, notes
   - EventRecord(BaseModel): id, app_id, event_type, note, created_at
   - DraftRecord(BaseModel): id, app_id, draft_type, content, created_at
   - AddApplicationInput(BaseModel): company, role, jd_url (Optional), fit_score (Optional[float]), resume_version (Optional[str])
   - UpdateStatusInput(BaseModel): app_id (str), status (Literal["applied","interview","rejected","offer","follow_up_due"])

2. config.py
   Load from .env:
   - SUPABASE_URL
   - SUPABASE_KEY (anon key is fine)
   - PORT = 8003
   Init supabase client: supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

3. tools.py
   Implement all 7 tools using supabase-py client:

   a) async add_application(company, role, jd_url, fit_score, resume_version) -> dict
      - Insert into applications table
      - Return {"id": new_uuid, "success": True}

   b) async update_status(app_id, status) -> dict
      - Update status + last_activity = now() where id = app_id
      - Log an event row too
      - Return {"success": True}

   c) async get_applications(status_filter=None, limit=50) -> list
      - Query applications table
      - If status_filter given, add .eq("status", status_filter)
      - Order by last_activity desc
      - Return list of ApplicationRecord dicts

   d) async get_followups_due(days_threshold=7) -> list
      - Return applications where last_activity < now() - days_threshold days
      - AND status not in ("rejected", "offer")

   e) async log_event(app_id, event_type, note=None) -> dict
      - Insert into events table
      - Update last_activity on parent application
      - Return {"success": True}

   f) async save_draft(app_id, draft_type, content) -> dict
      - Insert into drafts table
      - Return {"id": new_uuid, "success": True}

   g) async get_stats() -> dict
      - Query applications, group by status, count, avg fit_score
      - Return {"total": int, "by_status": {}, "avg_fit_score": float, "interviews": int}

4. main.py
   Register all 7 tools. Health check on GET /. Port 8003.

5. requirements.txt
   fastapi, uvicorn, mcp[server], pydantic, supabase, python-dotenv

6. .env.example
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   PORT=8003

After building, test add_application with a sample entry (company="Breathe ESG", role="AI Engineer Intern", fit_score=0.91), then call get_stats() and print the result.
Then show me the mcp_config.json entry for Antigravity.
```

---

## §4 — company-intel-mcp

### What it does
Given a company name, fetches structured intelligence: funding stage, headcount, tech stack, Glassdoor rating, recent news (last 90 days), and culture signals. Uses Pathway for real-time RAG on news + web search via Firecrawl for live data.

### Tools

| Tool | Input | Output |
|------|-------|--------|
| `get_company_intel(company_name)` | string | full CompanyIntel object |
| `get_tech_stack(company_name)` | string | `{stack: list[str], source: str}` |
| `get_culture_signals(company_name)` | string | `{signals: list[str], glassdoor_rating: float}` |
| `get_recent_news(company_name, days?)` | string + int (default 90) | `{articles: list[NewsItem]}` |
| `get_funding_info(company_name)` | string | `{stage, amount, investors, year}` |

### CompanyIntel schema

```python
class NewsItem(BaseModel):
    title: str
    summary: str
    date: str
    source: str

class CompanyIntel(BaseModel):
    company_name: str
    funding_stage: Optional[str]        # seed | series_a | series_b | public | unknown
    headcount: Optional[str]            # "~50" or "500-1000"
    hq_location: Optional[str]
    tech_stack: list[str]
    glassdoor_rating: Optional[float]
    culture_signals: list[str]
    recent_news: list[NewsItem]
    engineering_blog_url: Optional[str]
    careers_url: Optional[str]
```

### Antigravity build prompt

```
Build the company-intel-mcp MCP server for the HireHawk project.

LOCATION: mcp_servers/company_intel_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, Firecrawl, OpenAI SDK (GitHub Models), python-dotenv

FOLLOW the workspace rule in .agent/rules/hirehawk.md exactly.

BUILD these files:

1. models.py
   Define NewsItem and CompanyIntel as shown in mcp.md §4.
   Also define:
   - TechStackResult(BaseModel): stack (list[str]), confidence (str), source (str)
   - CultureResult(BaseModel): signals (list[str]), glassdoor_rating (Optional[float])
   - NewsResult(BaseModel): articles (list[NewsItem])
   - FundingInfo(BaseModel): stage (Optional[str]), amount (Optional[str]), investors (list[str]), year (Optional[int])

2. config.py
   Load from .env:
   - FIRECRAWL_API_KEY
   - GITHUB_TOKEN
   - GITHUB_MODELS_ENDPOINT
   - GITHUB_MODEL_NAME = "gpt-4o"
   - PORT = 8004

3. tools.py
   Implement these helper functions first:

   a) _web_search_company(company_name: str, query_suffix: str) -> str
      - Use Firecrawl search: f"{company_name} {query_suffix}"
      - Return combined markdown text from top 3 results
      - query_suffix examples: "tech stack engineering", "funding crunchbase", "culture glassdoor", "news 2026"

   b) _llm_extract(prompt: str, text: str, response_model) -> BaseModel
      - Use instructor + GitHub Models GPT-4o
      - System: "Extract structured data from the provided company research text. Only return what is explicitly found — never fabricate."
      - Return typed Pydantic object

   Then implement the 5 tools:

   c) async get_company_intel(company_name: str) -> dict
      - Run 3 parallel web searches: tech stack, funding, culture/news
      - Combine results and extract CompanyIntel using _llm_extract
      - Return CompanyIntel.model_dump()

   d) async get_tech_stack(company_name: str) -> dict
      - Search "{company_name} engineering tech stack"
      - Extract and return TechStackResult

   e) async get_culture_signals(company_name: str) -> dict
      - Search "{company_name} glassdoor culture reviews"
      - Extract and return CultureResult

   f) async get_recent_news(company_name: str, days: int = 90) -> dict
      - Search "{company_name} news {current_year}"
      - Extract and return NewsResult with articles filtered to within `days` days

   g) async get_funding_info(company_name: str) -> dict
      - Search "{company_name} funding round crunchbase series"
      - Extract and return FundingInfo

   Use asyncio.gather() in get_company_intel() to run the 3 searches in parallel for speed.

4. main.py
   Register all 5 tools. Health check on GET /. Port 8004.

5. requirements.txt
   fastapi, uvicorn, mcp[server], pydantic, firecrawl-py, openai, instructor, python-dotenv

6. .env.example
   FIRECRAWL_API_KEY=your_key
   GITHUB_TOKEN=your_token
   GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com
   GITHUB_MODEL_NAME=gpt-4o
   PORT=8004

After building, test get_company_intel("Breathe ESG") and print the full result. Check that recent_news has real articles, not fabricated ones.
Then show me the mcp_config.json entry for Antigravity.
```

---

## §5 — outreach-mcp

### What it does
Generates tailored cold emails, referral messages, and cover letters. Uses candidate data from resume-mcp and company intel from company-intel-mcp as inputs. Reads voice samples from mem0 to match Gokul's writing style. Saves drafts to tracker-mcp.

### Tools

| Tool | Input | Output |
|------|-------|--------|
| `generate_cold_email(jd_signals, company_intel, profile, tone?)` | structured dicts + optional tone | `{subject, body, word_count}` |
| `generate_referral_message(jd_signals, company_intel, profile)` | structured dicts | `{message, word_count}` |
| `generate_cover_letter(jd_signals, company_intel, profile)` | structured dicts | `{paragraphs: list[str], full_text}` |
| `save_draft(draft_type, content, app_id)` | draft fields | `{success: bool}` |
| `get_voice_sample()` | none | Gokul's writing voice description for the LLM |

### Voice sample (hardcoded — Gokul's actual style)

```
Writing voice: Direct, casual but professional. No corporate fluff. No "I am writing to express my interest."
Opens with a hook related to the company's actual work. References specific projects (Sentixcare, CineRAG)
by their impact, not just their name. Keeps cold emails under 150 words. Referral messages under 80 words.
Uses first person naturally. No excessive adjectives. Ends with a specific ask, not vague "hope to hear."
Example opener: "Your work on [specific ESG metric] caught my eye — I just shipped a Django + React
emissions tracker (carbon-ingest.onrender.com) for a similar use case."
NO FABRICATION: Never claim experience that is not in the profile from resume-mcp.
```

### Antigravity build prompt

```
Build the outreach-mcp MCP server for the HireHawk project.

LOCATION: mcp_servers/outreach_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, OpenAI SDK (GitHub Models), python-dotenv

FOLLOW the workspace rule in .agent/rules/hirehawk.md exactly.

BUILD these files:

1. models.py
   - JDSignalsInput(BaseModel): company_name, role_title, required_skills (list), culture_keywords (list), domain, seniority
   - CompanyIntelInput(BaseModel): company_name, funding_stage, tech_stack (list), culture_signals (list), recent_news (list[dict])
   - ProfileInput(BaseModel): name, email, github, portfolio, top_projects (list[dict]), top_skills (list[str]), experience_summary (str)
   - ColdEmailOutput(BaseModel): subject (str), body (str), word_count (int)
   - ReferralOutput(BaseModel): message (str), word_count (int)
   - CoverLetterOutput(BaseModel): paragraphs (list[str]), full_text (str)

2. config.py
   Load from .env:
   - GITHUB_TOKEN
   - GITHUB_MODELS_ENDPOINT
   - GITHUB_MODEL_NAME = "gpt-4o"
   - PORT = 8005
   
   Hardcode VOICE_SAMPLE string from mcp.md §5.

3. tools.py
   Build a _call_llm(system: str, user: str) -> str helper using OpenAI SDK + GitHub Models (no instructor needed here — free-form text generation).

   Then implement:

   a) async get_voice_sample() -> dict
      - Return {"voice_sample": VOICE_SAMPLE}

   b) async generate_cold_email(jd_signals: dict, company_intel: dict, profile: dict, tone: str = "direct_casual") -> dict
      
      System prompt:
      "You are writing a cold email for {profile.name} applying to {jd_signals.role_title} at {jd_signals.company_name}.
      
      VOICE: {VOICE_SAMPLE}
      
      RULES:
      - Under 150 words in the body
      - Reference one specific thing from company_intel.recent_news or company_intel.tech_stack
      - Reference one specific project from profile.top_projects by name and live URL
      - End with one clear ask (a 15-minute call or referral to the hiring manager)
      - NO fabrication — only use what is in profile and company_intel
      - NO corporate openers like 'I am writing to express my interest'
      - Return ONLY: Subject: <subject>\n\n<body>"
      
      Parse response into ColdEmailOutput. Count words in body.

   c) async generate_referral_message(jd_signals: dict, company_intel: dict, profile: dict) -> dict
      
      System prompt:
      "Write a casual referral request message for {profile.name} to send to a contact at {jd_signals.company_name}.
      
      VOICE: {VOICE_SAMPLE}
      
      RULES:
      - Under 80 words
      - Mention the specific role
      - One-line credential hook (e.g. SIH Finalist or Sentixcare on HuggingFace)
      - Direct ask: would you be willing to refer me or forward my resume?
      - NO fabrication"
      
      Return ReferralOutput.

   d) async generate_cover_letter(jd_signals: dict, company_intel: dict, profile: dict) -> dict
      
      "Write a 3-paragraph cover letter.
      Para 1 (Hook, ~60 words): Why this company specifically — reference real company intel.
      Para 2 (Proof, ~80 words): Most relevant project + internship bullet that maps to JD required_skills.
      Para 3 (Close, ~40 words): Clear ask + enthusiasm, no fluff.
      NO fabrication. Only use data from profile and company_intel."
      
      Split into paragraphs list. Return CoverLetterOutput.

   e) async save_draft(draft_type: str, content: str, app_id: str) -> dict
      - Make HTTP POST to tracker-mcp /save_draft endpoint (or call directly if in same process)
      - Return {"success": True, "draft_type": draft_type}

4. main.py
   Register all 5 tools. Health check on GET /. Port 8005.

5. requirements.txt
   fastapi, uvicorn, mcp[server], pydantic, openai, python-dotenv, httpx

6. .env.example
   GITHUB_TOKEN=your_token
   GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com
   GITHUB_MODEL_NAME=gpt-4o
   TRACKER_MCP_URL=http://localhost:8003
   PORT=8005

After building:
1. Test generate_cold_email with sample JD (role="AI Engineer Intern", company="Breathe ESG") and print the full output
2. Verify body is under 150 words
3. Verify no fabricated experience appears
Then show me the mcp_config.json entry for Antigravity.
```

---

## §6 — Antigravity mcp_config.json (all 5 servers)

Add all 5 servers to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "resume-mcp": {
      "url": "http://localhost:8001",
      "transport": "http",
      "description": "Gokul's candidate profile — single source of truth for all resume data"
    },
    "jd-parser-mcp": {
      "url": "http://localhost:8002",
      "transport": "http",
      "description": "Parses job description URLs and text into structured JDSignals"
    },
    "tracker-mcp": {
      "url": "http://localhost:8003",
      "transport": "http",
      "description": "Application tracker CRUD backed by Supabase"
    },
    "company-intel-mcp": {
      "url": "http://localhost:8004",
      "transport": "http",
      "description": "Fetches real-time company intelligence via Firecrawl + GPT-4o"
    },
    "outreach-mcp": {
      "url": "http://localhost:8005",
      "transport": "http",
      "description": "Generates tailored cold emails, referral messages, cover letters in Gokul's voice"
    }
  }
}
```

For Azure Functions production deployment, replace `http://localhost:800X` with your Azure Function URLs.

---

## §7 — Build order & testing sequence

Build in this order — each server is independent, no dependencies between them at build time:

```
1. resume-mcp      (port 8001)  — no external APIs, simplest, build first
2. tracker-mcp     (port 8003)  — only needs Supabase, build second
3. jd-parser-mcp   (port 8002)  — needs Firecrawl + GitHub Models
4. company-intel-mcp (port 8004) — needs Firecrawl + GitHub Models
5. outreach-mcp    (port 8005)  — needs GitHub Models + calls tracker-mcp
```

### Run all locally (5 terminal tabs or tmux)

```bash
cd mcp_servers/resume_mcp      && uvicorn main:app --port 8001 --reload
cd mcp_servers/tracker_mcp     && uvicorn main:app --port 8003 --reload
cd mcp_servers/jd_parser_mcp   && uvicorn main:app --port 8002 --reload
cd mcp_servers/company_intel_mcp && uvicorn main:app --port 8004 --reload
cd mcp_servers/outreach_mcp    && uvicorn main:app --port 8005 --reload
```

### Quick integration test after all 5 are running

```bash
# 1. Get Gokul's profile
curl http://localhost:8001/profile

# 2. Parse a JD
curl -X POST http://localhost:8002/parse_jd_url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://wellfound.com/jobs/your-target-job"}'

# 3. Add application
curl -X POST http://localhost:8003/add_application \
  -H "Content-Type: application/json" \
  -d '{"company": "Breathe ESG", "role": "AI Engineer Intern", "fit_score": 0.91}'

# 4. Get company intel
curl -X POST http://localhost:8004/get_company_intel \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Breathe ESG"}'

# 5. Generate cold email
curl -X POST http://localhost:8005/generate_cold_email \
  -H "Content-Type: application/json" \
  -d '{
    "jd_signals": {"company_name": "Breathe ESG", "role_title": "AI Engineer Intern", "required_skills": ["Python", "Django", "React"], "culture_keywords": ["sustainability", "ESG"], "domain": "fullstack", "seniority": "intern"},
    "company_intel": {"company_name": "Breathe ESG", "funding_stage": "Series A", "tech_stack": ["Django", "React", "PostgreSQL"], "culture_signals": ["sustainability-first"], "recent_news": []},
    "profile": {"name": "Gokul", "email": "gokul32499@gmail.com", "github": "github.com/Gokul7904231", "portfolio": "gokul-builds.vercel.app", "top_projects": [{"name": "Sentixcare", "live_url": "huggingface.co/spaces/Gokul7904231/sentixcare"}], "top_skills": ["Python", "Django", "React", "LangChain"], "experience_summary": "AI/ML Intern at Infosys, Full Stack Intern at Zidio"}
  }'
```

---

## §8 — Keys you need before starting

| Key | Where to get | Which servers need it |
|-----|-------------|----------------------|
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → Personal access tokens | jd-parser, company-intel, outreach |
| `FIRECRAWL_API_KEY` | firecrawl.dev → free tier (500 credits) | jd-parser, company-intel |
| `SUPABASE_URL` + `SUPABASE_KEY` | supabase.com → new project → Settings → API | tracker |
| No key needed | — | resume-mcp (static data only) |

GitHub Models is free — just needs your GitHub token. No billing required.

---

*HireHawk mcp.md — v1.0 — June 2026*
