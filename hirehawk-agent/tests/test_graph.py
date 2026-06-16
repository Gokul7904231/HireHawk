import pytest
from graph.supervisor import app as graph_app

@pytest.mark.asyncio
async def test_full_graph_flow_and_breakpoint():
    inputs = {
        "jd_raw": "We need an AI Engineer Intern with FastAPI and React skills.",
        "jd_signals": None,
        "resume_profile": None,
        "tailored_bullets": None,
        "company_intel": None,
        "outreach_draft": None,
        "fit_score": None,
        "tracker_id": None,
        "claims_trace": None,
        "hitl_approved": False,
        "error_log": [],
        "current_phase": "start"
    }
    
    config = {"configurable": {"thread_id": "test_flow_run_1"}}
    
    # 1. Run the graph until it reaches the breakpoint before track_application
    print("\nRunning graph up to HITL breakpoint...")
    async for event in graph_app.astream(inputs, config):
        node_name = list(event.keys())[0]
        print(f"Executed node: {node_name}")
        
    # Check current state at breakpoint
    state = await graph_app.aget_state(config)
    assert state.next == ("track_application",)
    assert state.values["jd_signals"] is not None
    assert state.values["outreach_draft"] is not None
    assert state.values["tracker_id"] is None
    
    # 2. Update state to approve HITL
    print("Approving application tracking checkpoint...")
    await graph_app.aupdate_state(config, {"hitl_approved": True})
    
    # 3. Resume execution from breakpoint
    print("Resuming graph execution...")
    async for event in graph_app.astream(None, config):
        node_name = list(event.keys())[0]
        print(f"Executed node post-breakpoint: {node_name}")
        
    # Verify complete state
    final_state = await graph_app.aget_state(config)
    assert final_state.next == ()  # Graph finished
    assert final_state.values["tracker_id"] is not None
    assert final_state.values["current_phase"] == "track_application"
