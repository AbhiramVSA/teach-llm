"""Demo 3 — tools: the agent loop in nine lines.

The decorator publishes the function's signature + docstring to the model.
The model *chooses* to call it; pydantic-ai runs it, feeds the result back
as new tokens, and the model answers with real data.

Run:  python 03_tools_agent.py
"""

from pydantic_ai import Agent

from _model import MODEL, banner, offline_override

agent = Agent(
    MODEL,
    instructions=(
        "You answer weather questions. Always check the tool before answering; "
        "never guess the weather."
    ),
)


@agent.tool_plain
def get_weather(city: str) -> dict:
    """Current weather for a city (rain probability is 0..1)."""
    print(f"  [tool called: get_weather(city={city!r})]")
    # In real life: call a weather API. In a lecture: Chennai in monsoon.
    return {"city": city, "rain_probability": 0.84, "temp_c": 31}


if __name__ == "__main__":
    banner()
    with offline_override(agent):
        result = agent.run_sync("Should I carry an umbrella in Chennai today?")

    print("\nA:", result.output)

    # Show the loop that actually happened: user -> model -> tool -> model -> answer
    print("\n--- the conversation the model actually had ---")
    for message in result.all_messages():
        for part in message.parts:
            kind = type(part).__name__
            content = getattr(part, "content", None) or getattr(part, "args", "")
            print(f"  {kind}: {str(content)[:90]}")
