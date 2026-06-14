# mcp_servers/shared/config.py
import os
from dotenv import load_dotenv

load_dotenv()

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
