// The city at dusk — drawn, not filmed — for the top and the end of the landing
// page, and under the call page (the call comes from the same evening).
//
// The film opens on a skyline at dusk: a navy sky going violet and then ember at
// the horizon, towers in silhouette, their windows lit one by one, a tall spire
// with a red light on its tip, and a tower whose sign switches on: 800mcp.com.
// The top of the page is that skyline (skyline()), the evening coming as the
// page opens. The end of it is one tower's face, close, with one window lit
// brighter than the rest (facade()): "one of those windows could be yours".
//
// Nothing here is needed to read the page: with no canvas or no script it is
// the same page, only without its city. The towers stand in the same places on
// every visit (a seeded random), so the city never rearranges itself; what
// changes is which windows are lit, now and then, as in any city at night. For
// anyone who asked for less motion the evening has already come, and is still.
// Off the screen, or in a tab nobody is looking at, nothing is drawn at all.

const SKY = [                  // the film's own sky, top to horizon
  [0, "rgba(20, 25, 66, 0)"],
  [0.38, "rgba(56, 43, 94, 0.36)"],
  [0.66, "rgba(115, 67, 102, 0.62)"],
  [0.86, "rgba(162, 90, 79, 0.78)"],
  [1, "rgba(162, 90, 79, 0.5)"],
];
const GROUND = "#0b0e15";      // the page itself (--bg): where the city ends
const WARM = [255, 207, 122];  // a lit window
const COOL = [201, 211, 255];  // a television, a screen
const SIGN = "800mcp.com";

/** The same "random" every time, from a number. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * A canvas that keeps its own size and sharpness, draws only when it can be
 * seen, and is told the time since it first appeared. `build(w, h)` lays the
 * picture out for a size; `paint(ctx, layout, ms)` draws it at a moment and
 * says whether it is still moving (true: draw again next frame).
 */
function stage(canvas, { calm, build, paint, tick = 0, onTick }) {
  const ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) return null;
  let width = 0;
  let height = 0;
  let layout = null;
  let started = 0;
  let frame = 0;
  let timer = 0;
  let seen = false;
  let draws = 0;

  const ratio = () => Math.min(2, window.devicePixelRatio || 1);
  const now = () => (calm ? Infinity : performance.now() - started);

  function fit() {
    const box = canvas.getBoundingClientRect();
    const w = Math.round(box.width);
    const h = Math.round(box.height);
    if (!w || !h) return false;
    if (w === width && h === height && layout) return true;
    width = w;
    height = h;
    const r = ratio();
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);
    ctx.setTransform(r, 0, 0, r, 0, 0);
    layout = build(w, h);
    return true;
  }

  function draw() {
    // (Asked for from more than one place — a frame, the timer, a new size: one at a time.)
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (!fit()) return;
    if (!started) started = performance.now();
    ctx.clearRect(0, 0, width, height);
    const moving = paint(ctx, layout, now());
    draws += 1;
    if (moving && seen && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function wake() {
    if (!frame) frame = requestAnimationFrame(draw);
    if (!calm && tick && onTick && !timer) {
      timer = setInterval(() => {
        if (!layout) return;
        if (onTick(layout, now())) draw();
      }, tick);
    }
  }

  function rest() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    clearInterval(timer);
    timer = 0;
  }

  const update = () => (seen && !document.hidden ? wake() : rest());
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting;
      update();
    }, { rootMargin: "120px 0px" }).observe(canvas);
  } else {
    seen = true;
  }
  document.addEventListener("visibilitychange", update);
  if ("ResizeObserver" in window) new ResizeObserver(() => seen && draw()).observe(canvas);
  else window.addEventListener("resize", () => seen && draw());
  // Drawn once straight away, seen or not: a page scrolled through quickly (or
  // a picture of it taken) never meets an empty frame. It moves only when seen.
  draw();
  update();

  return {
    /** Lay it out again (a change of direction, a font arriving) and draw. */
    redo() {
      layout = null;
      if (seen) draw();
    },
    get draws() { return draws; },
    get size() { return { width, height }; },
    get layout() { return layout; },
  };
}

// ── the skyline ───────────────────────────────────────────────────────────

