import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env file
load_dotenv()

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODELS_ENDPOINT = os.getenv("GITHUB_MODELS_ENDPOINT", "https://models.inference.ai.azure.com")
GITHUB_MODEL_NAME = os.getenv("GITHUB_MODEL_NAME", "gpt-4o")
PORT = int(os.getenv("PORT", "8002"))

if not FIRECRAWL_API_KEY:
    logger.warning("FIRECRAWL_API_KEY is missing. Scraping URLs will fail.")

if not GITHUB_TOKEN:
    logger.warning("GITHUB_TOKEN is missing. LLM calls to GitHub Models will fail.")
