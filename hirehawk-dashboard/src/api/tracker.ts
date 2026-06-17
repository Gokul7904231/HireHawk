import { Application, CompanyIntel, Claim, Profile, ApplicationDetail } from '../types';

const MOCK_MODE = import.meta.env.VITE_MOCK === 'true';
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// In-memory store for settings changes when in mock mode
let mockProfileData: Profile = {
  name: "Gokul",
  email: "gokul32499@gmail.com",
  github: "https://github.com/Gokul7904231",
  portfolio: "https://gokul-portfolio.vercel.app",
  top_projects: [
    {
      name: "Sentixcare",
      description: "Multi-agent RAG workflow for analyzing medical and clinical records using FastAPI, LangChain, and Qdrant. Deployed on HuggingFace.",
      live_url: "https://huggingface.co/spaces/Gokul7904231/sentixcare",
      tags: ["FastAPI", "LangChain", "Qdrant", "Python", "RAG", "AI"]
    },
    {
      name: "Meeting Intelligence Service",
      description: "Enterprise microservice parsing transcripts and drawing action items, with fallback error correction self-healing layers.",
      live_url: "https://github.com/Gokul7904231/meeting-intel",
      tags: ["TypeScript", "Node.js", "FastAPI", "Supabase", "AI"]
    }
  ],
  top_skills: ["Python", "Django", "FastAPI", "React", "TypeScript", "LangChain", "Qdrant", "PostgreSQL", "Docker", "Git"],
  experience_summary: "AI/ML Intern at Infosys, Full Stack Intern at Zidio, specialized in agentic workflows and React frontend dashboards.",
  experience: [
    {
      company: "Infosys",
      role: "AI/ML Developer Intern",
      description: "Developed and optimized retrieval models for corporate documents using semantic embeddings, reducing search latency by 40%.",
      period: "Jan 2026 - Present"
    },
    {
      company: "Zidio",
      role: "Full Stack Intern",
      description: "Constructed responsive frontend views using React and mapped data flows to Django APIs with PostgreSQL backends.",
      period: "Sep 2025 - Dec 2025"
    }
  ]
};

let mockApplications: Application[] = [
  {
    id: "6503e116-27c3-4647-b013-72c7736b608b",
    company: "Breathe ESG",
    role: "AI Engineer Intern",
    status: "interview",
    fit_score: 85,
    applied_at: "2026-06-10T10:00:00Z",
    last_activity: "2026-06-12T14:30:00Z",
    jd_url: "https://breatheesg.com/careers",
    resume_version: "v1_tailored",
    notes: "Awaiting interview confirmation email."
  },
  {
    id: "2",
    company: "Microsoft",
    role: "Software Engineer - Copilot Team",
    status: "applied",
    fit_score: 92,
    applied_at: "2026-06-14T09:00:00Z",
    last_activity: "2026-06-14T09:00:00Z",
    jd_url: "https://careers.microsoft.com",
    resume_version: "v2_tailored",
    notes: "Applied via referral"
  },
  {
    id: "3",
    company: "Google",
    role: "AI Research Scientist Intern",
    status: "rejected",
    fit_score: 68,
    applied_at: "2026-06-01T15:20:00Z",
    last_activity: "2026-06-05T11:10:00Z",
    jd_url: "https://google.com/careers",
    resume_version: "v1_baseline",
    notes: "Screening round completed, rejected due to graduation timeline mismatch."
  },
  {
    id: "4",
    company: "Stripe",
    role: "Backend Engineer - Payments Infrastructure",
    status: "pending",
    fit_score: 78,
    applied_at: "2026-06-12T16:40:00Z",
    last_activity: "2026-06-13T10:00:00Z",
    jd_url: "https://stripe.com/jobs",
    resume_version: "v1_tailored",
    notes: "Recruiter screen scheduled next week."
  },
  {
    id: "5",
    company: "Anthropic",
    role: "Full Stack Developer - Frontend Platform",
    status: "interview",
    fit_score: 95,
    applied_at: "2026-06-08T08:15:00Z",
    last_activity: "2026-06-14T17:30:00Z",
    jd_url: "https://anthropic.com/careers",
    resume_version: "v3_tailored",
    notes: "Take-home test submitted, waiting for review."
  }
];

