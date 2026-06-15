from mcp_clients.jd_parser_client import JDParserClient
from mcp_clients.resume_client import ResumeClient
from graph.state import NeuroHireState

async def parse_jd_node(state: NeuroHireState) -> dict:
    parser = JDParserClient()
    resume_cli = ResumeClient()
    
    jd_signals = await parser.parse_jd_text(state.get("jd_raw", ""))
    resume_profile = await resume_cli.get_profile()
    
    return {
        "jd_signals": jd_signals,
        "resume_profile": resume_profile
    }
