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
    
    // Custom claims verification details matching Breathe ESG
    const claims: Claim[] = [
      {
        claim: "Built carbon emissions analysis models using Python, FastAPI, and LangChain in Sentixcare project",
        supported_by_baseline: false,
        reasoning: "Fabricated claim. The baseline Sentixcare project is focused on clinical records RAG, not carbon emissions models. Caught by claims checker and rewritten."
      },
      {
        claim: "Led the entire engineering architecture of the Breathe ESG SaaS platform",
        supported_by_baseline: false,
        reasoning: "Fabricated claim. Baseline only lists internship details and academic projects. Caught by checker."
      },
      {
        claim: "Integrated backend services using Django and React",
        supported_by_baseline: true,
        reasoning: "Supported by baseline which lists Django and React under skills and Zidio Full Stack internship."
      }
    ];

    const company_intel: CompanyIntel = {
      company_name: app.company,
      founding_year: 2020,
      hq_location: app.company === "Breathe ESG" ? "Bangalore, India" : "San Francisco, CA",
      industry: app.company === "Breathe ESG" ? "Sustainability SaaS" : "Artificial Intelligence",
      website: `https://${app.company.toLowerCase().replace(/\s/g, '')}.com`,
      recent_news: [
        {
          title: `${app.company} raises Series A to expand carbon accounting tools`,
          summary: `${app.company} secured new financing to expand enterprise scope-3 emission automation.`,
          date: "2026-03-15",
          source: "TechCrunch"
        },
        {
          title: `${app.company} launches generative AI reporting agents`,
          summary: `New tools allow users to ask conversational questions about greenhouse gas profiles.`,
          date: "2026-05-10",
          source: "ESG Today"
        }
      ],
      data_availability: "full"
    };

    const outreach_draft = {
      cold_email: {
        subject: `AI / RAG Developer projects for ${app.company}`,
        body: `Hi team,\n\nI saw ${app.company} is expanding its AI engineering and RAG automation pipelines. I recently built Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and completed a Full Stack Intern role at Zidio building React interfaces.\n\nI'd love to learn if you're open to an intern to help construct carbon ingestion parsing tools. Are you free for a 10-minute chat next week?\n\nBest,\nGokul`
      },
      cover_letter_paragraphs: [
        `Dear Hiring Manager,\n\nYour recent work automating sustainability analytics at ${app.company} caught my eye. I recently shipped Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and completed a Full Stack Intern role at Zidio building React interfaces. I believe my background in building LangChain and FastAPI microservices aligns perfectly with your goals.`,
        `During my Full Stack Internship at Zidio, I developed responsive frontend dashboards in React and connected them to Django/PostgreSQL databases. In addition, my personal project Sentixcare involved training multi-modal classifiers and building semantic routing engines in Python, giving me strong fundamentals in pipeline integration.`,
        `I would love to bring my programming skills and fast learning pace to ${app.company}. Thank you for your time, and I look forward to the opportunity to discuss my qualifications.`
      ],
      referral_message: `Hi! I saw you work at ${app.company}. I'm an AI engineer intern looking at the open developer listing. I specialize in FastAPI, LangChain, and React (check out my HuggingFace Sentixcare app!). Would you be open to forwarding my details to the recruitment lead? Thanks!`
    };

    const tailored_bullets = [
      {
        project_or_role: "Sentixcare (AI/ML Project)",
        bullet: "Developed a multi-agent RAG workflow using Python, FastAPI, and LangChain to parse and analyze clinical records stored in a Qdrant database."
      },
      {
        project_or_role: "Full Stack Intern at Zidio",
        bullet: "Built responsive frontend UI widgets in React and integrated backend services using Django and PostgreSQL, achieving 30% faster data parsing speeds."
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

export async function triggerApproveRun(run_id: string, approved: boolean): Promise<boolean> {
  if (MOCK_MODE) {
    console.log(`[Mock Approve] Run ID: ${run_id} approved: ${approved}`);
    return true;
  }

  const res = await fetch(`${FASTAPI_URL}/approve/${run_id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved })
  });
  return res.ok;
}
