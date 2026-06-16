export interface Project {
  name: string;
  description: string;
  live_url?: string;
  github_url?: string;
  tags?: string[];
}

export interface Experience {
  company: string;
  role: string;
  description?: string;
  period?: string;
  duration?: string;
  bullets?: string[];
  stack?: string[];
}

export interface Profile {
  name: string;
  email: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  top_projects?: Project[];
  top_skills?: string[];
  experience_summary?: string;
  experience?: Experience[];
}

export type ApplicationStatus = 'applied' | 'interview' | 'rejected' | 'pending';

export interface Application {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  fit_score: number | null;
  applied_at: string;
  last_activity: string;
  jd_url?: string | null;
  resume_version?: string | null;
  notes?: string | null;
}

export interface Claim {
  claim: string;
  supported_by_baseline: boolean;
  reasoning: string;
}

export interface NewsArticle {
  title?: string;
  summary?: string;
  date?: string;
  source?: string;
}

export interface CompanyIntel {
  company_name: string;
  founding_year: number | null;
  hq_location: string | null;
  industry: string | null;
  website: string | null;
  logo_url?: string;
  recent_news?: (string | NewsArticle)[];
  data_availability?: 'full' | 'partial' | 'none';
}

export interface TailoredBullet {
  project_or_role: string;
  bullet: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

export interface ApplicationDetail {
  application: Application;
  claims: Claim[];
  company_intel: CompanyIntel;
  outreach_draft: {
    cold_email: OutreachDraft;
    cover_letter_paragraphs: string[];
    referral_message?: string;
  };
  tailored_bullets: TailoredBullet[];
}

export type StepStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentStep {
  name: string; // parse_jd, tailor_resume, get_company_intel, score_fit, write_outreach, HITL
  agentName: string;
  mcpServer: string;
  status: StepStatus;
  duration?: number; // in milliseconds
  error?: string;
}
