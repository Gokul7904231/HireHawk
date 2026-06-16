import subprocess
import time
import httpx
import sys
import os

def check_health(port):
    try:
        r = httpx.get(f"http://localhost:{port}/health", timeout=1.0)
        return r.status_code == 200 and r.json().get("status") == "ok"
    except Exception:
        return False

def main():
    print("Starting integration test. Launching 5 servers programmatically...")
    
    # Paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    mcp_dir = os.path.join(base_dir, "mcp_servers")
    
    env = os.environ.copy()
    env["MOCK_MODE"] = "true"
    env["PYTHONPATH"] = base_dir + os.pathsep + env.get("PYTHONPATH", "")
    
    # Launch subprocesses
    processes = []
    servers = [
        ("resume-mcp", 8001, "resume_mcp"),
        ("jd-parser-mcp", 8002, "jd_parser_mcp"),
        ("tracker-mcp", 8003, "tracker_mcp"),
        ("company-intel-mcp", 8004, "company_intel_mcp"),
        ("outreach-mcp", 8005, "outreach_mcp"),
    ]
    
    try:
        for name, port, folder in servers:
            cmd = [sys.executable, "-m", "uvicorn", "main:app", "--port", str(port)]
            cwd = os.path.join(mcp_dir, folder)
            print(f"Launching {name} on port {port} in {cwd}...")
            # Use shell=False, and stdout/stderr to devnull to avoid cluttering or blocking
            proc = subprocess.Popen(
                cmd, cwd=cwd, env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            processes.append(proc)
            
        print("Waiting for servers to initialize...")
        start_time = time.time()
        while time.time() - start_time < 15.0:
            if all(check_health(port) for _, port, _ in servers):
                print("All servers are healthy and ready!")
                break
            time.sleep(0.5)
        else:
            print("Timeout waiting for servers to start.")
            for _, port, _ in servers:
                print(f"Port {port} status: {'healthy' if check_health(port) else 'offline'}")
            raise RuntimeError("One or more servers failed to start.")
            
        # Running E2E Integration Pipeline
        print("\n=== STARTING E2E INTEGRATION PIPELINE ===")
        
        # Step 1: GET resume-mcp/profile
        print("\nStep 1: Fetching candidate profile...")
        r = httpx.get("http://localhost:8001/profile")
        assert r.status_code == 200
        profile = r.json()
        print(f"Candidate Profile: {profile['name']} <{profile['email']}>")
        
        # Step 2: POST jd-parser-mcp/parse_jd_url
        print("\nStep 2: Parsing Job Description URL...")
        r = httpx.post("http://localhost:8002/parse_jd_url", json={"url": "https://example.com/ai-intern-jd"})
        assert r.status_code == 200
        jd_signals = r.json()
        print(f"JD Signals: {jd_signals['company_name']} - {jd_signals['role_title']} (Domain: {jd_signals['domain']})")
        
        # Step 3: POST company-intel-mcp/get_company_intel
        print("\nStep 3: Fetching Company Intelligence...")
        r = httpx.post("http://localhost:8004/get_company_intel", json={"company_name": "Breathe ESG"})
        assert r.status_code == 200
        company_intel = r.json()
        print(f"Company Intel: {company_intel['company_name']} - Funding: {company_intel['funding_stage']}")
        
        # Format profile matching ProfileInput model for outreach
        profile_input = {
            "name": profile["name"],
            "email": profile["email"],
            "github": profile["github"],
            "portfolio": profile["portfolio"],
            "top_projects": [
                {"name": "Sentixcare", "live_url": "huggingface.co/spaces/Gokul7904231/sentixcare"}
            ],
            "top_skills": ["Python", "Django", "React", "LangChain"],
            "experience_summary": "AI/ML Intern at Infosys, Full Stack Intern at Zidio"
        }
        
        # Step 4: POST outreach-mcp/generate_cold_email
        print("\nStep 4: Generating Tailored Cold Email...")
        payload = {
            "jd_signals": jd_signals,
            "company_intel": company_intel,
            "profile": profile_input
        }
        r = httpx.post("http://localhost:8005/generate_cold_email", json=payload)
        assert r.status_code == 200
        cold_email = r.json()
        print(f"Cold Email Generated (Subject: {cold_email['subject']})")
        print(f"Word Count: {cold_email['word_count']} (Limit < 150)")
        assert cold_email["word_count"] < 150
        
        # Step 5: POST tracker-mcp/add_application
        print("\nStep 5: Logging Application to Tracker...")
        payload_app = {
            "company": jd_signals["company_name"],
            "role": jd_signals["role_title"],
            "fit_score": 0.95,
            "resume_version": "v1.0"
        }
        r = httpx.post("http://localhost:8003/add_application", json=payload_app)
        assert r.status_code == 200
        app_res = r.json()
        app_id = app_res["id"]
        print(f"Logged Application. ID: {app_id}")
        
        # Step 6: POST outreach-mcp/save_draft
        print("\nStep 6: Saving Cold Email Draft Linked to Application...")
        payload_draft = {
            "app_id": app_id,
            "draft_type": "cold_email",
            "content": cold_email["body"]
        }
        r = httpx.post("http://localhost:8005/save_draft", json=payload_draft)
        assert r.status_code == 200
        draft_res = r.json()
        print(f"Saved Draft. Success: {draft_res['success']}")
        
        # Step 7: GET tracker-mcp/applications
        print("\nStep 7: Verifying Draft Logged in Tracker DB...")
        r = httpx.get("http://localhost:8003/applications")
        assert r.status_code == 200
        applications = r.json()
        found = [a for a in applications if a["id"] == app_id]
        assert len(found) == 1
        print(f"Verified! Application in DB: {found[0]['company']} - {found[0]['role']} (Status: {found[0]['status']})")
        
        print("\n=== ALL E2E PIPELINE STEPS PASSED SUCCESSFULLY ===")
        
    finally:
        print("\nTearing down servers...")
        for proc in processes:
            try:
                proc.terminate()
                proc.wait(timeout=2.0)
            except Exception as e:
                print(f"Error stopping process: {e}")
        print("Tear down complete.")

if __name__ == "__main__":
    main()
