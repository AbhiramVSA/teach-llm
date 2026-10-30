# teach-llm

An interactive lecture deck and Python demos that introduce large language models, Pydantic AI, and FastAPI.

## Start with the deck

Clone the repository, then open `presentation/index.html` in a browser. The deck uses local HTML, CSS, and JavaScript files and has no build step. It covers model basics, agent patterns, APIs, and production topics.

```sh
git clone https://github.com/AbhiramVSA/teach-llm.git
cd teach-llm
```

Use the arrow keys, Space, or Page Up and Page Down to move between slides. Press `M` to open the section menu, `N` to open speaker notes, or `F` to enter full screen.

## Run the Python demos

The eight demos show agents, structured output, tools, FastAPI, dependency injection, conversation history, output validation, and a Celery queue walkthrough. See [`demos/README.md`](demos/README.md) for the full setup, run order, and queue instructions.

To run the first demo:

```sh
cd demos
python -m venv .venv
```

Activate the environment.

```sh
# macOS or Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

Install the packages and run the first demo:

```sh
python -m pip install -r requirements.txt
python 01_hello_agent.py
```

The demos use Pydantic AI's `TestModel` when `OPENAI_API_KEY` is unset or `OFFLINE=1`. Set an API key to use the live model. The deck does not need an API key.

## Contents

| Path | Purpose |
|---|---|
| `presentation/` | Interactive, browser-based lecture deck |
| `demos/` | Runnable Python examples and setup guide |
| `speaker-notes.md` | Lecture script |
| `qa-prep.md` | Questions and answers for lecture prep |
| `docs/` | Lecture design notes |

The root `index.html` redirects hosted requests to `/presentation/`. For local use, open `presentation/index.html` directly.
