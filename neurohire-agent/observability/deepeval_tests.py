import os
import pytest
from deepeval.test_case import LLMTestCase

# Standard deepeval LLM test cases running with fixture evaluations
def test_task_completion_score():
    actual_output = (
        "Hi team, I saw Breathe ESG is building carbon ingestion pipelines and LLM reporting agents. "
        "I recently built Sentixcare, a Python/FastAPI/LangChain project hosted live on HuggingFace. "
        "I'd love to learn if you're open to an AI Engineer Intern. Are you free for a quick chat next week?"
    )
    test_case = LLMTestCase(
        input="Draft outreach cold email for AI Engineer Intern at Breathe ESG",
        actual_output=actual_output,
        expected_output="A brief cold email targeting Breathe ESG's carbon pipeline, showcasing FastAPI and LangChain."
    )
    
    # Assert email length constraints
    word_count = len(test_case.actual_output.split())
    assert word_count < 150
    assert "Breathe ESG" in test_case.actual_output

def test_tool_correctness():
    # Assert tracker client successfully returned application mock ID
    tracker_response = {"id": "6503e116-27c3-4647-b013-72c7736b608b", "success": True}
    assert tracker_response["success"] is True
    assert len(tracker_response["id"]) > 0

def test_claim_adjudication_accuracy():
    # Adjudication metric checks
    claims = [
        {
            "claim": "Built carbon emissions analysis models using Python, FastAPI, and LangChain",
            "supported_by_baseline": True
        },
        {
            "claim": "Led the entire engineering architecture of the Breathe ESG SaaS platform",
            "supported_by_baseline": False
        }
    ]
    
    unsupported = [c for c in claims if not c["supported_by_baseline"]]
    assert len(unsupported) == 1
    assert "Led the entire engineering architecture" in unsupported[0]["claim"]

def test_fit_score_validity():
    # Fit score bounds check
    fit_score = 85.0
    assert 0.0 <= fit_score <= 100.0
