from fastapi import FastAPI
import uvicorn
import os
from dotenv import load_dotenv
from crew.resume_crew import ResumeTailorCrew

load_dotenv()

app = FastAPI(title="CrewAI A2A Resume Tailor Server", version="1.0.0")

@app.post("/tailor")
async def tailor_endpoint(payload: dict):
    jd_signals = payload.get("jd_signals") or {}
    profile = payload.get("profile") or {}
    
    crew = ResumeTailorCrew()
    result = await crew.run(jd_signals, profile)
    return result

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "neurohire-crew",
        "version": "1.0.0",
        "a2a_mock": os.getenv("A2A_MOCK", "true")
    }

if __name__ == "__main__":
    crew_port = int(os.getenv("CREW_PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting CrewAI A2A Server on http://{host}:{crew_port}...")
    uvicorn.run(app, host=host, port=crew_port)
