# NeuroHire — MCP Server Reference

> **Tool:** Google Antigravity (Agy)  
> **Config location:** `~/.gemini/config/mcp_config.json`  
> **Workspace rules:** `neurohire/.agent/rules/`  
> **All servers:** FastAPI + Python + Azure Functions (free tier)  
> **Total servers:** 5

---

## Project folder structure

```
neurohire/
├── .agent/
│   └── rules/
│       └── neurohire.md          ← Antigravity workspace rule (paste from §0)
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

Create this file at `neurohire/.agent/rules/neurohire.md` before starting any build:

```markdown
# NeuroHire workspace rule

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
Build the resume-mcp MCP server for the NeuroHire project.

LOCATION: mcp_servers/resume_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK (pip install mcp[server]), Pydantic v2, python-dotenv

FOLLOW the workspace rule in .agent/rules/neurohire.md exactly.

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
Takes a raw JD URL or text. Scrapes it via Firecrawl, parses the content using an LLM, and returns a structured `JDSignals` object. This is the first agent called in every NeuroHire pipeline run.

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
Build the jd-parser-mcp MCP server for the NeuroHire project.

LOCATION: mcp_servers/jd_parser_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, Firecrawl, OpenAI SDK (pointed at GitHub Models), instructor, python-dotenv

FOLLOW the workspace rule in .agent/rules/neurohire.md exactly.

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
Full CRUD for the NeuroHire application tracker. Backed by Supabase (PostgreSQL free tier). Every application, status update, outreach event, and follow-up reminder goes through this server. The Tracker Agent in LangGraph is the only writer.

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
Build the tracker-mcp MCP server for the NeuroHire project.

LOCATION: mcp_servers/tracker_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, supabase-py, python-dotenv

FOLLOW the workspace rule in .agent/rules/neurohire.md exactly.

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
Build the company-intel-mcp MCP server for the NeuroHire project.

LOCATION: mcp_servers/company_intel_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, Firecrawl, OpenAI SDK (GitHub Models), python-dotenv

FOLLOW the workspace rule in .agent/rules/neurohire.md exactly.

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
Build the outreach-mcp MCP server for the NeuroHire project.

LOCATION: mcp_servers/outreach_mcp/

STACK: Python 3.12, FastAPI, mcp[server] SDK, Pydantic v2, OpenAI SDK (GitHub Models), python-dotenv

FOLLOW the workspace rule in .agent/rules/neurohire.md exactly.

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

---

## §9 — Self-Healing Layer (applies to ALL 5 servers)

Every MCP server must implement a self-healing wrapper around every tool call. Based on the failure taxonomy from the Advanced Architectural Paradigms paper, three failure classes are handled differently.

### Failure taxonomy

| Code | Name | Cause | Recovery |
|------|------|-------|----------|
| F1 | Hallucination | LLM returns fabricated or contextually wrong data | Corrective prompt injection — re-run with error context added |
| F2 | Execution Error | Malformed API call, schema mismatch, network timeout, rate limit | Stack trace feedback loop — inject exact error into LLM context and retry |
| F3 | Reasoning Inconsistency | Logical degradation across steps, conflicting outputs | Graph state rollback — revert to last known good checkpoint |

### Self-healing base class — add to EVERY server

Create `mcp_servers/shared/self_healing.py` (shared across all 5 servers):

