"""The actual work — runs inside a Celery worker process, not the web server.

Start a worker (needs Redis running, see docker-compose.yml):
    celery -A tasks worker --loglevel=info --concurrency=2
"""

import os
import sys

from pydantic_ai import Agent

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from _model import MODEL, offline_override  # noqa: E402  (shared demo helper)

from celery_app import celery_app  # noqa: E402

agent = Agent(
    MODEL,
    instructions="Summarize documents in exactly three bullet points.",
)


@celery_app.task(bind=True, max_retries=3, retry_backoff=True)
def summarize_document(self, doc_text: str) -> str:
    """One long LLM job. Retries with exponential backoff on API failures.

    Everything slow or flaky belongs in here — never in the request handler.
    """
    try:
        with offline_override(agent, canned_text="- point one\n- point two\n- point three"):
            result = agent.run_sync(f"Summarize this document:\n\n{doc_text}")
        return result.output
    except Exception as exc:  # LLM APIs fail; that's a fact of life, so plan for it
        raise self.retry(exc=exc)
