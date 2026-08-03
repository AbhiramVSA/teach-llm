"""Demo 6 — multi-turn: the model remembers NOTHING unless you re-send it.

LLM APIs are stateless. "Conversation" = you keep the transcript and pass
it back on every call. This demo makes that visible.

Run:  python 06_conversation.py
"""

from pydantic_ai import Agent

from _model import MODEL, banner, offline_override

agent = Agent(MODEL, instructions="You are a friendly, concise assistant.")

if __name__ == "__main__":
    banner()

    with offline_override(agent, "Nice to meet you, Asha! Graph theory is a great taste."):
        r1 = agent.run_sync("Hi! I'm Asha and I love graph theory.")
    print("turn 1:", r1.output)

    # WITHOUT history: a fresh call knows nothing about Asha.
    with offline_override(agent, "I have no idea — you haven't told me anything yet!"):
        cold = agent.run_sync("What do I love?")
    print("\nturn 2 WITHOUT history:", cold.output)

    # WITH history: pass the transcript back in. THIS is all "memory" is.
    with offline_override(agent, "You told me you love graph theory!"):
        warm = agent.run_sync("What do I love?", message_history=r1.new_messages())
    print("turn 2 WITH history:   ", warm.output)

    # The context window is literally these messages, re-sent every time:
    print(f"\n(history passed on turn 2: {len(r1.new_messages())} messages — "
          "every turn re-sends the whole transcript; this is why long chats "
          "get slow, expensive, and eventually context-rotted)")
