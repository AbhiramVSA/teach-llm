# Lecture demos — Pydantic AI + FastAPI

Every demo runs in two modes, **automatically**:

- **LIVE** — if `OPENAI_API_KEY` is set: real calls to `openai:gpt-5.2`.
- **OFFLINE** — no key (or `OFFLINE=1`): pydantic-ai's `TestModel` answers with
  canned output. Tools still get called, schemas still validate, streaming
  still streams. If the venue wifi dies mid-lecture, nothing breaks.

That switch (`_model.py`, ~20 lines) is itself a lecture point: agent code
shouldn't care which model is behind it.

## Setup

```powershell
cd teach-llm\demos
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# live mode (optional):
$env:OPENAI_API_KEY = "sk-..."
# force offline even with a key:
$env:OFFLINE = "1"
```

## The demos, in lecture order

| # | file | run | shows |
|---|------|-----|-------|
| 1 | `01_hello_agent.py` | `python 01_hello_agent.py` | smallest agent; `instructions`; token usage |
| 2 | `02_structured_output.py` | `python 02_structured_output.py` | `output_type=` → validated Pydantic object, retry-on-invalid |
| 3 | `03_tools_agent.py` | `python 03_tools_agent.py` | `@agent.tool_plain`; prints the actual message loop |
| 4 | `04_fastapi_app.py` | `python 04_fastapi_app.py` → open <http://127.0.0.1:8000/docs> | agent as a service; SSE streaming endpoint |
| 5 | `05_deps_injection.py` | `python 05_deps_injection.py` | `deps_type` + `RunContext`: typed per-run context (user, DB) into tools |
| 6 | `06_conversation.py` | `python 06_conversation.py` | statelessness made visible; `message_history=r.new_messages()` |
| 7 | `07_guardrails.py` | `python 07_guardrails.py` | `@agent.output_validator` + `ModelRetry`; fail-closed on bad output |
| 8 | `08_scaling/` | read-through (optionally runnable) | Celery + Redis job queue: submit → 202 → poll |

All idioms validated against pydantic.dev/docs/ai (v2.22) and every script
run to green on 2026-08-01 — offline mode. `07_guardrails.py` *intentionally*
ends in a rejected run when offline: TestModel can't read ModelRetry
feedback, so you see the fail-closed path; live mode shows self-correction.

### Streaming demo (4) from a second terminal

```powershell
curl.exe -N -X POST http://127.0.0.1:8000/chat/stream `
  -H "Content-Type: application/json" -d '{\"message\": \"say hi in 30 words\"}'
```

Watch the `data:` lines arrive one chunk at a time.

### The scaling walkthrough (5)

Not run live in the lecture — walk the three files in this order:
`celery_app.py` (broker + backend) → `tasks.py` (the slow work, with retries)
→ `api.py` (202 + job_id + polling). To actually run it you need Docker:

```powershell
cd 08_scaling
docker compose up -d          # Redis
celery -A tasks worker --loglevel=info --concurrency=2
uvicorn api:app --port 8001   # in another terminal
```

## Troubleshooting

- `ModuleNotFoundError: _model` — run scripts from inside `demos/`.
- Port 8000 busy — `python 04_fastapi_app.py` again after killing the old one,
  or edit the port at the bottom of the file.
- Live mode errors mid-lecture — `$env:OFFLINE = "1"` and rerun; same code path.
- Offline streaming arrives as one chunk (TestModel doesn't split its canned
  text) — live mode streams token by token. Demo the race animation in the
  deck if you're offline.
