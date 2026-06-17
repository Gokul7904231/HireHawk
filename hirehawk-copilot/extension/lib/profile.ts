import profileData from "../fixtures/profile.json";
import { loadProfile } from "./resume-storage";

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

export async function getProfile(): Promise<any> {
  try {
    const profile = await loadProfile();
    if (profile) {
      return profile;
    }
  } catch (err) {
    console.warn("Failed to load profile from chrome storage, falling back to fixture:", err);
  }
  return profileData as ProfileData;
}
