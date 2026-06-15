export const WORKER_BASE_URL = "http://localhost:8787";

export async function extractJobDescription(jdMarkdown: string): Promise<any> {
  const res = await fetch(`${WORKER_BASE_URL}/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_markdown: jdMarkdown })
  });
  if (!res.ok) throw new Error(`Extract API error: ${await res.text()}`);
  return await res.json();
}

export async function tailorApplication(jdSignals: any, profile: any): Promise<any> {
  const res = await fetch(`${WORKER_BASE_URL}/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_signals: jdSignals, profile })
  });
  if (!res.ok) throw new Error(`Tailor API error: ${await res.text()}`);
  return await res.json();
}

export async function fetchCompanyIntel(name: string, domain: string): Promise<any> {
  const res = await fetch(`${WORKER_BASE_URL}/company-intel?name=${encodeURIComponent(name)}&domain=${encodeURIComponent(domain)}`, {
    method: "GET"
  });
  if (!res.ok) throw new Error(`Company Intel API error: ${await res.text()}`);
  return await res.json();
}

export async function addTrackerApplication(payload: {
  company: string;
  role: string;
  jd_url?: string;
  fit_score?: number;
  resume_version?: string;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${WORKER_BASE_URL}/tracker/add_application`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Tracker add application error: ${await res.text()}`);
  return await res.json();
}

export async function saveTrackerDraft(appId: string, draftType: string, content: string): Promise<any> {
  const res = await fetch(`${WORKER_BASE_URL}/tracker/save_draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, draft_type: draftType, content })
  });
  if (!res.ok) throw new Error(`Tracker save draft error: ${await res.text()}`);
  return await res.json();
}
