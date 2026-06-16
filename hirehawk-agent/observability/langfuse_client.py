import os
import logging

logger = logging.getLogger("observability.langfuse")

class LangfuseTraceLogger:
    def __init__(self):
        # Default to mock if key is missing or explicitly mocked
        self.mock_mode = (
            os.getenv("LANGFUSE_MOCK", "true").lower() == "true"
            or os.getenv("GEMINI_MOCK", "true").lower() == "true"
            or not os.getenv("LANGFUSE_PUBLIC_KEY")
        )
        if not self.mock_mode:
            try:
                from langfuse import Langfuse
                self.langfuse = Langfuse()
            except ImportError:
                self.langfuse = None
                self.mock_mode = True
        else:
            self.langfuse = None

    def log_node_execution(self, run_id: str, node_name: str, inputs: dict, outputs: dict):
        if self.mock_mode:
            print(f"[Langfuse Mock] Trace: {node_name} under run_id={run_id} logged.")
            return
            
        try:
            # Log trace span using the Langfuse client
            trace = self.langfuse.trace(id=run_id, name="hirehawk_agentic_flow")
            trace.span(
                name=node_name,
                input=inputs,
                output=outputs
            )
        except Exception as e:
            logger.warning(f"Langfuse logging failed: {str(e)}")
