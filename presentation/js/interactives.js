/* Interactive diagrams. Each <div data-interactive="name"> is initialised
   lazily the first time its slide becomes active. All data lives in data.js. */

(function () {
  "use strict";
  const D = window.DECKDATA;
  const SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- helpers ---------- */

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function svg(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    return e;
  }
  const TINTS = ["a", "b", "c", "d"];
  function chip(text, i, extra) {
    const s = el("span", "tok " + TINTS[i % 4] + (extra ? " " + extra : ""));
    s.textContent = text;
    return s;
  }
  function fmtPct(p) { return (p * 100).toFixed(p < 0.01 ? 1 : 0) + "%"; }

  function barRow(label, p, max, opts) {
    const row = el("div", "bar-row" + (opts && opts.pickable ? " pickable" : ""));
    const bt = el("span", "bt"); bt.textContent = label; row.appendChild(bt);
    const track = el("div", "bar-track");
    const fill = el("div", "bar-fill");
    fill.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.width = (p / max * 100) + "%";
    }));
    track.appendChild(fill); row.appendChild(track);
    row.appendChild(el("span", "bv", fmtPct(p)));
    return row;
  }

  /* ---------- 1. tokenizer ---------- */

  function initTokenizer(root) {
    const presets = D.tokenizer.presets;
    const btns = el("div", "ctlrow");
    const out = el("div", "tokline vgap");
    const note = el("p", "small vgap");
    presets.forEach((p, pi) => {
      const b = el("button", "ctl", p.label);
      b.addEventListener("click", () => render(pi, b));
      btns.appendChild(b);
    });
    root.append(btns, out, note);

    function render(pi, activeBtn) {
      btns.querySelectorAll("button").forEach(b => b.classList.remove("primary"));
      if (activeBtn) activeBtn.classList.add("primary");
      const p = presets[pi];
      out.innerHTML = "";
      p.tokens.forEach((t, i) => {
        const wrap = el("span");
        wrap.style.display = "inline-block";
        wrap.style.textAlign = "center";
        const c = chip(t.replace(/^ /, " "), i);
        wrap.appendChild(c);
        wrap.appendChild(el("span", "tok-id", String(p.ids[i])));
        out.appendChild(wrap);
      });
      const count = el("span", "tok ghost", p.tokens.length + " tokens");
      count.style.marginLeft = "1em";
      out.appendChild(count);
      note.textContent = p.note || "";
    }
    render(0, btns.querySelector("button"));
  }

  /* ---------- 2. next-token predictor ---------- */

  function initPredictor(root) {
    const presets = D.predictor.presets;
    let preset = presets[0];
    let generated = [];
    let stepKey = "start";

    const selrow = el("div", "ctlrow");
    presets.forEach((p, i) => {
      const b = el("button", "ctl", p.label);
      b.addEventListener("click", () => { preset = presets[i]; reset(); mark(b); });
      selrow.appendChild(b);
    });
    const resetBtn = el("button", "ctl", "↺ restart");
    resetBtn.addEventListener("click", reset);
    selrow.appendChild(resetBtn);

    const ctx = el("div", "tokline vgap");
    const barsWrap = el("div", "bars");
    const hintLine = el("p", "small vgap", "Click a candidate to append it — then the model runs again on the longer sequence.");
    root.append(selrow, ctx, hintLine, barsWrap);

    function mark(btn) {
      selrow.querySelectorAll("button").forEach(b => b.classList.remove("primary"));
      if (btn) btn.classList.add("primary");
    }

    function reset() {
      generated = []; stepKey = "start"; render();
    }

    function render() {
      ctx.innerHTML = "";
      preset.prompt.forEach((t, i) => ctx.appendChild(chip(t.replace(/^ /, " "), i)));
      generated.forEach(t => ctx.appendChild(chip(t.replace(/^ /, " "), 0, "hot")));
      const cursor = el("span", "tok ghost", "▊ next?");
      ctx.appendChild(cursor);

      barsWrap.innerHTML = "";
      const step = preset.steps[stepKey];
      if (!step || stepKey === "end") {
        barsWrap.appendChild(el("p", "small",
          "End of the precomputed branch — this demo only knows a few paths. A real model has a distribution over ~100,000 tokens at <em>every</em> step. Hit ↺ restart to try another path."));
        return;
      }
      const max = step.cands[0].p;
      step.cands.forEach(c => {
        const row = barRow(c.t.replace(/^ /, "·"), c.p, max, { pickable: true });
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        const pick = () => { generated.push(c.t); stepKey = c.next || "end"; render(); };
        row.addEventListener("click", pick);
        row.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        barsWrap.appendChild(row);
      });
    }
    mark(selrow.querySelector("button"));
    reset();
  }

  /* ---------- 3. temperature ---------- */

  function initTemperature(root) {
    const T = D.temperature;
    const ctx = el("div", "tokline");
    T.context.forEach((t, i) => ctx.appendChild(chip(t.replace(/^ /, " "), i)));
    ctx.appendChild(el("span", "tok ghost", "▊"));

    const row = el("div", "ctlrow");
    const label = el("label", "", "temperature: <b id='tval'>1.0</b>");
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = "0.05"; slider.max = "2"; slider.step = "0.05"; slider.value = "1";
    slider.setAttribute("aria-label", "temperature");
    row.append(label, slider);

    const barsWrap = el("div", "bars");
    const sample = el("p", "small vgap");
    root.append(ctx, row, barsWrap, sample);

    function render() {
      const t = parseFloat(slider.value);
      label.querySelector("#tval").textContent = t.toFixed(2);
      const exps = T.options.map(o => Math.exp(o.logit / t));
      const Z = exps.reduce((a, b) => a + b, 0);
      const ps = exps.map(e => e / Z);
      const max = Math.max(...ps);
      barsWrap.innerHTML = "";
      T.options.forEach((o, i) => {
        barsWrap.appendChild(barRow(o.t.replace(/^ /, "·"), ps[i], max));
      });
      sample.innerHTML = "<span class='mute'>a typical completion at this setting:</span> " +
        (t < 0.5 ? "“" + T.samples.low + "”" : t < 1.3 ? "“" + T.samples.mid + "”" : "“" + T.samples.high + "”");
    }
    slider.addEventListener("input", render);
    render();
  }

  /* ---------- 4. transformer walkthrough (HTML boxes) ---------- */

  function initTransformer(root) {
    const stages = [
      { id: "tokens", title: "tokens in", sub: "the text, chopped into chips",
        cap: "Everything starts as tokens — the chips you already know. Each one is looked up as a list of numbers (a vector)." },
      { id: "embed", title: "embeddings", sub: "each token → a vector",
        cap: "Each token becomes a long list of numbers — its position in “meaning space”. Similar words start out close together." },
      { id: "block", title: "transformer block × N", sub: "attention + feed-forward",
        cap: "The same two-step block repeats N times. Attention lets tokens look at each other and share information; the feed-forward layer transforms what each token has gathered." },
      { id: "unembed", title: "output layer", sub: "vector → scores for every token",
        cap: "The final vector is scored against every token in the vocabulary — roughly 100,000 numbers." },
      { id: "probs", title: "probabilities", sub: "softmax → the bars you saw",
        cap: "Softmax turns scores into the probability bars from earlier. Sample one token, append it, and the whole thing runs again." },
    ];
    let at = -1;

    const wrap = el("div", "tf-wrap");
    wrap.style.cssText = "display:flex;align-items:stretch;gap:.6em;margin:1em 0;";
    const boxes = stages.map((s) => {
      const b = el("div", "card tf-stage");
      b.style.cssText = "flex:1;text-align:center;transition:all .3s;padding:.8em .5em;";
      b.innerHTML = "<h3 style='margin-bottom:.2em'>" + s.title + "</h3><div class='small mute'>" + s.sub + "</div>";
      return b;
    });
    boxes.forEach((b, i) => {
      wrap.appendChild(b);
      if (i < boxes.length - 1) {
        const a = el("div", "", "→");
        a.style.cssText = "align-self:center;color:var(--ink-mute);font-family:var(--mono);";
        wrap.appendChild(a);
      }
    });

    const cap = el("p", "small", "Press <b>step</b> to follow one prediction through the machine.");
    cap.style.minHeight = "3.2em";
    const row = el("div", "ctlrow");
    const stepBtn = el("button", "ctl primary", "step ▸");
    const resetBtn = el("button", "ctl", "↺");
    row.append(stepBtn, resetBtn);
    root.append(wrap, row, cap);

    function paint() {
      boxes.forEach((b, i) => {
        b.style.borderColor = i === at ? "var(--cobalt)" : "var(--line)";
        b.style.background = i === at ? "var(--cobalt-soft)" : "var(--panel)";
        b.style.transform = i === at ? "translateY(-4px)" : "none";
      });
      cap.innerHTML = at < 0
        ? "Press <b>step</b> to follow one prediction through the machine."
        : "<b class='cobalt'>" + stages[at].title + ":</b> " + stages[at].cap;
      stepBtn.disabled = at >= stages.length - 1;
    }
    stepBtn.addEventListener("click", () => { at = Math.min(at + 1, stages.length - 1); paint(); });
    resetBtn.addEventListener("click", () => { at = -1; paint(); });
    paint();
  }

  /* ---------- 5. attention arcs ---------- */

  function initAttention(root) {
    const A = D.attention;
    let head = "A";
    let picked = 7; // "it"

    const headRow = el("div", "ctlrow");
    const hA = el("button", "ctl primary", "head 1 · meaning");
    const hB = el("button", "ctl", "head 2 · grammar");
    hA.addEventListener("click", () => { head = "A"; hA.classList.add("primary"); hB.classList.remove("primary"); draw(); });
    hB.addEventListener("click", () => { head = "B"; hB.classList.add("primary"); hA.classList.remove("primary"); draw(); });
    headRow.append(hA, hB, el("span", "small mute", "— click an underlined word"));

    const box = svg("svg", { viewBox: "0 0 1000 260", class: "diagram", "aria-label": "attention diagram" });
    root.append(headRow, box);
    const note = el("p", "small vgap");
    root.append(note);

    // layout tokens along the bottom
    const n = A.tokens.length;
    const xs = A.tokens.map((_, i) => 40 + i * (920 / (n - 1)));
    const Y = 225;

    function draw() {
      while (box.firstChild) box.removeChild(box.firstChild);
      const weights = A.heads[head][picked] || {};

      // arcs first (under text)
      for (const j in weights) {
        const w = weights[j];
        const x1 = xs[picked], x2 = xs[j];
        const mid = (x1 + x2) / 2;
        const lift = Math.min(190, 40 + Math.abs(x1 - x2) * 0.35);
        const path = svg("path", {
          d: `M ${x1} ${Y - 22} Q ${mid} ${Y - 22 - lift} ${x2} ${Y - 22}`,
          fill: "none", stroke: "var(--cobalt)",
          "stroke-width": (1 + w * 9).toFixed(1),
          "stroke-linecap": "round", opacity: (0.25 + w * 0.75).toFixed(2),
        });
        box.appendChild(path);
        const pct = svg("text", { x: x2, y: Y - 34 - lift * (x2 === x1 ? 0 : 0.06), "text-anchor": "middle", class: "sub" });
        pct.textContent = Math.round(w * 100) + "%";
        box.appendChild(pct);
      }

      A.tokens.forEach((t, i) => {
        const isQuery = A.heads.A[i] !== undefined;
        const g = svg("g", { style: isQuery ? "cursor:pointer" : "" });
        const label = svg("text", {
          x: xs[i], y: Y, "text-anchor": "middle",
          "font-size": "17", "font-weight": i === picked ? "700" : "400",
          fill: i === picked ? "var(--cobalt)" : "var(--ink)",
        });
        label.textContent = t;
        g.appendChild(label);
        if (isQuery) {
          const u = svg("line", {
            x1: xs[i] - 24, x2: xs[i] + 24, y1: Y + 8, y2: Y + 8,
            stroke: i === picked ? "var(--cobalt)" : "var(--ink-mute)",
            "stroke-width": 2, "stroke-dasharray": i === picked ? "" : "3 3",
          });
          g.appendChild(u);
          g.addEventListener("click", () => { picked = i; draw(); });
        }
        box.appendChild(g);
      });

      note.innerHTML = picked === 7
        ? "“<b>it</b>” spends most of its attention on “<b>animal</b>” — the model has resolved what “it” refers to. " + D.attention.story
        : "Arrows show where “<b>" + A.tokens[picked] + "</b>” looks to build up its meaning. Thicker = more attention.";
    }
    draw();
  }

  /* ---------- 6. embeddings scatter ---------- */

  function initEmbeddings(root) {
    const E = D.embeddings;
    const box = svg("svg", { viewBox: "0 0 1000 460", class: "diagram", "aria-label": "embedding map" });
    const sx = v => 60 + v * 8.8, sy = v => 30 + v * 4.0;

    const note = el("p", "small vgap", "A 2-D shadow of a ~1,000-dimensional space. Nearby words mean similar things.");
    const row = el("div", "ctlrow");
    const btn = el("button", "ctl primary", "king − man + woman = ?");
    const rst = el("button", "ctl", "↺");
    row.append(btn, rst);
    root.append(box, row, note);

    const find = w => E.words.find(o => o.w === w);

    function base() {
      while (box.firstChild) box.removeChild(box.firstChild);
      E.words.forEach(o => {
        const dot = svg("circle", { cx: sx(o.x), cy: sy(o.y), r: 5, fill: "var(--cobalt)", opacity: .75 });
        const t = svg("text", { x: sx(o.x), y: sy(o.y) - 10, "text-anchor": "middle", "font-size": "14" });
        t.textContent = o.w;
        box.append(dot, t);
      });
    }

    function arrow(x1, y1, x2, y2, color, dash) {
      return svg("line", {
        x1, y1, x2, y2, stroke: color, "stroke-width": 3,
        "stroke-dasharray": dash || "", "marker-end": "url(#embArr)", opacity: .9,
      });
    }

    btn.addEventListener("click", () => {
      base();
      const defs = svg("defs", {});
      const m = svg("marker", { id: "embArr", markerWidth: 8, markerHeight: 8, refX: 6, refY: 3, orient: "auto" });
      const p = svg("path", { d: "M0,0 L6,3 L0,6 z", fill: "var(--warn)" });
      m.appendChild(p); defs.appendChild(m); box.appendChild(defs);

      const k = find(E.arithmetic.a), man = find(E.arithmetic.minus),
            wom = find(E.arithmetic.plus), q = find(E.arithmetic.near);
      // vector man→king, then re-applied at woman
      box.appendChild(arrow(sx(man.x), sy(man.y), sx(k.x), sy(k.y), "var(--warn)"));
      box.appendChild(arrow(sx(wom.x), sy(wom.y), sx(wom.x) + (sx(k.x) - sx(man.x)), sy(wom.y) + (sy(k.y) - sy(man.y)), "var(--warn)", "6 4"));
      const ring = svg("circle", { cx: sx(q.x), cy: sy(q.y), r: 16, fill: "none", stroke: "var(--warn)", "stroke-width": 3 });
      box.appendChild(ring);
      note.innerHTML = "The <b>man → king</b> direction, applied to <b>woman</b>, lands almost exactly on <b>queen</b>. Directions in this space carry meaning: gender, royalty, tense, even “is the capital of”.";
    });
    rst.addEventListener("click", () => { base(); note.textContent = "A 2-D shadow of a ~1,000-dimensional space. Nearby words mean similar things."; });
    base();
  }

  /* ---------- 7. scale ---------- */

  function initScale(root) {
    const rows = el("div", "bars");
    const maxLog = Math.log10(D.scale[D.scale.length - 1].params);
    const minLog = Math.log10(D.scale[0].params) - 1;
    D.scale.forEach(m => {
      const row = el("div", "bar-row");
      row.style.gridTemplateColumns = "10em 1fr 12em";
      row.appendChild(el("span", "bt", m.name));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      const frac = (Math.log10(m.params) - minLog) / (maxLog - minLog);
      fill.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = frac * 100 + "%"; }));
      track.appendChild(fill);
      row.appendChild(track);
      const lbl = m.params >= 1e12 ? (m.params / 1e12) + " trillion" :
                  m.params >= 1e9 ? (m.params / 1e9) + " billion" :
                  m.params >= 1e6 ? (m.params / 1e6) + " million" : (m.params / 1e3) + "K";
      row.appendChild(el("span", "bv", lbl + " · " + m.note));
      rows.appendChild(row);
    });
    root.appendChild(rows);
    root.appendChild(el("p", "small vgap",
      "⚠ The bars are on a <b>log scale</b> — each big step is ×1,000. Linearly: if the toy model were <b>1 mm</b> long, the frontier model would stretch <b>~21 km</b> — the length of Chennai's coastline."));
  }

  /* ---------- 8. training pipeline minimap ---------- */

  function initPipeline(root) {
    const active = parseInt(root.dataset.stage, 10);
    const stages = [
      { t: "1 · Pretraining", d: "predict the next token on ~15T tokens of internet text", data: "the internet" },
      { t: "2 · SFT", d: "imitate ~100k expert-written conversations", data: "curated dialogues" },
      { t: "3 · RL / RLHF", d: "practice + feedback: reinforce what works", data: "preferences & checkers" },
    ];
    const wrap = el("div");
    wrap.style.cssText = "display:flex;gap:.6em;align-items:stretch;margin:.8em 0;";
    stages.forEach((s, i) => {
      const c = el("div", "card");
      c.style.cssText = "flex:1;padding:.7em .9em;" + (i === active
        ? "border-color:var(--cobalt);background:var(--cobalt-soft);"
        : "opacity:.55;");
      c.innerHTML = "<h3 style='font-size:.85em'>" + s.t + "</h3>" +
        "<div class='small'>" + s.d + "</div>" +
        "<div class='small mute' style='margin-top:.3em'>data: " + s.data + "</div>";
      wrap.appendChild(c);
      if (i < 2) {
        const a = el("div", "", "→");
        a.style.cssText = "align-self:center;font-family:var(--mono);color:var(--ink-mute)";
        wrap.appendChild(a);
      }
    });
    root.appendChild(wrap);
  }

  /* ---------- 9. agent loop ---------- */

  function initAgentLoop(root) {
    const steps = [
      { who: "user", text: "“Should I carry an umbrella in Chennai today?”" },
      { who: "llm", text: "model thinks: I don't know today's weather. I have a get_weather tool. → emits tool call: get_weather(city=\"Chennai\")" },
      { who: "tool", text: "your code runs the real API → returns { rain_probability: 0.84 }" },
      { who: "llm", text: "model sees the observation and decides it can answer now" },
      { who: "answer", text: "“Yes — 84% chance of rain this afternoon. Take the umbrella.”" },
    ];
    const nodes = { user: "You", llm: "LLM", tool: "Tools", answer: "Answer" };
    let at = -1;

    const dia = el("div");
    dia.style.cssText = "display:flex;gap:.8em;align-items:center;margin:.8em 0;flex-wrap:wrap;";
    const nodeEls = {};
    ["user", "llm", "tool", "answer"].forEach((k, i) => {
      const c = el("div", "card");
      c.style.cssText = "padding:.6em 1.1em;font-family:var(--display);font-weight:600;transition:all .25s;";
      c.textContent = nodes[k];
      nodeEls[k] = c;
      dia.appendChild(c);
      if (i < 3) {
        const arrows = ["→", "⇄", "→"];
        const a = el("div", "", arrows[i]);
        a.style.cssText = "font-family:var(--mono);color:var(--ink-mute);font-size:1.2em;";
        dia.appendChild(a);
      }
    });
    const loopLabel = el("div", "small mute", "⟲ the LLM ⇄ tools loop can repeat many times before answering");

    const log = el("div", "card vgap");
    log.style.cssText = "min-height:7.5em;font-size:.8em;";
    log.innerHTML = "<span class='mute'>Press <b>step</b> to run one trip around the loop.</span>";

    const row = el("div", "ctlrow");
    const stepBtn = el("button", "ctl primary", "step ▸");
    const rst = el("button", "ctl", "↺");
    row.append(stepBtn, rst);
    root.append(dia, loopLabel, row, log);

    function paint() {
      Object.values(nodeEls).forEach(n => { n.style.borderColor = "var(--line)"; n.style.background = "var(--panel)"; });
      if (at >= 0) {
        const k = steps[at].who;
        nodeEls[k].style.borderColor = "var(--cobalt)";
        nodeEls[k].style.background = "var(--cobalt-soft)";
        log.innerHTML = steps.slice(0, at + 1).map(s =>
          "<div style='margin-bottom:.35em'><b class='cobalt'>" + nodes[s.who] + ":</b> " + s.text + "</div>").join("");
      } else {
        log.innerHTML = "<span class='mute'>Press <b>step</b> to run one trip around the loop.</span>";
      }
      stepBtn.disabled = at >= steps.length - 1;
    }
    stepBtn.addEventListener("click", () => { at++; paint(); });
    rst.addEventListener("click", () => { at = -1; paint(); });
    paint();
  }

  /* ---------- 10. streaming race ---------- */

  function initSSE(root) {
    const answer = "Yes — there is an 84% chance of rain in Chennai this afternoon, so take the umbrella.".split(" ");
    const mkLane = (title) => {
      const lane = el("div", "card");
      lane.style.cssText = "flex:1;min-height:8em;";
      lane.innerHTML = "<h3 style='font-size:.8em'>" + title + "</h3>";
      const body = el("div", "");
      body.style.cssText = "font-size:.8em;min-height:3.5em;margin:.4em 0;";
      const stat = el("div", "small mute", "waiting…");
      lane.append(body, stat);
      return { lane, body, stat };
    };
    const wrap = el("div");
    wrap.style.cssText = "display:flex;gap:1em;margin:.8em 0;";
    const L = mkLane("without streaming — wait for the whole reply");
    const R = mkLane("with streaming — tokens as they're made");
    wrap.append(L.lane, R.lane);

    const row = el("div", "ctlrow");
    const play = el("button", "ctl primary", "▶ send the same request to both");
    row.appendChild(play);
    root.append(wrap, row);

    let timers = [];
    play.addEventListener("click", () => {
      timers.forEach(clearTimeout); timers = [];
      L.body.textContent = ""; R.body.textContent = "";
      L.stat.textContent = "⏳ generating…"; R.stat.textContent = "⏳ generating…";
      const perWord = 180, total = answer.length * perWord;

      answer.forEach((w, i) => {
        timers.push(setTimeout(() => {
          R.body.textContent += (i ? " " : "") + w;
          if (i === 0) R.stat.innerHTML = "<b class='cobalt'>first token at 0.2s</b> — the reader is already reading";
          if (i === answer.length - 1) R.stat.innerHTML = "done — but it <b>felt</b> instant";
        }, perWord * (i + 1)));
      });
      timers.push(setTimeout(() => {
        L.body.textContent = answer.join(" ");
        L.stat.innerHTML = "<b class='bad'>blank screen for " + (total / 1000).toFixed(1) + "s</b> — then everything at once";
      }, total + 250));
    });
  }

  /* ---------- 11. job queue ---------- */

  function initQueue(root) {
    const wrap = el("div");
    wrap.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1.4fr 1fr;gap:.8em;margin:.8em 0;";
    const mk = (title) => {
      const c = el("div", "card");
      c.style.cssText = "min-height:9em;padding:.6em .8em;";
      c.innerHTML = "<h3 style='font-size:.72em'>" + title + "</h3>";
      const body = el("div");
      body.style.cssText = "display:flex;flex-wrap:wrap;gap:.3em;margin-top:.4em;align-content:flex-start;";
      c.appendChild(body);
      return { c, body };
    };
    const client = mk("client<br><span class='small mute'>gets job_id, polls</span>");
    const api = mk("FastAPI<br><span class='small mute'>enqueue, return 202</span>");
    const queue = mk("Redis queue<br><span class='small mute'>jobs wait here</span>");
    const workers = mk("Celery workers ×2<br><span class='small mute'>each does 1 job</span>");
    wrap.append(client.c, api.c, queue.c, workers.c);

    const stat = el("p", "small mute", "Press ▶ to submit 5 long jobs at once.");
    const row = el("div", "ctlrow");
    const play = el("button", "ctl primary", "▶ submit 5 jobs");
    row.appendChild(play);
    root.append(wrap, row, stat);

    const dot = (n, state) => {
      const d = el("span", "tok " + state, "job " + n);
      d.style.fontSize = ".62em";
      return d;
    };

    let timers = [];
    play.addEventListener("click", () => {
      timers.forEach(clearTimeout); timers = [];
      [client, api, queue, workers].forEach(x => x.body.innerHTML = "");
      const N = 5, workTime = 1600;
      const done = [];
      for (let i = 1; i <= N; i++) {
        timers.push(setTimeout(() => {
          api.body.appendChild(dot(i, "c"));
          stat.textContent = "job " + i + " accepted → 202 + job_id returned instantly";
        }, i * 300));
        timers.push(setTimeout(() => {
          api.body.innerHTML = "";
          queue.body.appendChild(dot(i, "a"));
        }, i * 300 + 280));
      }
      // two workers pull jobs
      let t = N * 300 + 400;
      for (let i = 1; i <= N; i += 2) {
        const batch = [i, i + 1].filter(x => x <= N);
        timers.push(setTimeout(() => {
          batch.forEach(j => {
            const chipEl = Array.from(queue.body.children).find(c => c.textContent === "job " + j);
            if (chipEl) chipEl.remove();
            workers.body.appendChild(dot(j, "hot"));
          });
          stat.textContent = "workers processing job" + (batch.length > 1 ? "s" : "") + " " + batch.join(" & ") + " — queue holds the rest";
        }, t));
        t += workTime;
        timers.push(setTimeout(() => {
          batch.forEach(j => {
            const chipEl = Array.from(workers.body.children).find(c => c.textContent === "job " + j);
            if (chipEl) chipEl.remove();
            client.body.appendChild(dot(j, "b"));
            done.push(j);
          });
          stat.textContent = done.length === N
            ? "all results in Redis — client polls pick them up. No request ever timed out."
            : "results ready for job " + batch.join(" & ") + " — client's next poll returns them";
        }, t));
        t += 200;
      }
    });
  }

  /* ---------- 12. context window meter ---------- */

  function initContext(root) {
    const C = D.contextMeter;
    const win = el("div", "card");
    win.style.cssText = "min-height:10em;display:flex;flex-wrap:wrap;gap:.35em;align-content:flex-start;padding:.8em;";
    const cap = el("div", "small mute vgap", "The window starts clean: instructions + the things that matter.");
    const row = el("div", "ctlrow");
    const pollute = el("button", "ctl", "keep working (pollute)");
    const compact = el("button", "ctl", "compact / summarise");
    row.append(pollute, compact);
    root.append(win, row, cap);

    function fill(items, cls) {
      items.forEach(t => {
        const c = el("span", "tok " + cls, t);
        c.style.fontSize = ".68em";
        win.appendChild(c);
      });
    }
    function reset() {
      win.innerHTML = "";
      fill(C.good, "b");
    }
    let rotLevel = 0;
    pollute.addEventListener("click", () => {
      rotLevel++;
      fill(C.rot.slice(0, rotLevel * 2).map(t => t), "ghost");
      fill(rotLevel > 1 ? ["yet another stack trace", "asides"] : [], "ghost");
      cap.innerHTML = rotLevel < 2
        ? "Every tool call and dead end stays in the window. The model must attend over <b>all</b> of it."
        : "<b class='bad'>Context rot:</b> the signal is drowning. Recall degrades long before the window is technically full.";
    });
    compact.addEventListener("click", () => {
      rotLevel = 0; reset();
      fill(["summary of earlier work"], "d");
      cap.innerHTML = "<b class='cobalt'>Compaction:</b> replace the history with a short summary and keep going. This is what good agents (and Claude Code) do.";
    });
    reset();
  }

  /* ---------- DL-1. a single neuron (housing price, ReLU) ---------- */

  function initNeuron(root) {
    // price (₹ lakh) = max(0, 1.2 · (size − 20))
    const W = 1.2, B = -24;
    const price = s => Math.max(0, W * s + B);

    const dia = el("div");
    dia.style.cssText = "display:flex;align-items:center;gap:.9em;margin:.6em 0;flex-wrap:wrap;";
    const inBox = el("div", "card", "<h3 style='font-size:.8em'>input</h3><div class='small'>size of house</div><div id='nrn-in' class='stat' style='font-size:1.3em'>90 m²</div>");
    const neuron = el("div", "card", "<h3 style='font-size:.8em'>one neuron</h3><div class='small' style='font-family:var(--mono)'>max(0, w·size + b)</div>");
    neuron.style.borderColor = "var(--cobalt)"; neuron.style.background = "var(--cobalt-soft)";
    const outBox = el("div", "card", "<h3 style='font-size:.8em'>output</h3><div class='small'>predicted price</div><div id='nrn-out' class='stat' style='font-size:1.3em'></div>");
    const a1 = el("div", "", "→"), a2 = el("div", "", "→");
    [a1, a2].forEach(a => a.style.cssText = "font-family:var(--mono);color:var(--ink-mute);font-size:1.3em;");
    dia.append(inBox, a1, neuron, a2, outBox);

    // function plot: the bent line
    const box = svg("svg", { viewBox: "0 0 560 240", class: "diagram", style: "max-width:34em", "aria-label": "price vs size, ReLU shape" });
    const X0 = 55, Y0 = 205, XW = 470, YH = 170, SMAX = 200, PMAX = price(SMAX);
    const px = s => X0 + (s / SMAX) * XW;
    const py = p => Y0 - (p / PMAX) * YH;
    box.appendChild(svg("line", { x1: X0, y1: Y0, x2: X0 + XW + 15, y2: Y0, stroke: "var(--ink-mute)", "stroke-width": 1.4 }));
    box.appendChild(svg("line", { x1: X0, y1: Y0, x2: X0, y2: 20, stroke: "var(--ink-mute)", "stroke-width": 1.4 }));
    const xl = svg("text", { x: X0 + XW / 2, y: 232, "text-anchor": "middle", class: "sub" }); xl.textContent = "size (m²)";
    const yl = svg("text", { x: 14, y: 115, class: "sub", transform: "rotate(-90 14 115)", "text-anchor": "middle" }); yl.textContent = "price (₹ lakh)";
    box.append(xl, yl);
    box.appendChild(svg("path", {
      d: `M ${px(0)} ${py(0)} L ${px(20)} ${py(0)} L ${px(SMAX)} ${py(price(SMAX))}`,
      fill: "none", stroke: "var(--cobalt)", "stroke-width": 3.2, "stroke-linecap": "round",
    }));
    const bendLbl = svg("text", { x: px(24), y: py(0) - 12, class: "sub" });
    bendLbl.textContent = "← the bend: below 20 m², predict 0";
    box.appendChild(bendLbl);
    const dot = svg("circle", { cx: px(90), cy: py(price(90)), r: 8, fill: "var(--cobalt-deep)", stroke: "#fff", "stroke-width": 2 });
    box.appendChild(dot);

    const row = el("div", "ctlrow");
    const lbl = el("label", "", "drag the size:");
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = "0"; slider.max = "200"; slider.value = "90";
    slider.setAttribute("aria-label", "house size");
    row.append(lbl, slider);

    const cap = el("p", "small",
      "This bent line has a name — <b>ReLU</b>. One neuron = multiply, add, bend. That's it. Remember the bend; it returns in a few slides.");
    root.append(dia, row, box, cap);

    function render() {
      const s = Number(slider.value);
      inBox.querySelector("#nrn-in").textContent = s + " m²";
      outBox.querySelector("#nrn-out").textContent = "₹" + Math.round(price(s)) + "L";
      dot.setAttribute("cx", px(s)); dot.setAttribute("cy", py(price(s)));
    }
    slider.addEventListener("input", render);
    render();
  }

  /* ---------- DL-2. stacking neurons: a network ---------- */

  function initNetwork(root) {
    const inputs = ["size", "bedrooms", "pincode", "area wealth"];
    const hidden = [
      { name: "h1", learned: "“fits a family?”", feeds: [0, 1] },
      { name: "h2", learned: "“commute & walkability”", feeds: [2] },
      { name: "h3", learned: "“school quality”", feeds: [2, 3] },
    ];
    const box = svg("svg", { viewBox: "0 0 900 320", class: "diagram", style: "max-width:46em", "aria-label": "small neural network" });
    const xin = 120, xh = 450, xout = 780;
    const yin = i => 55 + i * 72, yh = i => 80 + i * 82, yout = 160;

    const edges = [];
    inputs.forEach((_, i) => hidden.forEach((h, j) => {
      const e = svg("line", { x1: xin + 62, y1: yin(i), x2: xh - 34, y2: yh(j), stroke: "var(--line)", "stroke-width": 1.6 });
      e.dataset.h = j; e.dataset.i = i;
      edges.push(e); box.appendChild(e);
    }));
    hidden.forEach((_, j) => {
      box.appendChild(svg("line", { x1: xh + 34, y1: yh(j), x2: xout - 40, y2: yout, stroke: "var(--line)", "stroke-width": 1.6 }));
    });

    inputs.forEach((t, i) => {
      const g = svg("g", {});
      g.appendChild(svg("rect", { x: xin - 58, y: yin(i) - 17, width: 120, height: 34, rx: 8, fill: "var(--panel)", stroke: "var(--line)", "stroke-width": 1.5 }));
      const tx = svg("text", { x: xin + 2, y: yin(i) + 5, "text-anchor": "middle", "font-size": "14" });
      tx.textContent = t; g.appendChild(tx); box.appendChild(g);
    });
    const hintTxt = svg("text", { x: xh, y: 26, "text-anchor": "middle", class: "sub" });
    hintTxt.textContent = "hover a hidden neuron";
    box.appendChild(hintTxt);
    const learnedLbl = el("p", "small vgap", "&nbsp;");
    hidden.forEach((h, j) => {
      const g = svg("g", { style: "cursor:pointer" });
      const c = svg("circle", { cx: xh, cy: yh(j), r: 26, fill: "var(--cobalt-soft)", stroke: "var(--cobalt)", "stroke-width": 2 });
      g.appendChild(c); box.appendChild(g);
      g.addEventListener("mouseenter", () => {
        edges.forEach(e => {
          const on = Number(e.dataset.h) === j;
          e.setAttribute("stroke", on ? "var(--cobalt)" : "var(--line)");
          e.setAttribute("stroke-width", on ? 3 : 1.6);
        });
        learnedLbl.innerHTML = "That neuron ended up computing something like <b>" + h.learned + "</b> — nobody told it to. It <em>invented</em> that feature because it helped predict price.";
      });
      g.addEventListener("mouseleave", () => {
        edges.forEach(e => { e.setAttribute("stroke", "var(--line)"); e.setAttribute("stroke-width", 1.6); });
      });
    });
    const og = svg("g", {});
    og.appendChild(svg("rect", { x: xout - 40, y: yout - 20, width: 110, height: 40, rx: 8, fill: "var(--cobalt)", stroke: "var(--cobalt-deep)" }));
    const ot = svg("text", { x: xout + 15, y: yout + 5, "text-anchor": "middle", "font-size": "14", fill: "#fff" });
    ot.textContent = "price"; og.appendChild(ot); box.appendChild(og);

    root.append(box, learnedLbl);
  }

  /* ---------- DL-3. scale drives progress (after Andrew Ng) ---------- */

  function initScaleGraph(root) {
    const curves = [
      { key: "trad", label: "traditional ML (SVM, regression…)", color: "#c22f2f", w: 2.4,
        d: "M80,462 C180,392 260,368 380,362 C560,356 760,354 900,352",
        cap: "Small data: everything works about equally — skill and feature engineering decide. More data? <b>It plateaus.</b>" },
      { key: "small", label: "small neural net", color: "#8fb0ee", w: 2.4,
        d: "M80,462 C200,368 320,318 500,300 C650,290 800,287 900,285",
        cap: "A small neural net does a bit better… then plateaus too. Capacity is the ceiling." },
      { key: "med", label: "medium neural net", color: "#3d78e8", w: 3,
        d: "M80,462 C220,355 380,278 560,240 C700,220 820,213 900,208",
        cap: "More capacity → the plateau moves up and to the right." },
      { key: "large", label: "large neural net", color: "#16419c", w: 3.6,
        d: "M80,462 C240,345 420,245 620,170 C760,122 860,98 900,84",
        cap: "<b>The large net just keeps climbing.</b> Feed it more data, it gets better. This one picture is the business case for the last decade of AI." },
    ];
    let shown = -1;

    const box = svg("svg", { viewBox: "0 0 1000 520", class: "diagram", style: "max-width:46em;display:block", "aria-label": "performance vs amount of data" });
    box.appendChild(svg("line", { x1: 70, y1: 470, x2: 950, y2: 470, stroke: "var(--ink-mute)", "stroke-width": 1.6 }));
    box.appendChild(svg("line", { x1: 70, y1: 470, x2: 70, y2: 40, stroke: "var(--ink-mute)", "stroke-width": 1.6 }));
    const xl = svg("text", { x: 510, y: 505, "text-anchor": "middle", class: "sub" });
    xl.textContent = "amount of labeled data (x, y pairs)";
    const yl = svg("text", { x: 30, y: 255, "text-anchor": "middle", class: "sub", transform: "rotate(-90 30 255)" });
    yl.textContent = "performance";
    box.append(xl, yl);
    const zone = svg("text", { x: 150, y: 300, class: "sub", opacity: 0 });
    zone.textContent = "← small-data zone: algorithms tie";
    box.appendChild(zone);

    const paths = curves.map(c => {
      const p = svg("path", { d: c.d, fill: "none", stroke: c.color, "stroke-width": c.w, "stroke-linecap": "round", opacity: 0 });
      box.appendChild(p);
      const end = c.d.split(" ").pop().split(",");
      const t = svg("text", { x: Number(end[0]) - 4, y: Number(end[1]) - 10, "text-anchor": "end", "font-size": "13", fill: c.color, opacity: 0, "font-weight": "600" });
      t.textContent = c.label;
      box.appendChild(t);
      return { p, t };
    });

    const cap = el("p", "small");
    cap.style.minHeight = "3em";
    cap.innerHTML = "Press <b>add a curve</b>. Redrawn from Andrew Ng's famous whiteboard chart.";
    const row = el("div", "ctlrow");
    const btn = el("button", "ctl primary", "add a curve ▸");
    const rst = el("button", "ctl", "↺");
    row.append(btn, rst);
    root.append(box, row, cap);

    function paint() {
      paths.forEach(({ p, t }, i) => {
        const on = i <= shown;
        if (on && p.getAttribute("opacity") === "0") {
          const len = p.getTotalLength();
          p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
          p.setAttribute("opacity", 1);
          requestAnimationFrame(() => {
            p.style.transition = "stroke-dashoffset .9s ease";
            p.style.strokeDashoffset = 0;
          });
          setTimeout(() => t.setAttribute("opacity", 1), 700);
        } else if (!on) {
          p.setAttribute("opacity", 0); p.style.transition = "none"; t.setAttribute("opacity", 0);
        }
      });
      zone.setAttribute("opacity", shown >= 0 ? 1 : 0);
      cap.innerHTML = shown < 0
        ? "Press <b>add a curve</b>. Redrawn from Andrew Ng's famous whiteboard chart."
        : curves[shown].cap;
      btn.disabled = shown >= curves.length - 1;
    }
    btn.addEventListener("click", () => { shown = Math.min(shown + 1, curves.length - 1); paint(); });
    rst.addEventListener("click", () => { shown = -1; paint(); });
    paint();
  }

  /* ---------- DL-4. sigmoid vs ReLU: where gradients die ---------- */

  function initSigmoidRelu(root) {
    const sig = x => 1 / (1 + Math.exp(-x));
    const mk = (title) => {
      const wrap = el("div", "card");
      wrap.style.cssText = "flex:1;padding:.7em .9em;";
      wrap.innerHTML = "<h3 style='font-size:.8em'>" + title + "</h3>";
      const s = svg("svg", { viewBox: "0 0 440 200", class: "diagram" });
      wrap.appendChild(s);
      const read = el("div", "small", "&nbsp;");
      read.style.fontFamily = "var(--mono)";
      wrap.appendChild(read);
      return { wrap, svg: s, read };
    };
    const X = x => 220 + x * 32;           // x in [-6, 6]
    const YS = y => 170 - y * 140;         // sigmoid y in [0, 1]
    const YR = y => 170 - y * 24;          // relu y in [0, 6]

    const S = mk("sigmoid — the old default"), R = mk("ReLU — the fix");
    // axes
    [S, R].forEach(({ svg: s }) => {
      s.appendChild(svg("line", { x1: 10, y1: 170, x2: 430, y2: 170, stroke: "var(--line)", "stroke-width": 1.2 }));
      s.appendChild(svg("line", { x1: 220, y1: 10, x2: 220, y2: 190, stroke: "var(--line)", "stroke-width": 1.2 }));
    });
    // flat-zone shading on sigmoid
    S.svg.appendChild(svg("rect", { x: X(-6), y: 10, width: X(-2.8) - X(-6), height: 180, fill: "#c22f2f", opacity: .07 }));
    S.svg.appendChild(svg("rect", { x: X(2.8), y: 10, width: X(6) - X(2.8), height: 180, fill: "#c22f2f", opacity: .07 }));
    const fz = svg("text", { x: X(-4.4), y: 30, "text-anchor": "middle", class: "sub", fill: "#c22f2f" });
    fz.textContent = "flat zone"; S.svg.appendChild(fz);
    const fz2 = svg("text", { x: X(4.4), y: 30, "text-anchor": "middle", class: "sub", fill: "#c22f2f" });
    fz2.textContent = "flat zone"; S.svg.appendChild(fz2);
    // curves
    let dS = "M";
    for (let x = -6; x <= 6.01; x += 0.25) dS += ` ${X(x)},${YS(sig(x))}`;
    S.svg.appendChild(svg("path", { d: dS, fill: "none", stroke: "var(--cobalt)", "stroke-width": 3 }));
    R.svg.appendChild(svg("path", { d: `M ${X(-6)},${YR(0)} L ${X(0)},${YR(0)} L ${X(6)},${YR(6)}`, fill: "none", stroke: "var(--cobalt)", "stroke-width": 3 }));
    const dotS = svg("circle", { r: 7, fill: "var(--cobalt-deep)", stroke: "#fff", "stroke-width": 2 });
    const dotR = svg("circle", { r: 7, fill: "var(--cobalt-deep)", stroke: "#fff", "stroke-width": 2 });
    S.svg.appendChild(dotS); R.svg.appendChild(dotR);

    const cols = el("div");
    cols.style.cssText = "display:flex;gap:1em;margin:.6em 0;";
    cols.append(S.wrap, R.wrap);

    const row = el("div", "ctlrow");
    row.appendChild(el("label", "", "move the neuron's input:"));
    const slider = document.createElement("input");
    slider.type = "range"; slider.min = "-6"; slider.max = "6"; slider.step = "0.1"; slider.value = "4";
    slider.setAttribute("aria-label", "neuron input");
    row.appendChild(slider);
    const cap = el("p", "small");
    root.append(cols, row, cap);

    function render() {
      const x = Number(slider.value);
      const gs = sig(x) * (1 - sig(x));
      const gr = x > 0 ? 1 : 0;
      dotS.setAttribute("cx", X(x)); dotS.setAttribute("cy", YS(sig(x)));
      dotR.setAttribute("cx", X(x)); dotR.setAttribute("cy", YR(Math.max(0, x)));
      S.read.innerHTML = "slope here: <b>" + gs.toFixed(3) + "</b>" + (gs < 0.02 ? " — <span style='color:#c22f2f'>≈ 0, learning stalls</span>" : "");
      R.read.innerHTML = "slope here: <b>" + gr.toFixed(0) + "</b>" + (gr === 1 ? " — <span style='color:var(--good)'>update flows at full strength</span>" : "");
      cap.innerHTML = Math.abs(x) > 2.8
        ? "Learning = walking downhill along the slope (<b>gradient descent</b>). In sigmoid's flat zones the slope is ≈ 0 — steps shrink to nothing and training <b>crawls</b>. ReLU keeps the slope alive, so the same hardware trains a much bigger net in the same time."
        : "Both look fine near the middle. Drag to the edges — that's where deep networks actually spend their lives.";
    }
    slider.addEventListener("input", render);
    render();
  }

  /* ---------- DL-5. the iteration cycle ---------- */

  function initCycle(root) {
    const dia = el("div");
    dia.style.cssText = "display:flex;gap:.8em;align-items:center;margin:.8em 0;";
    const nodes = ["idea", "code", "experiment"].map(t => {
      const c = el("div", "card");
      c.style.cssText = "padding:.6em 1.4em;font-family:var(--display);font-weight:600;transition:all .2s;";
      c.textContent = t;
      dia.appendChild(c);
      return c;
    });
    dia.insertBefore(el("div", "mute", "→"), nodes[1]);
    dia.insertBefore(el("div", "mute", "→"), nodes[2]);
    const loop = el("div", "small mute", "⟲ what you learn feeds the next idea");

    const counter = el("div", "");
    counter.innerHTML = "<span class='stat' id='cyc-n'>0</span> <span class='stat-label'>ideas tested</span>";
    const row = el("div", "ctlrow");
    const slow = el("button", "ctl primary", "▶ 2005: one experiment ≈ weeks");
    const fast = el("button", "ctl", "▶ now: GPUs — same experiment in minutes");
    row.append(slow, fast);
    const cap = el("p", "small", "Progress isn't measured in ideas you <em>have</em> — it's ideas you <em>test</em>. Compute doesn't just make models bigger; it makes the loop spin faster.");
    root.append(dia, loop, row, counter, cap);

    let timer = null;
    function run(ms, label) {
      clearInterval(timer);
      let n = 0, stage = 0;
      const nEl = counter.querySelector("#cyc-n");
      nEl.textContent = "0";
      const t0 = performance.now();
      timer = setInterval(() => {
        nodes.forEach((c, i) => {
          c.style.borderColor = i === stage ? "var(--cobalt)" : "var(--line)";
          c.style.background = i === stage ? "var(--cobalt-soft)" : "var(--panel)";
        });
        stage = (stage + 1) % 3;
        if (stage === 0) { n++; nEl.textContent = String(n); }
        if (performance.now() - t0 > 6000) {
          clearInterval(timer);
          nodes.forEach(c => { c.style.borderColor = "var(--line)"; c.style.background = "var(--panel)"; });
          cap.innerHTML = "In the same six seconds of “research time”: <b>" + n + "</b> ideas tested at " + label + " speed. Faster loops compound — that's why better hardware <em>and</em> faster-training algorithms (like ReLU) both show up as <b>more progress</b>, not just bigger models.";
        }
      }, ms);
    }
    slow.addEventListener("click", () => run(600, "2005"));
    fast.addEventListener("click", () => run(80, "today's"));
  }

  /* ---------- registry ---------- */

  const INITS = {
    neuron: initNeuron,
    network: initNetwork,
    scalegraph: initScaleGraph,
    sigmoidrelu: initSigmoidRelu,
    cycle: initCycle,
    tokenizer: initTokenizer,
    predictor: initPredictor,
    temperature: initTemperature,
    transformer: initTransformer,
    attention: initAttention,
    embeddings: initEmbeddings,
    scale: initScale,
    pipeline: initPipeline,
    agentloop: initAgentLoop,
    sse: initSSE,
    queue: initQueue,
    context: initContext,
  };

  window.Interactives = {
    activate(slide) {
      slide.querySelectorAll("[data-interactive]").forEach(node => {
        if (node.dataset.ready) return;
        const fn = INITS[node.dataset.interactive];
        if (fn) { fn(node); node.dataset.ready = "1"; }
      });
    },
  };
})();
