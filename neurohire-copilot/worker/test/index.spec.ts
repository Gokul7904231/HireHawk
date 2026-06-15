import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";
import { selfHealing, CircuitBreaker } from "../src/lib/self-healing";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("NeuroHire Copilot Worker Suite", () => {
  describe("CORS and Routing", () => {
    it("handles OPTIONS preflight requests", async () => {
      const request = new IncomingRequest("http://example.com/extract", {
        method: "OPTIONS"
      });
      const response = await worker.fetch(request, env, {} as any);
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    });

    it("returns 404 for unknown endpoints", async () => {
      const request = new IncomingRequest("http://example.com/invalid-route", {
        method: "GET"
      });
      const response = await worker.fetch(request, env, {} as any);
      expect(response.status).toBe(404);
      const data = (await response.json()) as any;
      expect(data.error).toBe("Not found");
    });
  });

  describe("API Route: /extract", () => {
    it("returns mock JDSignals when GEMINI_MOCK is true", async () => {
      const request = new IncomingRequest("http://example.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_markdown: "We need a React developer" })
      });
      // Set mock environment
      const mockEnv = { ...env, GEMINI_MOCK: "true" };
      const response = await worker.fetch(request, mockEnv, {} as any);
      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.company_name).toBe("Breathe ESG");
      expect(data.role_title).toBe("AI Engineer Intern");
      expect(data.required_skills).toContain("React");
    });

    it("returns error 400 when jd_markdown parameter is missing", async () => {
      const request = new IncomingRequest("http://example.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const response = await worker.fetch(request, env, {} as any);
      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data.error).toBe("Missing jd_markdown parameter");
    });
  });

  describe("API Route: /tailor", () => {
    it("returns tailored bullets, letters, and claims trace verification", async () => {
      const request = new IncomingRequest("http://example.com/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jd_signals: { company_name: "Breathe ESG", role_title: "AI Engineer Intern" },
          profile: { name: "Gokul", skills: ["Python", "FastAPI"] }
        })
      });
      const mockEnv = { ...env, GEMINI_MOCK: "true" };
      const response = await worker.fetch(request, mockEnv, {} as any);
      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.tailored_bullets).toBeDefined();
      expect(data.cover_letter_paragraphs.length).toBe(3);
      expect(data.cold_email.subject).toBeDefined();
      expect(data.claims.length).toBeGreaterThan(0);
      expect(data.any_unsupported_claims).toBe(true);
    });
  });

  describe("API Route: /company-intel", () => {
    it("returns mock company details and data availability in mock mode", async () => {
      const request = new IncomingRequest("http://example.com/company-intel?name=Breathe%20ESG&domain=breatheesg.com", {
        method: "GET"
      });
      const mockEnv = { ...env, GEMINI_MOCK: "true" };
      const response = await worker.fetch(request, mockEnv, {} as any);
      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.company_name).toBe("Breathe ESG");
      expect(data.hq_location).toBe("Bangalore, India");
      expect(data.recent_news.length).toBe(2);
      expect(data.data_availability).toBe("full");
    });
  });

  describe("API Route: /tracker", () => {
    let testAppId: string = "";

    it("creates a new job application and retrieves it", async () => {
      const addRequest = new IncomingRequest("http://example.com/tracker/add_application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: "Breathe ESG",
          role: "AI Engineer Intern",
          fit_score: 0.95
        })
      });
      const mockEnv = { ...env, SUPABASE_MOCK: "true" };
      const addRes = await worker.fetch(addRequest, mockEnv, {} as any);
      expect(addRes.status).toBe(200);
      const addData = (await addRes.json()) as any;
      expect(addData.success).toBe(true);
      expect(addData.id).toBeDefined();
      testAppId = addData.id;

      // Get applications
      const getRequest = new IncomingRequest("http://example.com/tracker/applications", {
        method: "GET"
      });
      const getRes = await worker.fetch(getRequest, mockEnv, {} as any);
      expect(getRes.status).toBe(200);
      const getList = (await getRes.json()) as any[];
      expect(getList.length).toBeGreaterThan(0);
      const found = getList.find(a => a.id === testAppId);
      expect(found).toBeDefined();
      expect(found.company).toBe("Breathe ESG");
    });

    it("updates application status and verifies tracking stats", async () => {
      const mockEnv = { ...env, SUPABASE_MOCK: "true" };

      // Update status to interview
      const updateReq = new IncomingRequest("http://example.com/tracker/update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: testAppId,
          status: "interview"
        })
      });
      const updateRes = await worker.fetch(updateReq, mockEnv, {} as any);
      expect(updateRes.status).toBe(200);

      // Verify stats
      const statsReq = new IncomingRequest("http://example.com/tracker/stats", {
        method: "GET"
      });
      const statsRes = await worker.fetch(statsReq, mockEnv, {} as any);
      expect(statsRes.status).toBe(200);
      const stats = (await statsRes.json()) as any;
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.by_status.interview).toBe(1);
    });

    it("saves template outreach drafts successfully", async () => {
      const mockEnv = { ...env, SUPABASE_MOCK: "true" };
      const draftReq = new IncomingRequest("http://example.com/tracker/save_draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: testAppId,
          draft_type: "cold_email",
          content: "Hi Gokul, this is a test email content"
        })
      });
      const draftRes = await worker.fetch(draftReq, mockEnv, {} as any);
      expect(draftRes.status).toBe(200);
      const draftData = (await draftRes.json()) as any;
      expect(draftData.success).toBe(true);
      expect(draftData.id).toBeDefined();
    });
  });

  describe("Resiliency: Self-Healing & Circuit Breaker Logic", () => {
    it("selfHealing recovers from transient errors", async () => {
      let callCount = 0;
      const fn = async (corrective?: string) => {
        callCount++;
        if (callCount < 3) {
          throw new Error("Timeout/Fetch error");
        }
        return "SuccessValue";
      };

      const res = await selfHealing(fn, { maxRetries: 3, baseDelay: 1 });
      expect(res).toBe("SuccessValue");
      expect(callCount).toBe(3);
    });

    it("selfHealing uses fallback when exhausted", async () => {
      const fn = async () => {
        throw new Error("Schema error");
      };

      const res = await selfHealing(fn, { maxRetries: 2, baseDelay: 1, fallback: "FallbackValue" });
      expect(res).toBe("FallbackValue");
    });

    it("CircuitBreaker trips to OPEN after threshold failures", async () => {
      const breaker = new CircuitBreaker(3, 100);
      const faultyApi = async () => {
        throw new Error("Database down");
      };

      // 3 failures to trip breaker
      for (let i = 0; i < 3; i++) {
        await expect(breaker.call(faultyApi)).rejects.toThrow("Database down");
      }

      // 4th call should immediately fail due to open circuit
      await expect(breaker.call(faultyApi)).rejects.toThrow("Circuit OPEN");
      expect(breaker.getState()).toBe("OPEN");

      // Wait for cooldown
      await new Promise(r => setTimeout(r, 120));
      expect(breaker.getState()).toBe("OPEN");

      // Succeeds, moving state back to CLOSED
      const workingApi = async () => "Succeeds";
      const result = await breaker.call(workingApi);
      expect(result).toBe("Succeeds");
      expect(breaker.getState()).toBe("CLOSED");
    });
  });
});
