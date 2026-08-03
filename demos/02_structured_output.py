"""Demo 2 — structured output: from prose to types.

The LLM's reply is validated against a Pydantic model. If validation fails,
the error goes back to the model and it retries. Downstream code gets real
types, not vibes.

Run:  python 02_structured_output.py
"""

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from _model import MODEL, banner, offline_override


class Triage(BaseModel):
    """A triaged support ticket."""

    category: str = Field(description="one of: bug, billing, feature, other")
    urgency: int = Field(ge=1, le=5, description="1 = whenever, 5 = drop everything")
    reply_draft: str = Field(description="a short, friendly first reply")


agent = Agent(
    MODEL,
    output_type=Triage,
    instructions="Triage incoming support tickets for a document-upload app.",
)

TICKET = "Ticket: 'App crashes every time I upload a PDF!! I have a demo at 3pm!'"

if __name__ == "__main__":
    banner()
    with offline_override(agent):
        result = agent.run_sync(TICKET)

    triage = result.output          # a real Triage instance
    print("ticket:  ", TICKET)
    print("category:", triage.category)
    print("urgency: ", triage.urgency, "(an int — you can sort a queue by this)")
    print("reply:   ", triage.reply_draft)
