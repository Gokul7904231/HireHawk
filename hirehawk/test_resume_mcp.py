import sys
import os

# Add resume_mcp directory to system path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "mcp_servers", "resume_mcp"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "server": "resume-mcp"}
    print("Health check passed.")

def test_profile():
    response = client.get("/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Gokul"
    assert data["email"] == "gokul32499@gmail.com"
    print("Profile endpoint passed.")

def test_skills():
    response = client.get("/skills?category=languages")
    assert response.status_code == 200
    data = response.json()
    assert "languages" in data
    assert "Python" in data["languages"]
    print("Skills category filter endpoint passed.")

if __name__ == "__main__":
    print("Starting integration tests for resume-mcp...")
    test_health()
    test_profile()
    test_skills()
    print("All tests passed successfully!")
