import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Parse Resume API Endpoint Tests", () => {
  it("Mock mode: POST with any file returns valid profile shape and mock: true", async () => {
    const formData = new FormData();
    const pdfBlob = new Blob([new Uint8Array(100)], { type: "application/pdf" });
    formData.append("resume", pdfBlob, "resume.pdf");

    const request = new IncomingRequest("http://example.com/parse-resume", {
      method: "POST",
      body: formData
    });

    const mockEnv = { ...env, GEMINI_MOCK: "true" };
    const response = await worker.fetch(request, mockEnv, {} as any);
    expect(response.status).toBe(200);

    const data = (await response.json()) as any;
    expect(data.mock).toBe(true);
    expect(data.parsed_profile).toBeDefined();
    expect(data.parsed_profile.name).toBe("Gokul");
    expect(data.confidence).toBe("high");
    expect(data.missing_fields).toBeDefined();
  });

  it("Missing fields: POST empty PDF returns confidence: low, missing_fields non-empty", async () => {
    const formData = new FormData();
    const emptyBlob = new Blob([], { type: "application/pdf" });
    formData.append("resume", emptyBlob, "empty.pdf");

    const request = new IncomingRequest("http://example.com/parse-resume", {
      method: "POST",
      body: formData
    });

    const mockEnv = { ...env, GEMINI_MOCK: "true" };
    const response = await worker.fetch(request, mockEnv, {} as any);
    expect(response.status).toBe(200);

    const data = (await response.json()) as any;
    expect(data.mock).toBe(true);
    expect(data.confidence).toBe("low");
    expect(data.missing_fields.length).toBeGreaterThan(0);
    expect(data.missing_fields).toContain("name");
    expect(data.missing_fields).toContain("email");
  });

  it("File too large: POST 6MB blob returns 400 error", async () => {
    const formData = new FormData();
    const largeBlob = new Blob([new Uint8Array(6 * 1024 * 1024)], { type: "application/pdf" });
    formData.append("resume", largeBlob, "large.pdf");

    const request = new IncomingRequest("http://example.com/parse-resume", {
      method: "POST",
      body: formData
    });

    const mockEnv = { ...env, GEMINI_MOCK: "true" };
    const response = await worker.fetch(request, mockEnv, {} as any);
    expect(response.status).toBe(400);

    const data = (await response.json()) as any;
    expect(data.error).toBe("PDF exceeds 5MB limit");
  });

  it("Schema completeness: all top-level keys present in response", async () => {
    const formData = new FormData();
    const pdfBlob = new Blob([new Uint8Array(100)], { type: "application/pdf" });
    formData.append("resume", pdfBlob, "resume.pdf");

    const request = new IncomingRequest("http://example.com/parse-resume", {
      method: "POST",
      body: formData
    });

    const mockEnv = { ...env, GEMINI_MOCK: "true" };
    const response = await worker.fetch(request, mockEnv, {} as any);
    expect(response.status).toBe(200);

    const data = (await response.json()) as any;
    expect(data.parsed_profile).toBeDefined();
    expect(data.confidence).toBeDefined();
    expect(data.missing_fields).toBeDefined();
    expect(data.raw_text_length).toBeDefined();
    expect(data.mock).toBeDefined();

    const profile = data.parsed_profile;
    const expectedKeys = [
      "name", "email", "phone", "github", "linkedin", "portfolio", "location",
      "education", "experience", "projects", "skills", "publications",
      "certifications", "achievements"
    ];
    for (const key of expectedKeys) {
      expect(profile).toHaveProperty(key);
    }
  });
});