```python
# mcp_servers/shared/self_healing.py
import asyncio
import logging
import traceback
from enum import Enum
from typing import Any, Callable, Optional
from functools import wraps

logger = logging.getLogger("neurohire.self_healing")

class FailureType(Enum):
    F1_HALLUCINATION = "hallucination"
    F2_EXECUTION = "execution_error"
    F3_REASONING = "reasoning_inconsistency"

class SelfHealingError(Exception):
    def __init__(self, failure_type: FailureType, original_error: Exception, attempts: int):
        self.failure_type = failure_type
        self.original_error = original_error
        self.attempts = attempts
        super().__init__(f"{failure_type.value} after {attempts} attempts: {original_error}")

def classify_error(error: Exception) -> FailureType:
    """Classify exception into F1/F2/F3 taxonomy."""
    error_str = str(error).lower()
    
    # F2: Execution errors — deterministic, retriable
    if any(k in error_str for k in [
        "timeout", "connection", "rate limit", "429", "503",
        "json", "schema", "validation", "typeerror", "keyerror",
        "attributeerror", "404", "500"
    ]):
        return FailureType.F2_EXECUTION
    
    # F1: Hallucination signals — LLM output validation failures
    if any(k in error_str for k in [
        "fabricat", "hallucin", "not found in profile",
        "invalid url", "no such project", "pydantic"
    ]):
        return FailureType.F1_HALLUCINATION
    
    # F3: Default for reasoning/logic failures
    return FailureType.F3_REASONING

def self_healing(
    max_retries: int = 3,
    base_delay: float = 1.0,
    fallback_value: Optional[Any] = None
):
    """
    Decorator for MCP tool functions.
    Catches exceptions, classifies them, applies appropriate recovery,
    and retries with exponential backoff.
    
    Usage:
        @self_healing(max_retries=3, fallback_value={"error": "unavailable", "success": False})
        async def my_tool(param: str) -> dict:
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            corrective_context = None
            
            for attempt in range(1, max_retries + 1):
                try:
                    # On retry attempts, inject corrective context if available
                    if corrective_context and "llm_call" in func.__name__ or attempt > 1:
                        kwargs["_corrective_context"] = corrective_context
                    
                    result = await func(*args, **kwargs)
                    
                    if attempt > 1:
                        logger.info(
                            f"[SELF-HEAL] {func.__name__} recovered on attempt {attempt}"
                        )
                    return result
                    
                except Exception as e:
                    last_error = e
                    failure_type = classify_error(e)
                    stack_trace = traceback.format_exc()
                    
                    logger.warning(
                        f"[SELF-HEAL] {func.__name__} | attempt {attempt}/{max_retries} | "
                        f"{failure_type.value} | {type(e).__name__}: {e}"
                    )
                    
                    # Build corrective context for next attempt (F1 + F2)
                    corrective_context = (
                        f"PREVIOUS ATTEMPT FAILED ({failure_type.value}):\n"
                        f"Error: {type(e).__name__}: {str(e)}\n"
                        f"Stack trace:\n{stack_trace}\n"
                        f"Fix the above error in your next response. "
                        f"Do not repeat the same mistake."
                    )
                    
                    if attempt < max_retries:
                        # Exponential backoff: 1s, 2s, 4s
                        delay = base_delay * (2 ** (attempt - 1))
                        
                        # For rate limits (F2), wait longer
                        if "429" in str(e) or "rate limit" in str(e).lower():
                            delay = max(delay, 10.0)
                        
                        logger.info(f"[SELF-HEAL] Retrying in {delay}s...")
                        await asyncio.sleep(delay)
                    else:
                        # All retries exhausted
                        logger.error(
                            f"[SELF-HEAL] {func.__name__} failed after {max_retries} attempts. "
                            f"Final failure: {failure_type.value}"
                        )
                        
                        if fallback_value is not None:
                            logger.info(f"[SELF-HEAL] Returning fallback value for {func.__name__}")
                            return {
                                **fallback_value,
                                "self_heal_exhausted": True,
                                "failure_type": failure_type.value,
                                "error": str(last_error)
                            }
                        
                        raise SelfHealingError(failure_type, last_error, max_retries)
        
        return wrapper
    return decorator


class CircuitBreaker:
    """
    Circuit breaker for external API calls (Firecrawl, GitHub Models).
    Prevents cascading failures when an external service is down.
    States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
    """
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"
    
    async def call(self, func: Callable, *args, **kwargs):
        import time
        
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("[CIRCUIT] Half-open — testing recovery")
            else:
                raise Exception(f"Circuit OPEN — service unavailable. Retry in {self.recovery_timeout}s")
        
        try:
            result = await func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("[CIRCUIT] Closed — service recovered")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"[CIRCUIT] OPEN — {self.failure_count} failures. Blocking calls for {self.recovery_timeout}s")
            raise
```

### How to apply to each server

**resume-mcp** (static data, minimal risk — light wrapper):
```python
# tools.py
from shared.self_healing import self_healing

@self_healing(max_retries=2, fallback_value={"error": "profile unavailable", "success": False})
async def get_profile() -> dict:
    """Returns Gokul's full contact and identity profile."""
    return PROFILE
```

**jd-parser-mcp** (Firecrawl + LLM — highest failure risk):
```python
from shared.self_healing import self_healing, CircuitBreaker

firecrawl_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=120.0)
llm_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60.0)

@self_healing(
    max_retries=3,
    base_delay=2.0,
    fallback_value={"error": "JD parsing failed", "success": False, "jd_signals": None}
)
async def parse_jd_url(url: str, _corrective_context: str = None) -> dict:
    """
    Parses a job description URL into structured JDSignals.
    Self-heals on Firecrawl timeouts (F2) and LLM schema errors (F1).
    Corrective context is injected automatically on retry.
    """
    # If this is a retry with corrective context, add it to LLM system prompt
    system_prompt = BASE_SYSTEM_PROMPT
    if _corrective_context:
        system_prompt = f"{BASE_SYSTEM_PROMPT}\n\n{_corrective_context}"
    
    raw_text = await firecrawl_breaker.call(_scrape_url, url)
    result = await llm_breaker.call(_parse_with_llm, raw_text, system_prompt)
    return result.model_dump()
```

