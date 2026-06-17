export interface ParsedProfile {
  name: string;
  email: string | null;
  phone: string | null;
  github: string | null;
  linkedin: string | null;
  portfolio: string | null;
  location: string | null;
  education: {
    degree: string;
    college: string;
    university: string | null;
    cgpa: string | null;
    grad_year: number | null;
  };
  experience: {
    role: string;
    company: string;
    duration: string;
    bullets: string[];
    stack: string[];
  }[];
  projects: {
    name: string;
    description: string;
    tech: string[];
    live_url: string | null;
    github_url: string | null;
    tags: string[];
  }[];
  skills: {
    languages: string[];
    frameworks: string[];
    cloud: string[];
    ml: string[];
  };
  publications: {
    title: string;
    venue: string;
    year: number;
  }[];
  certifications: {
    name: string;
    issuer: string;
    score: string | null;
    year: number | null;
  }[];
  achievements: string[];
}

export interface ProfileMeta {
  uploaded_at: string;
  filename: string;
  confidence: "high" | "medium" | "low";
  missing_fields: string[];
}

export async function saveProfile(profile: ParsedProfile, meta: ProfileMeta): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({
      neurohire_profile: profile,
      neurohire_profile_meta: meta
    });
  } else {
    globalThis.localStorage?.setItem("neurohire_profile", JSON.stringify(profile));
    globalThis.localStorage?.setItem("neurohire_profile_meta", JSON.stringify(meta));
  }
}

export async function loadProfile(): Promise<ParsedProfile | null> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get("neurohire_profile");
    return res.neurohire_profile || null;
  } else {
    const data = globalThis.localStorage?.getItem("neurohire_profile");
    return data ? JSON.parse(data) : null;
  }
}

export async function loadProfileMeta(): Promise<ProfileMeta | null> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    const res = await chrome.storage.local.get("neurohire_profile_meta");
    return res.neurohire_profile_meta || null;
  } else {
    const data = globalThis.localStorage?.getItem("neurohire_profile_meta");
    return data ? JSON.parse(data) : null;
  }
}

export async function clearProfile(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.remove(["neurohire_profile", "neurohire_profile_meta"]);
  } else {
    globalThis.localStorage?.removeItem("neurohire_profile");
    globalThis.localStorage?.removeItem("neurohire_profile_meta");
  }
}

export async function hasProfile(): Promise<boolean> {
  const profile = await loadProfile();
  return profile !== null && typeof profile.name === "string" && profile.name.trim() !== "";
}
