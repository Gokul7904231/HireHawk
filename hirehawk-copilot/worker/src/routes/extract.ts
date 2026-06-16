import { Env, JDSignals } from "../types";
import { callGemini } from "../lib/gemini";
import { selfHealing } from "../lib/self-healing";
import { MOCK_JD_SIGNALS } from "../lib/mock-fixtures";

/**
 * handleExtract — Phase 11 update
 *
 * When AGENT_BACKEND_URL is set the Worker acts as a thin SSE proxy:
 *   1. POST /run → FastAPI to start the LangGraph pipeline
 *   2. Pipe GET /stream/{run_id} SSE events back to the extension
 *
 * When AGENT_BACKEND_URL is absent (MOCK / legacy mode) the original
 * direct-Gemini path is preserved so existing Vitest tests keep passing.
 */
export async function handleExtract(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = (await request.json()) as any;
    const jd_markdown = body.jd_markdown;
    if (!jd_markdown) {
      return new Response(JSON.stringify({ error: "Missing jd_markdown parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ── AGENTIC PATH: proxy to LangGraph FastAPI backend ──────────────────────
    const backendUrl = env.AGENT_BACKEND_URL;
    if (backendUrl) {
      // 1. Start a new graph run
      const runRes = await fetch(`${backendUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_raw: jd_markdown })
      });

      if (!runRes.ok) {
        const errText = await runRes.text();
        return new Response(JSON.stringify({ error: `Backend /run failed: ${errText}` }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        });
      }

      const { run_id } = (await runRes.json()) as { run_id: string };

      // 2. Pipe SSE stream from FastAPI back to the extension client
      const streamRes = await fetch(`${backendUrl}/stream/${run_id}`);
      if (!streamRes.ok || !streamRes.body) {
        return new Response(JSON.stringify({ error: "Backend /stream failed" }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Forward as Server-Sent Events so the extension popup can consume events live
      return new Response(streamRes.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Run-Id": run_id
        }
      });
    }

    // ── LEGACY / MOCK PATH: call Gemini directly ───────────────────────────────
    const mockMode = env.GEMINI_MOCK !== "false"; // default true
    const apiKey = env.GEMINI_API_KEY || "";
    const modelName = "gemini-1.5-flash";

    const responseSchema = {
      type: "OBJECT",
      properties: {
        company_name: { type: "STRING" },
        role_title: { type: "STRING" },
        required_skills: { type: "ARRAY", items: { type: "STRING" } },
        nice_to_have_skills: { type: "ARRAY", items: { type: "STRING" } },
        culture_keywords: { type: "ARRAY", items: { type: "STRING" } },
        seniority: { type: "STRING", enum: ["intern", "junior", "mid", "senior"] },
        domain: { type: "STRING", enum: ["ai", "fullstack", "devops", "data", "other"] },
        remote_status: { type: "STRING", enum: ["remote", "hybrid", "onsite", "unknown"] },
        location: { type: "STRING" },
        salary_range: { type: "STRING" }
      },
      required: [
        "company_name",
        "role_title",
        "required_skills",
        "nice_to_have_skills",
        "culture_keywords",
        "seniority",
        "domain",
        "remote_status"
      ]
    };

    const systemPrompt = "You are a precise JD parser. Extract structured signals from the provided job description markdown. Return only what is explicitly stated — do not infer or fabricate.";

    const result = await selfHealing<JDSignals>(
      async (corrective) => {
        const prompt = corrective ? `${jd_markdown}\n\n${corrective}` : jd_markdown;
        return await callGemini(
          apiKey,
          modelName,
          systemPrompt,
          prompt,
          responseSchema,
          mockMode,
          MOCK_JD_SIGNALS
        );
      },
      {
        maxRetries: 3,
        fallback: {
          ...MOCK_JD_SIGNALS,
          extraction_failed: true
        }
      }
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
