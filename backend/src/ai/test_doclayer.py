"""pytest tests for doclayer.py. The LLM and embeddings are faked, so no API key or network is needed."""
import json
from types import SimpleNamespace

import pytest

from ai import doclayer


# ---------- chunk_text ----------

def test_chunk_text_empty_and_whitespace():
    assert doclayer.chunk_text("") == []
    assert doclayer.chunk_text("  \n\n \n\n") == []


def test_chunk_text_packs_small_paragraphs_together():
    text = "one\n\ntwo\n\nthree"
    assert doclayer.chunk_text(text, max_chars=100) == ["one\n\ntwo\n\nthree"]


def test_chunk_text_splits_when_limit_exceeded():
    text = "a" * 60 + "\n\n" + "b" * 60 + "\n\n" + "c" * 60
    chunks = doclayer.chunk_text(text, max_chars=100)
    assert chunks == ["a" * 60, "b" * 60, "c" * 60]


def test_chunk_text_keeps_oversized_paragraph_whole():
    big = "x" * 500
    assert doclayer.chunk_text(big, max_chars=100) == [big]


def test_chunk_text_never_loses_content():
    text = "\n\n".join(f"para {i} " + "w" * 30 for i in range(20))
    joined = "\n\n".join(doclayer.chunk_text(text, max_chars=120))
    assert joined == text


# ---------- cosine ----------

def test_cosine_identical_orthogonal_opposite():
    assert doclayer.cosine([1, 0], [1, 0]) == pytest.approx(1.0)
    assert doclayer.cosine([1, 0], [0, 1]) == pytest.approx(0.0)
    assert doclayer.cosine([1, 0], [-1, 0]) == pytest.approx(-1.0)


def test_cosine_zero_vector_returns_zero():
    assert doclayer.cosine([0, 0], [1, 2]) == 0.0


# ---------- get_outline ----------

def test_get_outline_returns_headings_in_order():
    text = "# Title\nintro\n## Part A\nbody\n   ### Indented\nnot a heading"
    assert doclayer.get_outline(text) == ["# Title", "## Part A", "### Indented"]


def test_get_outline_no_headings():
    assert doclayer.get_outline("just text\nmore text") == []


# ---------- search_document (fake embeddings) ----------

@pytest.fixture
def fake_embed(monkeypatch):
    """Embed by keyword: dimension 0 = 'cat', dimension 1 = 'tax'."""
    def _embed(texts):
        return [[float("cat" in t.lower()), float("tax" in t.lower())] for t in texts]

    monkeypatch.setattr(doclayer, "embed", _embed)


def _long(sentence):
    """Pad a paragraph so it is too big to be packed with its neighbours (limit is 800 chars)."""
    return sentence + " " + "filler " * 80


def test_search_document_ranks_relevant_chunk_first(fake_embed):
    cats, tax, weather = _long("Cats are small animals."), _long("Tax returns are due in April."), _long("The weather is mild.")
    text = "\n\n".join([cats, tax, weather])
    hits = doclayer.search_document(text, "tell me about tax", k=1)
    assert hits == [tax.strip()]


def test_search_document_empty_text(fake_embed):
    assert doclayer.search_document("", "anything") == []


# ---------- embed cache ----------

def test_embed_caches_and_only_requests_missing(monkeypatch):
    calls = []

    class FakeEmbeddings:
        def create(self, model, input):
            calls.append(list(input))
            return SimpleNamespace(data=[SimpleNamespace(embedding=[float(len(t))]) for t in input])

    monkeypatch.setattr(doclayer, "get_client", lambda: SimpleNamespace(embeddings=FakeEmbeddings()))
    doclayer._embedding_cache.clear()

    assert doclayer.embed(["aa", "bbb"]) == [[2.0], [3.0]]
    assert doclayer.embed(["aa", "bbb", "c"]) == [[2.0], [3.0], [1.0]]
    assert calls == [["aa", "bbb"], ["c"]]  # second call sent only the new text


