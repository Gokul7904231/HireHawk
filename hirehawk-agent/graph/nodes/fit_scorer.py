from graph.state import HireHawkState

async def score_fit_node(state: HireHawkState) -> dict:
    jd_signals = state.get("jd_signals") or {}
    resume_profile = state.get("resume_profile") or {}
    
    required = [s.lower() for s in jd_signals.get("required_skills", [])]
    candidate = [s.lower() for s in resume_profile.get("top_skills", [])]
    
    if not required:
        # Default fallback fit score
        return {"fit_score": 80.0}
        
    matched = set(required).intersection(set(candidate))
    
    # Simple set overlap matching percentage
    overlap_score = (len(matched) / len(required)) * 100.0
    
    # Plus a little boost for experience matching
    experience_boost = 0.0
    exp_summary = resume_profile.get("experience_summary", "").lower()
    for keyword in jd_signals.get("culture_keywords", []):
        if keyword.lower() in exp_summary:
            experience_boost += 5.0
            
    final_score = min(overlap_score + experience_boost, 100.0)
    # Ensure it's rounded to 1 decimal place
    return {"fit_score": round(final_score, 1)}
