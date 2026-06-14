from pydantic import BaseModel
from typing import List, Optional

# --- Input Models ---
class GetCompanyIntelInput(BaseModel):
    company_name: str

class GetTechStackInput(BaseModel):
    company_name: str

class GetCultureSignalsInput(BaseModel):
    company_name: str

class GetRecentNewsInput(BaseModel):
    company_name: str
    days: Optional[int] = 90

class GetFundingInfoInput(BaseModel):
    company_name: str


# --- Output Models ---
class NewsItem(BaseModel):
    title: str
    summary: str
    date: str
    source: str

class CompanyIntel(BaseModel):
    company_name: str
    funding_stage: Optional[str] = None       # seed | series_a | series_b | public | unknown
    headcount: Optional[str] = None           # "~50" or "500-1000"
    hq_location: Optional[str] = None
    tech_stack: List[str]
    glassdoor_rating: Optional[float] = None
    culture_signals: List[str]
    recent_news: List[NewsItem]
    engineering_blog_url: Optional[str] = None
    careers_url: Optional[str] = None

class TechStackResult(BaseModel):
    stack: List[str]
    confidence: str
    source: str

class CultureResult(BaseModel):
    signals: List[str]
    glassdoor_rating: Optional[float] = None

class NewsResult(BaseModel):
    articles: List[NewsItem]

class FundingInfo(BaseModel):
    stage: Optional[str] = None
    amount: Optional[str] = None
    investors: List[str]
    year: Optional[int] = None
