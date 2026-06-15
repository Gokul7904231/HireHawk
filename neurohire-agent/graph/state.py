from typing import TypedDict, List, Dict, Any, Optional

class NeuroHireState(TypedDict):
    # Raw input job description (markdown or raw text)
    jd_raw: str
    
    # Extracted signals from the job description
    jd_signals: Optional[Dict[str, Any]]
    
    # Candidate profile data
    resume_profile: Optional[Dict[str, Any]]
    
    # Generated tailored experiences / bullets
    tailored_bullets: Optional[List[Dict[str, Any]]]
    
    # Aggregated company intelligence (Headquarters, Found Year, News, Logo)
    company_intel: Optional[Dict[str, Any]]
    
    # Outreach messages (cold email, cover letter, referral message)
    outreach_draft: Optional[Dict[str, Any]]
    
    # Computed fit score (0-100)
    fit_score: Optional[float]
    
    # Logged application ID from Supabase
    tracker_id: Optional[str]
    
    # Verification trace for adjudicated claims
    claims_trace: Optional[List[Dict[str, Any]]]
    
    # Human-in-the-loop checkpoint approval state
    hitl_approved: bool
    
    # Diagnostic log list for errors
    error_log: List[str]
    
    # Current node / execution phase name
    current_phase: str
