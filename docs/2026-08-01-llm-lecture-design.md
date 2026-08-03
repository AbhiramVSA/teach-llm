# Design: Half-Day LLM Lecture Kit (`teach-llm`)

**Date:** 2026-08-01 · **Status:** Approved (interactive session)

## Goal

A half-day, discussion-based lecture introducing LLMs to students / early-career
engineers — intuition over math — delivered as an interactive slide-deck
**website** (HTML/CSS/vanilla JS, no build step, fully offline), plus runnable
Pydantic AI + FastAPI demos, a word-for-word speaker script, and Q&A prep.

## Audience & constraints

- Students / early-career: assume programming, no ML background.
- Presented from the user's Windows 11 laptop on a projector; must work with no
  network (system fonts only, no CDNs, canned data for interactives).
- Demos: `pydantic-ai` against OpenAI (`OPENAI_API_KEY`) with automatic
  `TestModel` fallback for offline. Scaling section is diagrams + code
  walkthrough — nothing on stage requires Docker/Redis.

## Deliverables

```
teach-llm/
├── presentation/           # the deck
│   ├── index.html          # ~34 slides as <section>s
│   ├── css/deck.css
│   └── js/deck.js          # engine: keys, hash routing, progress, menu (M),
│   │                       #   notes drawer (N), fullscreen (F), timer
│   ├── js/data.js          # canned distributions, attention weights, embeddings
│   └── js/interactives.js  # all interactive diagrams
├── demos/                  # runnable Python
│   ├── 01_hello_agent.py … 04_fastapi_app.py, 08_scaling/
│   ├── requirements.txt, README.md
├── speaker-notes.md        # full script with timings
├── qa-prep.md              # expected + stumper questions
└── docs/                   # this spec
```

## Visual system

- **Identity: the token chip.** Rounded monospace chips (alternating soft
  tints, like tokenizer visualizers) appear on the title slide and recur in
  every diagram. One running example sentence throughout:
  *"The animal didn't cross the street because it was too tired."*
- Surface `#F7F8FA` cool paper · ink `#1A1D26` · single accent cobalt
  `#0D5BDB` = "computed by the model". Code panels on near-black.
- Type: headings **Cascadia Code** (ships with Win11 → offline-safe), body
  Segoe UI, chips/code Cascadia Mono → Consolas fallback.
- Probability charts: single-hue cobalt ramp (magnitude), selected token
  highlighted; no categorical palettes.
- Motion: staggered entrance on slide activation; interactives animate on
  demand; `prefers-reduced-motion` respected.

## Narrative arc (Karpathy-style, research-validated)

**Part 1 — What is an LLM (~90 min):** intro (user's IBM-style text) →
tokens (interactive tokenizer) → next-token prediction (probability bars,
click-to-append) → temperature slider → transformer overview → attention arcs
→ embeddings as directions → scale → pretraining ("lossy zip of the
internet") → SFT → RLHF + its limits → verified vs unverified domains → two
memories (params vs context window) → hallucination → jagged intelligence →
applications & impact → discussion break.

**Part 2 — Building with LLMs (~2 hr):** chatbot→agent loop → Pydantic AI
(hello agent, structured output, tools, TestModel) → FastAPI endpoint →
streaming SSE (animated) → Celery+Redis job queue (animated) → batching →
production checklist → prompting → context engineering (context rot) →
harnesses (Claude Code, CLAUDE.md, aitmpl.com skills, claude-mem) →
discussion + closing.

Every section ends with a "turn to the room" discussion prompt.

## Deck engine

Arrow/space/PgUp-PgDn navigation, URL hash deep-links (`#12`), top progress
bar, `M` section menu overlay, `N` speaker-notes drawer (cue-card version;
full script lives in speaker-notes.md), `F` fullscreen, elapsed timer in the
drawer. No dependencies.

## Honesty rules for interactives

Temperature slider computes a real softmax over curated logits; token
distributions and attention weights are curated/illustrative (stated in
speaker notes). Demo code uses current pydantic-ai v2 idioms (`output_type=`,
`instructions=`, `result.output`) verified against pydantic.dev/docs/ai
before finalizing.
