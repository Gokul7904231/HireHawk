import os
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env file if it exists
load_dotenv()

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
PORT = int(os.getenv("PORT", "8003"))

supabase = None

if MOCK_MODE:
    logger.info("Running tracker-mcp in MOCK_MODE. Supabase calls will bypass to mock_db.")
else:
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.warning("SUPABASE_URL or SUPABASE_KEY is missing. Falling back to mock_db.")
        MOCK_MODE = True
    else:
        try:
            from supabase import create_client
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}. Falling back to mock_db.")
            MOCK_MODE = True