# ---------- run_agent (fake chat client) ----------

def _tool_call(name, arguments, call_id="call_1"):
    return SimpleNamespace(id=call_id, function=SimpleNamespace(name=name, arguments=arguments))


def _reply(content=None, tool_calls=None):
    msg = SimpleNamespace(content=content, tool_calls=tool_calls)
    return SimpleNamespace(choices=[SimpleNamespace(message=msg)])


class FakeChat:
    """Returns scripted replies in order and records every request."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.requests = []
        self.completions = self

    @property
    def chat(self):
        return self

    def create(self, **kwargs):
        self.requests.append(kwargs)
        return self.replies.pop(0)


def _use_client(monkeypatch, client):
    monkeypatch.setattr(doclayer, "get_client", lambda: client)


def test_agent_answers_directly_without_tools(monkeypatch):
    client = FakeChat([_reply(content="Hello!")])
    _use_client(monkeypatch, client)
    assert doclayer.run_agent("hi", "doc text") == ("Hello!", [])


def test_agent_uses_tool_then_answers_and_reports_sources(monkeypatch, fake_embed):
    client = FakeChat([
        _reply(tool_calls=[_tool_call("search_document", json.dumps({"query": "tax"}))]),
        _reply(content="Taxes are due in April."),
    ])
    _use_client(monkeypatch, client)
    tax = _long("Tax returns are due in April.")
    text = _long("Cats are small.") + "\n\n" + tax

    answer, sources = doclayer.run_agent("when are taxes due?", text)

    assert answer == "Taxes are due in April."
    assert tax.strip() in sources
    # tool result was sent back to the model
    tool_msgs = [m for m in client.requests[1]["messages"] if isinstance(m, dict) and m["role"] == "tool"]
    assert len(tool_msgs) == 1 and tool_msgs[0]["tool_call_id"] == "call_1"


def test_agent_survives_malformed_tool_arguments(monkeypatch, fake_embed):
    client = FakeChat([
        _reply(tool_calls=[_tool_call("get_outline", "{not json")]),
        _reply(content="done"),
    ])
    _use_client(monkeypatch, client)
    assert doclayer.run_agent("outline?", "# A\ntext")[0] == "done"


def test_agent_unknown_tool_returns_error_not_crash(monkeypatch):
    client = FakeChat([
        _reply(tool_calls=[_tool_call("delete_everything", "{}")]),
        _reply(content="ok"),
    ])
    _use_client(monkeypatch, client)
    assert doclayer.run_agent("x", "doc")[0] == "ok"
    tool_msg = [m for m in client.requests[1]["messages"] if isinstance(m, dict) and m["role"] == "tool"][0]
    assert "unknown tool" in tool_msg["content"]


def test_agent_stops_after_max_steps_and_forces_final_answer(monkeypatch):
    looping = [_reply(tool_calls=[_tool_call("get_outline", "{}")]) for _ in range(doclayer.MAX_TOOL_STEPS)]
    client = FakeChat(looping + [_reply(content="final answer")])
    _use_client(monkeypatch, client)

    answer, _ = doclayer.run_agent("loop forever", "# H")

    assert answer == "final answer"
    assert len(client.requests) == doclayer.MAX_TOOL_STEPS + 1
    assert "tools" not in client.requests[-1]  # last call has tools disabled


def test_agent_includes_selection_in_user_message(monkeypatch):
    client = FakeChat([_reply(content="ok")])
    _use_client(monkeypatch, client)
    doclayer.run_agent("rewrite this", "doc", selection="highlighted words")
    user_msg = client.requests[0]["messages"][1]["content"]
    assert "highlighted words" in user_msg and "<selection>" in user_msg


def test_system_prompt_marks_document_as_untrusted():
    assert "untrusted" in doclayer.SYSTEM_PROMPT
