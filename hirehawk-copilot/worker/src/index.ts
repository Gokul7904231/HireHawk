import { Env } from "./types";
import { handleExtract } from "./routes/extract";
import { handleTailor } from "./routes/tailor";
import { handleCompanyIntel } from "./routes/company-intel";
import { handleTracker } from "./routes/tracker";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response("OK", { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    if (path.startsWith("/extract")) {
      response = await handleExtract(request, env);
    } else if (path.startsWith("/tailor")) {
      response = await handleTailor(request, env);
    } else if (path.startsWith("/company-intel")) {
      response = await handleCompanyIntel(request, env);
    } else if (path.startsWith("/tracker")) {
      response = await handleTracker(request, env);
    } else {
      response = new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Wrap with CORS headers
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
} satisfies ExportedHandler<Env>;
