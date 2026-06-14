from pydantic import BaseModel
from typing import List, Optional, Literal

# --- Input Models ---
class ParseJdUrlInput(BaseModel):
    url: str

class ParseJdTextInput(BaseModel):
    text: str

class ExtractSkillsInput(BaseModel):
    jd_text: str

class DetectSeniorityInput(BaseModel):
    jd_text: str

class GetCultureKeywordsInput(BaseModel):
    jd_text: str


# --- Output Models ---
class JDSignals(BaseModel):
    company_name: str
    role_title: str
    required_skills: List[str]
    nice_to_have_skills: List[str]
    culture_keywords: List[str]
    seniority: Literal["intern", "junior", "mid", "senior"]
    domain: Literal["ai", "fullstack", "devops", "data", "other"]
    remote_status: Literal["remote", "hybrid", "onsite", "unknown"]
    location: Optional[str] = None
    salary_range: Optional[str] = None
    raw_text: str

class ExtractSkillsOutput(BaseModel):
    required: List[str]
    nice_to_have: List[str]

class DetectSeniorityOutput(BaseModel):
    level: Literal["intern", "junior", "mid", "senior"]
    confidence: float

class GetCultureKeywordsOutput(BaseModel):
    keywords: List[str]
