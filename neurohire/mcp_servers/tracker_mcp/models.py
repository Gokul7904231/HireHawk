from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime

class ApplicationRecord(BaseModel):
    id: str
    company: str
    role: str
    jd_url: Optional[str] = None
    fit_score: Optional[float] = None
    resume_version: Optional[str] = None
    status: str
    applied_at: datetime
    last_activity: datetime
    notes: Optional[str] = None

class EventRecord(BaseModel):
    id: str
    app_id: str
    event_type: str
    note: Optional[str] = None
    created_at: datetime

class DraftRecord(BaseModel):
    id: str
    app_id: str
    draft_type: str
    content: str
    created_at: datetime

class AddApplicationInput(BaseModel):
    company: str
    role: str
    jd_url: Optional[str] = None
    fit_score: Optional[float] = None
    resume_version: Optional[str] = None
    notes: Optional[str] = None

class UpdateStatusInput(BaseModel):
    app_id: str
    status: Literal["applied", "interview", "rejected", "offer", "follow_up_due"]

class LogEventInput(BaseModel):
    app_id: str
    event_type: str
    note: Optional[str] = None

class SaveDraftInput(BaseModel):
    app_id: str
    draft_type: Literal["cold_email", "referral_message", "cover_letter"]
    content: str