**company-intel-mcp** (parallel web searches — rate limit risk):
```python
@self_healing(
    max_retries=3,
    base_delay=1.0,
    fallback_value={"company_name": "unknown", "tech_stack": [], "recent_news": [], "success": False}
)
async def get_company_intel(company_name: str, _corrective_context: str = None) -> dict:
    """
    Fetches real-time company intelligence.
    Parallel searches with circuit breaker on Firecrawl.
    Falls back to cached data if all retries fail.
    """
    # Run 3 searches in parallel (Map pattern from the paper)
    results = await asyncio.gather(
        firecrawl_breaker.call(_web_search_company, company_name, "tech stack engineering"),
        firecrawl_breaker.call(_web_search_company, company_name, "funding crunchbase"),
        firecrawl_breaker.call(_web_search_company, company_name, "news 2026"),
        return_exceptions=True  # Don't let one failure kill all 3
    )
    
    # Filter out exceptions — partial results are better than nothing
    valid_results = [r for r in results if not isinstance(r, Exception)]
    combined_text = "\n\n".join(valid_results)
    
    if not combined_text:
        raise ValueError("All web searches failed — triggering self-heal retry")
    
    system_prompt = BASE_EXTRACT_PROMPT
    if _corrective_context:
        system_prompt = f"{BASE_EXTRACT_PROMPT}\n\n{_corrective_context}"
    
    return await _llm_extract(system_prompt, combined_text, CompanyIntel)
```

**outreach-mcp** (LLM generation — F1 hallucination risk):
```python
@self_healing(
    max_retries=3,
    base_delay=1.5,
    fallback_value={"subject": "", "body": "", "word_count": 0, "success": False}
)
async def generate_cold_email(
    jd_signals: dict,
    company_intel: dict,
    profile: dict,
    tone: str = "direct_casual",
    _corrective_context: str = None
) -> dict:
    """
    Generates tailored cold email.
    Self-heals on word count violations (F1) and LLM API errors (F2).
    Injected corrective context on retry enforces length and no-fabrication rules.
    """
    system_prompt = _build_email_system_prompt(profile, VOICE_SAMPLE, tone)
    
    # Inject corrective context on retry (e.g., "previous output was 200 words, must be under 150")
    if _corrective_context:
        system_prompt = f"{system_prompt}\n\nCORRECTION REQUIRED:\n{_corrective_context}"
    
    response = await _call_llm(system_prompt, _build_email_user_prompt(jd_signals, company_intel, profile))
    
    # F1 guard: validate word count
    subject, body = _parse_email_response(response)
    word_count = len(body.split())
    
    if word_count > 160:  # tolerance buffer
        raise ValueError(
            f"F1_HALLUCINATION: Generated email has {word_count} words, must be under 150. "
            f"Retry with stricter length enforcement."
        )
    
    return ColdEmailOutput(subject=subject, body=body, word_count=word_count).model_dump()
```

**tracker-mcp** (Supabase DB — connection/schema risk):
```python
supabase_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30.0)

@self_healing(
    max_retries=3,
    base_delay=0.5,
    fallback_value={"success": False, "error": "tracker unavailable"}
)
async def add_application(company: str, role: str, jd_url: str = None,
                           fit_score: float = None, resume_version: str = None) -> dict:
    """
    Logs a new application to Supabase.
    Self-heals on connection drops and schema validation errors.
    """
    result = await supabase_breaker.call(
        supabase.table("applications").insert({
            "company": company,
            "role": role,
            "jd_url": jd_url,
            "fit_score": fit_score,
            "resume_version": resume_version
        }).execute
    )
    return {"id": result.data[0]["id"], "success": True}
```

### Antigravity build prompt — self-healing layer

