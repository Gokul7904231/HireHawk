import asyncio
import inspect
import logging
import traceback
from enum import Enum
from typing import Any, Callable, Optional
from functools import wraps

logger = logging.getLogger("neurohire.self_healing")

class FailureType(Enum):
    F1_HALLUCINATION = "hallucination"
    F2_EXECUTION = "execution_error"
    F3_REASONING = "reasoning_inconsistency"

class SelfHealingError(Exception):
    def __init__(self, failure_type: FailureType, original_error: Exception, attempts: int):
        self.failure_type = failure_type
        self.original_error = original_error
        self.attempts = attempts
        super().__init__(f"{failure_type.value} after {attempts} attempts: {original_error}")

def classify_error(error: Exception) -> FailureType:
    """Classify exception into F1/F2/F3 taxonomy."""
    error_str = str(error).lower()
    
    # F2: Execution errors — deterministic, retriable
    if any(k in error_str for k in [
        "timeout", "connection", "rate limit", "429", "503",
        "json", "schema", "validation", "typeerror", "keyerror",
        "attributeerror", "404", "500"
    ]):
        return FailureType.F2_EXECUTION
    
    # F1: Hallucination signals — LLM output validation failures
    if any(k in error_str for k in [
        "fabricat", "hallucin", "not found in profile",
        "invalid url", "no such project", "pydantic"
    ]):
        return FailureType.F1_HALLUCINATION
    
    # F3: Default for reasoning/logic failures
    return FailureType.F3_REASONING

def self_healing(
    max_retries: int = 3,
    base_delay: float = 1.0,
    fallback_value: Optional[Any] = None
):
    """
    Decorator for MCP tool functions.
    Catches exceptions, classifies them, applies appropriate recovery,
    and retries with exponential backoff.
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            corrective_context = None
            
            for attempt in range(1, max_retries + 1):
                try:
                    # On retry attempts, inject corrective context if available
                    if corrective_context:
                        sig = inspect.signature(func)
                        if "_corrective_context" in sig.parameters or any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values()):
                            kwargs["_corrective_context"] = corrective_context
                    
                    result = await func(*args, **kwargs)
                    
                    if attempt > 1:
                        logger.info(
                            f"[SELF-HEAL] {func.__name__} recovered on attempt {attempt}"
                        )
                    return result
                    
                except Exception as e:
                    last_error = e
                    failure_type = classify_error(e)
                    stack_trace = traceback.format_exc()
                    
                    logger.warning(
                        f"[SELF-HEAL] {func.__name__} | attempt {attempt}/{max_retries} | "
                        f"{failure_type.value} | {type(e).__name__}: {e}"
                    )
                    
                    # Build corrective context for next attempt (F1 + F2)
                    corrective_context = (
                        f"PREVIOUS ATTEMPT FAILED ({failure_type.value}):\n"
                        f"Error: {type(e).__name__}: {str(e)}\n"
                        f"Stack trace:\n{stack_trace}\n"
                        f"Fix the above error in your next response. "
                        f"Do not repeat the same mistake."
                    )
                    
                    if attempt < max_retries:
                        # Exponential backoff: 1s, 2s, 4s
                        delay = base_delay * (2 ** (attempt - 1))
                        
                        # For rate limits (F2), wait longer
                        if "429" in str(e) or "rate limit" in str(e).lower():
                            delay = max(delay, 10.0)
                        
                        logger.info(f"[SELF-HEAL] Retrying in {delay}s...")
                        await asyncio.sleep(delay)
                    else:
                        # All retries exhausted
                        logger.error(
                            f"[SELF-HEAL] {func.__name__} failed after {max_retries} attempts. "
                            f"Final failure: {failure_type.value}"
                        )
                        
                        if fallback_value is not None:
                            logger.info(f"[SELF-HEAL] Returning fallback value for {func.__name__}")
                            if isinstance(fallback_value, dict):
                                return {
                                    **fallback_value,
                                    "self_heal_exhausted": True,
                                    "failure_type": failure_type.value,
                                    "error": str(last_error)
                                }
                            return fallback_value
                        
                        raise SelfHealingError(failure_type, last_error, max_retries)
        
        return wrapper
    return decorator


class CircuitBreaker:
    """
    Circuit breaker for external API calls (Firecrawl, GitHub Models).
    Prevents cascading failures when an external service is down.
    States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)
    """
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"
    
    async def call(self, func: Callable, *args, **kwargs):
        import time
        
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("[CIRCUIT] Half-open — testing recovery")
            else:
                raise Exception(f"Circuit OPEN — service unavailable. Retry in {self.recovery_timeout}s")
        
        try:
            result = await func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                logger.info("[CIRCUIT] Closed — service recovered")
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"[CIRCUIT] OPEN — {self.failure_count} failures. Blocking calls for {self.recovery_timeout}s")
            raise
