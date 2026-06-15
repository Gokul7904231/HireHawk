import { Env, JDSignals, TailorOutput } from "../types";
import { callGemini } from "../lib/gemini";
import { selfHealing } from "../lib/self-healing";
import { MOCK_TAILOR_OUTPUT } from "../lib/mock-fixtures";

/**
 * handleTailor — Phase 11 update
 *
 * When AGENT_BACKEND_URL is set, this handler:
 *   1. Expects a run_id to already exist (started by /extract SSE stream) — OR
 *      starts a new run with the tailor payload.
 *   2. Posts approval to FastAPI /approve/{run_id} to resume the HITL checkpoint,
 *      then pipes the resulting SSE stream back to the extension.
 *
 * When AGENT_BACKEND_URL is absent the original direct-Gemini path runs.
 */
export async function handleTailor(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = (await request.json()) as any;
    const { jd_signals, profile, run_id: existingRunId } = body;
    if (!jd_signals || !profile) {
      return new Response(JSON.stringify({ error: "Missing jd_signals or profile parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // ── AGENTIC PATH: proxy to LangGraph FastAPI backend ──────────────────────
    const backendUrl = env.AGENT_BACKEND_URL;
    if (backendUrl) {
      let run_id = existingRunId as string | undefined;

      // If no existing run_id, start a fresh graph run with jd_signals as raw text
      if (!run_id) {
        const runRes = await fetch(`${backendUrl}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jd_raw: JSON.stringify(jd_signals),
            user_id: "extension_user"
          })
        });
        if (!runRes.ok) {
          const errText = await runRes.text();
          return new Response(JSON.stringify({ error: `Backend /run failed: ${errText}` }), {
            status: 502,
            headers: { "Content-Type": "application/json" }
          });
        }
        const data = (await runRes.json()) as { run_id: string };
        run_id = data.run_id;
      }

      // Approve the HITL checkpoint (resume after breakpoint)
      const approveRes = await fetch(`${backendUrl}/approve/${run_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true })
      });
      if (!approveRes.ok) {
        const errText = await approveRes.text();
        return new Response(JSON.stringify({ error: `Backend /approve failed: ${errText}` }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Pipe resuming SSE stream back to extension
      const streamRes = await fetch(`${backendUrl}/stream/${run_id}`);
      if (!streamRes.ok || !streamRes.body) {
        return new Response(JSON.stringify({ error: "Backend /stream failed after approve" }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        });
      }

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
    const mockMode = env.GEMINI_MOCK !== "false";
    const apiKey = env.GEMINI_API_KEY || "";
    const modelName = "gemini-1.5-flash";

    const responseSchema = {
      type: "OBJECT",
      properties: {
        tailored_bullets: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              project_or_role: { type: "STRING" },
              bullet: { type: "STRING" }
            },
            required: ["project_or_role", "bullet"]
          }
        },
        cover_letter_paragraphs: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        cold_email: {
          type: "OBJECT",
          properties: {
            subject: { type: "STRING" },
            body: { type: "STRING" }
          },
          required: ["subject", "body"]
        },
        referral_message: { type: "STRING" },
        claims: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              claim: { type: "STRING" },
              supported_by_baseline: { type: "BOOLEAN" },
              reasoning: { type: "STRING" }
            },
            required: ["claim", "supported_by_baseline", "reasoning"]
          }
        },
        any_unsupported_claims: { type: "BOOLEAN" }
      },
      required: [
        "tailored_bullets",
        "cover_letter_paragraphs",
        "cold_email",
        "referral_message",
        "claims",
        "any_unsupported_claims"
      ]
    };

    const systemPrompt = `You are tailoring a candidate's resume bullets, cover letter, and outreach messages for a specific job. Follow these steps IN ORDER within your response:

STEP 1 — DRAFT: Generate tailored_bullets, cover_letter_paragraphs (exactly 3 paragraphs), cold_email, and referral_message, mapping the candidate's baseline experience onto the job's required_skills and culture_keywords.

STEP 2 — CLAIM EXTRACTION: List every distinct factual claim about the candidate's experience present in your STEP 1 output (e.g., "built X using Y", "led Z", "improved performance by N%").

STEP 3 — ADJUDICATION: For each claim from STEP 2, determine whether it is EXPLICITLY supported by the baseline resume data provided below. Output {claim, supported_by_baseline: boolean, reasoning: string} for each.

STEP 4 — REWRITE: If any claim has supported_by_baseline=false, rewrite the offending bullet/paragraph to strictly match the baseline truth (e.g., "led the architecture" -> "contributed to the architecture" if baseline only says "contributed to"). Your FINAL tailored_bullets/cover_letter/etc. must contain ONLY claims that are supported_by_baseline=true.

VOICE GUIDELINE:
Use casual, clear, direct, and non-generic writing. Avoid corporate fluff, placeholders, or standard templates. Keep wordings brief.

BASELINE RESUME DATA (ground truth — never go beyond this):
${JSON.stringify(profile)}

Return the FINAL (post-rewrite) tailored_bullets, cover_letter_paragraphs, cold_email, referral_message, AND the full claims array from STEP 3, AND any_unsupported_claims (set to true only if any claims are unsupported_by_baseline=false).`;

    const userPrompt = `Job description signals: ${JSON.stringify(jd_signals)}`;

    const result = await selfHealing<TailorOutput>(
      async (corrective) => {
        const currentPrompt = corrective ? `${userPrompt}\n\n${corrective}` : userPrompt;
        const res = await callGemini(
          apiKey,
          modelName,
          systemPrompt,
          currentPrompt,
          responseSchema,
          mockMode,
          MOCK_TAILOR_OUTPUT
        );

        // Word count guard & validation checks
        if (!res.claims || res.claims.length === 0) {
          throw new Error("hallucination: claims array is empty or missing");
        }

        const emailBody = res.cold_email?.body || "";
        const wordCount = emailBody.split(/\s+/).filter(Boolean).length;
        if (wordCount > 160) {
          throw new Error(`hallucination: cold email body has ${wordCount} words, exceeding the 150-word strict limit`);
        }

        return res;
      },
      {
        maxRetries: 3,
        fallback: MOCK_TAILOR_OUTPUT
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
