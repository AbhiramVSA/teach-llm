"""Demo 5 — the queue: Celery wired to Redis.

Walkthrough code for the lecture (we don't run this live). The whole idea:

  client -> FastAPI -> Redis (broker) -> Celery worker -> Redis (results)
                 ^                                              |
                 +--------------- client polls -----------------+

Redis plays two roles here: the *broker* holds jobs waiting for a worker,
the *result backend* holds finished answers waiting for a poll.
"""

from celery import Celery

celery_app = Celery(
    "lecture",
    broker="redis://localhost:6379/0",    # jobs wait here
    backend="redis://localhost:6379/1",   # results wait here
)

celery_app.conf.update(
    task_acks_late=True,          # a job survives a worker crash mid-run
    worker_prefetch_multiplier=1, # LLM jobs are slow — don't hoard them
    task_time_limit=600,          # no zombie jobs
)
