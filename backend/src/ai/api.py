"""
/api/ai/ router. Replaces the echo placeholder in backend/src/ai/api.py.
Logic lives in doclayer.py (see tests in test_doclayer.py).
"""
import logging
from typing import Any, Optional

from ninja import Router, Schema
from ninja.errors import HttpError
from openai import OpenAIError

from helpers.api.auth.permissions import user_required

from . import doclayer

router = Router(auth=user_required)
log = logging.getLogger(__name__)

MAX_DOC_CHARS = 200_000  # guard against huge payloads
MAX_SELECTION_CHARS = 5_000


class AIPayload(Schema):
    query: str
    # Expected: {"text": "<document text>", "selection": "<optional highlighted text>"}
    context: Optional[Any] = None


class AIResponse(Schema):
    message: str
    sources: list[str] = []


# /api/ai/
@router.post("/", response=AIResponse)
def ai_view(request, payload: AIPayload):
    ctx = payload.context if isinstance(payload.context, dict) else {}
    text = str(ctx.get("text", ""))[:MAX_DOC_CHARS]
    selection = str(ctx.get("selection", ""))[:MAX_SELECTION_CHARS]

    try:
        message, sources = doclayer.run_agent(payload.query, text, selection)
    except OpenAIError:
        log.exception("LLM call failed")
        raise HttpError(502, "AI service is unavailable, try again.")
    return {"message": message, "sources": sources}