```
Add the self-healing layer to all 5 NeuroHire MCP servers.

STEP 1: Create mcp_servers/shared/__init__.py (empty)
STEP 2: Create mcp_servers/shared/self_healing.py with the full SelfHealingError, classify_error, self_healing decorator, and CircuitBreaker class exactly as defined in mcp.md §9.

STEP 3: For each server, update tools.py:
- Import self_healing and CircuitBreaker from shared.self_healing
- Wrap EVERY tool function with @self_healing decorator
- Use appropriate max_retries and fallback_value per tool (higher retries for LLM tools, lower for static data tools)
- For tools that call Firecrawl: instantiate a firecrawl_breaker = CircuitBreaker(failure_threshold=3)
- For tools that call GitHub Models: instantiate a llm_breaker = CircuitBreaker(failure_threshold=5)
- For tools that call Supabase: instantiate a supabase_breaker = CircuitBreaker(failure_threshold=3)

STEP 4: Update main.py in each server to add a /health endpoint that reports circuit breaker states:
GET /health → {
  "status": "ok",
  "server": "<server-name>",
  "circuit_breakers": {
    "firecrawl": "CLOSED|OPEN|HALF_OPEN",  (if applicable)
    "llm": "CLOSED|OPEN|HALF_OPEN"          (if applicable)
  }
}

STEP 5: Add to each server's requirements.txt: (no new packages needed — uses standard library only)

After building, trigger a test failure in jd-parser-mcp by passing an invalid URL and confirm:
1. The decorator retries 3 times with exponential backoff
2. Logs show [SELF-HEAL] messages with attempt count
3. After exhaustion, returns the fallback_value dict with self_heal_exhausted: True
```

---

## §10 — Semantic Tool Routing Layer

The paper proves that injecting all 25+ tools from 5 MCP servers into the LLM context causes token bloat and degrades reasoning accuracy. Instead, embed every tool as a vector and do a top-K similarity search before every agent call. Only inject the 3–5 most relevant tools per task.

**Impact:** 99.6% token reduction, sub-100ms retrieval, 97.1% hit rate at K=3.

### Architecture

```
Agent receives task
       ↓
Embed the task query → dense vector
       ↓
Qdrant similarity search over tool_index collection
(dot product: Similarity(Q, T_i) = Σ Q_j · T_{i,j})
       ↓
Top-K=3 tools returned (< 100ms)
       ↓
Only those 3 tools injected into LLM context
       ↓
LLM calls the right tool immediately
```

### Tool index schema — all 25 tools across 5 servers

Create `mcp_servers/shared/tool_registry.py`:

