-- Run this in Supabase SQL editor before building the server

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  jd_url TEXT,
  fit_score FLOAT,
  resume_version TEXT,
  status TEXT DEFAULT 'applied',  -- applied | interview | rejected | offer | follow_up_due
  applied_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,   -- applied | email_sent | interview_scheduled | rejected | offer
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL,   -- cold_email | referral_message | cover_letter
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
