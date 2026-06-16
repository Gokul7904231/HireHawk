import { describe, it, expect } from "vitest";
import { cacheGet, cacheSet, getDeterministicVector } from "../lib/vector-cache";

describe("Local Vector Cache", () => {
  it("generates deterministic normalized vectors for identical text input", () => {
    const v1 = getDeterministicVector("React Developer");
    const v2 = getDeterministicVector("React Developer");
    const v3 = getDeterministicVector("FastAPI Developer");

    expect(v1.length).toBe(384);
    expect(v1).toEqual(v2);
    expect(v1).not.toEqual(v3);

    // Verify normalization (length close to 1)
    const len = Math.sqrt(v1.reduce((sum, v) => sum + v * v, 0));
    expect(len).toBeCloseTo(1, 4);
  });

  it("yields cache misses and cache hits correctly", async () => {
    const jdText = "Job description for a Python Intern at Breathe ESG";
    const result = await cacheGet(jdText);
    expect(result).toBeNull(); // Cache miss initially

    const mockTailor = {
      tailored_bullets: [{ project_or_role: "Zidio", bullet: "React development" }],
      cover_letter_paragraphs: ["letter"],
      cold_email: { subject: "Sub", body: "Body" },
      referral_message: "Hi",
      claims: [],
      any_unsupported_claims: false
    };

    // Cache the tailored output
    await cacheSet(jdText, mockTailor);

    // Retrieve again
    const cached = await cacheGet(jdText);
    expect(cached).not.toBeNull();
    expect(cached?.cold_email.subject).toBe("Sub");
  });
});
