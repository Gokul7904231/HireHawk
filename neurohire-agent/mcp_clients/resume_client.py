import os
import httpx

class ResumeClient:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("RESUME_MCP_URL", "http://localhost:8001")

    async def get_profile(self) -> dict:
        if os.getenv("MCP_MOCK", "true").lower() == "true":
            # Return a default baseline candidate profile matching Gokul
            return {
                "name": "Gokul",
                "email": "gokul32499@gmail.com",
                "github": "https://github.com/Gokul7904231",
                "portfolio": "https://gokul-portfolio.vercel.app",
                "top_projects": [
                    {
                        "name": "Sentixcare",
                        "description": "Multi-agent RAG workflow for analyzing medical records.",
                        "live_url": "https://huggingface.co/spaces/Gokul7904231/sentixcare",
                        "tags": ["FastAPI", "LangChain", "Qdrant", "Python", "RAG"]
                    }
                ],
                "top_skills": ["Python", "Django", "FastAPI", "React", "TypeScript", "LangChain"],
                "experience_summary": "AI/ML Intern at Infosys, Full Stack Intern at Zidio"
            }
            
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/profile")
            res.raise_for_status()
            return res.json()
