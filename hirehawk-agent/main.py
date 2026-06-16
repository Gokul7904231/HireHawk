import uvicorn
import os
import sys
from dotenv import load_dotenv

load_dotenv()

def main():
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    print(f"Starting HireHawk Agentic Server on http://{host}:{port}...")
    uvicorn.run("api.server:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    main()
