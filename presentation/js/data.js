/* Canned, curated data for the interactive diagrams.
   Distributions and attention weights are ILLUSTRATIVE — shaped to match how
   real models behave, but not dumped from a live model. The temperature demo
   computes a real softmax over these logits. Say so if asked. */

window.DECKDATA = {

  /* ---- tokenizer presets (BPE-style segmentation, illustrative ids) ---- */
  tokenizer: {
    presets: [
      {
        label: "our sentence",
        tokens: ["The", " animal", " didn't", " cross", " the", " street",
                 " because", " it", " was", " too", " tired", "."],
        ids: [791, 10065, 3287, 2202, 279, 8761, 1606, 433, 574, 2288, 19781, 13],
      },
      {
        label: "strawberry",
        tokens: ["str", "aw", "berry"],
        ids: [496, 675, 15717],
        note: "The model never sees letters — only these three chunks. Remember this for later.",
      },
      {
        label: "9.11 vs 9.9",
        tokens: ["9", ".", "11", " is", " bigger", " than", " 9", ".", "9"],
        ids: [24, 13, 806, 374, 11493, 1109, 220, 24, 13, 24],
        note: "“11” is one token, “9” is another — the model sees chunks, not decimal numbers.",
      },
      {
        label: "hindi",
        tokens: ["नम", "स्ते", " दुनि", "या"],
        ids: [98301, 45021, 101913, 30181],
        note: "Less common scripts get chopped into more, smaller pieces — one reason quality varies by language.",
      },
      {
        label: "code",
        tokens: ["def", " fib", "(", "n", "):", "\\n", "    ", "return"],
        ids: [755, 16178, 1021, 77, 1680, 198, 262, 693],
        note: "Code tokenizes cleanly — even indentation is a token. Models read code the same way they read prose.",
      },
    ],
  },

  /* ---- next-token prediction: small precomputed trees ---- */
  predictor: {
    presets: [
      {
        label: "our sentence",
        prompt: ["The", " animal", " didn't", " cross", " the", " street",
                 " because", " it", " was", " too"],
        steps: {
          start: {
            cands: [
              { t: " tired", p: 0.62, next: "s1" },
              { t: " scared", p: 0.14, next: "s1b" },
              { t: " busy", p: 0.07, next: "s1" },
              { t: " wide", p: 0.05, next: "s1c" },
              { t: " dangerous", p: 0.04, next: "s1" },
            ],
          },
          s1: {
            cands: [
              { t: ".", p: 0.46, next: "end" },
              { t: " to", p: 0.28, next: "s2" },
              { t: ",", p: 0.11, next: "end" },
              { t: " and", p: 0.06, next: "end" },
              { t: " from", p: 0.03, next: "end" },
            ],
          },
          s1b: {
            cands: [
              { t: " of", p: 0.52, next: "s2b" },
              { t: ".", p: 0.21, next: "end" },
              { t: " to", p: 0.12, next: "s2" },
              { t: ",", p: 0.07, next: "end" },
              { t: " by", p: 0.04, next: "end" },
            ],
          },
          s1c: {
            cands: [
              { t: ".", p: 0.58, next: "end" },
              { t: " and", p: 0.15, next: "end" },
              { t: " for", p: 0.11, next: "end" },
              { t: ",", p: 0.08, next: "end" },
              { t: " to", p: 0.04, next: "s2" },
            ],
          },
          s2: {
            cands: [
              { t: " move", p: 0.41, next: "end" },
              { t: " walk", p: 0.22, next: "end" },
              { t: " continue", p: 0.14, next: "end" },
              { t: " bother", p: 0.09, next: "end" },
              { t: " care", p: 0.05, next: "end" },
            ],
          },
          s2b: {
            cands: [
              { t: " the", p: 0.44, next: "end" },
              { t: " traffic", p: 0.27, next: "end" },
              { t: " cars", p: 0.13, next: "end" },
              { t: " people", p: 0.07, next: "end" },
              { t: " it", p: 0.04, next: "end" },
            ],
          },
        },
      },
      {
        label: "once upon a…",
        prompt: ["Once", " upon", " a"],
        steps: {
          start: {
            cands: [
              { t: " time", p: 0.97, next: "s1" },
              { t: " midnight", p: 0.012, next: "end" },
              { t: " hill", p: 0.004, next: "end" },
              { t: " dream", p: 0.003, next: "end" },
              { t: " star", p: 0.002, next: "end" },
            ],
          },
          s1: {
            cands: [
              { t: ",", p: 0.71, next: "s2" },
              { t: " there", p: 0.19, next: "s2" },
              { t: " in", p: 0.05, next: "end" },
              { t: " long", p: 0.02, next: "end" },
              { t: ".", p: 0.01, next: "end" },
            ],
          },
          s2: {
            cands: [
              { t: " there", p: 0.62, next: "end" },
              { t: " in", p: 0.15, next: "end" },
              { t: " a", p: 0.09, next: "end" },
              { t: " far", p: 0.06, next: "end" },
              { t: " deep", p: 0.03, next: "end" },
            ],
          },
        },
      },
      {
        label: "capital of France",
        prompt: ["The", " capital", " of", " France", " is"],
        steps: {
          start: {
            cands: [
              { t: " Paris", p: 0.96, next: "s1" },
              { t: " the", p: 0.02, next: "end" },
              { t: " a", p: 0.008, next: "end" },
              { t: " located", p: 0.006, next: "end" },
              { t: " famous", p: 0.004, next: "end" },
            ],
          },
          s1: {
            cands: [
              { t: ".", p: 0.55, next: "end" },
              { t: ",", p: 0.29, next: "end" },
              { t: " and", p: 0.07, next: "end" },
              { t: " which", p: 0.05, next: "end" },
              { t: " —", p: 0.02, next: "end" },
            ],
          },
        },
      },
    ],
  },

  /* ---- temperature: real softmax over curated logits ---- */
  temperature: {
    context: ["My", " favourite", " part", " of", " school", " was"],
    options: [
      { t: " lunch", logit: 3.1 },
      { t: " recess", logit: 2.6 },
      { t: " maths", logit: 2.2 },
      { t: " science", logit: 1.9 },
      { t: " art", logit: 1.5 },
      { t: " history", logit: 1.1 },
      { t: " music", logit: 0.8 },
      { t: " detention", logit: -0.6 },
    ],
    samples: {
      low: "My favourite part of school was lunch, without question.",
      mid: "My favourite part of school was science — we got to break things on purpose.",
      high: "My favourite part of school was detention, weirdly, because the librarian kept parrots.",
    },
  },

  /* ---- attention: per-query weights, two heads ---- */
  attention: {
    tokens: ["The", "animal", "didn't", "cross", "the", "street",
             "because", "it", "was", "too", "tired"],
    // head A: meaning / coreference. head B: local syntax.
    heads: {
      A: {
        7:  { 1: 0.68, 5: 0.16, 0: 0.05, 10: 0.06 },          // "it" → animal
        10: { 1: 0.44, 7: 0.31, 9: 0.12, 2: 0.06 },           // "tired" → animal, it
        3:  { 1: 0.52, 5: 0.28, 2: 0.11 },                    // "cross" → animal, street
        6:  { 2: 0.34, 3: 0.27, 10: 0.24, 1: 0.08 },          // "because" → didn't/cross/tired
        5:  { 4: 0.30, 3: 0.42, 1: 0.14 },                    // "street" → cross
      },
      B: {
        7:  { 6: 0.41, 8: 0.35, 5: 0.12 },                    // "it" → because, was
        10: { 9: 0.58, 8: 0.27, 7: 0.08 },                    // "tired" → too, was
        3:  { 2: 0.62, 4: 0.21, 1: 0.09 },                    // "cross" → didn't, the
        6:  { 5: 0.44, 7: 0.38, 8: 0.09 },                    // "because" → street, it
        5:  { 4: 0.66, 3: 0.22, 6: 0.07 },                    // "street" → the
      },
    },
    story: "With one changed word — “because it was too wide” — the arrows from “it” flip from animal to street. Same sentence shape, different meaning, and attention is the mechanism that resolves it.",
  },

  /* ---- embeddings: 2D projection, curated clusters ---- */
  embeddings: {
    words: [
      // royalty / people (used for the arithmetic)
      { w: "king", x: 76, y: 26 }, { w: "queen", x: 88, y: 20 },
      { w: "man", x: 70, y: 44 }, { w: "woman", x: 82, y: 38 },
      { w: "prince", x: 72, y: 20 }, { w: "princess", x: 84, y: 14 },
      // animals
      { w: "cat", x: 16, y: 22 }, { w: "dog", x: 21, y: 18 },
      { w: "kitten", x: 12, y: 28 }, { w: "puppy", x: 24, y: 25 },
      { w: "tiger", x: 10, y: 14 }, { w: "animal", x: 18, y: 33 },
      // cities / countries
      { w: "Paris", x: 42, y: 76 }, { w: "France", x: 36, y: 82 },
      { w: "Delhi", x: 52, y: 80 }, { w: "India", x: 47, y: 87 },
      { w: "Tokyo", x: 58, y: 74 }, { w: "Japan", x: 55, y: 84 },
      // food
      { w: "dosa", x: 82, y: 74 }, { w: "idli", x: 87, y: 78 },
      { w: "coffee", x: 78, y: 82 }, { w: "chai", x: 84, y: 86 },
      // verbs
      { w: "run", x: 30, y: 52 }, { w: "walk", x: 35, y: 56 },
      { w: "sprint", x: 26, y: 48 },
    ],
    arithmetic: { a: "king", minus: "man", plus: "woman", near: "queen" },
  },

  /* ---- scale comparison (log-ish areas handled in code) ---- */
  scale: [
    { name: "nanoGPT demo", params: 85e3, note: "sorts the letters A, B, C", year: "toy" },
    { name: "GPT-2", params: 124e6, note: "2019 — coherent paragraphs", year: "2019" },
    { name: "GPT-3", params: 175e9, note: "2020 — few-shot everything", year: "2020" },
    { name: "Frontier models", params: 1.8e12, note: "2025+ — estimated; not disclosed", year: "now" },
  ],

  /* ---- context rot meter ---- */
  contextMeter: {
    good: ["task instructions", "the actual document", "relevant code", "recent turns"],
    rot: ["stale tool output", "dead-end attempts", "duplicate pastes", "old errors", "off-topic chat"],
  },
};
