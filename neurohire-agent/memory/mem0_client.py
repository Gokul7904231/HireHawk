import os
from typing import List, Dict, Any

class Mem0Client:
    def __init__(self):
        # Default to mock/in-memory mode if key is missing or explicitly mocked
        self.mock_mode = (
            os.getenv("MEM0_MOCK", "true").lower() == "true"
            or os.getenv("GEMINI_MOCK", "true").lower() == "true"
            or not os.getenv("MEM0_API_KEY")
        )
        if not self.mock_mode:
            try:
                from mem0 import Memory
                self.memory = Memory()
            except ImportError:
                self.memory = None
                self.mock_mode = True
        else:
            self.memory = None

    def add_memory(
        self,
        content: str,
        user_id: str,
        agent_id: str = "neurohire_agent",
        run_id: str = "default_run",
        app_id: str = "default_app"
    ) -> Dict[str, Any]:
        """
        Store a memory structured with 4-dimension scoping: user, agent, run, application ID.
        """
        if self.mock_mode:
            print(f"[Mem0 Mock] Added memory: {content} | user={user_id}, agent={agent_id}, run={run_id}, app={app_id}")
            return {"success": True, "mocked": True}
        
        metadata = {
            "agent_id": agent_id,
            "run_id": run_id,
            "app_id": app_id
        }
        self.memory.add(content, user_id=user_id, metadata=metadata)
        return {"success": True}

    def search_memories(
        self,
        query: str,
        user_id: str,
        agent_id: str = "neurohire_agent",
        run_id: str = "default_run",
        app_id: str = "default_app"
    ) -> List[Dict[str, Any]]:
        """
        Retrieve structured memories filtered by scope dimensions.
        """
        if self.mock_mode:
            print(f"[Mem0 Mock] Search query: '{query}' | user={user_id}")
            # Return default fixtures to inform LLMs
            return [
                {"memory": "Candidate prefers casual/direct outreach tone without corporate jargon."},
                {"memory": "Candidate's flagship project is Sentixcare, built with FastAPI and LangChain."}
            ]
            
        metadata = {
            "agent_id": agent_id,
            "run_id": run_id,
            "app_id": app_id
        }
        results = self.memory.search(query, user_id=user_id, metadata=metadata)
        return results or []