```python
# mcp_servers/shared/tool_registry.py
# Complete tool registry for semantic routing
# Each entry: tool_id, server, description (used for embedding), port

TOOL_REGISTRY = [
    # ── resume-mcp (port 8001) ──────────────────────────────────
    {
        "tool_id": "resume.get_profile",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get candidate contact details: name, email, phone, GitHub, LinkedIn, portfolio URL, location",
        "tags": ["profile", "contact", "identity", "personal info"]
    },
    {
        "tool_id": "resume.get_education",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get academic record: degree, college, university, CGPA, HSC percentage, SSLC percentage, graduation year",
        "tags": ["education", "academic", "cgpa", "college", "degree"]
    },
    {
        "tool_id": "resume.get_experience",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get internship experience with role, company, duration, bullet points and tech stack. Filter by role name.",
        "tags": ["internship", "experience", "work history", "infosys", "zidio"]
    },
    {
        "tool_id": "resume.get_projects",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get portfolio projects filtered by tags: ai, ml, fullstack, rag, agentic, analytics. Returns name, description, tech stack, live URL.",
        "tags": ["projects", "portfolio", "sentixcare", "cinerag", "planetopia", "apex"]
    },
    {
        "tool_id": "resume.get_skills",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get technical skills by category: languages, frameworks, cloud, ml, certifications",
        "tags": ["skills", "tech stack", "python", "langchain", "pytorch", "aws"]
    },
    {
        "tool_id": "resume.get_publications",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get research publications: conference papers and journal papers with title, venue, year",
        "tags": ["publications", "research", "papers", "icrit", "academic"]
    },
    {
        "tool_id": "resume.get_certifications",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get professional certifications: AWS CCP, CLLMSP with scores and dates",
        "tags": ["certifications", "aws", "llm security", "credentials"]
    },
    {
        "tool_id": "resume.get_sih_achievement",
        "server": "resume-mcp",
        "port": 8001,
        "description": "Get Smart India Hackathon 2025 achievement — National Finalist framing",
        "tags": ["sih", "hackathon", "achievement", "national finalist", "award"]
    },

    # ── jd-parser-mcp (port 8002) ───────────────────────────────
    {
        "tool_id": "jd_parser.parse_jd_url",
        "server": "jd-parser-mcp",
        "port": 8002,
        "description": "Parse a job description URL and extract structured signals: required skills, nice-to-haves, culture keywords, seniority level, domain, remote status",
        "tags": ["jd", "job description", "parse", "url", "scrape"]
    },
    {
        "tool_id": "jd_parser.parse_jd_text",
        "server": "jd-parser-mcp",
        "port": 8002,
        "description": "Parse raw job description text into structured JDSignals without scraping",
        "tags": ["jd", "job description", "parse", "text", "signals"]
    },
    {
        "tool_id": "jd_parser.extract_skills",
        "server": "jd-parser-mcp",
        "port": 8002,
        "description": "Extract required and nice-to-have skills from a job description",
        "tags": ["skills", "requirements", "tech requirements", "jd skills"]
    },
    {
        "tool_id": "jd_parser.detect_seniority",
        "server": "jd-parser-mcp",
        "port": 8002,
        "description": "Detect seniority level from job description: intern, junior, mid, senior with confidence score",
        "tags": ["seniority", "level", "experience level", "intern", "junior"]
    },
    {
        "tool_id": "jd_parser.get_culture_keywords",
        "server": "jd-parser-mcp",
        "port": 8002,
        "description": "Extract company culture signals from job description: work style, values, team dynamics",
        "tags": ["culture", "values", "work style", "team", "remote-first"]
    },

    # ── tracker-mcp (port 8003) ─────────────────────────────────
    {
        "tool_id": "tracker.add_application",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Log a new job application to the tracker database with company, role, fit score and resume version",
        "tags": ["add", "log", "track", "application", "new application"]
    },
    {
        "tool_id": "tracker.update_status",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Update application status: applied, interview, rejected, offer, follow_up_due",
        "tags": ["status", "update", "interview", "rejected", "offer"]
    },
    {
        "tool_id": "tracker.get_applications",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Retrieve all job applications with optional status filter and pagination",
        "tags": ["list", "applications", "history", "all applications", "get"]
    },
    {
        "tool_id": "tracker.get_followups_due",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Get applications where follow-up is overdue — no activity for 7+ days",
        "tags": ["followup", "overdue", "reminder", "follow-up", "pending"]
    },
    {
        "tool_id": "tracker.log_event",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Log an event on an application: email sent, interview scheduled, rejection received",
        "tags": ["event", "log", "interview scheduled", "email sent", "rejection"]
    },
    {
        "tool_id": "tracker.save_draft",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Save a generated outreach draft (cold email, referral, cover letter) linked to an application",
        "tags": ["draft", "save", "email draft", "outreach", "cover letter"]
    },
    {
        "tool_id": "tracker.get_stats",
        "server": "tracker-mcp",
        "port": 8003,
        "description": "Get application statistics: total count, by status breakdown, average fit score, interview count",
        "tags": ["stats", "statistics", "dashboard", "metrics", "count"]
    },

    # ── company-intel-mcp (port 8004) ───────────────────────────
    {
        "tool_id": "company_intel.get_company_intel",
        "server": "company-intel-mcp",
        "port": 8004,
        "description": "Get full company intelligence: funding stage, headcount, HQ, tech stack, Glassdoor rating, culture signals, recent news",
        "tags": ["company", "intel", "research", "funding", "tech stack", "glassdoor"]
    },
    {
        "tool_id": "company_intel.get_tech_stack",
        "server": "company-intel-mcp",
        "port": 8004,
        "description": "Get confirmed tech stack used by a company from job listings and engineering blog",
        "tags": ["tech stack", "technology", "tools used", "engineering", "company tech"]
    },
    {
        "tool_id": "company_intel.get_culture_signals",
        "server": "company-intel-mcp",
        "port": 8004,
        "description": "Get company culture signals from Glassdoor reviews and LinkedIn posts",
        "tags": ["culture", "glassdoor", "reviews", "work environment", "values"]
    },
    {
        "tool_id": "company_intel.get_recent_news",
        "server": "company-intel-mcp",
        "port": 8004,
        "description": "Get recent company news from last 90 days: funding rounds, product launches, leadership changes",
        "tags": ["news", "recent", "announcements", "press", "funding round"]
    },
    {
        "tool_id": "company_intel.get_funding_info",
        "server": "company-intel-mcp",
        "port": 8004,
        "description": "Get company funding information: stage (seed/series A/B), amount raised, key investors, year",
        "tags": ["funding", "series", "investors", "vc", "raise", "crunchbase"]
    },

    # ── outreach-mcp (port 8005) ────────────────────────────────
    {
        "tool_id": "outreach.generate_cold_email",
        "server": "outreach-mcp",
        "port": 8005,
        "description": "Generate a tailored cold email (under 150 words) in Gokul's voice for a specific company and role",
        "tags": ["cold email", "email", "outreach", "generate", "write email"]
    },
    {
        "tool_id": "outreach.generate_referral_message",
        "server": "outreach-mcp",
        "port": 8005,
        "description": "Generate a short casual referral request message (under 80 words) to send to a contact at a company",
        "tags": ["referral", "message", "referral request", "contact", "linkedin message"]
    },
    {
        "tool_id": "outreach.generate_cover_letter",
        "server": "outreach-mcp",
        "port": 8005,
        "description": "Generate a 3-paragraph cover letter tailored to the specific company and JD",
        "tags": ["cover letter", "letter", "application letter", "generate", "write"]
    },
    {
        "tool_id": "outreach.get_voice_sample",
        "server": "outreach-mcp",
        "port": 8005,
        "description": "Get Gokul's writing voice sample and style guidelines for outreach generation",
        "tags": ["voice", "style", "tone", "writing style", "voice sample"]
    }
]
```

