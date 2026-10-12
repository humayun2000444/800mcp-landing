// The landing page — 800mcp.com.
//
// Who we are, what we do, the film and how to reach us, in English or Arabic
// (words.js): the phone's own language, or the switch in the bar, kept on that
// phone — and the call page follows it. Every "Live preview" is the way into a
// call with the assistant (/call), in the language this page is read in.
//
// The film: a short silent loop of it plays in the hero (300 KB), and the
// whole film, with its sound, is one tap away. Not for anyone who asked for
// less motion or less data — they get the film's poster and its own controls.

import { chooseLanguage, fillIn, setLanguage, words } from "../shared/lang.js";
import { WORDS } from "./words.js";

const $ = (selector) => document.querySelector(selector);
// (Relative: the same files work from the service and from any static host.)
const LOOP = "static/landing/media/800mcp-loop.mp4";
const FILM = "static/landing/media/800mcp-film.mp4";
const setting = (name) => (document.querySelector(`meta[name="800mcp:${name}"]`) || {}).content;
// Where "Live preview & booking" goes: the call page, wherever the call is.
const CALL = setting("call") || "/call";
const SERVICE = setting("service") || "";

let t = words(WORDS, chooseLanguage());
let status = "";            // "ai" | "agent" | "" — who would answer a call just now

function draw() {
  setLanguage(t.lang);
  fillIn(t);
  document.title = t("title");
  $('meta[name="description"]').setAttribute("content", t("description"));
  // The switch names the other language, in that language.
  $("#lang-btn").lang = t.lang === "ar" ? "en" : "ar";
  // Into a call, in this page's language.
  for (const link of document.querySelectorAll(".js-call")) {
    link.href = CALL.startsWith("#") ? CALL : `${CALL}${CALL.includes("?") ? "&" : "?"}lang=${t.lang}`;
  }
  $("#biz-mail").href = `mailto:support@800mcp.com?subject=${encodeURIComponent(t("biz.subject"))}`;
  $("#rights").textContent = t("footer.rights", { year: new Date().getFullYear() });
  const [before, after] = t("footer.credit").split("{site}");
  const site = document.createElement("b");
  site.lang = "en";
  site.textContent = "cameramcp.com";
  $("#credit").replaceChildren(before, site, after || "");
  drawStatus();
}

function drawStatus() {
  $("#status").hidden = !status;
  if (status) $("#status-text").textContent = t(`status.${status}`);
}

$("#lang-btn").addEventListener("click", () => {
  t = words(WORDS, t.lang === "ar" ? "en" : "ar");
  setLanguage(t.lang, { remember: true });
  draw();
});

// Who would answer right now — said only when it is so.
(SERVICE === "none" ? Promise.reject(new Error("not asked")) : fetch(`${SERVICE}api/public/config`, { cache: "no-store" }))
  .then((response) => response.json())
  .then((config) => {
    status = config.answer === "ai" ? "ai" : config.agents_available ? "agent" : "";
    drawStatus();
  })
  .catch(() => {});

// ── the film ──────────────────────────────────────────────────────────────

const film = $("#film-video");
const sound = $("#film-sound");
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  || !!(navigator.connection && navigator.connection.saveData);
let mode = "film";          // "loop" while the silent loop plays in the hero

function wholeFilm(play) {
  if (mode === "loop") {
    mode = "film";
    film.loop = false;
    film.muted = false;
    film.controls = true;
    film.src = FILM;
  }
  sound.hidden = true;
  if (play) {
    const playing = film.play();
    if (playing && playing.catch) playing.catch(() => {});
  }
}

if (!calm) {
  mode = "loop";
  film.controls = false;
  film.muted = true;
  film.loop = true;
  film.setAttribute("muted", "");
  film.src = LOOP;
  sound.hidden = false;
  const playing = film.play();
  // A browser that will not play it by itself: the film, its poster and its controls.
  if (playing && playing.catch) playing.catch(() => wholeFilm(false));
  // Off the screen, the loop rests.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (mode !== "loop") return;
      if (entry.isIntersecting) film.play().catch(() => {});
      else film.pause();
    }).observe(film);
  }
}

sound.addEventListener("click", () => wholeFilm(true));
// "Watch the film": to the film, and playing with its sound — the tap is what lets it.
$("#watch").addEventListener("click", (event) => {
  event.preventDefault();
  $("#film").scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
  wholeFilm(true);
});

// ── the bar ───────────────────────────────────────────────────────────────

const bar = $(".bar");
const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Where the reader is: that section's name marked in the bar.
const links = [...document.querySelectorAll(".nav a")];
if ("IntersectionObserver" in window) {
  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (link.getAttribute("href") === `#${entry.target.id}`) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    }
  }, { rootMargin: "-45% 0px -50% 0px" });
  for (const link of links) {
    const section = document.querySelector(link.getAttribute("href"));
    if (section) watch.observe(section);
  }
}

draw();
// Read by the automated test.
window.__landing = { get lang() { return t.lang; }, get film() { return mode; }, get status() { return status; } };