export async function getStats(): Promise<{
  total: number;
  by_status: Record<string, number>;
  avg_fit_score: number;
  interviews: number;
}> {
  if (MOCK_MODE) {
    const total = mockApplications.length;
    const by_status = mockApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const validScores = mockApplications.filter(a => a.fit_score !== null);
    const sumFit = validScores.reduce((sum, a) => sum + (a.fit_score || 0), 0);
    const avg_fit_score = validScores.length > 0 ? parseFloat((sumFit / validScores.length).toFixed(1)) : 0;
    const interviews = mockApplications.filter(a => a.status === 'interview').length;

    return { total, by_status, avg_fit_score, interviews };
  }

  const res = await fetch(`${WORKER_URL}/tracker/stats`);
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

export async function getApplications(status?: string): Promise<Application[]> {
  if (MOCK_MODE) {
    if (status) {
      return mockApplications.filter(a => a.status === status);
    }
    return [...mockApplications].sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
  }

  const url = status ? `${WORKER_URL}/tracker/applications?status=${status}` : `${WORKER_URL}/tracker/applications`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

export async function updateStatus(app_id: string, status: string): Promise<{ success: boolean }> {
  if (MOCK_MODE) {
    const app = mockApplications.find(a => a.id === app_id);
    if (app) {
      app.status = status as any;
      app.last_activity = new Date().toISOString();
    }
    return { success: true };
  }

  const res = await fetch(`${WORKER_URL}/tracker/update_status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id, status })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function getApplicationDetail(id: string): Promise<ApplicationDetail> {
  if (MOCK_MODE) {
    const app = mockApplications.find(a => a.id === id) || mockApplications[0];
    const company = app.company;
    const role = app.role;

    // Custom claims verification details matching Breathe ESG or newly parsed values
    const claims: Claim[] = [
      {
        claim: `Implemented clinical / document indexing and RAG pipelines using Python, FastAPI, and LangChain matching ${company}'s core stack.`,
        supported_by_baseline: true,
        reasoning: `Supported by baseline ground truth which lists Python, FastAPI, and LangChain skills, as well as the Sentixcare Space deployment.`
      },
      {
        claim: `Led the entire cloud orchestration and DevOps infrastructure team at ${company}.`,
        supported_by_baseline: false,
        reasoning: "Fabricated claim. Baseline profile only lists software engineering internship experience and personal AI RAG prototypes. Caught by claims checker."
      },
      {
        claim: "Integrated backend services using Django and React",
        supported_by_baseline: true,
        reasoning: "Supported by baseline which lists Django and React under skills and Zidio Full Stack internship."
      }
    ];

    const company_intel: CompanyIntel = {
      company_name: company,
      founding_year: 2018 + Math.floor(Math.random() * 5),
      hq_location: company === "Breathe ESG" ? "Bangalore, India" : "San Francisco, CA",
      industry: company === "Breathe ESG" ? "Sustainability SaaS" : "Information Technology & Services",
      website: `https://${company.toLowerCase().replace(/\s/g, '')}.com`,
      recent_news: [
        {
          title: `${company} raises new venture capital round to expand AI analytics tools`,
          summary: `${company} secured new financing to expand enterprise automation.`,
          date: new Date().toISOString().split('T')[0],
          source: "TechCrunch"
        },
        {
          title: `${company} launches generative AI reporting agents`,
          summary: `New tools allow users to ask conversational questions about operations.`,
          date: new Date().toISOString().split('T')[0],
          source: "ESG Today"
        }
      ],
      data_availability: "full"
    };

    const outreach_draft = {
      cold_email: {
        subject: `AI / RAG Developer interest for ${role} at ${company}`,
        body: `Hi team,\n\nI saw ${company} is expanding its AI engineering and RAG automation pipelines. I recently built Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and completed a Full Stack Intern role at Zidio building React interfaces.\n\nI'd love to learn if you're open to an intern to help construct client-facing pipelines for ${company}. Are you free for a 10-minute chat next week?\n\nBest,\nGokul`
      },
      cover_letter_paragraphs: [
        `Dear Hiring Manager,\n\nYour recent work automating sustainability analytics at ${company} caught my eye. I recently shipped Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and completed a Full Stack Intern role at Zidio building React interfaces. I believe my background in building LangChain and FastAPI microservices aligns perfectly with your goals for the ${role} role.`,
        `During my Full Stack Internship at Zidio, I developed responsive frontend dashboards in React and connected them to Django/PostgreSQL databases. In addition, my personal project Sentixcare involved training multi-modal classifiers and building semantic routing engines in Python, giving me strong fundamentals in pipeline integration.`,
        `I would love to bring my programming skills and fast learning pace to ${company}. Thank you for your time, and I look forward to the opportunity to discuss my qualifications.`
      ],
      referral_message: `Hi! I saw you work at ${company}. I'm an AI engineer intern looking at the open developer listing for ${role}. I specialize in FastAPI, LangChain, and React (check out my HuggingFace Sentixcare app!). Would you be open to forwarding my details to the recruitment lead? Thanks!`
    };

    const tailored_bullets = [
      {
        project_or_role: "Sentixcare (AI/ML Project)",
        bullet: `Developed a multi-agent RAG workflow using Python, FastAPI, and LangChain to parse and analyze clinical records for ${company}.`
      },
      {
        project_or_role: "Full Stack Intern at Zidio",
        bullet: `Built responsive frontend UI widgets in React and integrated backend services using Django and PostgreSQL for ${company}.`
      }
    ];

    return {
      application: app,
      claims,
      company_intel,
      outreach_draft,
      tailored_bullets
    };
  }

  // Real fetch (calls our REST endpoints)
  const detailRes = await fetch(`${WORKER_URL}/tracker/applications?id=${id}`);
  if (!detailRes.ok) throw new Error('Failed to fetch application');
  const application = await detailRes.json();

  // Fetch company intel & drafts
  const intelUrl = `${WORKER_URL}/company-intel?name=${encodeURIComponent(application.company)}`;
  const intelRes = await fetch(intelUrl).catch(() => null);
  const company_intel = intelRes?.ok ? await intelRes.json() : { company_name: application.company, founding_year: null, hq_location: null, industry: null, website: null };

  // Fetch drafts if available, or generate baseline empty ones
  const claims: Claim[] = [];
  const outreach_draft = {
    cold_email: { subject: '', body: '' },
    cover_letter_paragraphs: [],
    referral_message: ''
  };
  const tailored_bullets: any[] = [];

  return {
    application,
    claims,
    company_intel,
    outreach_draft,
    tailored_bullets
  };
}