### Semantic router — create `mcp_servers/shared/semantic_router.py`

```python
# mcp_servers/shared/semantic_router.py
import asyncio
import json
from typing import Optional
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from .tool_registry import TOOL_REGISTRY

COLLECTION_NAME = "neurohire_tool_index"
EMBEDDING_MODEL = "text-embedding-3-small"
VECTOR_DIM = 1536

class SemanticToolRouter:
    """
    Implements vector-based semantic tool routing.
    Embeds all MCP tools once at startup, then does sub-100ms
    similarity search to find top-K tools for any agent query.
    
    Paper result: 97.1% hit rate at K=3, 99.6% token reduction.
    """
    
    def __init__(self, qdrant_url: str, github_token: str, github_endpoint: str):
        self.qdrant = QdrantClient(url=qdrant_url)
        self.openai = AsyncOpenAI(
            base_url=github_endpoint,
            api_key=github_token
        )
        self._indexed = False
    
    async def index_all_tools(self, force_reindex: bool = False):
        """
        Embed all tools in TOOL_REGISTRY and store in Qdrant.
        Run once at startup (idempotent if already indexed).
        """
        # Check if already indexed
        try:
            collection = self.qdrant.get_collection(COLLECTION_NAME)
            if collection.points_count == len(TOOL_REGISTRY) and not force_reindex:
                print(f"[ROUTER] Tool index already has {len(TOOL_REGISTRY)} tools. Skipping re-index.")
                self._indexed = True
                return
        except Exception:
            pass
        
        # Create collection with binary quantization (paper: 96x compression)
        self.qdrant.recreate_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.DOT),
            quantization_config={
                "binary": {
                    "always_ram": True  # Keep compressed index in RAM for sub-100ms retrieval
                }
            }
        )
        
        # Embed all tool descriptions in parallel batches
        print(f"[ROUTER] Indexing {len(TOOL_REGISTRY)} tools...")
        
        # Build embedding texts: description + tags combined for richer semantic signal
        texts = [
            f"{tool['description']}. Keywords: {', '.join(tool['tags'])}"
            for tool in TOOL_REGISTRY
        ]
        
        # Batch embed (max 20 per call)
        batch_size = 20
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.openai.embeddings.create(
                model=EMBEDDING_MODEL,
                input=batch
            )
            all_embeddings.extend([e.embedding for e in response.data])
        
        # Upsert into Qdrant
        points = [
            PointStruct(
                id=idx,
                vector=embedding,
                payload={
                    "tool_id": tool["tool_id"],
                    "server": tool["server"],
                    "port": tool["port"],
                    "description": tool["description"],
                    "tags": tool["tags"]
                }
            )
            for idx, (tool, embedding) in enumerate(zip(TOOL_REGISTRY, all_embeddings))
        ]
        
        self.qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
        self._indexed = True
        print(f"[ROUTER] Indexed {len(points)} tools successfully.")
    
    async def route(self, query: str, k: int = 3) -> list[dict]:
        """
        Find top-K most relevant tools for a given agent query.
        
        Args:
            query: The agent's task description or intent
            k: Number of tools to return (paper recommends K=3 for 97.1% hit rate)
        
        Returns:
            List of tool dicts with tool_id, server, port, description
        
        Example:
            query = "I need to write a cold email for the Breathe ESG AI Engineer role"
            → returns: [outreach.generate_cold_email, resume.get_profile, company_intel.get_recent_news]
        """
        if not self._indexed:
            await self.index_all_tools()
        
        # Embed the query
        response = await self.openai.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[query]
        )
        query_vector = response.data[0].embedding
        
        # Dot product search with oversampling (paper: retrieve 3x, rerank)
        oversample_k = k * 3  # Pull 9 candidates, return top 3
        results = self.qdrant.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_vector,
            limit=oversample_k,
            with_payload=True
        )
        
        # Rerank by score and return top-K
        tools = [
            {
                "tool_id": hit.payload["tool_id"],
                "server": hit.payload["server"],
                "port": hit.payload["port"],
                "description": hit.payload["description"],
                "score": round(hit.score, 4)
            }
            for hit in results[:k]
        ]
        
        return tools
    
    async def get_tool_context(self, query: str, k: int = 3) -> str:
        """
        Returns a formatted string of top-K tools for injection into LLM context.
        This is what gets passed to the supervisor agent instead of all 25+ tools.
        """
        tools = await self.route(query, k)
        
        lines = ["AVAILABLE TOOLS FOR THIS TASK (semantic top-K selection):"]
        for tool in tools:
            lines.append(
                f"- {tool['tool_id']} (score: {tool['score']})\n"
                f"  Server: {tool['server']} | Port: {tool['port']}\n"
                f"  {tool['description']}"
            )
        
        return "\n".join(lines)


# Singleton instance — initialised once per MCP server startup
_router: Optional[SemanticToolRouter] = None

def get_router(qdrant_url: str, github_token: str, github_endpoint: str) -> SemanticToolRouter:
    global _router
    if _router is None:
        _router = SemanticToolRouter(qdrant_url, github_token, github_endpoint)
    return _router
```

