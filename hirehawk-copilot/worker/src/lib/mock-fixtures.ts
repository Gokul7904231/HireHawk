import { JDSignals, TailorOutput } from "../types";

export const MOCK_JD_SIGNALS: JDSignals = {
  company_name: "Breathe ESG",
  role_title: "AI Engineer Intern",
  required_skills: ["Python", "Django", "React", "LangChain", "FastAPI"],
  nice_to_have_skills: ["PyTorch", "TensorFlow", "PostgreSQL", "Docker"],
  culture_keywords: ["sustainability", "ESG", "ownership", "fast-paced"],
  seniority: "intern",
  domain: "ai",
  remote_status: "hybrid",
  location: "Chennai, India",
  salary_range: "Rs 25,000 - Rs 35,000 / month"
};

export const MOCK_TAILOR_OUTPUT: TailorOutput = {
  tailored_bullets: [
    {
      project_or_role: "Sentixcare (AI/ML Project)",
      bullet: "Developed a multi-agent RAG workflow using Python, FastAPI, and LangChain to parse and analyze clinical records stored in a Qdrant database."
    },
    {
      project_or_role: "Full Stack Intern at Zidio",
      bullet: "Built responsive frontend UI widgets in React and integrated backend services using Django and PostgreSQL, achieving 30% faster data parsing speeds."
    }
  ],
  cover_letter_paragraphs: [
    "Dear Hiring Manager,\n\nYour recent work expanding utility emissions parsing tools at Breathe ESG caught my eye. I recently shipped Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and completed a Full Stack Intern role at Zidio building React interfaces. I believe my background in building LangChain and FastAPI microservices aligns perfectly with your goals.",
    "During my Full Stack Internship at Zidio, I developed backend APIs using Django and React dashboards, which align directly with your core stack. Additionally, in my project Sentixcare, I designed custom AI parsers utilizing Python to extract structured metrics, which directly prepares me to build your carbon ingestion pipelines.",
    "I would love the opportunity to contribute my engineering skills to Breathe ESG's sustainability mission. Thank you for your time and consideration, and I look forward to discussing how my background aligns with your engineering goals."
  ],
  cold_email: {
    subject: "AI / RAG projects for Breathe ESG",
    body: "Hi team,\n\nI saw Breathe ESG is building carbon ingestion pipelines and LLM reporting agents. I recently built Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace, and previously interned as a Django/React developer.\n\nI'd love to learn if you're open to an AI Engineer Intern to help automate utility emissions parsing. Are you free for a quick chat next week?\n\nBest,\nGokul"
  },
  referral_message: "Hi there, I noticed you work at Breathe ESG. I saw the AI Engineer Intern posting and would love to chat. I'm a Django/FastAPI developer with RAG experience (check out my Sentixcare space on HuggingFace). Would you be open to sharing my resume with the hiring manager?",
  claims: [
    {
      claim: "Built carbon emissions analysis models using Python, FastAPI, and LangChain in Sentixcare project",
      supported_by_baseline: false,
      reasoning: "Fabricated claim. The baseline Sentixcare project is focused on clinical records RAG, not carbon emissions models. Caught by claims checker and rewritten."
    },
    {
      claim: "Led the entire engineering architecture of the Breathe ESG SaaS platform",
      supported_by_baseline: false,
      reasoning: "Fabricated claim. Baseline only shows internship experience at Zidio and personal projects. The LLM successfully caught and rewrote this claim in Step 4."
    },
    {
      claim: "Integrated backend services using Django and React",
      supported_by_baseline: true,
      reasoning: "Supported by baseline which lists Django and React under technical skills and Zidio internship."
    }
  ],
  any_unsupported_claims: true
};
