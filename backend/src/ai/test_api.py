"""Tests for the /api/ai/ endpoint. The agent is mocked, so no API key or network is needed."""
from unittest.mock import Mock

import pytest
from ninja.testing import TestClient
from openai import OpenAIError

from ai import api, doclayer

client = TestClient(api.router)
logged_in = Mock(is_authenticated=True)  # a fake user that passes the auth check


@pytest.fixture
def fake_agent(monkeypatch):
    """Replace the real agent with one that records its arguments and returns a fixed answer."""
    calls = []

    def _run_agent(query, text, selection):
        calls.append({"query": query, "text": text, "selection": selection})
        return "Taxes are due in April.", ["Tax returns are due in April."]

    monkeypatch.setattr(doclayer, "run_agent", _run_agent)
    return calls


# (1) No user and no token: the request is refused before the agent runs.
def test_unauthenticated_request_is_rejected(fake_agent):
    response = client.post("/", json={"query": "hi"})
    assert response.status_code == 401
    assert fake_agent == []


# (2) A normal request returns the agent's answer and sources.
def test_valid_request_returns_message_and_sources(fake_agent):
    body = {"query": "When are taxes due?", "context": {"text": "# Tax\n\nDue in April.", "selection": "April"}}
    response = client.post("/", json=body, user=logged_in)

    assert response.status_code == 200
    assert response.json() == {
        "message": "Taxes are due in April.",
        "sources": ["Tax returns are due in April."],
    }
    assert fake_agent[0]["text"] == "# Tax\n\nDue in April."
    assert fake_agent[0]["selection"] == "April"


# (3) If OpenAI fails, the user gets a clean 502 instead of a crash.
def test_provider_failure_returns_502(monkeypatch):
    def _broken_agent(*args):
        raise OpenAIError("quota exceeded")

    monkeypatch.setattr(doclayer, "run_agent", _broken_agent)
    response = client.post("/", json={"query": "hi"}, user=logged_in)

    assert response.status_code == 502


# (4) Missing, empty, or wrongly-typed context is treated as an empty document.
@pytest.mark.parametrize("context", [None, {}, "not a dict"])
def test_missing_or_empty_context_does_not_crash(fake_agent, context):
    body = {"query": "hi"} if context is None else {"query": "hi", "context": context}
    response = client.post("/", json=body, user=logged_in)

    assert response.status_code == 200
    assert fake_agent[0]["text"] == ""
    assert fake_agent[0]["selection"] == ""


# (5) A '#' line inside a ``` code block is code, not a heading.
def test_outline_ignores_hash_lines_in_code_blocks():
    text = "# Setup\n```\n# install deps\npip install x\n```\n## Usage"
    assert doclayer.get_outline(text) == ["# Setup", "## Usage"]