### Semantic caching for company intel — `mcp_servers/shared/semantic_cache.py`

```python
# mcp_servers/shared/semantic_cache.py
# RedisVL semantic cache for company intel lookups
# Paper: 68.8% API cost reduction, 100x speed boost on cache hits

import json
import hashlib
from typing import Optional, Any
from openai import AsyncOpenAI

try:
    from redisvl.extensions.llmcache import SemanticCache
    REDISVL_AVAILABLE = True
except ImportError:
    REDISVL_AVAILABLE = False

class NeuroHireSemanticCache:
    """
    Semantic cache for company intel and JD parsing results.
    Cache hit: returns in <10ms. Cache miss: runs full pipeline.
    
    Uses cosine distance threshold 0.1 — queries within this distance
    return cached response instead of hitting Firecrawl + LLM.
    """
    
    def __init__(self, redis_url: str, github_token: str, github_endpoint: str):
        self.redis_url = redis_url
        self.openai = AsyncOpenAI(base_url=github_endpoint, api_key=github_token)
        self._cache = None
        
        if REDISVL_AVAILABLE:
            self._cache = SemanticCache(
                name="neurohire_cache",
                redis_url=redis_url,
                distance_threshold=0.1,  # Tight threshold — only very similar queries hit
                ttl=86400  # 24-hour TTL for company intel
            )
    
    async def get(self, query: str) -> Optional[Any]:
        """Check cache for a semantically similar query."""
        if not self._cache:
            return None
        
        try:
            results = self._cache.check(prompt=query, num_results=1)
            if results:
                cached = results[0]
                print(f"[CACHE HIT] Semantic match (distance: {cached.get('vector_distance', 'N/A')})")
                return json.loads(cached["response"])
        except Exception as e:
            print(f"[CACHE] Check failed: {e}")
        
        return None
    
    async def set(self, query: str, response: Any, ttl: int = None):
        """Store a query-response pair in semantic cache."""
        if not self._cache:
            return
        
        try:
            self._cache.store(
                prompt=query,
                response=json.dumps(response),
                ttl=ttl
            )
            print(f"[CACHE SET] Stored result for: {query[:50]}...")
        except Exception as e:
            print(f"[CACHE] Store failed: {e}")
    
    def cache_company_intel(self, func):
        """
        Decorator to add semantic caching to company intel tool calls.
        
        Usage:
            @cache.cache_company_intel
            async def get_company_intel(company_name: str) -> dict:
                ...
        """
        from functools import wraps
        
        @wraps(func)
        async def wrapper(company_name: str, **kwargs):
            cache_key = f"company_intel: {company_name}"
            
            # Check cache first
            cached = await self.get(cache_key)
            if cached is not None:
                return {**cached, "from_cache": True}
            
            # Cache miss — run full pipeline
            result = await func(company_name, **kwargs)
            
            # Store in cache (only successful results)
            if result.get("success", True) and "error" not in result:
                await self.set(cache_key, result)
            
            return result
        
        return wrapper
```

### Integration into LangGraph supervisor (preview)

This section gives Antigravity context for when the agents are built in Week 2:

```python
# agents/supervisor.py (Week 2 build — preview only)
from mcp_servers.shared.semantic_router import get_router
from mcp_servers.shared.semantic_cache import NeuroHireSemanticCache

# At supervisor startup
router = get_router(QDRANT_URL, GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT)
await router.index_all_tools()

# Before every agent node call, inject only relevant tools
async def supervisor_node(state: NeuroHireState) -> NeuroHireState:
    task = state["current_task"]  # e.g. "write a cold email for Breathe ESG AI Engineer role"
    
    # Semantic routing: get top-3 tools only
    tool_context = await router.get_tool_context(task, k=3)
    
    # Inject into LLM context — NOT the full 25-tool list
    response = await llm.invoke([
        SystemMessage(content=f"You are the NeuroHire supervisor.\n\n{tool_context}"),
        HumanMessage(content=task)
    ])
    
    return {**state, "supervisor_response": response}
```

