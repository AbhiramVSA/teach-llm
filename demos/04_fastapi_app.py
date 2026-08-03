"""Demo 4 — serving the agent: FastAPI + streaming.

Two endpoints over the same agent:
  POST /chat         -> wait, then return the whole reply as JSON
  POST /chat/stream  -> Server-Sent Events: tokens as they are generated

Run:   python 04_fastapi_app.py
Then:  open http://127.0.0.1:8000/docs  (interactive Swagger UI)

Try streaming from another terminal:
  curl -N -X POST http://127.0.0.1:8000/chat/stream ^
       -H "Content-Type: application/json" -d "{\"message\": \"hi\"}"
"""

import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic_ai import Agent

from _model import MODEL, OFFLINE, offline_override

agent = Agent(
    MODEL,
    instructions="You are a helpful, concise assistant. Two short paragraphs max.",
)

app = FastAPI(title="Lecture agent", description="Demo 4 — an LLM agent as a service")


class ChatIn(BaseModel):
    message: str


class ChatOut(BaseModel):
    reply: str
    offline: bool


@app.post("/chat", response_model=ChatOut)
async def chat(body: ChatIn) -> ChatOut:
    """Plain request/response. Fine for short replies and machine callers."""
    with offline_override(agent, canned_text="(canned offline reply) Hello from TestModel!"):
        result = await agent.run(body.message)
    return ChatOut(reply=result.output, offline=OFFLINE)


@app.post("/chat/stream")
async def chat_stream(body: ChatIn):
    """Server-Sent Events: each new chunk of text is shipped as it's made.

    Same total generation time — but time-to-first-token is what a human
    feels, and that drops from seconds to milliseconds.
    """

    async def gen():
        with offline_override(agent, canned_text="Hello! This canned reply streams word by word, exactly like a live model would."):
            async with agent.run_stream(body.message) as run:
                async for chunk in run.stream_text(delta=True):
                    # SSE framing: "data: <payload>\n\n"
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
