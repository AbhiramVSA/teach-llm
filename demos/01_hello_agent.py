"""Demo 1 — the smallest possible agent.

Run:  python 01_hello_agent.py        (from the demos/ folder)
Live: set OPENAI_API_KEY first. Without it, runs offline on TestModel.
"""

from pydantic_ai import Agent

from _model import MODEL, banner, offline_override

agent = Agent(
    MODEL,
    instructions=(
        "You are a concise teaching assistant for a class of engineering "
        "students. Answer in at most two sentences."
    ),
)

if __name__ == "__main__":
    banner()
    with offline_override(
        agent,
        "Tokenization chops text into frequent sub-word chunks so the model "
        "can turn language into numbers it can predict.",
    ):
        result = agent.run_sync("Explain tokenization in one sentence.")

    print("Q: Explain tokenization in one sentence.")
    print("A:", result.output)

    # Talking point: result also carries usage — tokens are money.
    usage = result.usage
    print(f"\n(usage: {usage.input_tokens} tokens in, {usage.output_tokens} out)")
