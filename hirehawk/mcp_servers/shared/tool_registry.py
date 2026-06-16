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
