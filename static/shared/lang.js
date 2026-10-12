// Which language a page is read in: English, or Arabic — read right to left.
//
// The call page is opened by a stranger at a sign in Dubai. It opens in the
// language their phone is set to (Arabic, or English for anything else), and
// one tap on its switch changes it — kept on that phone for the next visit. A
// link may say for one visit: ?lang=ar, ?lang=en.
//
// Each page keeps its own sentences, in both languages, in its own words.js.
// This is only what they share: choosing, turning the page, filling it in.

export const LANGUAGES = ["en", "ar"];
const KEPT = "webcall.lang";

/** The language to open in: the link's, else this phone's last choice
    (`remembered`), else the phone's own. */
export function chooseLanguage({ remembered = true } = {}) {
  const asked = new URLSearchParams(location.search).get("lang");
  if (LANGUAGES.includes(asked)) return asked;
  if (remembered) {
    try {
      const kept = localStorage.getItem(KEPT);
      if (LANGUAGES.includes(kept)) return kept;
    } catch (error) {
      /* a private window, or storage blocked: the phone decides */
    }
  }
  const phone = String((navigator.languages && navigator.languages[0]) || navigator.language || "");
  return /^ar\b/i.test(phone) ? "ar" : "en";
}

/** Turn the whole page to `lang` — its direction with it. `remember` keeps
    the choice on this phone. */
export function setLanguage(lang, { remember = false } = {}) {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === "ar" ? "rtl" : "ltr";
  if (remember) {
    try {
      localStorage.setItem(KEPT, lang);
    } catch (error) {
      /* not kept for next time; switched all the same */
    }
  }
}

/**
 * A page's sentences in one language: t(key, values). A sentence that
 * language does not have is shown in English — never a blank, never a key.
 * `{name}` in a sentence is filled from `values`.
 */
export function words(tables, lang) {
  const own = tables[lang] || {};
  const t = (key, values) => {
    let text = key in own ? own[key] : key in tables.en ? tables.en[key] : key;
    if (values) text = text.replace(/\{(\w+)\}/g, (all, name) => (name in values ? String(values[name]) : all));
    return text;
  };
  t.lang = lang;
  // Something inside a sentence that may run the other way — a name, a
  // number, a tower — kept in one piece (a Unicode isolate), so that the
  // Arabic around it does not turn it round. In English, left as it is.
  t.whole = (text) => (lang === "ar" && text ? `⁨${text}⁩` : String(text ?? ""));
  return t;
}

/** The words written into the page itself: data-t (its text), data-t-label
    (aria-label), data-t-hint (placeholder), data-t-title (title), data-t-alt
    (what a picture shows, for whoever cannot see it). */
export function fillIn(t, root = document) {
  for (const el of root.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  for (const el of root.querySelectorAll("[data-t-label]")) el.setAttribute("aria-label", t(el.dataset.tLabel));
  for (const el of root.querySelectorAll("[data-t-hint]")) el.setAttribute("placeholder", t(el.dataset.tHint));
  for (const el of root.querySelectorAll("[data-t-title]")) el.setAttribute("title", t(el.dataset.tTitle));
  for (const el of root.querySelectorAll("[data-t-alt]")) el.setAttribute("alt", t(el.dataset.tAlt));
}