export async function getProfile(): Promise<Profile> {
  if (MOCK_MODE) {
    return mockProfileData;
  }

  const res = await fetch(`${FASTAPI_URL}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile settings');
  return res.json();
}

export async function saveProfile(profile: Profile): Promise<{ success: boolean }> {
  if (MOCK_MODE) {
    mockProfileData = profile;
    return { success: true };
  }

  const res = await fetch(`${FASTAPI_URL}/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!res.ok) throw new Error('Failed to save profile settings');
  return res.json();
}

export async function getMcpStatus(): Promise<Record<string, 'healthy' | 'unhealthy' | 'offline'>> {
  if (MOCK_MODE) {
    return {
      "resume-mcp": "healthy",
      "jd-parser-mcp": "healthy",
      "tracker-mcp": "healthy",
      "company-intel-mcp": "healthy",
      "outreach-mcp": "healthy"
    };
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/mcp_status`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      "resume-mcp": "offline",
      "jd-parser-mcp": "offline",
      "tracker-mcp": "offline",
      "company-intel-mcp": "offline",
      "outreach-mcp": "offline"
    };
  }
}

export async function triggerApproveRun(run_id: string, approved: boolean): Promise<{ success: boolean; appId?: string }> {
  if (MOCK_MODE) {
    console.log(`[Mock Approve] Run ID: ${run_id} approved: ${approved}`);
    return { success: true, appId: run_id };
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/approve/${run_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved })
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, appId: data.app_id || run_id };
  } catch {
    return { success: false };
  }
}

function parseJobDescription(jdText: string): { company: string; role: string } {
  let company = "Unknown Company";
  let role = "AI Engineer";

  // Regex patterns
  const atMatch = jdText.match(/(?:looking for|seeking|hiring|role of|position of)?\s*(?:an?|the)?\s*([^,.\n]+?)\s+at\s+([^,.\n]+)/i);
  if (atMatch) {
    role = atMatch[1].trim();
    company = atMatch[2].trim();
  } else {
    const isLookingMatch = jdText.match(/([^,.\n]+?)\s+(?:is looking for|is hiring for|seeks|is seeking)\s+(?:an?|the)?\s*([^,.\n]+)/i);
    if (isLookingMatch) {
      company = isLookingMatch[1].trim();
      role = isLookingMatch[2].trim();
    }
  }

  // Cleaning
  company = company.replace(/^(we are|we're|our team|we|are hiring)\s+/i, '').trim();
  role = role.replace(/^(an?|the|a|to hire a)\s+/i, '').trim();

  // Strip trailing descriptors
  role = role.replace(/\s+to\s+.*$/i, '').trim();
  company = company.replace(/\s+to\s+.*$/i, '').trim();

  if (company.length > 40) company = company.substring(0, 40);
  if (role.length > 50) role = role.substring(0, 50);

  // Capitalize words helper
  const capitalize = (str: string) => str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { company: capitalize(company), role: capitalize(role) };
}

export function logNewMockApplication(jdText: string): string {
  const { company, role } = parseJobDescription(jdText);
  const newId = `mock-app-${Math.random().toString(36).substring(2, 15)}`;

  // Fit score logic
  let fit = 70;
  const jdLower = jdText.toLowerCase();
  if (jdLower.includes('python')) fit += 5;
  if (jdLower.includes('react')) fit += 5;
  if (jdLower.includes('django')) fit += 5;
  if (jdLower.includes('fastapi')) fit += 6;
  if (jdLower.includes('langchain')) fit += 7;
  if (fit > 98) fit = 98;

  const newApp: Application = {
    id: newId,
    company,
    role,
    status: "applied",
    fit_score: fit,
    applied_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    jd_url: `https://${company.toLowerCase().replace(/\s/g, '')}.com/careers`,
    resume_version: "v1_tailored",
    notes: "Auto-logged from Live Agent stream"
  };

  mockApplications.push(newApp);
  return newId;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: { email: string; name: string; role: string } }> {
  const res = await fetch(`${WORKER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to login');
  }
  return res.json();
}

export async function signupUser(payload: { email: string; password: string; name: string; role: string }): Promise<{ token: string; user: { email: string; name: string; role: string } }> {
  const res = await fetch(`${WORKER_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to sign up');
  }
  return res.json();
}

export async function validateSession(token: string): Promise<{ valid: boolean; user: { email: string; name: string; role: string } }> {
  const res = await fetch(`${WORKER_URL}/auth/validate?token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error('Session is invalid or expired');
  }
  return res.json();
}

export async function logoutUser(token: string): Promise<{ success: boolean }> {
  const res = await fetch(`${WORKER_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}