/**
 * The city at dusk along the foot of `canvas`. `rtl()` says whether the page
 * reads right to left: the city turns round with it (the spire stays at the
 * start, the sign tower towards the end), but the sign itself still reads
 * 800mcp.com. `tall` (0–1) lowers every tower, for a page whose words stand
 * just above the city (the call page): more sky, the sign lower down.
 */
export function skyline(canvas, { calm = false, rtl = () => false, tall = 1 } = {}) {
  function build(w, h) {
    const rnd = seeded(800);
    const s = Math.max(0.58, Math.min(1.15, w / 1240));
    const flip = rtl();
    const X = (x, width = 0) => (flip ? w - x - width : x);

    const stars = [];
    for (let i = 0, n = Math.round(46 * (w / 1240)); i < n; i++) {
      stars.push({ x: rnd() * w, y: rnd() * h * 0.5, r: rnd() < 0.85 ? 0.7 : 1.1, a: 0.18 + rnd() * 0.4 });
    }

    // Far away: low, violet, a few small lights.
    const far = [];
    for (let x = -10; x < w + 10;) {
      const bw = (18 + rnd() * 36) * s;
      const bh = h * (0.2 + rnd() * 0.3) * tall;
      const lights = [];
      for (let y = h - bh + 5 * s; y < h - 4; y += 6 * s) {
        for (let lx = 3 * s; lx < bw - 3 * s; lx += 5 * s) {
          if (rnd() < 0.09) lights.push({ x: lx, y, a: 0.25 + rnd() * 0.35 });
        }
      }
      far.push({ x, w: bw, h: bh, lights });
      x += bw + rnd() * 5 * s;
    }

    // The spire, near the start, as in the film.
    const spire = { x: w * 0.13, base: Math.max(26, 34 * s), h: h * 0.97 * tall };

    // Near: the towers whose windows light up — one of them carries the sign.
    const near = [];
    const signAt = w * (w < 720 ? 0.7 : 0.74);
    let signTower = null;
    for (let x = -24; x < w + 20;) {
      const isSign = !signTower && x + 60 * s > signAt;
      const bw = isSign ? Math.max(92, 128 * s) : (40 + rnd() * 92) * s;
      const bh = (isSign ? h * 0.7 : h * (0.26 + rnd() * 0.42)) * tall;
      const shade = ["#111726", "#131a2a", "#0f1522", "#151b2c"][Math.floor(rnd() * 4)];
      const cellW = 9 * s;
      const cellH = 11.5 * s;
      const windows = [];
      for (let y = h - bh + 9 * s; y < h - 6 * s; y += cellH) {
        for (let wx = 6 * s; wx + 5 * s < bw - 5 * s; wx += cellW) {
          const lit = rnd() < (isSign ? 0.32 : 0.23);
          windows.push({
            x: wx, y, lit,
            cool: rnd() < 0.16,
            a: 0.55 + rnd() * 0.42,
            at: 150 + rnd() * 2100, // when it comes on, as the evening falls
          });
        }
      }
      const tower = { x, w: bw, h: bh, shade, windows, win: [5 * s, 6.5 * s] };
      near.push(tower);
      if (isSign) signTower = tower;
      x += bw + (rnd() < 0.35 ? rnd() * 16 * s : 0);
    }

    const sign = signTower && {
      tower: signTower,
      w: signTower.w + 18 * s,
      h: Math.max(18, 27 * s),
      font: Math.max(10.5, 17 * s),
    };

    return { w, h, s, X, flip, stars, far, spire, near, sign, blink: false };
  }

  function paint(ctx, L, ms) {
    const { w, h, s, X } = L;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    for (const [at, colour] of SKY) sky.addColorStop(at, colour);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    for (const star of L.stars) {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.a})`;
      ctx.fillRect(X(star.x), star.y, star.r, star.r);
    }

    // The spire: four tapering stages and a needle, lavender in the last light.
    const { spire } = L;
    ctx.fillStyle = "rgba(121, 107, 140, 0.5)";
    const stages = [[1, 0.42], [0.66, 0.64], [0.4, 0.8], [0.2, 0.9], [0.06, 1]];
    let bottom = h;
    for (const [width, top] of stages) {
      const bw = spire.base * width;
      const y = h - spire.h * top;
      ctx.fillRect(X(spire.x - bw / 2, bw), y, bw, bottom - y);
      bottom = y;
    }
    // …and the red light on its tip, as every tall tower has.
    if (L.blink || ms === Infinity) {
      ctx.fillStyle = "rgba(255, 82, 82, 0.95)";
      ctx.shadowColor = "rgba(255, 60, 60, 0.9)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(X(spire.x), h - spire.h - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const tower of L.far) {
      ctx.fillStyle = "rgba(42, 36, 78, 0.78)";
      ctx.fillRect(X(tower.x, tower.w), h - tower.h, tower.w, tower.h);
      for (const light of tower.lights) {
        ctx.fillStyle = `rgba(255, 214, 160, ${light.a})`;
        ctx.fillRect(X(tower.x + light.x, 1.6 * s), light.y, 1.6 * s, 2.2 * s);
      }
    }

    let moving = false;
    for (const tower of L.near) {
      ctx.fillStyle = tower.shade;
      ctx.fillRect(X(tower.x, tower.w), h - tower.h, tower.w, tower.h);
      const [ww, wh] = tower.win;
      for (const win of tower.windows) {
        const on = win.lit && ms >= win.at;
        if (win.lit && !on) moving = true;
        ctx.fillStyle = on ? rgba(win.cool ? COOL : WARM, win.cool ? win.a * 0.55 : win.a) : "rgba(38, 46, 70, 0.55)";
        ctx.fillRect(X(tower.x + win.x, ww), win.y, ww, wh);
      }
    }

    if (L.sign) moving = paintSign(ctx, L, ms) || moving;

    // Where the city meets the page: the ground, the same navy as everything under it.
    const ground = ctx.createLinearGradient(0, h * 0.72, 0, h);
    ground.addColorStop(0, "rgba(11, 14, 21, 0)");
    ground.addColorStop(1, GROUND);
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    return moving;
  }

  // The sign switches on letter by letter, flickers once, and stays lit.
  function paintSign(ctx, L, ms) {
    const { s, X } = L;
    const { tower, w: sw, h: sh, font } = L.sign;
    const top = L.h - tower.h - sh - 5 * s;
    const x = X(tower.x - (sw - tower.w) / 2, sw);
    ctx.fillStyle = "#0e121b";
    ctx.fillRect(x, top, sw, sh);
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(x + sw * 0.25, top + sh, 2 * s, 5 * s);
    ctx.fillRect(x + sw * 0.75, top + sh, 2 * s, 5 * s);

    ctx.font = `700 ${font}px "Titillium Web", sans-serif`;
    ctx.textBaseline = "middle";
    // The name is written left to right on an Arabic page too — letter by letter, from its left edge.
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    const letters = [...SIGN];
    const widths = letters.map((letter) => ctx.measureText(letter).width);
    let lx = x + (sw - widths.reduce((a, b) => a + b, 0)) / 2;
    const flicker = ms > 1700 && ms < 1780;
    let moving = false;
    letters.forEach((letter, i) => {
      const lit = ms >= 950 + i * 75 && !flicker;
      if (!lit || ms < 1900) moving = true;
      // "800" is the brand's amber; the rest of the name a warmer white — as on the sign.
      const colour = i < 3 ? [251, 191, 81] : [255, 226, 168];
      ctx.fillStyle = lit ? rgba(colour, 1) : "rgba(245, 176, 65, 0.16)";
      ctx.shadowColor = lit ? "rgba(245, 176, 65, 0.85)" : "transparent";
      ctx.shadowBlur = lit ? 10 * s : 0;
      ctx.fillText(letter, lx, top + sh / 2 + 0.5);
      lx += widths[i];
    });
    ctx.shadowBlur = 0;
    return moving;
  }

  // Once the evening has come: now and then a light goes on or off, and the
  // spire's red light blinks.
  let ticks = 0;
  function onTick(L) {
    ticks += 1;
    L.blink = ticks % 5 === 0;
    if (ticks % 3 === 0) {
      const tower = L.near[Math.floor(Math.random() * L.near.length)];
      const win = tower && tower.windows[Math.floor(Math.random() * tower.windows.length)];
      if (win) {
        win.lit = !win.lit;
        win.at = 0;
      }
    }
    return true;
  }

  const scene = stage(canvas, { calm, build, paint, tick: 420, onTick });
  // The sign is written in the brand's own letters: drawn again once they arrive.
  if (scene && document.fonts && document.fonts.load) {
    document.fonts.load('700 16px "Titillium Web"').then(() => scene.redo()).catch(() => {});
  }
  return scene;
}

// ── one tower's face, and one window ──────────────────────────────────────

/**
 * A tower's face filling `canvas`, its windows lit here and there — and one,
 * near the top in the middle, left for `marker` (an element the page places
 * over it and makes glow: the window that "could be yours").
 */
export function facade(canvas, marker, { calm = false } = {}) {
  function build(w, h) {
    const rnd = seeded(42);
    const s = Math.max(0.68, Math.min(1.1, w / 1240));
    const cw = 46 * s;
    const ch = 62 * s;
    const cols = Math.ceil(w / cw) + 1;
    const rows = Math.ceil(h / ch) + 1;
    const x0 = (w - cols * cw) / 2;
    const y0 = -ch * 0.35;
    const pane = [cw - 12 * s, ch - 18 * s];
    const want = { x: w / 2, y: Math.min(86, h * 0.14) };
    let yours = null;
    let best = Infinity;
    const windows = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = x0 + c * cw + (cw - pane[0]) / 2;
        const y = y0 + r * ch + (ch - pane[1]) / 2;
        const win = { x, y, lit: rnd() < 0.24, cool: rnd() < 0.14, a: 0.35 + rnd() * 0.5, blind: rnd() * 0.5 };
        windows.push(win);
        const far = Math.hypot(x + pane[0] / 2 - want.x, y + pane[1] / 2 - want.y);
        if (far < best && y > 8) {
          best = far;
          yours = win;
        }
      }
    }
    if (yours) yours.lit = false;
    return { w, h, s, pane, windows, yours };
  }

  function paint(ctx, L) {
    const { w, h, pane } = L;
    const face = ctx.createLinearGradient(0, 0, 0, h);
    face.addColorStop(0, "#121829");
    face.addColorStop(1, "#0c101b");
    ctx.fillStyle = face;
    ctx.fillRect(0, 0, w, h);
    for (const win of L.windows) {
      if (win === L.yours) continue;
      if (win.lit) {
        const glass = ctx.createLinearGradient(0, win.y, 0, win.y + pane[1]);
        const colour = win.cool ? COOL : WARM;
        glass.addColorStop(0, rgba(colour, win.a * (win.cool ? 0.5 : 0.95)));
        glass.addColorStop(1, rgba(colour, win.a * (win.cool ? 0.3 : 0.6)));
        ctx.fillStyle = glass;
        ctx.fillRect(win.x, win.y, pane[0], pane[1]);
        // A blind half-down, in some.
        if (win.blind > 0.32) {
          ctx.fillStyle = "rgba(12, 16, 27, 0.35)";
          ctx.fillRect(win.x, win.y, pane[0], pane[1] * (win.blind - 0.2));
        }
      } else {
        ctx.fillStyle = "rgba(30, 38, 58, 0.9)";
        ctx.fillRect(win.x, win.y, pane[0], pane[1]);
        ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
        ctx.fillRect(win.x, win.y, pane[0] * 0.45, pane[1]);
      }
    }
    // Placed over the one window left dark: the page makes it glow.
    if (marker && L.yours) {
      marker.style.setProperty("--x", `${L.yours.x}px`);
      marker.style.setProperty("--y", `${L.yours.y}px`);
      marker.style.setProperty("--w", `${pane[0]}px`);
      marker.style.setProperty("--h", `${pane[1]}px`);
      marker.hidden = false;
    }
    return false;
  }

  let ticks = 0;
  function onTick(L) {
    ticks += 1;
    if (ticks % 4) return false;
    const win = L.windows[Math.floor(Math.random() * L.windows.length)];
    if (!win || win === L.yours) return false;
    win.lit = !win.lit;
    return true;
  }

  return stage(canvas, { calm, build, paint, tick: 450, onTick });
}
