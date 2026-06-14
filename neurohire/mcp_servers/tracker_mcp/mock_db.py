import os
import json
import uuid
import logging
from datetime import datetime

logger = logging.getLogger("tracker_mcp.mock_db")

# Find project root
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "fixtures"))
if not os.path.exists(FIXTURES_DIR):
    FIXTURES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "fixtures"))
if not os.path.exists(FIXTURES_DIR):
    os.makedirs(FIXTURES_DIR, exist_ok=True)

MOCK_DB_PATH = os.path.join(FIXTURES_DIR, "mock_tracker_data.json")

class MockDB:
    def __init__(self):
        self.data = {"applications": [], "events": [], "drafts": []}
        self.load()

    def load(self):
        if os.path.exists(MOCK_DB_PATH):
            try:
                with open(MOCK_DB_PATH, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    if isinstance(loaded, dict) and "applications" in loaded:
                        self.data = loaded
                    else:
                        # Fallback if empty list was initialized
                        self.data = {"applications": [], "events": [], "drafts": []}
            except Exception as e:
                logger.error(f"Failed to load mock DB: {e}")
        else:
            self.save()

    def save(self):
        try:
            with open(MOCK_DB_PATH, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save mock DB: {e}")

    def add_application(self, company: str, role: str, jd_url: str = None, fit_score: float = None, resume_version: str = None, notes: str = None) -> str:
        app_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        app = {
            "id": app_id,
            "company": company,
            "role": role,
            "jd_url": jd_url,
            "fit_score": fit_score,
            "resume_version": resume_version,
            "status": "applied",
            "applied_at": now,
            "last_activity": now,
            "notes": notes
        }
        self.data["applications"].append(app)
        self.save()
        
        # Automatically log an event for 'applied'
        self.log_event(app_id, "applied", f"Applied to {company} as {role}")
        return app_id

    def update_status(self, app_id: str, status: str) -> bool:
        for app in self.data["applications"]:
            if app["id"] == app_id:
                app["status"] = status
                app["last_activity"] = datetime.utcnow().isoformat()
                self.save()
                self.log_event(app_id, status, f"Status updated to {status}")
                return True
        return False

    def get_applications(self, status_filter: str = None, limit: int = 50) -> list:
        apps = self.data["applications"]
        if status_filter:
            apps = [a for a in apps if a["status"] == status_filter]
        
        # Sort by last_activity desc
        apps = sorted(apps, key=lambda x: x["last_activity"], reverse=True)
        return apps[:limit]

    def get_followups_due(self, days_threshold: int = 7) -> list:
        from datetime import datetime, timedelta
        due = []
        threshold_date = datetime.utcnow() - timedelta(days=days_threshold)
        for app in self.data["applications"]:
            if app["status"] in ["rejected", "offer"]:
                continue
            # Parse datetime
            try:
                last_act_dt = datetime.fromisoformat(app["last_activity"].replace("Z", "+00:00"))
            except ValueError:
                last_act_dt = datetime.utcnow() # fallback
            # Remove timezone info for comparison if threshold_date has no tz info
            if last_act_dt.tzinfo is not None:
                last_act_dt = last_act_dt.replace(tzinfo=None)
            if last_act_dt < threshold_date:
                due.append(app)
        return due

    def log_event(self, app_id: str, event_type: str, note: str = None) -> bool:
        event = {
            "id": str(uuid.uuid4()),
            "app_id": app_id,
            "event_type": event_type,
            "note": note,
            "created_at": datetime.utcnow().isoformat()
        }
        self.data["events"].append(event)
        
        # Update last_activity on parent application
        for app in self.data["applications"]:
            if app["id"] == app_id:
                app["last_activity"] = datetime.utcnow().isoformat()
                break
                
        self.save()
        return True

    def save_draft(self, app_id: str, draft_type: str, content: str) -> str:
        draft_id = str(uuid.uuid4())
        draft = {
            "id": draft_id,
            "app_id": app_id,
            "draft_type": draft_type,
            "content": content,
            "created_at": datetime.utcnow().isoformat()
        }
        self.data["drafts"].append(draft)
        self.save()
        return draft_id

    def get_stats(self) -> dict:
        apps = self.data["applications"]
        total = len(apps)
        
        by_status = {}
        fit_scores = []
        interviews = 0
        
        for app in apps:
            status = app["status"]
            by_status[status] = by_status.get(status, 0) + 1
            if app["fit_score"] is not None:
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

mock_db = MockDB()
