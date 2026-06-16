import profileData from "../fixtures/profile.json";

export interface Project {
  name: string;
  description: string;
  live_url: string;
  tags?: string[];
}

export interface Experience {
  company: string;
  role: string;
  description: string;
  period: string;
}

export interface ProfileData {
  name: string;
  email: string;
  github: string;
  portfolio: string;
  top_projects: Project[];
  top_skills: string[];
  experience_summary: string;
  experience?: Experience[];
}

export function getProfile(): ProfileData {
  return profileData as ProfileData;
}
