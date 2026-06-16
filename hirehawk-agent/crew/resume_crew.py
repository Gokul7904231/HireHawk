import os
import json
import asyncio
from crewai import Agent, Task, Crew
from mcp_clients.fixtures import MOCK_TAILOR_OUTPUT

class ResumeTailorCrew:
    def __init__(self):
        self.mock_mode = os.getenv("A2A_MOCK", "true").lower() == "true" or os.getenv("GEMINI_MOCK", "true").lower() == "true"

    async def run(self, jd_signals: dict, profile: dict) -> dict:
        if self.mock_mode:
            # Simulate processing delay
            await asyncio.sleep(0.5)
            return MOCK_TAILOR_OUTPUT

        # Live CrewAI setup
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=os.getenv("GEMINI_API_KEY", "")
            )
        except ImportError:
            llm = None  # fallback

        adjudicator = Agent(
            role="Resume Customization & Fact Adjudicator Expert",
            goal="Analyze job signals, customize experience bullets, and strictly verify candidate claims against baseline credentials.",
            backstory="You are a meticulous technical recruiter and career coach. You customize resumes to highlight relevant experience but refuse to exaggerate or lie. You double-check every claim against the candidate's actual history.",
            llm=llm,
            verbose=True,
            memory=False
        )

        tailor_task = Task(
            description=(
                "You are tailoring a candidate's resume experiences for a specific job.\n"
                "Follow these steps in order:\n"
                "1. DRAFT: Customize experience bullets matching the required skills in the job signals.\n"
                "2. CLAIMS EXTRACTION: Extract all factual claims about the candidate from your drafted bullets.\n"
                "3. ADJUDICATION: Match each claim against the candidate baseline profile (ground truth). Verify if supported.\n"
                "4. REWRITE: If any claim is unsupported, rewrite the bullets to strictly reflect baseline truth.\n\n"
                "Job Description Signals:\n{jd_signals}\n\n"
                "Candidate Baseline Profile (Ground Truth):\n{profile}"
            ),
            expected_output=(
                "A JSON object with the following schema:\n"
                "{\n"
                '  "tailored_bullets": [{"project_or_role": "Project Name", "bullet": "Tailored bullet text"}],\n'
                '  "claims": [{"claim": "Specific statement made", "supported_by_baseline": true/false, "reasoning": "Why"}],\n'
                '  "any_unsupported_claims": true/false\n'
                "}"
            ),
            agent=adjudicator
        )

        crew = Crew(
            agents=[adjudicator],
            tasks=[tailor_task],
            verbose=True
        )

        # Run the crew asynchronously from inside FastAPI async endpoint
        result = await crew.kickoff_async(inputs={
            "jd_signals": json.dumps(jd_signals),
            "profile": json.dumps(profile)
        })

        try:
            # Parse the string result into JSON dict
            return json.loads(str(result))
        except Exception:
            # Fallback if parsing fails
            return MOCK_TAILOR_OUTPUT