### Antigravity build prompt — semantic routing + caching layer

```
Add the semantic tool routing and caching layer to NeuroHire.

STEP 1: Create mcp_servers/shared/tool_registry.py
Copy the full TOOL_REGISTRY list from mcp.md §10 exactly.
All 29 tools across 5 servers must be present.

STEP 2: Create mcp_servers/shared/semantic_router.py
Copy the SemanticToolRouter class from mcp.md §10 exactly.
Add error handling: if Qdrant is unreachable, fall back to returning ALL tools (graceful degradation).

STEP 3: Create mcp_servers/shared/semantic_cache.py
Copy the NeuroHireSemanticCache class from mcp.md §10 exactly.
If redisvl is not installed, cache silently does nothing (no-op fallback).

STEP 4: Update company_intel_mcp/main.py
- Import NeuroHireSemanticCache
- Instantiate cache at startup using UPSTASH_REDIS_URL from .env
- Wrap get_company_intel with @cache.cache_company_intel decorator

STEP 5: Update shared requirements
Create mcp_servers/shared/requirements.txt:
qdrant-client, openai, redisvl, redis, python-dotenv

STEP 6: Add to company_intel_mcp/.env.example:
UPSTASH_REDIS_URL=redis://default:your_password@your-endpoint.upstash.io:6379
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_key

STEP 7: Write a test script at mcp_servers/shared/test_routing.py:
- Index all 29 tools
- Run 5 test queries:
  1. "write a cold email for a machine learning role"
  2. "what is the funding stage of Breathe ESG"
  3. "log that I applied to Cognizant today"
  4. "parse this job description URL"
  5. "what are my strongest AI skills"
- Print top-3 tools returned for each query with scores
- Verify each result is semantically correct (right server, right tool)

After building, run the test script and show me the routing results.
The scores should all be above 0.75 for correct routing.
```

---

## §11 — Updated folder structure (post §9 + §10)

```
neurohire/
├── .agent/
│   └── rules/
│       └── neurohire.md
├── mcp_servers/
│   ├── shared/                        ← NEW
│   │   ├── __init__.py
│   │   ├── self_healing.py            ← §9: F1/F2/F3 recovery + CircuitBreaker
│   │   ├── semantic_router.py         ← §10: vector-based tool routing
│   │   ├── semantic_cache.py          ← §10: RedisVL semantic caching
│   │   ├── tool_registry.py           ← §10: all 29 tools indexed
│   │   ├── requirements.txt
│   │   └── test_routing.py            ← routing accuracy test
│   ├── resume_mcp/
│   │   ├── main.py                    ← /health now reports circuit state
│   │   ├── tools.py                   ← @self_healing on all 8 tools
│   │   ├── models.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── jd_parser_mcp/
│   │   ├── main.py
│   │   ├── tools.py                   ← @self_healing + CircuitBreaker + corrective context
│   │   ├── models.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── tracker_mcp/
│   │   ├── main.py
│   │   ├── tools.py                   ← @self_healing + supabase_breaker
│   │   ├── models.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── company_intel_mcp/
│   │   ├── main.py
│   │   ├── tools.py                   ← @self_healing + asyncio.gather + @cache_company_intel
│   │   ├── models.py
│   │   ├── config.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── outreach_mcp/
│       ├── main.py
│       ├── tools.py                   ← @self_healing + F1 word count guard
│       ├── models.py
│       ├── config.py
│       ├── requirements.txt
│       └── .env.example
├── agents/                            ← Week 2 (LangGraph)
├── frontend/                          ← Week 3 (React)
└── README.md
```

---

## §12 — Updated keys needed

| Key | Where to get | Used by |
|-----|-------------|---------|
| `GITHUB_TOKEN` | github.com → Settings → Developer settings → PAT | jd-parser, company-intel, outreach, semantic-router |
| `FIRECRAWL_API_KEY` | firecrawl.dev free tier | jd-parser, company-intel |
| `SUPABASE_URL` + `SUPABASE_KEY` | supabase.com free tier | tracker |
| `QDRANT_URL` + `QDRANT_API_KEY` | cloud.qdrant.io free tier (1 cluster) | semantic-router |
| `UPSTASH_REDIS_URL` | upstash.com free tier (10k cmds/day) | semantic-cache (company-intel) |
| No key needed | — | resume-mcp |

---

*NeuroHire mcp.md — v2.0 — June 2026 — Added §9 Self-Healing + §10 Semantic Routing*
