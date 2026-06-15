from typing import TypedDict, List, Dict, Any, Optional, Annotated

def reduce_phase(old_phase: Optional[str], new_phase: str) -> str:
    return new_phase

def reduce_errors(old_errors: Optional[List[str]], new_errors: List[str]) -> List[str]:
    if old_errors is None:
        old_errors = []
    if new_errors is None:
        new_errors = []
    result = list(old_errors)
    for err in new_errors:
        if err not in result:
            result.append(err)
    return result

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
    error_log: Annotated[List[str], reduce_errors]
    
    # Current node / execution phase name
    current_phase: Annotated[str, reduce_phase]
