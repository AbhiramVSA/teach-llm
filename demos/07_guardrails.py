"""Demo 7 — guardrails in code: validators that push back on the model.

Two layers:
  1. Pydantic field constraints (seats 1..5) — schema-level validation.
  2. An @agent.output_validator with business rules (course must exist) —
     raising ModelRetry sends the error BACK to the model, which reads it
     and corrects itself. Validation failure becomes a conversation.

Run:  python 07_guardrails.py
  - LIVE: watch the model self-correct after a ModelRetry.
  - OFFLINE: TestModel can't read errors, so the guardrail (correctly!)
    blocks it after the retry budget — you see the fail-closed path.
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent, ModelRetry, RunContext

from _model import MODEL, banner, offline_override

COURSE_CATALOG = {"MA2040", "CS2700", "EE1101", "HS1090"}


class Booking(BaseModel):
    course_id: str = Field(description="an existing course code")
    seats: int = Field(ge=1, le=5, description="tutorial seats to reserve, 1-5")


agent = Agent(
    MODEL,
    output_type=Booking,
    retries=2,
    instructions=(
        "Book tutorial seats. Valid courses: " + ", ".join(sorted(COURSE_CATALOG))
    ),
)


@agent.output_validator
def course_must_exist(ctx: RunContext, output: Booking) -> Booking:
    if output.course_id not in COURSE_CATALOG:
        print(f"  [validator rejected course_id={output.course_id!r} -> ModelRetry]")
        raise ModelRetry(
            f"course_id {output.course_id!r} does not exist. "
            f"Choose one of: {sorted(COURSE_CATALOG)}"
        )
    return output


if __name__ == "__main__":
    banner()
    try:
        with offline_override(agent):
            result = agent.run_sync(
                "Reserve three seats in the probability course for me."
            )
        booking = result.output
        print(f"booked: {booking.seats} seats in {booking.course_id} "
              "(course verified, seats range-checked — safe to hand to real code)")
    except Exception as exc:
        print(f"\nrun rejected: {type(exc).__name__}")
        print("This is the guardrail failing CLOSED: the model never produced a "
              "valid booking within the retry budget, so nothing reached your "
              "systems. (Live models read the ModelRetry message and fix "
              "themselves — TestModel can't, which is exactly the point.)")
