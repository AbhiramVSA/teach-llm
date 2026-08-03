# Q&A prep — expected questions, stumpers, and honest answers

Organized by when they tend to come up. Each entry: the crisp answer to say
out loud, then backup detail if they push. The rule for all of them: honesty
beats confidence — this room will fact-check you on their phones.

---

## Deep-learning ramp territory

### 0a. "Do modern LLMs actually use ReLU?"
**Say:** Mostly its smoother cousins — GELU, SwiGLU — small refinements of
the same bend. The lesson is unchanged: pick activations whose gradients
don't die, so gradient descent keeps flowing. ReLU is the historically
important one and the one to build intuition on.

### 0b. "Is more data always better? Does the large-NN curve ever bend?"
**Say:** It does bend — the curve is roughly logarithmic, so each doubling
of data buys a similar (not growing) improvement, and data *quality*
increasingly beats quantity. The honest statement: for the last decade,
scale kept paying — and the interesting 2025+ question is what happens as
naive scaling saturates (that's the "data wall" question — see #9).

### 0c. "Which mattered most — data, compute, or algorithms?"
**Say:** They multiply, they don't add. No amount of data trains an
untrainable net; no GPU helps a net with dead gradients; no algorithm
shines on a thousand rows. Studies of algorithmic progress attribute
roughly half the effective gains to algorithms — but the clean answer is
that all three had to arrive together, and did.

### 0d. "If features are learned, not engineered, is feature engineering dead?"
**Say:** For unstructured data (images, text, audio) — largely yes, the
network wins. For small structured/tabular data — no: gradient-boosted
trees plus domain features still beat deep nets on many real business
tables. Deep learning conquered the unstructured world; the structured
world is still contested.

### 0e. "Why did it take 60 years if the math existed?"
**Say:** The math was necessary, not sufficient. Backprop existed in the
80s; what didn't exist was a millionfold more compute, the digitized data,
and the small algorithmic fixes (ReLU, better initialization, attention)
that make deep stacks trainable. The ideas waited for the world to catch
up — a recurring pattern in science.

---

## Part 1 territory — how the machine works

### 1. "Does it actually understand, or is it just predicting?"
**Say:** Genuinely contested — and both extreme answers are wrong. Probing
experiments show models build real internal representations — board states,
geography, features that fire before a rhyming word is chosen. But
text-only grounding gaps and weird reasoning failures persist. "Stochastic
parrot" undersells it; "understands like us" oversells it.
**Backup:** Anthropic's interpretability work found Claude picks the rhyme
word ("rabbit") *before* writing the line, and suppressing that internal
feature makes it re-plan to "habit". Planning is happening. Whether that's
"understanding" is a definitions fight, not a facts fight.

### 2. "Why do LLMs make things up (hallucinate)?"
**Say:** Because the machine only ever produces *plausible* next tokens.
Where the truth is common in training data, plausible equals true; where
it's rare or missing, the machine still answers — fluently. On top of that,
our benchmarks graded right/wrong with no credit for "I don't know", so
models learned that guessing beats honesty — like students gaming an exam.
**Backup:** OpenAI's 2025 paper ("Why Language Models Hallucinate") makes
this formal: hallucination rate is lower-bounded by classification error,
and binary grading rewards guessing. Mitigations: "I don't know" training,
tools, facts-in-context.

### 3. "Why is it so confident when it's wrong?"
**Say:** Fluency and correctness are learned separately. It absorbed the
*style* of confident experts, and that tone transfers even when the facts
don't. Never read confidence as reliability.

### 4. "Why can't it count the r's in strawberry?" *(you planted this)*
**Say:** Tokenization — it sees three chips, str-aw-berry, never letters.
Asking it to count letters is like asking you to count letters in a word
you've only ever heard. Reasoning models fix it by spelling the word out
token by token in their chain of thought — using tokens to think.

### 5. "Does it learn from my conversations?"
**Say:** The weights are frozen — nothing you type changes the model.
"Memory" features are a database that re-pastes notes into the context
window. (Separate issue: the *company* may use your chats to train future
models — that's a data-policy question, check the setting.)

### 6. "Why different answers to the same question?"
**Say:** Sampling — the temperature slider you saw. And even at temperature
zero it's only *mostly* deterministic; GPU arithmetic and batching add tiny
nondeterminism.

### 7. "Is it a black box? Do we know how it works?"
**Say:** We know perfectly how it was *built*; we only partially know what
it *learned*. Interpretability research can now trace some circuits —
planning, refusal, arithmetic tricks — but only a fraction of any given
computation is explainable today. Less black than five years ago, far from
transparent.

### 8. "Can LLMs actually do math?"
**Say:** Raw arithmetic: bad — tokenization plus no built-in algorithm;
give it a calculator or code (that's what tool use is for). Mathematical
*reasoning*: shockingly good now — models hit gold-medal level on the 2025
International Math Olympiad, officially graded. Both facts are true; the
divide is the verified-domains slide.

### 9. "Are we running out of training data?"
**Say:** Naive "scrape more internet" scaling is ending — usable public
text is roughly bounded, and leaders have said as much. But progress moved
to new recipes: synthetic data, RL practice in verifiable domains, and
spending more compute at answer time (reasoning models). New recipes, not
bigger crawls.

### 10. "Why doesn't it know about [last month's thing]?"
**Say:** Knowledge cutoff — the zip file has a date stamp. Anything fresher
must arrive through the context window: search, RAG, or you pasting it.
Treat a model like a dependency with an expiry date.

### 11. "How much energy does one query burn? Is this killing the planet?"
**Say:** A typical chat query is around 0.3 watt-hours — a few minutes of
a laptop, not the "10× a Google search" meme, which is 2023-era. The real
concern is aggregate: data-center buildout, and reasoning queries cost far
more than chat. Honest answer: per-query small, industry-level real.

### 12. "Do models memorize training data? Is training even legal?"
**Say:** Repeated text does get memorized verbatim — extraction attacks
prove it. Legally: a 2025 US ruling found training on lawfully obtained
books is fair use, but pirated acquisition isn't — Anthropic settled that
part for $1.5B. Direction of travel, not settled law; India's answer may
differ.

### 13. "Will AI take my job?" *(guaranteed to come up)*
**Say:** The honest evidence cuts both ways. Massive real adoption, coding
is the top use case, mostly as augmentation. And the best RCT we have found
experienced devs 19% *slower* with early-2025 tools — while believing they
were faster. What's clearly rising in value: specifying problems, reviewing
and verifying work, owning outcomes. What's falling: being a typing speed.
My advice: be the person who *wields* it with verification discipline.

---

## Part 2 territory — building

### 14. "Should I fine-tune a model on my company's/lab's documents?"
**Say:** Almost always no. Fine-tuning changes *behavior and style*, not
reliable knowledge. Knowledge goes in the context — paste it, or RAG it
when the corpus is big or changing. Rule: **RAG for knowledge, fine-tuning
for behavior** — and you probably need neither to start.

### 15. "RAG vs long context — which one?"
**Say:** Long context windows made small-document RAG unnecessary — paste
the doc. RAG survives for: corpora too big for any window, data that
changes hourly, per-user access control, and cost (shipping a million
tokens per query is expensive). It's retrieval feeding the working memory —
the two-memories slide, productized.

### 16. "What's prompt injection and why can't you just filter it?"
**Say:** Instructions hidden in data the model reads — a webpage, an email,
a PDF — hijack the agent. There's no reliable filter because instructions
and data share one channel: they're all just tokens. Unsolved, top of the
OWASP LLM list. Defense: least-privilege tools, human approval on
consequential actions, and don't combine private data + untrusted content +
the ability to communicate out.

### 17. "How is Claude Code different from ChatGPT?"
**Say:** Same class of model — different harness. ChatGPT is one loop turn:
you ask, it answers. Claude Code runs the agent loop with real tools —
reads your repo, edits files, runs your tests, sees the failure, fixes its
own fix. The loop plus a verifiable judge (your test suite) is the entire
difference.

### 18. "Why Pydantic AI and not LangChain / LlamaIndex / raw API?"
**Say:** For learning: raw API first — know what a tool call actually is.
For building: I like Pydantic AI because validation-with-retry is the core
primitive and it's typed end-to-end with FastAPI. LangChain has enormous
ecosystem breadth but more abstraction than beginners need. Frameworks
churn; the concepts today — loop, tools, types, evals — transfer to all of
them.

### 19. "Can I trust the model's explanation of its own reasoning?"
**Say:** Not fully. Chain-of-thought is *generated output*, not a log of
the computation — models have been caught producing reasoning that doesn't
match what they actually did (e.g., rationalizing a hinted answer). Useful
artifact, often correlated with the real process, not a faithful trace.

### 20. "Why does it refuse harmless things sometimes / fall for jailbreaks?"
**Say:** Refusal is a learned *tendency*, not a rule engine — it
generalizes fuzzily in both directions. "How do I kill a Python process"
sometimes trips it; clever roleplay sometimes slips past it. No known way
to make it exact — same reason hallucination isn't solved: everything is
learned behaviour, nothing is a rule.

### 21. "Which model should I use for my project?"
**Say:** Whichever passes *your* eval. Build 30 examples of your actual
task, run the candidates, look. Leaderboards are contaminated and gamed;
your eval isn't. Start with a cheap fast model; escalate only where it
fails. (And the one-string model swap in Pydantic AI makes trying three
models a five-minute job.)

### 22. "How much does it cost to run this in production?"
**Say:** Sane pilots are cheap: token prices span roughly two orders of
magnitude across model tiers, batch APIs are half price, and caching
repeated prefixes cuts more. The costs that hurt are unmeasured ones —
that's why usage logging is on the production checklist. Do the napkin
math per feature: tokens per request × requests per day × price.

### 23. "Can we run models locally / on our own servers?"
**Say:** Yes — open-weight models (Llama, and stronger ones since) run on
a good GPU via tools like Ollama. Trade-off: control, privacy, no per-token
cost — versus peak capability, which frontier APIs still win. Note "open
weights" ≠ open source: you get the numbers, not the training data or
recipe. For sensitive research data, local is worth a serious look.

---

## Production & agentic-development territory

### P1. "How do you actually trust code an AI agent wrote?"
**Say:** You don't trust the code — you trust the loop around it. In the
codebase from the case study: adversarial review by a fresh agent whose
only job is to falsify the work, evidence labels on every claim, evals
and gates that can go red, and a ledger of past mistakes distilled into
standing rules. Same answer as for human code, enforced harder: never
trust a claim, trust the process that would have caught a false claim.

### P2. "Isn't an agent reviewing another agent just AI grading AI?"
**Say:** It works for the same reason code review works between humans who
are equally fallible: the failure modes are decorrelated, and the
reviewer's incentive is inverted — it's prompted to *break* the work, not
to finish it. Generation and verification are different tasks, and
verification is usually easier (verified-domains logic again). It's not
infallible; that's why gates, tests, and humans stay in the loop.

### P3. "What does an agent-written codebase actually cost? Is it cheaper?"
**Say:** Honest answer: token costs are real but small next to engineer
time; the real cost shifts to *verification infrastructure* — evals,
gates, review loops, observability. Teams that skip that spend the savings
on incident response. The economics work when the verification is cheap
relative to the task — which is why agents took over coding (tests are
cheap judges) before they took over, say, legal advice.

### P4. "Where do I even get 30 eval examples for a brand-new feature?"
**Say:** Start with 10 you write yourself — you know what good looks like.
Add every failure you hit while building (they're the best test cases,
already labeled "bad"). Once in shadow/assist mode, human corrections
become examples for free. The set is never finished; it compounds. A
spreadsheet is a perfectly respectable v1.

### P5. "Does prompt injection really happen outside of demos?"
**Say:** Yes — documented attacks against email assistants, browser
agents, and code agents reading poisoned web pages or repo files; OWASP
ranks it #1 for LLM apps. The honest part: there is no known reliable
fix, only architecture — least privilege, gated actions, breaking the
private-data / untrusted-content / can-act triangle. Anyone selling you
an "injection filter" is selling you a WAF for a channel that has no
protocol.

### P6. "Why Celery/Redis? Aren't there simpler background-job options?"
**Say:** The pattern matters, not the brand: durable queue + workers +
result store + polling. In Python, Celery/Redis is the battle-tested
default; arq is a leaner async-native alternative from the Pydantic
world; managed clouds have their own (SQS+Lambda, Cloud Tasks). What
FastAPI's BackgroundTasks lacks — persistence, retry, visibility — is
the actual lesson.

### P7. "How do I version prompts? Git-diff a paragraph?"
**Say:** Exactly that — prompts live in the repo next to code, reviewed
in PRs, and every change runs the eval before it ships. Some teams add a
prompt registry with IDs for runtime swapping, but git + eval gate is
90% of the value. The mindset shift: a prompt change is a behaviour
change is a deploy.

---

## Curveballs — low probability, be ready anyway

### 24. "Is this AGI / when is AGI coming?"
**Say:** I'll give you the boring true answer: nobody knows, expert
forecasts span decades, and the term itself is fuzzy. What I can show you
is the trend that matters for *your* decisions: capabilities are jagged and
climbing fastest where answers are verifiable. Plan careers and products
around that, not around a date.

### 25. "Could the model be lying to us right now / is it conscious?"
**Say:** Two different questions. Deception: models *can* produce
strategically misleading output in lab setups — it's an active safety
research area, taken seriously. Consciousness: no evidence, no agreed test,
and I won't pretend philosophy is settled. What I'll stand behind: treat
outputs as unverified claims from a very well-read source, and verify.

### 26. "My cousin says AI is a bubble / it's all hype."
**Say:** Both can be true — the internet was a bubble in 1999 *and* it
changed everything. Investment may be ahead of returns; the capability is
real — you watched it triage tickets and fix code today. Engineers don't
have to bet on the market either way: learn the primitives, they survive
the correction.

### 27. "Why did you use OpenAI in the demos and not [other provider]?"
**Say:** Convenience of one API key — and deliberately irrelevant: you saw
the model string; swapping providers is one line. The concepts are
provider-agnostic, and multi-provider fallback is on the production
checklist for a reason.

### 28. If a demo fails live
**Say (while typing):** "Perfect — production lesson number one, live: LLM
APIs fail. Watch this." → `$env:OFFLINE = "1"`, rerun, same code path on
the test model. Narrate the fallback as the feature it is.

---

## Three questions to ask THEM when energy dips

- "9.11 vs 9.9 — who can explain, from tokenization, why models get this
  wrong?" (calls back the tokenizer slide)
- "Your final-year project: which half is verifiable? What's its unit
  test?" (calls back the verified-domains slide)
- "You now know context rot exists. What's wrong with keeping one giant
  chat open all semester?" (calls back the context-engineering slide)
