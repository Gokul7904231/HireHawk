export interface JDSignals {
  company_name: string;
  role_title: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  culture_keywords: string[];
  seniority: "intern" | "junior" | "mid" | "senior";
  domain: "ai" | "fullstack" | "devops" | "data" | "other";
  remote_status: "remote" | "hybrid" | "onsite" | "unknown";
  location?: string;
  salary_range?: string;
  extraction_failed?: boolean;
}

export interface ClaimVerification {
  claim: string;
  supported_by_baseline: boolean;
  reasoning: string;
}

export interface TailorOutput {
  tailored_bullets: { project_or_role: string; bullet: string }[];
  cover_letter_paragraphs: string[];
  cold_email: { subject: string; body: string };
  referral_message: string;
  claims: ClaimVerification[];
  any_unsupported_claims: boolean;
}

export interface Env {
  GEMINI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  LOGO_DEV_TOKEN?: string;
  GEMINI_MOCK?: string;
  SUPABASE_MOCK?: string;
  /** LangGraph FastAPI backend base URL, e.g. http://localhost:8000 */
  AGENT_BACKEND_URL?: string;
}
