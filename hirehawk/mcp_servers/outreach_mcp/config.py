import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env file
load_dotenv()

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODELS_ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.inference.ai.azure.com")
GITHUB_MODEL_NAME = os.getenv("GITHUB_MODEL_NAME", "gpt-4o")
TRACKER_MCP_URL = os.getenv("TRACKER_MCP_URL", "http://localhost:8003")
PORT = int(os.getenv("PORT", "8005"))

VOICE_SAMPLE = (
    "Writing voice: Direct, casual but professional. No corporate fluff. No \"I am writing to express my interest.\"\n"
    "Opens with a hook related to the company's actual work. References specific projects (Sentixcare, CineRAG)\n"
    "by their impact, not just their name. Keeps cold emails under 150 words. Referral messages under 80 words.\n"
    "Uses first person naturally. No excessive adjectives. Ends with a specific ask, not vague \"hope to hear.\"\n"
    "Example opener: \"Your work on [specific ESG metric] caught my eye — I just shipped a Django + React\n"
    "emissions tracker (carbon-ingest.onrender.com) for a similar use case.\"\n"
    "NO FABRICATION: Never claim experience that is not in the profile from resume-mcp."
)

if MOCK_MODE:
    logger.info("Running outreach-mcp in MOCK_MODE. Bypassing external LLM calls to local templates.")
else:
    if not GITHUB_TOKEN:
        logger.warning("GITHUB_TOKEN is missing. LLM outreach generation will fail.")
