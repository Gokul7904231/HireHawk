import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env file
load_dotenv()

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODELS_ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.inference.ai.azure.com")
GITHUB_MODEL_NAME = os.getenv("GITHUB_MODEL_NAME", "gpt-4o")
PORT = int(os.getenv("PORT", "8004"))
UPSTASH_REDIS_URL = os.getenv("UPSTASH_REDIS_URL", "")

if MOCK_MODE:
    logger.info("Running company-intel-mcp in MOCK_MODE. External APIs bypassed.")
else:
    if not FIRECRAWL_API_KEY:
        logger.warning("FIRECRAWL_API_KEY is missing. Web search will fail.")
    if not GITHUB_TOKEN:
        logger.warning("GITHUB_TOKEN is missing. LLM extractions will fail.")
