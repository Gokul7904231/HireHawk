import { Env } from "../types";
import { getSupabaseClient } from "../lib/supabase";
import { selfHealing, CircuitBreaker } from "../lib/self-healing";

// Shared in-memory mock database for worker isolates
const mockApplications: any[] = [];
const mockEvents: any[] = [];
const mockDrafts: any[] = [];

const supabaseBreaker = new CircuitBreaker(3, 30000);

function generateUUID(): string {
  return crypto.randomUUID();
}

export async function handleTracker(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, ""); // trim trailing slash
  const mockMode = env.SUPABASE_MOCK !== "false"; // default true

  try {
    if (path.endsWith("/tracker/add_application") && request.method === "POST") {
      const body = (await request.json()) as any;
      const { company, role, jd_url, fit_score, resume_version, notes } = body;

      if (!company || !role) {
        return new Response(JSON.stringify({ error: "Missing company or role parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (mockMode) {
        const id = generateUUID();
        const newApp = {
          id,
          company,
          role,
          jd_url: jd_url || null,
          fit_score: fit_score || null,
          resume_version: resume_version || null,
          notes: notes || null,
          status: "applied",
          applied_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        };
        mockApplications.push(newApp);
        return new Response(JSON.stringify({ id, success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Supabase insertion
      const result = await selfHealing<any>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const data = {
            company,
            role,
            jd_url,
            fit_score,
            resume_version,
            notes,
            status: "applied",
            applied_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          };
          const { data: inserted, error } = await client.table("applications").insert(data).select().single();
          if (error) throw new Error(error.message);
          return { id: inserted.id, success: true };
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/update_status") && request.method === "POST") {
      const { app_id, status } = (await request.json()) as any;
      if (!app_id || !status) {
        return new Response(JSON.stringify({ error: "Missing app_id or status parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (mockMode) {
        const app = mockApplications.find((a) => a.id === app_id);
        if (!app) {
          return new Response(JSON.stringify({ error: "Application not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
        }
        app.status = status;
        app.last_activity = new Date().toISOString();
        
        mockEvents.push({
          id: generateUUID(),
          app_id,
          event_type: status,
          note: `Status updated to '${status}'`,
          created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const nowStr = new Date().toISOString();
          
          const { error: appError } = await client.table("applications").update({
            status,
            last_activity: nowStr
          }).eq("id", app_id);
          if (appError) throw new Error(appError.message);

          const { error: eventError } = await client.table("events").insert({
            app_id,
            event_type: status,
            note: `Status updated to '${status}'`
          });
          if (eventError) throw new Error(eventError.message);

          return { success: true };
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/applications") && request.method === "GET") {
      const statusFilter = url.searchParams.get("status");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      if (mockMode) {
        let apps = [...mockApplications];
        if (statusFilter) {
          apps = apps.filter((a) => a.status === statusFilter);
        }
        apps.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
        return new Response(JSON.stringify(apps.slice(0, limit)), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any[]>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          let query = client.table("applications").select("*");
          if (statusFilter) {
            query = query.eq("status", statusFilter);
          }
          const { data, error } = await query.order("last_activity", { ascending: false }).limit(limit);
          if (error) throw new Error(error.message);
          return data || [];
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/followups") && request.method === "GET") {
      const days = parseInt(url.searchParams.get("days") || "7");

      if (mockMode) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const followups = mockApplications.filter((a) => {
          return new Date(a.last_activity).getTime() < cutoff && a.status !== "rejected" && a.status !== "offer";
        });
        return new Response(JSON.stringify(followups), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any[]>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
          const { data, error } = await client.table("applications")
            .select("*")
            .lt("last_activity", cutoff)
            .neq("status", "rejected")
            .neq("status", "offer");
          if (error) throw new Error(error.message);
          return data || [];
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/log_event") && request.method === "POST") {
      const { app_id, event_type, note } = (await request.json()) as any;
      if (!app_id || !event_type) {
        return new Response(JSON.stringify({ error: "Missing app_id or event_type parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (mockMode) {
        mockEvents.push({
          id: generateUUID(),
          app_id,
          event_type,
          note: note || null,
          created_at: new Date().toISOString()
        });
        const app = mockApplications.find((a) => a.id === app_id);
        if (app) app.last_activity = new Date().toISOString();
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const nowStr = new Date().toISOString();
          
          const { error: eventError } = await client.table("events").insert({
            app_id,
            event_type,
            note
          });
          if (eventError) throw new Error(eventError.message);

          const { error: appError } = await client.table("applications").update({
            last_activity: nowStr
          }).eq("id", app_id);
          if (appError) throw new Error(appError.message);

          return { success: true };
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/save_draft") && request.method === "POST") {
      const { app_id, draft_type, content } = (await request.json()) as any;
      if (!app_id || !draft_type || !content) {
        return new Response(JSON.stringify({ error: "Missing app_id, draft_type, or content parameters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      if (mockMode) {
        const id = generateUUID();
        mockDrafts.push({
          id,
          app_id,
          draft_type,
          content,
          created_at: new Date().toISOString()
        });
        return new Response(JSON.stringify({ id, success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const { data, error } = await client.table("drafts").insert({
            app_id,
            draft_type,
            content
          }).select().single();
          if (error) throw new Error(error.message);
          return { id: data.id, success: true };
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (path.endsWith("/tracker/stats") && request.method === "GET") {
      if (mockMode) {
        const total = mockApplications.length;
        const by_status: any = {};
        let sumFit = 0;
        let fitCount = 0;
        let interviews = 0;

        for (const app of mockApplications) {
          by_status[app.status] = (by_status[app.status] || 0) + 1;
          if (app.fit_score !== null) {
            sumFit += app.fit_score;
            fitCount++;
          }
          if (app.status === "interview") {
            interviews++;
          }
        }

        return new Response(JSON.stringify({
          total,
          by_status,
          avg_fit_score: fitCount > 0 ? parseFloat((sumFit / fitCount).toFixed(4)) : 0,
          interviews
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const result = await selfHealing<any>(async () => {
        return await supabaseBreaker.call(async () => {
          const client = getSupabaseClient(env.SUPABASE_URL, env.SUPABASE_KEY);
          const { data: apps, error } = await client.table("applications").select("*");
          if (error) throw new Error(error.message);

          const total = apps.length;
          const by_status: any = {};
          let sumFit = 0;
          let fitCount = 0;
          let interviews = 0;

          for (const app of apps) {
            by_status[app.status] = (by_status[app.status] || 0) + 1;
            if (app.fit_score !== null) {
              sumFit += app.fit_score;
              fitCount++;
            }
            if (app.status === "interview") {
              interviews++;
            }
          }

          return {
            total,
            by_status,
            avg_fit_score: fitCount > 0 ? parseFloat((sumFit / fitCount).toFixed(4)) : 0,
            interviews
          };
        });
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
