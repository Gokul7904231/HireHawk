import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveProfile, loadProfile, clearProfile, hasProfile, ParsedProfile, ProfileMeta } from "../lib/resume-storage";

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn().mockImplementation(async (keys: string | string[]) => {
        const result: Record<string, any> = {};
        const keysArr = Array.isArray(keys) ? keys : [keys];
        for (const k of keysArr) {
          if (mockStorage[k] !== undefined) {
            result[k] = mockStorage[k];
          }
        }
        return result;
      }),
      set: vi.fn().mockImplementation(async (items: Record<string, any>) => {
        for (const [k, v] of Object.entries(items)) {
          mockStorage[k] = v;
        }
      }),
      remove: vi.fn().mockImplementation(async (keys: string | string[]) => {
        const keysArr = Array.isArray(keys) ? keys : [keys];
        for (const k of keysArr) {
          delete mockStorage[k];
        }
      })
    }
  }
} as any;

const sampleProfile: ParsedProfile = {
  name: "Gokul",
  email: "gokul@gmail.com",
  phone: "+91-1234567890",
  github: "github.com/Gokul",
  linkedin: "linkedin.com/in/gokul",
  portfolio: "gokul.dev",
  location: "Chennai",
  education: {
    degree: "B.Tech",
    college: "Crescent",
    university: null,
    cgpa: "7.5",
    grad_year: 2026
  },
  experience: [],
  projects: [],
  skills: { languages: [], frameworks: [], cloud: [], ml: [] },
  publications: [],
  certifications: [],
  achievements: []
};

const sampleMeta: ProfileMeta = {
  uploaded_at: "2026-06-17",
  filename: "resume.pdf",
  confidence: "high",
  missing_fields: []
};

describe("Resume Storage Library Tests", () => {
  beforeEach(() => {
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
  });

  it("saveProfile and loadProfile round-trip: same object returned", async () => {
    await saveProfile(sampleProfile, sampleMeta);
    const loaded = await loadProfile();
    expect(loaded).toEqual(sampleProfile);
  });

  it("hasProfile returns false before save, true after", async () => {
    const before = await hasProfile();
    expect(before).toBe(false);

    await saveProfile(sampleProfile, sampleMeta);
    const after = await hasProfile();
    expect(after).toBe(true);
  });

  it("clearProfile causes hasProfile to return false again", async () => {
    await saveProfile(sampleProfile, sampleMeta);
    expect(await hasProfile()).toBe(true);

    await clearProfile();
    expect(await hasProfile()).toBe(false);
    expect(await loadProfile()).toBeNull();
  });

  it("loadProfile when empty returns null", async () => {
    const profile = await loadProfile();
    expect(profile).toBeNull();
  });
});
