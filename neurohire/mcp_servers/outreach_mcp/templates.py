def generate_cold_email_mock(jd_signals: dict, company_intel: dict, profile: dict) -> str:
    proj_name = "Sentixcare"
    proj_url = "huggingface.co/spaces/Gokul7904231/sentixcare"
    
    # Extract projects from profile safely
    top_projects = profile.get("top_projects", [])
    if top_projects and len(top_projects) > 0:
        proj_name = top_projects[0].get("name", proj_name)
        proj_url = top_projects[0].get("live_url", proj_url)
        if not proj_url:
            proj_url = top_projects[0].get("github_url", "github.com/Gokul7904231/sentixcare")

    company = jd_signals.get("company_name", "Breathe ESG")
    role = jd_signals.get("role_title", "AI Engineer Intern")
    
    subject = f"AI / RAG projects for {company}"
    body = (
        f"Hi there,\n\n"
        f"Your work on sustainable ESG metrics at {company} caught my eye. "
        f"I recently shipped {proj_name} ({proj_url}), a multimodal emotion recognition AI, "
        f"and CineRAG, a conversational RAG agent, which align well with your tech stack.\n\n"
        f"I'm a B.Tech CS student at Crescent College and recently finished a RAG-based document Q&A internship at Infosys. "
        f"I'd love to chat about how my experience in Python and LLMs can help you build reporting agents as an {role}.\n\n"
        f"Would you be open to a 10-minute call this week?\n\n"
        f"Best,\n"
        f"{profile.get('name', 'Gokul')}"
    )
    return f"Subject: {subject}\n\n{body}"

def generate_referral_message_mock(jd_signals: dict, company_intel: dict, profile: dict) -> str:
    company = jd_signals.get("company_name", "Breathe ESG")
    role = jd_signals.get("role_title", "AI Engineer Intern")
    
    message = (
        f"Hi,\n\n"
        f"I saw that {company} is hiring an {role}. "
        f"As a Smart India Hackathon 2025 National Finalist and developer of Sentixcare (mood AI on HuggingFace), "
        f"my background in Python, Django, and LangChain aligns perfectly with your engineering blog's stack.\n\n"
        f"Would you be open to referring me or forwarding my resume to the hiring manager?\n\n"
        f"Thanks,\n"
        f"{profile.get('name', 'Gokul')}"
    )
    return message

def generate_cover_letter_mock(jd_signals: dict, company_intel: dict, profile: dict) -> list[str]:
    company = jd_signals.get("company_name", "Breathe ESG")
    role = jd_signals.get("role_title", "AI Engineer Intern")
    
    p1 = (
        f"I am writing to express my strong interest in the {role} position at {company}. "
        f"Having followed {company}'s recent Series A round and growth in the ESG SaaS sector, "
        f"I am eager to apply my experience in automated data extraction to help scale your carbon accounting platform."
    )
    
    p2 = (
        f"During my AI/ML internship at Infosys, I built RAG-based Q&A pipelines using Python, LangChain, and PyTorch, "
        f"which directly matches the skills required for this role. Additionally, my portfolio includes Sentixcare, "
        f"a multimodal emotion AI, and CineRAG, an agentic movie recommendation bot, showing my hands-on experience with LLMs."
    )
    
    p3 = (
        f"I would welcome the opportunity to discuss how my background in Python, Django, and agentic workflows can add value "
        f"to your engineering team. Thank you for your time and consideration."
    )
    
    return [p1, p2, p3]
