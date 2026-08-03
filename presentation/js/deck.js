/* Deck engine — no dependencies.
   Keys: ←/→ or space = navigate (reveals build-steps first), M = menu,
   N = speaker notes, F = fullscreen, Home/End = first/last slide.
   URL hash (#12) deep-links a slide. */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll("section.slide"));
  const progress = document.getElementById("progress");
  const counter = document.getElementById("counter");
  const notes = document.getElementById("notes");
  const notesBody = document.getElementById("notes-body");
  const menu = document.getElementById("menu");
  const timerEl = document.getElementById("timer");
  let current = -1;
  let startedAt = null;

  /* ---------- navigation ---------- */

  function clamp(n) { return Math.max(0, Math.min(slides.length - 1, n)); }

  function go(n, { fromHash = false } = {}) {
    n = clamp(n);
    if (n === current) return;
    if (current >= 0) slides[current].classList.remove("active");
    current = n;
    const slide = slides[current];
    slide.classList.add("active");

    // stagger entrance animation indices
    slide.querySelectorAll(".rise").forEach((el, i) => el.style.setProperty("--i", i));

    progress.style.width = ((current + 1) / slides.length) * 100 + "%";
    counter.textContent = (current + 1) + " / " + slides.length;
    if (!fromHash) history.replaceState(null, "", "#" + (current + 1));
    renderNotes(slide);
    markMenu();
    if (!startedAt && current > 0) startedAt = Date.now();

    // let interactives lazily initialise
    if (window.Interactives) window.Interactives.activate(slide);
  }

  function pendingFrag(slide) {
    return slide.querySelector(".frag:not(.on)");
  }

  function next() {
    const slide = slides[current];
    const frag = pendingFrag(slide);
    if (frag) { frag.classList.add("on"); return; }
    go(current + 1);
  }

  function prev() {
    const slide = slides[current];
    const shown = Array.from(slide.querySelectorAll(".frag.on"));
    if (shown.length) { shown[shown.length - 1].classList.remove("on"); return; }
    go(current - 1);
    // arriving backwards: show all fragments so content isn't hidden
    slides[current].querySelectorAll(".frag").forEach(f => f.classList.add("on"));
  }

  /* ---------- speaker notes drawer ---------- */

  function renderNotes(slide) {
    const aside = slide.querySelector("aside.notes");
    notesBody.innerHTML = aside ? aside.innerHTML :
      "<p class='mute'>No notes for this slide.</p>";
  }

  function tickTimer() {
    if (!timerEl) return;
    if (!startedAt) { timerEl.textContent = "00:00"; return; }
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    timerEl.textContent = (h === "00" ? "" : h + ":") + m + ":" + ss;
  }
  setInterval(tickTimer, 1000);

  /* ---------- menu overlay ---------- */

  function buildMenu() {
    const parts = new Map();
    slides.forEach((s, i) => {
      const part = s.dataset.part || "Deck";
      if (!parts.has(part)) parts.set(part, []);
      parts.get(part).push({ i, title: s.dataset.title || "Slide " + (i + 1) });
    });
    const wrap = document.getElementById("menu-parts");
    wrap.innerHTML = "";
    for (const [part, items] of parts) {
      const div = document.createElement("div");
      div.className = "part";
      div.innerHTML = "<div class='part-title'>" + part + "</div>";
      items.forEach(({ i, title }) => {
        const a = document.createElement("a");
        a.href = "#" + (i + 1);
        a.dataset.slide = i;
        a.innerHTML = "<span class='n'>" + String(i + 1).padStart(2, "0") + "</span>" + title;
        a.addEventListener("click", (e) => {
          e.preventDefault();
          menu.classList.remove("open");
          go(i);
        });
        div.appendChild(a);
      });
      wrap.appendChild(div);
    }
  }

  function markMenu() {
    menu.querySelectorAll("a").forEach(a =>
      a.classList.toggle("here", Number(a.dataset.slide) === current));
  }

  /* ---------- input ---------- */

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea")) return;
    switch (e.key) {
      case "ArrowRight": case " ": case "PageDown": e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp": e.preventDefault(); prev(); break;
      case "Home": go(0); break;
      case "End": go(slides.length - 1); break;
      case "m": case "M": menu.classList.toggle("open"); break;
      case "n": case "N": notes.classList.toggle("open"); break;
      case "f": case "F":
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
      case "Escape": menu.classList.remove("open"); notes.classList.remove("open"); break;
    }
  });

  document.getElementById("nextbtn").addEventListener("click", next);
  document.getElementById("prevbtn").addEventListener("click", prev);

  let touchX = null;
  document.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener("touchend", e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) (dx < 0 ? next() : prev());
    touchX = null;
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) go(n - 1, { fromHash: true });
  });

  /* ---------- boot ---------- */

  buildMenu();
  const initial = parseInt(location.hash.slice(1), 10);
  go(isNaN(initial) ? 0 : initial - 1, { fromHash: true });
})();
