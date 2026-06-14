import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from config import supabase
from models import ApplicationRecord, EventRecord, DraftRecord

logger = logging.getLogger(__name__)

def check_supabase():
    if supabase is None:
        raise ValueError("Supabase client is not initialized. Please configure SUPABASE_URL and SUPABASE_KEY in .env.")

async def add_application(
    company: str,
    role: str,
    jd_url: Optional[str] = None,
    fit_score: Optional[float] = None,
    resume_version: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Add a new job application to the tracker.
    Returns the application ID and success status.
    """
    try:
        check_supabase()
        data = {
            "company": company,
            "role": role,
            "jd_url": jd_url,
            "fit_score": fit_score,
            "resume_version": resume_version,
            "notes": notes,
            "status": "applied",
            "applied_at": datetime.now(timezone.utc).isoformat(),
            "last_activity": datetime.now(timezone.utc).isoformat()
        }
        res = supabase.table("applications").insert(data).execute()
        if not res.data:
            raise Exception("No data returned from insert operation.")
        new_uuid = res.data[0]["id"]
        return {"id": new_uuid, "success": True}
    except Exception as e:
        logger.error(f"Error in add_application: {e}")
        return {"error": str(e), "success": False}

async def update_status(app_id: str, status: str) -> Dict[str, Any]:
    """
    Update the status of a job application.
    Also logs an event row and updates last_activity.
    """
    try:
        check_supabase()
        now_str = datetime.now(timezone.utc).isoformat()
        # Update application
        app_res = supabase.table("applications").update({
            "status": status,
            "last_activity": now_str
        }).eq("id", app_id).execute()
        
        if not app_res.data:
            raise Exception(f"Application with ID {app_id} not found.")

        # Log event
        supabase.table("events").insert({
            "app_id": app_id,
            "event_type": status,
            "note": f"Status updated to '{status}'"
        }).execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Error in update_status: {e}")
        return {"error": str(e), "success": False}

async def get_applications(status_filter: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get job applications from the tracker.
    Can be filtered by status, and defaults to a limit of 50.
    """
    try:
        check_supabase()
        query = supabase.table("applications").select("*")
        if status_filter:
            query = query.eq("status", status_filter)
        res = query.order("last_activity", desc=True).limit(limit).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error in get_applications: {e}")
        return {"error": str(e), "success": False}

async def get_followups_due(days_threshold: int = 7) -> List[Dict[str, Any]] | Dict[str, Any]:
    """
    Get applications that require follow-up.
    Returns applications where last_activity is older than the days_threshold,
    excluding 'rejected' and 'offer' states.
    """
    try:
        check_supabase()
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days_threshold)).isoformat()
        res = supabase.table("applications").select("*")\
            .lt("last_activity", cutoff)\
            .neq("status", "rejected")\
            .neq("status", "offer")\
            .execute()
        return res.data
    except Exception as e:
        logger.error(f"Error in get_followups_due: {e}")
        return {"error": str(e), "success": False}

async def log_event(app_id: str, event_type: str, note: Optional[str] = None) -> Dict[str, Any]:
    """
    Log a communication or pipeline event for an application.
    Updates last_activity on the application.
    """
    try:
        check_supabase()
        now_str = datetime.now(timezone.utc).isoformat()
        
        # Insert event
        supabase.table("events").insert({
            "app_id": app_id,
            "event_type": event_type,
            "note": note
        }).execute()

        # Update last_activity on parent application
        supabase.table("applications").update({
            "last_activity": now_str
        }).eq("id", app_id).execute()

        return {"success": True}
    except Exception as e:
        logger.error(f"Error in log_event: {e}")
        return {"error": str(e), "success": False}

async def save_draft(app_id: str, draft_type: str, content: str) -> Dict[str, Any]:
    """
    Save generated outreach templates (cold email, referral, cover letter) for an application.
    """
    try:
        check_supabase()
        data = {
            "app_id": app_id,
            "draft_type": draft_type,
            "content": content
        }
        res = supabase.table("drafts").insert(data).execute()
        if not res.data:
            raise Exception("No data returned from insert draft operation.")
        new_uuid = res.data[0]["id"]
        return {"id": new_uuid, "success": True}
    except Exception as e:
        logger.error(f"Error in save_draft: {e}")
        return {"error": str(e), "success": False}

async def get_stats() -> Dict[str, Any]:
    """
    Retrieve application tracker statistics.
    Returns total, status breakdown, average fit score, and total interviews.
    """
    try:
        check_supabase()
        res = supabase.table("applications").select("*").execute()
        apps = res.data
        
        total = len(apps)
        by_status = {}
        fit_scores = []
        interviews = 0
        
        for app in apps:
            status = app.get("status", "applied")
            by_status[status] = by_status.get(status, 0) + 1
            if app.get("fit_score") is not None:
                fit_scores.append(app["fit_score"])
            if status == "interview":
                interviews += 1
                
        avg_fit_score = sum(fit_scores) / len(fit_scores) if fit_scores else 0.0
        
        return {
            "total": total,
            "by_status": by_status,
            "avg_fit_score": round(avg_fit_score, 4),
            "interviews": interviews
        }
    except Exception as e:
        logger.error(f"Error in get_stats: {e}")
        return {"error": str(e), "success": False}
