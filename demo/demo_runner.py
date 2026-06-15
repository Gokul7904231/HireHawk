#!/usr/bin/env python3
"""
demo_runner.py — Run the full NeuroHire pipeline against demo sample jobs
and print the claims adjudication trace output.

Usage:
    python demo/demo_runner.py                    # runs all 3 demo jobs
    python demo/demo_runner.py --job 0            # runs job at index 0
    python demo/demo_runner.py --mock             # forces mock mode
"""
import asyncio
import json
import argparse
import sys
import os
from pathlib import Path

# Force UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent / "neurohire-agent"))
os.chdir(str(Path(__file__).parent.parent / "neurohire-agent"))

from dotenv import load_dotenv
load_dotenv()

DEMO_JOBS_PATH = Path(__file__).parent / "sample_jobs.json"

MOCK_CANDIDATE_PROFILE = {
    "name": "Gokul Balagopal",
    "email": "gokul@example.com",
    "top_skills": ["Python", "FastAPI", "React", "TypeScript", "LangGraph", "CrewAI",
                   "PostgreSQL", "Supabase", "Cloudflare Workers", "LLM APIs"],
    "experience_summary": (
        "AI Engineer and Full Stack Developer with experience building LLM-powered tools, "
        "FastAPI microservices, React dashboards, and Chrome Extensions. "
        "Contributed to open-source projects and built NeuroHire - a multi-agent job application "
        "copilot using LangGraph, Cloudflare Workers, and Model Context Protocol servers. "
        "Completed internships focused on ML pipeline development and data engineering."
    ),
    "projects": [
        {
            "name": "NeuroHire",
            "description": "Autonomous job copilot: Chrome Extension + LangGraph + 5 MCP servers + CrewAI",
            "tech": ["LangGraph", "CrewAI", "Python", "TypeScript", "Cloudflare Workers", "Supabase"]
        },
        {
            "name": "ESG Dashboard",
            "description": "FastAPI + React dashboard for ESG data extraction from sustainability reports",
            "tech": ["FastAPI", "React", "Python", "PostgreSQL"]
        }
    ],
    "education": "B.Tech Computer Science, 2025"
}

def print_separator(title: str, char: str = "=", width: int = 70):
    pad = max(0, width - len(title) - 4)
    left = pad // 2
    right = pad - left
    print(f"\n{char * left}[ {title} ]{char * right}")

def print_claims_trace(claims: list, job_title: str):
    print_separator(f"CLAIMS ADJUDICATION — {job_title}", "─")
    supported = [c for c in claims if c.get("supported_by_baseline")]
    unsupported = [c for c in claims if not c.get("supported_by_baseline")]

    print(f"  Total claims: {len(claims)} | Supported: {len(supported)} | Unsupported: {len(unsupported)}")
    print()

    for i, claim in enumerate(claims, 1):
        icon = "✅" if claim.get("supported_by_baseline") else "❌"
        print(f"  {icon} Claim {i}: {claim.get('claim', '')[:80]}")
        print(f"     Reasoning: {claim.get('reasoning', '')[:100]}")
        print()

    if unsupported:
        print(f"  ⚠️  {len(unsupported)} claim(s) were adjudicated and rewritten to baseline truth.")

async def run_pipeline_for_job(job: dict):
    from graph.supervisor import app as graph_app

    print_separator(f"JOB: {job['title']} @ {job['company']}", "═")
    print(f"  Location: {job['location']} | Mode: {job['remote_status']} | Level: {job['seniority']}")
    print(f"  Required skills: {', '.join(job['required_skills'][:5])}")

    inputs = {
        "jd_raw": job["raw_jd"],
        "jd_signals": None,
        "resume_profile": MOCK_CANDIDATE_PROFILE,
        "tailored_bullets": None,
        "company_intel": None,
        "outreach_draft": None,
        "fit_score": None,
        "tracker_id": None,
        "claims_trace": None,
        "hitl_approved": False,
        "error_log": [],
        "current_phase": "start"
    }
    config = {"configurable": {"thread_id": f"demo_{job['id']}"}}

    print(f"\n  ▶ Running graph pipeline...")
    phases_completed = []

    async for event in graph_app.astream(inputs, config):
        node_name = list(event.keys())[0]
        phases_completed.append(node_name)
        print(f"    → {node_name}")

    # Check breakpoint
    state = await graph_app.aget_state(config)
    if state.next:
        print(f"\n  ⏸  HITL BREAKPOINT: paused before '{state.next[0]}'")
        print(f"     Fit score: {state.values.get('fit_score', 'N/A')}")

        # Print claims trace
        claims = state.values.get("claims_trace") or []
        if claims:
            print_claims_trace(claims, job["title"])

        # Auto-approve for demo
        print(f"\n  ▶ Auto-approving (demo mode)...")
        await graph_app.aupdate_state(config, {"hitl_approved": True})
        async for event in graph_app.astream(None, config):
            node_name = list(event.keys())[0]
            print(f"    → {node_name} (post-approval)")

    final = await graph_app.aget_state(config)
    fv = final.values

    print(f"\n  ✅ Pipeline complete!")
    print(f"     Fit score  : {fv.get('fit_score', 'N/A')}")
    print(f"     Tracker ID : {fv.get('tracker_id', 'N/A')}")

    # Show tailored bullets snippet
    bullets = fv.get("tailored_bullets") or []
    if bullets:
        print(f"\n  📝 Sample tailored bullet:")
        b = bullets[0]
        print(f"     [{b.get('project_or_role', '')}] {b.get('bullet', '')[:120]}")

    # Show outreach snippet
    draft = fv.get("outreach_draft") or {}
    cold = draft.get("cold_email") or {}
    if cold:
        print(f"\n  📧 Cold email subject: {cold.get('subject', '')}")

    return fv

async def main():
    parser = argparse.ArgumentParser(description="NeuroHire demo pipeline runner")
    parser.add_argument("--job", type=int, default=None, help="Run specific job index (0-2)")
    parser.add_argument("--mock", action="store_true", help="Force mock mode")
    args = parser.parse_args()

    if args.mock:
        os.environ["MCP_MOCK"] = "true"
        os.environ["GEMINI_MOCK"] = "true"
        os.environ["SUPABASE_MOCK"] = "true"
        os.environ["A2A_MOCK"] = "true"

    with open(DEMO_JOBS_PATH) as f:
        jobs = json.load(f)

    if args.job is not None:
        jobs = [jobs[args.job]]

    print_separator("NEUROHIRE DEMO PIPELINE", "═", 70)
    print(f"  Running {len(jobs)} job(s) through the full agentic pipeline")
    print(f"  Mock mode: MCP={os.getenv('MCP_MOCK','?')} | Gemini={os.getenv('GEMINI_MOCK','?')}")

    results = []
    for job in jobs:
        result = await run_pipeline_for_job(job)
        results.append(result)

    print_separator("DEMO COMPLETE", "═", 70)
    print(f"  Processed {len(results)} job(s) successfully.")

if __name__ == "__main__":
    asyncio.run(main())
