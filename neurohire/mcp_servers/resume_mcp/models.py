from pydantic import BaseModel
from typing import List, Optional

# --- Input Models ---
class GetProfileInput(BaseModel):
    pass

class GetEducationInput(BaseModel):
    pass

class GetExperienceInput(BaseModel):
    role_filter: Optional[str] = None

class GetProjectsInput(BaseModel):
    tags: Optional[List[str]] = None

class GetSkillsInput(BaseModel):
    category: Optional[str] = None

class GetPublicationsInput(BaseModel):
    pass

class GetCertificationsInput(BaseModel):
    pass

class GetSihAchievementInput(BaseModel):
    pass


# --- Output Models ---
class ProfileOutput(BaseModel):
    name: str
    email: str
    phone: str
    github: str
    linkedin: str
    portfolio: str
    location: str

class EducationOutput(BaseModel):
    degree: str
    college: str
    university: str
    cgpa: str
    hsc: str
    sslc: str
    school: str
    grad_year: int

class ExperienceItem(BaseModel):
    role: str
    company: str
    duration: str
    bullets: List[str]
    stack: List[str]

class ProjectItem(BaseModel):
    name: str
    tags: List[str]
    description: str
    tech: List[str]
    live_url: Optional[str] = None
    github_url: str
    highlight: Optional[str] = None

class PublicationItem(BaseModel):
    title: str
    venue: str
    year: int
    type: str

class CertificationItem(BaseModel):
    name: str
    issuer: str
    score: Optional[str] = None
    year: int

class SihAchievementOutput(BaseModel):
    achievement: str

class SkillsOutput(BaseModel):
    languages: List[str]
    frameworks: List[str]
    cloud: List[str]
    ml: List[str]
    certifications: List[str]
