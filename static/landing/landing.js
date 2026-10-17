// The landing page — 800mcp.com.
//
// Who we are, what we do, the film and how to reach us, in English or Arabic
// (words.js): the phone's own language, or the switch in the bar, kept on that
// phone — and the call page follows it. Every "Live preview" is the way into a
// call with the assistant (/call), in the language this page is read in.
//
// The page tells one evening, from the outside in (night.js draws the city):
// the skyline at the top with its windows lighting up (shared/night.js — the call
// page stands on the same city), four moments by the
// clock, a departures board on which every call is free — with Dubai's own time
// on it — and one lit window at the end.
//
// The film: a short silent loop of it plays in the hero (300 KB), and the
// whole film, with its sound, is one tap away. Not for anyone who asked for
// less motion or less data — they get the film's poster and its own controls.

import { chooseLanguage, fillIn, setLanguage, words } from "../shared/lang.js";
import { facade, skyline } from "../shared/night.js";
import { WORDS } from "./words.js";

const $ = (selector) => document.querySelector(selector);
// (Relative: the same files work from the service and from any static host.)
// The film is made in each language: the Arabic page shows the Arabic one.
const MEDIA = "static/landing/media/";
const filmOf = (lang) => {
  const ar = lang === "ar" ? "-ar" : "";
  return { loop: `${MEDIA}800mcp-loop${ar}.mp4`, film: `${MEDIA}800mcp-film${ar}.mp4`, poster: `${MEDIA}800mcp-film-poster${ar}.jpg` };
};
const setting = (name) => (document.querySelector(`meta[name="800mcp:${name}"]`) || {}).content;
// Where "Live preview & booking" goes: the call page, wherever the call is.
const CALL = setting("call") || "/call";
const SERVICE = setting("service") || "";
const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  || !!(navigator.connection && navigator.connection.saveData);

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
  // How far each city on the board is — the number as it is written in both languages.
  for (const cell of document.querySelectorAll("[data-km]")) {
    cell.textContent = t("board.km", { n: Number(cell.dataset.km).toLocaleString("en-US") });
  }
  drawClock();
  drawStatus();
  drawFilm();
  // The four moments are stills of the film — of the film in this language.
  for (const img of document.querySelectorAll(".moments img")) {
    const src = img.getAttribute("src").replace(/step-(\d)(-ar)?\.jpg$/, (_, n) => `step-${n}${t.lang === "ar" ? "-ar" : ""}.jpg`);
    if (src !== img.getAttribute("src")) img.setAttribute("src", src);
  }
  // The city turns round with the page.
  if (city) city.redo();
}

function drawStatus() {
  $("#status").hidden = !status;
  if (status) $("#status-text").textContent = t(`status.${status}`);
}

// The departures board says what time it is in Dubai — now, wherever it is read.
function drawClock() {
  const clock = $("#board-clock");
  try {
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .format(new Date());
    clock.textContent = t("board.clock", { time });
    clock.hidden = false;
  } catch (error) {
    clock.hidden = true;     // a browser that does not know Dubai's time: no clock rather than a wrong one
  }
}
setInterval(drawClock, 15000);

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

// ── the city ──────────────────────────────────────────────────────────────

let city = null;
let tower = null;
try {
  city = skyline($("#skyline"), { calm, rtl: () => t.lang === "ar" });
  tower = facade($("#facade"), $("#yours"), { calm });
} catch (error) {
  /* the page is whole without its city */
}

// The board turns its flaps once, the first time it is seen.
if (!calm && "IntersectionObserver" in window) {
  const board = $("#board");
  const seen = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    board.classList.add("flipping");
    seen.disconnect();
  }, { threshold: 0.35 });
  seen.observe(board);
}

// ── the film ──────────────────────────────────────────────────────────────

const film = $("#film-video");
const sound = $("#film-sound");
let mode = "film";          // "loop" while the silent loop plays in the hero
let filmLang = "";          // the language of the film now in the player

// The film in this page's language — swapped where it stands (loop or whole film).
function drawFilm() {
  if (filmLang === t.lang) return;
  const first = !filmLang;
  filmLang = t.lang;
  const media = filmOf(t.lang);
  film.poster = media.poster;
  // First time: the loop's source is chosen below; the plain film (for anyone
  // who asked for less motion) is the page's own <source> — in English.
  if (first) { if (mode !== "loop" && t.lang !== "en") film.src = media.film; return; }
  const wasPlaying = !film.paused;
  film.src = mode === "loop" ? media.loop : media.film;
  if (wasPlaying || mode === "loop") film.play().catch(() => {});
}

function wholeFilm(play) {
  if (mode === "loop") {
    mode = "film";
    film.loop = false;
    film.muted = false;
    film.controls = true;
    film.src = filmOf(t.lang).film;
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
  film.src = filmOf(t.lang).loop;
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
window.__landing = {
  get lang() { return t.lang; },
  get film() { return mode; },
  get status() { return status; },
  get city() { return { skyline: city ? city.draws : 0, facade: tower ? tower.draws : 0 }; },
};
