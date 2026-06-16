from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# --- Structured Inputs (used for internal validation or strict typing) ---
class JDSignalsInput(BaseModel):
    company_name: str
    role_title: str
    required_skills: List[str]
    culture_keywords: List[str]
    domain: str
    seniority: str

class CompanyIntelInput(BaseModel):
    company_name: str
    funding_stage: Optional[str] = None
    tech_stack: List[str]
    culture_signals: List[str]
    recent_news: List[Dict[str, Any]]

class ProfileInput(BaseModel):
    name: str
    email: str
    github: str
    portfolio: str
    top_projects: List[Dict[str, Any]]
    top_skills: List[str]
    experience_summary: str

# --- Outputs ---
class ColdEmailOutput(BaseModel):
    subject: str
    body: str
    word_count: int

class ReferralOutput(BaseModel):
    message: str
    word_count: int

class CoverLetterOutput(BaseModel):
    paragraphs: List[str]
    full_text: str
