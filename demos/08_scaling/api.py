"""The web tier: accept the job instantly, hand back a ticket, let clients poll.

Run (needs Redis + a worker, see README):
    uvicorn api:app --port 8001
"""

from celery.result import AsyncResult
from fastapi import FastAPI
from pydantic import BaseModel

from celery_app import celery_app
from tasks import summarize_document

app = FastAPI(title="Batch summarizer")


class SubmitIn(BaseModel):
    text: str


@app.post("/summarize", status_code=202)          # 202 = "accepted, working on it"
def submit(body: SubmitIn):
    job = summarize_document.delay(body.text)     # returns in microseconds
    return {"job_id": job.id, "poll": f"/jobs/{job.id}"}


@app.get("/jobs/{job_id}")
def status(job_id: str):
    res = AsyncResult(job_id, app=celery_app)
    if res.state == "SUCCESS":
        return {"state": res.state, "result": res.result}
    return {"state": res.state}                   # PENDING / STARTED / RETRY / FAILURE
