import sys
import os

# Ensure the project root is on sys.path so "graph", "api", etc. resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

# Force mock mode during ALL tests — override whatever .env says.
# The test suite must never call real APIs or require live credentials.
_MOCK_VARS = {
    "MCP_MOCK": "true",
    "GEMINI_MOCK": "true",
    "SUPABASE_MOCK": "true",
    "A2A_MOCK": "true",
    "MEM0_MOCK": "true",
    "GEMINI_API_KEY": "ci-mock-key",
    "SUPABASE_URL": "https://mock.supabase.co",
    "SUPABASE_KEY": "ci-mock-key",
    "LANGFUSE_PUBLIC_KEY": "pk-mock",
    "LANGFUSE_SECRET_KEY": "sk-mock",
    "MEM0_API_KEY": "m0-mock",
}

for key, value in _MOCK_VARS.items():
    os.environ[key] = value
