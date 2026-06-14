import pytest
import asyncio
from mcp_servers.shared.self_healing import self_healing, CircuitBreaker, classify_error, FailureType, SelfHealingError

@pytest.mark.asyncio
async def test_self_healing_retry_and_recovery():
    call_count = 0
    
    @self_healing(max_retries=3, base_delay=0.01)
    async def retriable_func(fail_until: int):
        nonlocal call_count
        call_count += 1
        if call_count < fail_until:
            raise TimeoutError("Simulated network timeout")
        return {"success": True}
        
    result = await retriable_func(3)
    assert result == {"success": True}
    assert call_count == 3

@pytest.mark.asyncio
async def test_self_healing_exhaustion_fallback():
    @self_healing(max_retries=2, base_delay=0.01, fallback_value={"status": "fallback"})
    async def failing_func():
        raise ValueError("Simulated F1 hallucination error")
        
    result = await failing_func()
    assert result["self_heal_exhausted"] is True
    assert result["failure_type"] == "hallucination"
    assert result["status"] == "fallback"

@pytest.mark.asyncio
async def test_circuit_breaker_states():
    breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=0.2)
    
    async def faulty_api():
        raise ConnectionError("API is down")
        
    # Trigger threshold failures
    for _ in range(3):
        with pytest.raises(ConnectionError):
            await breaker.call(faulty_api)
            
    assert breaker.state == "OPEN"
    
    # Next call should immediately fail due to open circuit
    with pytest.raises(Exception) as exc_info:
        await breaker.call(faulty_api)
    assert "Circuit OPEN" in str(exc_info.value)
    
    # Wait for recovery timeout
    await asyncio.sleep(0.25)
    
    # Next call should test recovery (HALF_OPEN)
    # We will make it succeed this time
    async def working_api():
        return "OK"
        
    result = await breaker.call(working_api)
    assert result == "OK"
    assert breaker.state == "CLOSED"
    assert breaker.failure_count == 0
