"""Shared model selection for all demos.

If OPENAI_API_KEY is set  -> real model ("openai:gpt-5.2").
If it isn't (or OFFLINE=1) -> pydantic-ai's TestModel: no network, no cost,
tools still get called, schemas still validated. The lecture point: your
agent code should not care which one it's running against.
"""

import os
from contextlib import nullcontext

OFFLINE = bool(os.getenv("OFFLINE")) or not os.getenv("OPENAI_API_KEY")

# Agent("openai:...") builds the provider immediately and demands a key, so
# offline mode must pick the built-in test model *here*, not later.
MODEL = "test" if OFFLINE else os.getenv("DEMO_MODEL", "openai:gpt-5.2")


def offline_override(agent, canned_text: str | None = None):
    """Context manager: swaps in TestModel when we have no API key.

    Usage:
        with offline_override(agent, "canned reply"):
            result = agent.run_sync("...")
    """
    if not OFFLINE:
        return nullcontext()

    from pydantic_ai import models
    from pydantic_ai.models.test import TestModel

    models.ALLOW_MODEL_REQUESTS = False  # hard guarantee: no accidental spend
    test_model = TestModel(custom_output_text=canned_text) if canned_text else TestModel()
    return agent.override(model=test_model)


def banner():
    mode = "OFFLINE (TestModel — canned output)" if OFFLINE else f"LIVE ({MODEL})"
    print(f"--- running {mode} ---\n")
