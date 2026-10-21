// Cinematic mode look: type, color and visual system (shared contract in
// org/plan.md; the why is in org/art/direction.md).
// cineLook(themeKey, tradeKey?, { tradeLook }) -> { css, fontsHref, vars }.
// Default: the classic theme mapped onto cream paper with a serif display face
// (true italic for the accent word) and one sans. With tradeKey and
// tradeLook !== false, trades that have a signature palette use it instead
// (pressure washing carbon + yellow, HVAC carbon + orange, builders wood +
// blueprint blue, fencing/roofing/restoration cream + serif).
// The css also bridges the engine's own variables (--serif, --sans, --cream,
// --ink, --accent...) so the look applies to cinematic.js markup as is.
// placeholderArt(trade, slotId, label) -> SVG data URI: an ink-on-paper
// drawing of the picture that belongs in that slot. Never photo-like, and the
// "Sample picture: make in Higgsfield" label is drawn on the art itself.
// blueprintArt(trade) -> SVG data URI: a drawn plan sheet for the blueprint tool.

import { THEMES } from "./themes.js";
import { CINE_KIT } from "./cine-kit.js";

export const CINE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap";

// Each classic theme mapped onto the cream look. `accent` fills the small
// button (text on it is `accentInk`), `accentText` is the italic word and
// links on paper (AA 4.5:1), `accentHi` is the italic word on dark picture
// sections, `night` backs dark sections and picture scrims.
export const CINE_THEMES = {
  navy:   { night: "#13253a", accent: "#f27a1f", accentInk: "#1a1206", accentText: "#a94a0b", accentHi: "#ff9a4d" },
  forest: { night: "#1d3a2a", accent: "#e9b949", accentInk: "#1d1a0a", accentText: "#7a5710", accentHi: "#f3cd6e" },
  steel:  { night: "#1f2329", accent: "#cf2f27", accentInk: "#ffffff", accentText: "#b0261f", accentHi: "#ff8a7e" },
  sky:    { night: "#0c3c66", accent: "#ffc23d", accentInk: "#1b1503", accentText: "#855a00", accentHi: "#ffd36b" },
};

const PAPER = { paper: "#f6f1e7", paper2: "#ede5d6", ink: "#1d1b18", muted: "#5b5449", line: "#d9cfbd", display: "serif" };

// Signature palettes per trade (from the reel study, see direction.md).
// display: serif (italic accent word) or grotesk (heavy sans, accent by color).
export const CINE_PALETTES = {
  // Dark story and tools (night), light content sections (paper), like the reels.
  // On paper the accent word is ink on a highlighter stripe in the true accent.
  carbonYellow: { label: "Carbon and yellow", display: "grotesk", marker: true,
    paper: "#f4f2ed", paper2: "#e9e6df", ink: "#121212", muted: "#55524b", line: "#d9d5cc", night: "#0c0d0f",
    accent: "#ffd23f", accentInk: "#15130c", accentText: "#121212", accentHi: "#ffd23f" },
  carbonOrange: { label: "Carbon and orange", display: "grotesk", marker: true,
    paper: "#f5f1ec", paper2: "#ebe5dd", ink: "#141110", muted: "#58514a", line: "#dbd3c9", night: "#0e0c0b",
    accent: "#ff7a1a", accentInk: "#160c04", accentText: "#141110", accentHi: "#ff8f45" },
  woodBlueprint: { label: "Wood and blueprint", display: "serif",
    paper: "#f3ebdf", paper2: "#e8dccb", ink: "#22190f", muted: "#5d5040", line: "#d6c6ae", night: "#13284a",
    accent: "#f2c230", accentInk: "#1d1606", accentText: "#1d4f9c", accentHi: "#f2c230" },
  creamSerif: { label: "Cream and serif", display: "serif",
    paper: "#f6f1e7", paper2: "#ede5d6", ink: "#1d1b18", muted: "#5b5449", line: "#d9cfbd", night: "#1e1a16",
    accent: "#ea6a1f", accentInk: "#1a0f05", accentText: "#a94a0b", accentHi: "#ff9a4d" },
};

export const CINE_TRADE_LOOK = {
  pressure: "carbonYellow", hvac: "carbonOrange",
  builder: "woodBlueprint", framing: "woodBlueprint", remodeling: "woodBlueprint",
  fencing: "creamSerif", roofing: "creamSerif", restoration: "creamSerif",
};

export function cineVars(themeKey, tradeKey, opts = {}) {
  const pal = opts.tradeLook !== false && CINE_PALETTES[CINE_TRADE_LOOK[tradeKey]];
  if (pal) return { ...PAPER, ...pal };
  const t = CINE_THEMES[themeKey] || CINE_THEMES.navy;
  return { ...PAPER, ...t };
}

// Film grain, drawn once as a tiny SVG noise tile.
const GRAIN = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>');

export function cineLook(themeKey, tradeKey, opts = {}) {
  const v = cineVars(themeKey, tradeKey, opts);
  const grotesk = v.display === "grotesk";
  const marker = !!v.marker;
  const css = `
:root{--c-paper:${v.paper};--c-paper-2:${v.paper2};--c-ink:${v.ink};--c-muted:${v.muted};--c-line:${v.line};
--c-night:${v.night};--c-accent:${v.accent};--c-accent-ink:${v.accentInk};--c-accent-text:${v.accentText};--c-accent-hi:${v.accentHi};
--f-display:${grotesk ? '"Manrope","Segoe UI",system-ui,sans-serif' : '"Instrument Serif","Iowan Old Style","Palatino Linotype",Georgia,serif'};
--f-body:"Manrope","Segoe UI",system-ui,-apple-system,sans-serif;
--ease:cubic-bezier(.2,.7,.1,1);--ease-out:cubic-bezier(.16,1,.3,1);--t-fade:900ms;--t-ui:260ms;
--gap:clamp(20px,4vw,40px);--pad-y:clamp(80px,13vw,168px);--wrap:1180px;--radius:18px}
.cine{background:var(--c-paper);color:var(--c-ink);font-family:var(--f-body);font-size:17px;line-height:1.6;
-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.cine *,.cine *::before,.cine *::after{box-sizing:border-box}
.cine img{display:block;max-width:100%}
.cine-wrap{width:min(var(--wrap),100% - 2*var(--gap));margin-inline:auto}

/* Type: big quiet serif, one italic accent word, small tracked eyebrow */
.cine-display,.cine h1,.cine h2,.cine h3{font-family:var(--f-display);font-weight:400;letter-spacing:-.012em;line-height:1.02;margin:0;text-wrap:balance}
.cine-xl{font-size:clamp(2.75rem,8.2vw,7rem)}
.cine-l{font-size:clamp(2.25rem,5.6vw,4.75rem)}
.cine-m{font-size:clamp(1.75rem,3.4vw,2.75rem);line-height:1.08}
.cine-accent{font-style:italic;color:var(--c-accent-text);padding-right:.04em}
.cine-dark .cine-accent,.cine-photo .cine-accent{color:var(--c-accent-hi)}
.cine-eyebrow{font:600 .75rem/1.2 var(--f-body);letter-spacing:.18em;text-transform:uppercase;color:var(--c-muted);margin:0 0 18px;display:flex;align-items:center;gap:12px}
.cine-eyebrow::before{content:"";width:28px;height:1px;background:currentColor;opacity:.6}
.cine-lede{font-size:clamp(1.05rem,1.5vw,1.2rem);color:var(--c-muted);max-width:34em;margin:20px 0 0}
.cine-dark .cine-eyebrow,.cine-photo .cine-eyebrow,.cine-dark .cine-lede,.cine-photo .cine-lede{color:rgba(250,246,238,.82)}

/* Rhythm: cream paper sections between full-bleed picture sections */
.cine-section{padding-block:var(--pad-y);background:var(--c-paper)}
.cine-section.alt{background:var(--c-paper-2)}
.cine-section+.cine-section{border-top:1px solid var(--c-line)}
.cine-dark{background:var(--c-night);color:#faf6ee}
.cine-head{display:grid;gap:8px;margin-bottom:clamp(36px,6vw,64px);max-width:760px}

/* Full-bleed picture section with a soft scrim for legible type */
.cine-photo{position:relative;min-height:100svh;overflow:hidden;color:#faf6ee;background:var(--c-night);isolation:isolate}
.cine-photo>img,.cine-frame>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cine-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;
background:linear-gradient(180deg,rgba(10,10,12,.34) 0%,rgba(10,10,12,0) 32%,rgba(10,10,12,0) 52%,rgba(10,10,12,.58) 100%),
linear-gradient(90deg,rgba(10,10,12,.32) 0%,rgba(10,10,12,0) 55%)}
.cine-grain::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:url("${GRAIN}");opacity:.07;mix-blend-mode:multiply}

/* Scroll story: frames stack; the engine sets .is-on and --zoom (1 to 1.06) */
.cine-frame{position:absolute;inset:0;opacity:0;transition:opacity var(--t-fade) var(--ease)}
.cine-frame.is-on{opacity:1}
.cine-frame>img{transform:scale(var(--zoom,1));transform-origin:50% 60%;will-change:transform}
.cine-caption{position:absolute;z-index:3;left:var(--gap);right:var(--gap);bottom:clamp(40px,9vh,96px);max-width:900px;
opacity:0;transform:translateY(18px);transition:opacity 700ms var(--ease-out),transform 700ms var(--ease-out)}
.cine-caption.is-on{opacity:1;transform:none}
.cine-caption h2{font-size:clamp(2.6rem,8vw,6.5rem);text-shadow:0 1px 30px rgba(0,0,0,.25)}
.cine-step{font:600 .75rem/1 var(--f-body);letter-spacing:.18em;text-transform:uppercase;opacity:.85;margin-bottom:16px}
.cine-progress{position:absolute;z-index:3;right:var(--gap);top:50%;transform:translateY(-50%);display:grid;gap:10px}
.cine-progress i{display:block;width:2px;height:28px;background:rgba(250,246,238,.35);transition:background var(--t-ui)}
.cine-progress i.is-on{background:var(--c-accent-hi)}

/* Glass card over a picture */
.cine-glass{position:relative;z-index:3;background:rgba(250,246,238,.68);color:var(--c-ink);border:1px solid rgba(255,255,255,.55);
border-radius:var(--radius);padding:22px 24px;box-shadow:0 20px 50px -20px rgba(15,12,8,.45);
-webkit-backdrop-filter:blur(18px) saturate(1.25);backdrop-filter:blur(18px) saturate(1.25);max-width:360px}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.cine-glass{background:rgba(250,246,238,.94)}}
.cine-glass h3{font-size:1.75rem;line-height:1.1}
.cine-glass p{margin:8px 0 16px;color:var(--c-muted);font-size:.95rem}

/* Small accent button: the only loud thing on the page */
.cine-btn{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:11px 20px;border-radius:999px;border:0;cursor:pointer;
background:var(--c-accent);color:var(--c-accent-ink);font:600 .95rem/1 var(--f-body);text-decoration:none;
transition:transform var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)}
.cine-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}
.cine-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.cine-btn.ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1px currentColor}
.cine-link{color:var(--c-accent-text);text-underline-offset:3px}

/* Style tabs */
.cine-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:5px;border-radius:999px;background:rgba(250,246,238,.66);
-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);width:max-content;max-width:100%}
.cine-tab{min-height:40px;padding:8px 16px;border-radius:999px;border:0;background:transparent;color:var(--c-ink);
font:600 .875rem/1 var(--f-body);cursor:pointer;transition:background var(--t-ui),color var(--t-ui)}
.cine-tab[aria-selected="true"]{background:var(--c-ink);color:var(--c-paper)}

/* Before/after slider */
.cine-ba{position:relative;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;background:var(--c-night);touch-action:pan-y;user-select:none}
.cine-ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cine-ba-line{position:absolute;top:0;bottom:0;width:2px;background:#faf6ee;transform:translateX(-1px);box-shadow:0 0 18px rgba(0,0,0,.35)}
.cine-ba-handle{position:absolute;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;
background:rgba(250,246,238,.8);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);display:grid;place-items:center;
box-shadow:0 8px 24px -8px rgba(0,0,0,.5);color:var(--c-ink);cursor:ew-resize}
.cine-ba-tag{position:absolute;top:16px;z-index:2;font:600 .7rem/1 var(--f-body);letter-spacing:.16em;text-transform:uppercase;
padding:8px 12px;border-radius:999px;background:rgba(20,18,16,.6);color:#faf6ee}

/* Estimator */
.cine-est{display:grid;gap:28px;background:#fffdf8;border:1px solid var(--c-line);border-radius:calc(var(--radius) + 6px);padding:clamp(22px,4vw,40px)}
.cine-chips{display:flex;flex-wrap:wrap;gap:8px}
.cine-chip{min-height:44px;padding:10px 16px;border-radius:12px;border:1px solid var(--c-line);background:var(--c-paper);color:var(--c-ink);
font:500 .95rem/1.2 var(--f-body);cursor:pointer;transition:border-color var(--t-ui),background var(--t-ui)}
.cine-chip[aria-pressed="true"]{border-color:var(--c-ink);background:var(--c-ink);color:var(--c-paper)}
.cine-range{font-family:var(--f-display);font-size:clamp(2.5rem,6vw,4.25rem);line-height:1;letter-spacing:-.01em}
.cine-note{font-size:.85rem;color:var(--c-muted)}

/* Focus, motion */
.cine :focus-visible{outline:2px solid var(--c-accent-text);outline-offset:3px;border-radius:8px}
.cine-photo :focus-visible,.cine-dark :focus-visible{outline-color:var(--c-accent-hi)}
.cine-rise{opacity:0;transform:translateY(24px);transition:opacity 800ms var(--ease-out),transform 800ms var(--ease-out)}
.cine-rise.is-on{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
.cine *,.cine *::before,.cine *::after{transition:none!important;animation:none!important}
.cine-frame>img{transform:none!important}
.cine-rise,.cine-caption{opacity:1;transform:none}
}
/* Bridge: the engine's markup (cinematic.js) reads these, so the look applies there too */
:root{--serif:var(--f-display);--sans:var(--f-body);--cream:var(--c-paper);--cream2:var(--c-paper-2);--ink:var(--c-ink);--muted:var(--c-muted);
--dark:var(--c-night);--accent:var(--c-accent);--accent-ink:var(--c-accent-ink);--hi:var(--c-accent-hi);--accent-text:var(--c-accent-text);--dark2:color-mix(in srgb,var(--c-night) 90%,#ffffff);color-scheme:light}
body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
h1,h2{font-weight:${grotesk ? "800" : "400"};letter-spacing:${grotesk ? "-.035em" : "-.012em"}}
${grotesk ? `h1 em,h2 em,.line em,.sec h2 em,.est-num em{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;letter-spacing:-.01em;padding-right:.04em}` : ""}
h1 em,h2 em,.line em,.sec h2 em{color:var(--c-accent-text)${marker ? ";background:linear-gradient(transparent 58%,var(--c-accent) 58%,var(--c-accent) 90%,transparent 90%);padding:0 .06em" : ""}}
html body :is(.story,.dark-sec,.final,.panel,.est-out,.top) em{color:var(--c-accent-hi);background:none;padding:0}
.est-out{background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.02)),var(--c-night);border:1px solid rgba(255,255,255,.09);
box-shadow:0 30px 60px -30px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08)}
.est-num{font-family:var(--f-display);font-weight:${grotesk ? "800" : "400"};font-size:clamp(2.6rem,7vw,4.5rem);line-height:1;letter-spacing:-.02em}
`;
  return { css, fontsHref: CINE_FONTS_HREF, vars: v };
}

/* ---------- Placeholder art ---------- */

const W = 1600, H = 900, G = 720; // canvas and ground line
const C = {
  ink: "#2b2722", paper: "#f4ede1", paper2: "#e9dfcd", sky1: "#ece5d7", sky2: "#f7f1e6",
  sage: "#a7b394", sageD: "#6f7f62", clay: "#c46a3c", wood: "#cf9f69", woodD: "#a3733f",
  stone: "#bdb6a9", stoneD: "#8f887c", grime: "#6f6553", night: "#2f3b4c", night2: "#53607a",
  gold: "#efbe62", white: "#fbf8f2", slate: "#6c727a", char: "#3c3a37", blue: "#56708c", rust: "#9a5a33",
  hill: "#c9cdb5", dot: "#cfc4b0", sunDay: "#f1d9a6", cloud: "#fbf7ef",
};
const LIGHT = { ...C };
// Carbon ink mode for the dark trade palettes: light lines on near-black, the
// clean or finished thing bright, one yellow accent. Same drawings, swapped inks.
const CARBON = {
  ink: "#ece6d8", paper: "#1b1d20", paper2: "#202327", sky1: "#121417", sky2: "#262a2f", sage: "#252a24", sageD: "#3f4b39",
  white: "#2b2e33", stone: "#dcd8ce", stoneD: "#8c8880", grime: "#3a3327", char: "#16171a", hill: "#2c3035", dot: "#393d43",
  sunDay: "#ffd23f", gold: "#ffd23f", cloud: "#2f3338", blue: "#8fb3d9",
};
const CARBON_TRADES = new Set(["pressure", "hvac"]);

const f = (n) => Math.round(n * 10) / 10;
const line = (x1, y1, x2, y2, w = 3, c = C.ink, extra = "") =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
const rect = (x, y, w, h, fill = "none", stroke = C.ink, sw = 3, rx = 0, extra = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
const path = (d, fill = "none", stroke = C.ink, sw = 3, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const circle = (cx, cy, r, fill = "none", stroke = C.ink, sw = 3, extra = "") =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${extra}/>`;
const range = (n) => Array.from({ length: n }, (_, i) => i);
// Repeatable pseudo-random numbers so a slot always draws the same.
function rng(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Sky, sun, far trees and ground. mood: day | gold | dusk
function backdrop(mood = "day", ground = C.sage, sunX = 1250, gy = G) {
  const sky = mood === "dusk" ? [C.night, C.night2] : mood === "gold" ? ["#ead9bd", "#f7ecdb"] : [C.sky1, C.sky2];
  const sunY = mood === "gold" ? 420 : mood === "dusk" ? 520 : 250;
  const sun = mood === "dusk" ? "#e9a86a" : mood === "gold" ? C.gold : C.sunDay;
  const dots = range(15).map((i) => range(8).map((j) =>
    `<circle cx="${60 + i * 106}" cy="${50 + j * 84}" r="1.6" fill="${mood === "dusk" ? "#8d97ab" : C.dot}"/>`).join("")).join("");
  const hills = `M0 ${gy - 90} C 180 ${gy - 150} 330 ${gy - 120} 470 ${gy - 140} S 760 ${gy - 190} 930 ${gy - 150} S 1260 ${gy - 110} 1400 ${gy - 160} S 1560 ${gy - 140} 1600 ${gy - 130} V ${gy} H 0 Z`;
  const cloud = (x, y, s) => `<g opacity=".8" fill="${mood === "dusk" ? "#56627a" : C.cloud}"><ellipse cx="${x}" cy="${y}" rx="${110 * s}" ry="${26 * s}"/><ellipse cx="${x - 40 * s}" cy="${y - 18 * s}" rx="${60 * s}" ry="${30 * s}"/><ellipse cx="${x + 34 * s}" cy="${y - 22 * s}" rx="${50 * s}" ry="${28 * s}"/></g>`;
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>${dots}
<g class="drift2">${cloud(420, 300, 1)}</g><g class="drift">${cloud(1000, 210, 0.8)}</g>
${circle(sunX, sunY, 128, "none", sun, 2, ' class="glow" opacity=".5"')}${circle(sunX, sunY, 92, sun, "none", 0, ' opacity=".9"')}
${path(hills, mood === "dusk" ? "#3d4a5c" : C.hill, "none", 0, ' opacity=".8"')}
${rect(0, gy, W, H - gy, ground, "none", 0)}${line(0, gy, W, gy, 3)}`;
}

// Interior room: back wall, floor, window.
function room(wall = C.paper2, floor = "#d9c3a0", lightOn = false, wx = 1080) {
  return `<rect width="${W}" height="${H}" fill="${wall}"/>
${rect(0, 650, W, 250, floor, "none", 0)}${line(0, 650, W, 650)}
${rect(wx, 150, 330, 330, lightOn ? "#f7e7c4" : "#e4ebe7")}${line(wx + 165, 150, wx + 165, 480, 2)}${line(wx, 315, wx + 330, 315, 2)}
${path(`M${wx} 480 L${wx - 120} 650 M${wx + 330} 480 L${wx + 420} 650`, "none", C.ink, 1.5, ' opacity=".35"')}
${path(`M${wx} 480 L${wx - 120} 650 L${wx + 420} 650 L${wx + 330} 480 Z`, lightOn ? "#f3dcae" : "#efe6d4", "none", 0, ' class="glow" opacity=".55"')}`;
}

// A gable house front. roof: old | deck | wrap | new | metal | slate | frame
// wall: paint color, or "frame" (studs) | "wrap"
function house({ x = 800, w = 640, wallH = 250, roof = "new", wall = C.white, worn = false, windows = true, door = "#55463a", lit = false, garage = null, trim = C.white, base = G, roofH = 190 } = {}) {
  const x0 = x - w / 2, x1 = x + w / 2, top = base - wallH, peak = top - roofH;
  const eL = x0 - 46, eR = x1 + 46, eY = top + 6;
  const tri = `M${eL} ${eY} L${x} ${peak} L${eR} ${eY} Z`;
  let out = "";
  // walls
  if (wall === "frame") {
    out += line(x0, base - 4, x1, base - 4, 6, C.woodD) + line(x0, top, x1, top, 6, C.woodD);
    out += range(Math.round(w / 40) + 1).map((i) => line(x0 + i * (w / Math.round(w / 40)), top, x0 + i * (w / Math.round(w / 40)), base, 4, C.woodD)).join("");
  } else {
    out += rect(x0, top, w, wallH, wall === "wrap" ? "#f5f5f1" : wall);
    if (wall === "wrap") out += range(4).map((i) => line(x0 + 10, top + 50 + i * 55, x1 - 10, top + 50 + i * 55, 1.5, "#b9c3c9")).join("");
    else out += range(Math.floor(wallH / 26)).map((i) => line(x0 + 2, top + 26 * (i + 1), x1 - 2, top + 26 * (i + 1), 1, C.ink, ' opacity=".14"')).join("");
  }
  // roof
  const rows = (gap, c, sw = 1.5, op = 1) => range(Math.ceil((eY - peak) / gap)).map((i) => {
    const y = peak + gap * (i + 1), t = (y - peak) / (eY - peak);
    return line(x - (x - eL) * t, y, x + (eR - x) * t, y, sw, c, ` opacity="${op}"`);
  }).join("");
  if (roof === "none") {
    // walls only
  } else if (roof === "frame") {
    out += path(`M${eL} ${eY} L${x} ${peak} L${eR} ${eY} Z`, "none", C.woodD, 5);
    out += range(9).map((i) => { const t = (i + 1) / 10; return line(eL + (x - eL) * t, eY - (eY - peak) * t, eL + (eR - eL) * t, eY, 3, C.woodD); }).join("");
  } else {
    const fill = { old: "#a99d89", deck: "#dcc095", wrap: "#d3d1cb", new: C.char, metal: "#5b4636", slate: C.slate }[roof] || C.char;
    out += path(tri, fill);
    if (roof === "old") {
      out += rows(22, C.ink, 1.5, 0.35);
      const r = rng("roof-old");
      out += range(9).map(() => rect(x - 200 + r() * 400, peak + 70 + r() * 90, 26, 16, "#7d7262", "none", 0)).join("");
      out += range(5).map(() => path(`M${x - 250 + r() * 500} ${peak + 60 + r() * 40} q 10 60 -6 110`, "none", "#6b604f", 5, ' opacity=".45"')).join("");
    }
    if (roof === "deck") out += range(16).map((i) => line(eL + (eR - eL) * i / 16, eY, x, peak, 1.2, C.woodD, ' opacity=".55"')).join("") + rows(48, C.woodD, 1.2, 0.5);
    if (roof === "wrap") out += rows(52, "#a8a59e", 1.5) + line(eL, eY, eR, eY, 5, "#8f8b84");
    if (roof === "new") out += rows(16, "#6e6a64", 1.5);
    if (roof === "metal") out += range(22).map((i) => { const t = (i + 1) / 23; return line(eL + (eR - eL) * t, eY, x + (eL + (eR - eL) * t - x) * 0.04, peak + 8, 1.8, "#8a705a"); }).join("");
    if (roof === "slate") out += rows(20, "#8e949b", 1.5) + range(40).map((i) => { const y = peak + 20 * (Math.floor(i / 8) + 2); const t = (y - peak) / (eY - peak); return line(x - (x - eL) * t + ((i % 8) + 0.5) * ((eR - eL) * t / 8), y - 20, x - (x - eL) * t + ((i % 8) + 0.5) * ((eR - eL) * t / 8), y, 1, "#8e949b"); }).join("");
    out += line(eL - 4, eY, eR + 4, eY, 6, roof === "new" ? "#2a2826" : C.ink);
  }
  // windows and door
  if (windows && wall !== "frame") {
    const glass = lit ? "#f6d488" : wall === "wrap" ? "#7d8790" : "#9fb2bd";
    const wy = top + 54;
    for (const wx of [x0 + w * 0.14, x1 - w * 0.14 - 110]) {
      out += rect(wx - 8, wy - 8, 126, 136, trim, C.ink, 2) + rect(wx, wy, 110, 120, glass) + line(wx + 55, wy, wx + 55, wy + 120, 2) + line(wx, wy + 60, wx + 110, wy + 60, 2);
    }
    if (!garage) out += rect(x - 46, base - 160, 92, 160, door) + circle(x + 28, base - 80, 4, C.gold, "none", 0);
  }
  if (garage) out += garage;
  if (worn && wall !== "frame") {
    const r = rng("wall-worn");
    out += range(7).map(() => path(`M${x0 + 20 + r() * (w - 60)} ${top + 10} q ${r() * 12 - 6} ${40 + r() * 60} ${r() * 10 - 5} ${80 + r() * 90}`, "none", C.grime, 6, ' opacity=".28"')).join("");
  }
  return out;
}

// Label on the art: always visible. Top center and narrow (440 of 1600), so
// it survives object-fit: cover on a phone (about 450 wide stays in view)
// and stays clear of headlines and buttons, which sit at the bottom.
function label(text, dark, y = 96) {
  const t1 = "Sample picture: make in Higgsfield";
  const t2 = text.length > 40 ? text.slice(0, 39) + "\u2026" : text;
  return `<g font-family="Helvetica, Arial, sans-serif" text-anchor="middle">
<rect x="600" y="${y}" width="400" height="74" rx="12" fill="${dark ? "rgba(250,246,238,.92)" : "rgba(29,27,24,.86)"}"/>
<text x="800" y="${y + 32}" font-size="20" font-weight="700" fill="${dark ? "#1d1b18" : "#faf6ee"}">${svgEsc(t1)}</text>
<text x="800" y="${y + 59}" font-size="17" fill="${dark ? "#4a443b" : "#d8cfbf"}">${svgEsc(t2)}</text></g>`;
}

// Viewfinder corner marks and a small "16:9 sketch" tag: reads as a shot to be made.
function frameMarks(dark) {
  const c = dark ? "#e6dccb" : C.ink, L = 46, m = 36;
  const corners = [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]
    .map(([x, y, sx, sy]) => path(`M${x} ${y + sy * L} V${y} H${x + sx * L}`, "none", c, 3)).join("");
  return corners;
}

function svgEsc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

// Ground-plane trapezoid for driveways and roads.
const drive = (fill, topW = 260, botW = 900, topY = G, cx = 800) =>
  path(`M${cx - topW / 2} ${topY} L${cx + topW / 2} ${topY} L${cx + botW / 2} ${H} L${cx - botW / 2} ${H} Z`, fill);

function blotches(seed, n, box, color, op = 0.35, pebble = 0) {
  const r = rng(seed);
  return range(n).map(() => {
    const cx = box[0] + r() * box[2], cy = box[1] + r() * box[3], rx = pebble || 30 + r() * 90, ry = pebble ? pebble * 0.7 : 12 + r() * 30;
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${op}"/>`;
  }).join("");
}

function shrub(x, y, s = 1, fill = C.sageD) {
  return path(`M${x - 60 * s} ${y} C ${x - 70 * s} ${y - 60 * s} ${x - 20 * s} ${y - 90 * s} ${x} ${y - 70 * s} C ${x + 30 * s} ${y - 100 * s} ${x + 80 * s} ${y - 50 * s} ${x + 60 * s} ${y} Z`, fill);
}

// Scenes. Each takes (stage, last, variant) and returns { art, mood }.
// stage 0 is the base picture, `last` is the finished frame.
const SCENES = {
  roofing(st, last, v) {
    const roof = v === 1 ? "metal" : v === 2 ? "slate" : ["old", "deck", "wrap", "new"][st] || "new";
    const art = house({ roof, worn: st === 0 && v < 0 }) + shrub(400, G, 1) + shrub(1200, G, 0.9);
    const bundles = st === 1 ? rect(760, 330, 80, 34, "#6e6a64") : "";
    return { art: art + bundles, mood: st === last || v >= 0 ? "gold" : "day" };
  },
  fencing(st, last, v) {
    // Story frames keep the fence on the right, clear of the bottom-left headline;
    // style pictures (shifted right for the glass card) use the full width.
    const story = v < 0;
    const y0 = 600, x0 = story ? 660 : 110, x1 = story ? 1520 : 1490, n = story ? 8 : 12, step = (x1 - x0) / n;
    let a = house({ x: story ? 1040 : 800, w: 420, wallH: 200, roof: "new" });
    a += rect(0, G - 2, W, H - G, C.sage, "none", 0) + shrub(1350, G - 40, 0.8);
    const stage = v >= 0 ? 3 : st;
    const kind = v === 1 ? "vinyl" : v === 2 ? "rail" : "cedar";
    if (stage === 0) {
      a += line(x0, y0 + 60, x1, y0 + 60, 3, C.clay);
      a += range(n + 1).map((i) => line(x0 + i * step, y0 + 50, x0 + i * step, y0 + 100, 5, C.woodD)).join("");
    } else {
      const pc = kind === "vinyl" ? C.white : kind === "rail" ? C.char : C.woodD;
      if (stage >= 3 && kind === "cedar") a += rect(x0, y0 - 120, x1 - x0, 230, C.wood) + range(70).map((i) => line(x0 + i * (x1 - x0) / 70, y0 - 120, x0 + i * (x1 - x0) / 70, y0 + 110, 1.5, C.woodD)).join("");
      if (stage >= 3 && kind === "vinyl") a += range(n).map((i) => rect(x0 + i * step + 6, y0 - 120, step - 12, 230, C.white)).join("");
      if (stage >= 3 && kind === "rail") a += range(n * 6).map((i) => line(x0 + i * step / 6, y0 - 110, x0 + i * step / 6, y0 + 110, 3, C.char)).join("");
      a += range(n + 1).map((i) => rect(x0 + i * step - 9, y0 - 140, 18, 250, pc)).join("");
      a += range(n + 1).map((i) => `<ellipse cx="${f(x0 + i * step)}" cy="${y0 + 112}" rx="20" ry="6" fill="${C.stone}"/>`).join("");
      if (stage >= 2) a += line(x0, y0 - 90, x1, y0 - 90, 10, pc) + line(x0, y0 + 60, x1, y0 + 60, 10, pc);
    }
    return { art: a, mood: "gold" };
  },
  pressure(st, last, v) {
    const story = v < 0;
    const B = 450;
    let a = house({ base: B, x: 800, w: 520, wallH: 160, roofH: 110, roof: "new", wall: v === 1 ? "#ebe8e1" : C.white, worn: story && st === 0,
      garage: rect(650, B - 130, 230, 130, C.white) + range(3).map((i) => line(650, B - 130 + 32 * (i + 1), 880, B - 130 + 32 * (i + 1), 2)).join("") });
    a += drive(C.stone, 230, 1700, B, 765);
    if (v === 2) a += rect(0, 770, W, 130, C.wood) + range(6).map((i) => line(0, 770 + i * 22, W, 770 + i * 22, 2, C.woodD)).join("");
    if (story && st < last) {
      const dirt = `${drive(C.grime, 230, 1700, B, 765)}${blotches("drive", 30, [200, 470, 1150, 420], "#15130f", 0.55)}${blotches("moss", 12, [40, 640, 1500, 240], "#4f6a3f", 0.55)}${path(`M600 ${B} L330 ${H} M910 ${B} L1150 ${H}`, "none", "#0d0c0a", 34, ' opacity=".4"')}`;
      if (st === 0) a += dirt;
      else {
        // left half washed: sharp edge, yellow wash line, a little mist
        a += `<defs><clipPath id="half"><rect x="760" y="0" width="900" height="900"/></clipPath></defs><g clip-path="url(#half)">${dirt}</g>`;
        a += line(760, B, 760, H, 6, "#ffd23f") + line(760, B, 760, H, 22, "#ffd23f", ' opacity=".18" class="glow"');
        a += blotches("mist", 9, [700, 470, 130, 400], "#ffffff", 0.25, 18);
      }
    }
    // depth: haze at the horizon, wet sheen on clean concrete, foam and falling spray at the edge, grass in front
    const driveClip = `<clipPath id="dc"><path d="M${765 - 115} ${B} L${765 + 115} ${B} L${765 + 850} ${H} L${765 - 850} ${H} Z"/></clipPath>`;
    a = `<defs>${driveClip}<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3ad" stop-opacity="0"/><stop offset="1" stop-color="#9aa3ad" stop-opacity=".22"/></linearGradient><linearGradient id="wet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>` + a;
    a += `<rect x="0" y="${B - 160}" width="${W}" height="160" fill="url(#haze)"/>`;
    if (story && st >= 1) {
      const wetW = st === last ? 1600 : 760;
      a += `<g clip-path="url(#dc)"><g clip-path="url(#wetside)"><g class="shimmer"><path d="M300 ${H} L560 ${B} L640 ${B} L420 ${H} Z" fill="url(#wet)" opacity=".7"/><path d="M820 ${H} L740 ${B} L780 ${B} L900 ${H} Z" fill="url(#wet)" opacity=".45"/></g></g></g><defs><clipPath id="wetside"><rect x="0" y="0" width="${wetW}" height="${H}"/></clipPath></defs>`;
    }
    if (story && st > 0 && st < last) {
      const r = rng("foam");
      a += range(46).map(() => { const t = r(), y = B + 10 + t * (H - B - 10), rad = 4 + t * 22 * r(); return circle(760 + (r() - 0.5) * (14 + t * 60), y, rad, "#ffffff", "none", 0, ` opacity="${(0.35 + r() * 0.5).toFixed(2)}"`); }).join("");
      a += range(14).map((i) => line(722 + (i % 7) * 12, B + 40 + Math.floor(i / 7) * 120, 726 + (i % 7) * 12, B + 62 + Math.floor(i / 7) * 120, 3, "#dbe6ee", ` class="fall" style="animation-delay:${(i * 0.11).toFixed(2)}s"`)).join("");
    }
    const blades = (x0, dir) => range(14).map((i) => path(`M${x0 + i * 16 * dir} ${H} q ${dir * 6} -${50 + (i % 4) * 26} ${dir * (18 + (i % 3) * 8)} -${80 + (i % 5) * 22}`, "none", "#0f1410", 7)).join("");
    a += `<g class="sway">${blades(0, 1)}</g><g class="sway" style="animation-delay:-2s">${blades(W, -1)}</g>`;
    if (story && st === last) a += range(5).map((i) => path(`M${520 + i * 140} ${560 + (i % 2) * 90} l 8 18 l 18 8 l -18 8 l -8 18 l -8 -18 l -18 -8 l 18 -8 Z`, "#ffd23f", "none", 0, ' class="glow"')).join("");
    return { art: a, mood: "day", gy: B };
  },
  hvac(st, last, v) {
    if (v === 2) {
      return { art: room(C.paper2, "#cfb38b") + rect(240, 160, 520, 130, C.white, C.ink, 3, 22) + line(270, 260, 730, 260, 2) + rect(260, 650 - 220, 380, 180, "#8f9c84", C.ink, 3, 12), mood: "day", raw: true };
    }
    if (v >= 0) return { art: hvacUnit(false, v === 1), mood: "day", raw: true };
    // Story: one room from cold to warm.
    const warm = st / Math.max(1, last);
    let a = room(warm > 0.5 ? "#3a2a1c" : "#1c232b", warm > 0.5 ? "#7a4f2a" : "#2a2f36", warm > 0, 635);
    a += rect(480, 470, 640, 160, "#55604c", C.ink, 3, 22) + rect(460, 430, 680, 70, "#66725a", C.ink, 3, 22);
    a += path(`M840 430 C 880 380 1010 390 1040 440 L 1020 480 C 970 450 890 460 840 480 Z`, "#b98d6c");
    if (warm < 1) a += blotches("frost", 10, [645, 160, 310, 310], "#ffffff", 0.8 * (1 - warm), 34);
    if (warm > 0) a += line(1270, 650, 1270, 470, 4) + path(`M1220 470 L1320 470 L1295 400 L1245 400 Z`, "#f3d08c") + circle(1270, 440, 200 * warm, "#ffb347", "none", 0, ' class="glow" opacity=".28"');
    a += `<rect width="${W}" height="${H}" fill="${warm > 0.5 ? "#ff8a2a" : "#4a6c96"}" opacity="${warm > 0.5 ? 0.14 * warm : 0.22 * (1 - warm)}"/>`;
    a += rect(300, 300, 70, 90, "#f2efe8", "#16171a", 2, 10) + circle(335, 345, 22, "none", warm > 0.5 ? "#ff7a1a" : C.blue, 4);
    return { art: a, mood: "day", raw: true };
  },
  restoration(st, last, v) {
    let a;
    if (v === 1) a = room("#efe9de", "#cbb18c") + rect(160, 380, 820, 270, C.white) + range(5).map((i) => line(160 + i * 164, 380, 160 + i * 164, 650, 2)).join("") + rect(160, 360, 820, 22, C.stone) + rect(180, 120, 780, 160, C.white) + range(5).map((i) => line(180 + i * 156, 120, 180 + i * 156, 280, 2)).join("");
    else if (v === 2) a = room("#eef0ee", "#d8d6cf") + range(10).map((i) => line(0, 120 + i * 53, 1000, 120 + i * 53, 1.5, "#bfc5c3")).join("") + range(12).map((i) => line(i * 85, 120, i * 85, 650, 1.5, "#bfc5c3")).join("");
    else {
      a = room(C.paper2, st === 0 ? "#9d8d76" : st === 1 ? "#b9b4aa" : "#c9b493");
      if (st === 0) a += path(`M0 560 C 200 540 340 575 520 548 S 860 570 1000 552 L 1080 560 V 650 H 0 Z`, "#b9a88d", "none", 0, ' opacity=".7"') + line(0, 556, 1080, 556, 2, C.grime, ' opacity=".6"');
      if (st === 1) {
        a += rect(0, 520, 1080, 130, "#e8dcc6", "none", 0) + range(14).map((i) => rect(20 + i * 76, 520, 16, 130, C.wood, C.woodD, 2)).join("") + line(0, 520, 1080, 520, 3);
        for (const [x, y] of [[300, 760], [700, 790], [1180, 760]]) a += path(`M${x - 70} ${y + 40} L${x - 50} ${y - 60} H${x + 50} L${x + 70} ${y + 40} Z`, "#6c7680") + circle(x, y - 10, 34, "#9aa3ac");
        a += rect(1300, 690, 140, 150, "#d9dcd8", C.ink, 3, 10);
      }
      if (st >= 2) a += line(0, 640, 1080, 640, 8, C.white);
    }
    return { art: a, mood: "day" };
  },
  builder(st, last, v) {
    let a = "";
    const stage = v >= 0 ? 3 : st;
    if (stage === 0) {
      a += rect(0, G, W, H - G, "#c8b896", "none", 0) + line(0, G, W, G);
      a += path(`M820 ${G + 24} L1320 ${G + 24} L1420 ${G + 110} L720 ${G + 110} Z`, "none", C.clay, 3, ' stroke-dasharray="14 10"');
      for (const [x, y] of [[820, G + 24], [1320, G + 24], [1420, G + 110], [720, G + 110]]) a += line(x, y - 34, x, y + 4, 6, C.woodD);
      return { art: a, mood: "gold", ground: "#c8b896" };
    }
    if (stage === 1) a += rect(470, G - 6, 660, 14, C.stone) + house({ x: 800, w: 640, wallH: 300, roof: "frame", wall: "frame" }) + line(480, G - 150, 1120, G - 150, 6, C.woodD);
    if (stage === 2) a += house({ x: 800, w: 640, wallH: 300, roof: "wrap", wall: "wrap" });
    if (stage === 3) {
      if (v === 2) a += rect(420, G - 280, 760, 280, "#e9e4da") + rect(420, G - 300, 800, 26, C.char) + rect(470, G - 230, 380, 190, "#f6d488") + range(4).map((i) => line(470 + i * 95, G - 230, 470 + i * 95, G - 40, 3)).join("") + rect(900, G - 200, 90, 200, C.woodD);
      else {
        const wall = v === 1 ? "#cdb38c" : C.white;
        a += house({ x: 800, w: 640, wallH: 300, roof: v === 1 ? "new" : "metal", wall, lit: true, trim: v === 0 ? C.char : C.white, door: v === 1 ? C.woodD : C.char });
        if (v === 0 || v < 0) a += range(17).map((i) => line(484 + i * 38, G - 296, 484 + i * 38, G, 1.5, C.ink, ' opacity=".25"')).join("");
        a += rect(560, G - 120, 480, 14, C.char) + (v === 1 ? range(2).map((i) => path(`M${600 + i * 380} ${G - 106} L${590 + i * 380} ${G} H${630 + i * 380} L${620 + i * 380} ${G - 106} Z`, C.white)).join("") : range(4).map((i) => line(570 + i * 153, G - 106, 570 + i * 153, G, 5)).join(""));
      }
      a += drive("#d9d2c4", 140, 520, G, 1000);
    }
    return { art: a, mood: "gold" };
  },
  framing(st, last, v) {
    let a = rect(380, G - 8, 840, 22, C.stone);
    const stage = v >= 0 ? 3 : st;
    if (v === 1) return { art: house({ x: 620, w: 520, roof: "new" }) + house({ x: 1150, w: 300, wallH: 220, roof: "frame", wall: "frame" }), mood: "day" };
    if (v === 2) return { art: a + house({ x: 800, w: 760, wallH: 260, roof: "frame", wall: "frame" }) + rect(560, G - 220, 480, 220, C.paper2, C.woodD, 6), mood: "day" };
    if (stage === 0) {
      a += range(6).map((i) => line(420 + i * 150, G - 8, 420 + i * 150, G - 40, 4, C.slate)).join("");
      a += range(6).map((i) => rect(1280, G - 20 - i * 18, 240, 18, C.wood, C.woodD, 2)).join("");
    }
    if (stage >= 1) a += house({ x: 800, w: 800, wallH: 280, roof: stage >= 2 ? "frame" : "none", wall: "frame" });
    if (stage >= 1) a += rect(500, G - 200, 140, 120, C.paper2, C.woodD, 5) + rect(960, G - 200, 140, 120, C.paper2, C.woodD, 5) + rect(750, G - 220, 100, 220, C.paper2, C.woodD, 5);
    if (stage === 3) a = rect(380, G - 8, 840, 22, C.stone) + house({ x: 800, w: 800, wallH: 280, roof: "deck", wall: "#dcc095", windows: false }) + rect(500, G - 200, 140, 120, "#4b4038") + rect(960, G - 200, 140, 120, "#4b4038") + rect(750, G - 220, 100, 220, "#4b4038");
    return { art: a, mood: "day" };
  },
  remodeling(st, last, v) {
    if (v === 1) return { art: room("#efece6", "#d8d4cc") + range(9).map((i) => line(0, 120 + i * 60, 900, 120 + i * 60, 1.5, "#c4c0b8")).join("") + rect(120, 140, 360, 510, "rgba(200,220,225,.45)", C.ink, 3) + rect(620, 470, 300, 180, C.woodD) + rect(600, 450, 340, 24, C.white), mood: "day" };
    if (v === 2) return { art: room("#eae2d4", "#b88d5f", true) + rect(120, 160, 600, 490, "#d8c6a8") + range(4).map((i) => line(120, 160 + i * 122, 720, 160 + i * 122, 4, C.woodD)).join("") + rect(820, 520, 420, 130, "#8c9a83", C.ink, 3, 18), mood: "gold" };
    const stage = v >= 0 ? 3 : st;
    let a = room(stage === 1 ? "#e6dac4" : C.paper2, stage === 0 ? "#d4c27a" : stage === 1 ? "#cdbfa5" : "#c79e6c", stage === 3);
    if (stage === 0) a += range(4).map((i) => rect(100 + i * 200, 420, 190, 230, "#a5743f", C.ink, 3)).join("") + rect(90, 400, 820, 26, "#d9cfb9") + range(4).map((i) => rect(100 + i * 200, 140, 190, 180, "#a5743f")).join("") + circle(520, 60, 30, "#e8e2c0");
    if (stage === 1) a += range(14).map((i) => rect(60 + i * 70, 80, 14, 570, C.wood, C.woodD, 2)).join("") + path(`M60 300 C 300 280 500 340 980 300`, "none", C.clay, 3);
    if (stage >= 2) {
      a += range(4).map((i) => rect(100 + i * 200, 420, 190, 230, "#f2efe8", C.ink, 3)).join("") + range(4).map((i) => rect(100 + i * 200, 120, 190, 200, "#f2efe8")).join("") + rect(300, 600, 560, 50, "#efe9de");
      if (stage === 3) {
        a += rect(90, 398, 820, 26, "#d6d3cc") + range(26).map((i) => line(100 + i * 31, 325, 100 + i * 31, 398, 1.2, C.ink, ' opacity=".3"')).join("");
        for (const x of [420, 620]) a += line(x, 0, x, 160, 2) + path(`M${x - 40} 210 Q ${x} 140 ${x + 40} 210 Z`, C.gold);
      }
    }
    return { art: a, mood: "day" };
  },
  painting(st, last, v) {
    const color = v === 1 ? "#33435c" : v === 2 ? "#f7f3ea" : st === last || v === 0 ? "#7f9078" : "#a8b3b8";
    let a = house({ x: 800, w: 720, wallH: 290, roof: "new", wall: color, worn: st === 0 && v < 0, trim: v === 2 ? C.char : C.white, door: v >= 0 || st === last ? "#1f1d1b" : "#7d6d5d" });
    if (st === 0 && v < 0) a += blotches("peel", 14, [460, 450, 680, 260], "#e9e4dc", 0.85);
    if (st === 1 && v < 0) {
      a += blotches("primer", 12, [460, 440, 680, 260], C.white, 0.95);
      for (const wx of [440 + 720 * 0.14, 1160 - 720 * 0.14 - 110]) a += rect(wx - 8, G - 290 + 46, 126, 136, "#d8c8a6", C.clay, 3);
    }
    a += shrub(380, G) + shrub(1220, G, 0.9);
    return { art: a, mood: st === last || v >= 0 ? "gold" : "day" };
  },
  concrete(st, last, v) {
    let a = house({ x: 800, w: 700, wallH: 220, roof: "new" });
    const stage = v >= 0 ? 2 : st;
    if (stage === 0) {
      a += drive("#a59e90") + blotches("crack", 6, [400, 740, 800, 140], "#7d766a", 0.5);
      a += path(`M690 ${G} l -30 60 l 40 50 l -60 70`, "none", C.ink, 3) + path(`M920 760 l 40 40 l -10 50 l 60 50`, "none", C.ink, 3) + path(`M520 840 l 120 -16 l 80 20`, "none", C.ink, 3);
      a += shrub(680, 790, 0.18, "#7c8a52") + shrub(940, 810, 0.2, "#7c8a52");
    }
    if (stage === 1) {
      a += drive("#b6a98f") + blotches("gravel", 30, [380, 730, 840, 160], "#8f8574", 0.4);
      a += range(8).map((i) => { const t = i / 7; return line(800 - 130 - 320 * t, G + 180 * t, 800 + 130 + 320 * t, G + 180 * t, 2, C.rust); }).join("");
      a += range(9).map((i) => line(670 + i * 32.5, G, 350 + i * 112.5, H, 2, C.rust)).join("");
      a += path(`M670 ${G} L350 ${H} M930 ${G} L1250 ${H}`, "none", C.woodD, 10);
    }
    if (stage === 2) {
      a += drive(v === 2 ? "#cdb99c" : "#d6d1c6");
      if (v === 1) a += range(30).map((i) => { const r = rng("st" + i); return path(`M${f(500 + r() * 600)} ${f(740 + r() * 150)} l 40 -10 l 30 20 l -20 30 l -50 -5 Z`, "none", "#9a9488", 2); }).join("");
      else if (v === 2) a += blotches("agg", 140, [420, 730, 760, 165], "#8c7356", 0.6, 5);
      else a += line(800 - 230, G + 70, 800 + 230, G + 70, 2) + line(800 - 360, G + 140, 800 + 360, G + 140, 2) + line(800, G, 800, H, 2);
    }
    return { art: a, mood: "day" };
  },
  landscaping(st, last, v) {
    const stage = v >= 0 ? 3 : st;
    const ground = stage === 0 ? "#bfae82" : stage === 3 ? "#8fa874" : "#b5b58a";
    let a = house({ x: 820, w: 640, wallH: 230, roof: "new" });
    if (stage === 0) a += blotches("dirt", 14, [80, 740, 1440, 150], "#9a8462", 0.6) + shrub(560, G + 10, 1.3, "#7f8a56") + shrub(1080, G + 10, 1.4, "#7f8a56") + shrub(800, G + 10, 1.1, "#7f8a56");
    if (stage >= 1) a += path(`M380 ${G + 60} C 620 ${G + 20} 1000 ${G + 90} 1260 ${G + 40} L 1260 ${G} L 380 ${G} Z`, v === 1 ? C.stone : "#5a4636");
    if (v === 1) a += blotches("rock", 30, [380, G + 6, 880, 40], C.stoneD, 0.7);
    if (stage >= 2) a += [440, 560, 700, 960, 1100, 1200].map((x, i) => i % 2 ? path(`M${x} ${G + 30} l -24 -70 M${x} ${G + 30} l 0 -84 M${x} ${G + 30} l 24 -70`, "none", C.sageD, 4) : shrub(x, G + 30, 0.5)).join("");
    if (stage === 3 && v !== 1) a += range(6).map((i) => rect(0, G + 70 + i * 22, W, 11, "#a1b986", "none", 0)).join("");
    if (v === 2) a += range(10).map((i) => path(`M${200 + i * 120} ${G + 120} l 90 -6 l 20 34 l -100 10 Z`, C.stone)).join("");
    return { art: a, mood: "gold", ground };
  },
  tree(st, last, v) {
    let a = house({ x: 980, w: 600, wallH: 230, roof: "new" });
    const stage = v >= 0 ? 2 : st;
    if (v === 1 || v === 2) {
      a += v === 1 ? `<ellipse cx="460" cy="${G + 20}" rx="70" ry="18" fill="${C.wood}" stroke="${C.ink}" stroke-width="3"/>` : `<ellipse cx="460" cy="${G + 30}" rx="90" ry="20" fill="#7b6449"/>`;
      return { art: a, mood: "gold" };
    }
    a += path(`M430 ${G} C 440 600 420 520 450 420 M450 470 C 520 420 600 400 700 380 M445 520 C 380 470 320 460 260 450`, "none", "#5f4b39", stage === 0 ? 26 : 22);
    const big = stage === 0;
    a += path(big ? `M120 470 C 60 320 240 160 420 190 C 560 90 860 140 940 300 C 1060 340 1020 470 900 470 C 760 520 300 540 120 470 Z`
      : `M210 430 C 170 300 300 200 440 220 C 560 150 720 210 740 320 C 800 380 740 450 640 440 C 520 470 320 480 210 430 Z`, big ? "#7a8a5e" : "#8fa06e");
    if (big) a += path(`M700 380 L 860 330 L 900 300`, "none", "#5f4b39", 10) + path(`M860 330 l 30 -40 M880 316 l 40 10`, "none", "#5f4b39", 5);
    if (stage === 2) a += range(5).map((i) => line(1250, 250, 900 - i * 110, G, 3, C.gold, ' opacity=".5"')).join("");
    return { art: a, mood: stage === 2 ? "gold" : "day" };
  },
  garage(st, last, v) {
    const stage = v >= 0 ? 2 : st;
    const dusk = stage === 2;
    let door;
    const gx = 520, gw = 560, gy = G - 230;
    if (stage === 0 && v < 0) door = rect(gx, gy, gw, 230, "#ebe7df") + range(4).map((i) => line(gx, gy + 57 * (i + 1), gx + gw, gy + 57 * (i + 1), 2)).join("") + path(`M${gx + 160} ${gy + 70} q 30 20 10 50`, "none", C.stoneD, 4) + line(gx + 280, gy + 114, gx + gw, gy + 124, 2);
    else if (v === 1) door = rect(gx, gy, gw, 230, "#3a3d42") + range(4).map((i) => range(5).map((j) => rect(gx + 12 + j * 108, gy + 10 + i * 55, 100, 46, dusk ? "#d9cba9" : "#c9d2d6", "#3a3d42", 2)).join("")).join("");
    else if (v === 2) door = rect(gx, gy, gw, 230, C.white) + range(4).map((i) => range(4).map((j) => rect(gx + 16 + j * 136, gy + 12 + i * 55, 120, 42, "none", C.ink, 2)).join("")).join("");
    else door = rect(gx, gy, gw, 230, "#5a4a3c") + range(4).map((j) => rect(gx + 14 + j * 136, gy + 14, 126, 46, dusk ? "#f2d18a" : "#c9d2d6")).join("") + range(9).map((i) => line(gx + i * 62, gy + 70, gx + i * 62, G, 2, "#3e3229")).join("") + line(gx + gw / 2, gy + 70, gx + gw / 2, G, 4, "#3e3229");
    let a = house({ x: 800, w: 900, wallH: 300, roof: "new", lit: dusk, garage: door, windows: true });
    if (dusk) a += circle(470, G - 200, 10, "#ffd98a") + circle(1130, G - 200, 10, "#ffd98a") + circle(470, G - 200, 40, "#ffd98a", "none", 0, ' opacity=".25"') + circle(1130, G - 200, 40, "#ffd98a", "none", 0, ' opacity=".25"');
    a += drive("#cfc8ba", gw, 1300);
    return { art: a, mood: dusk ? "dusk" : "day" };
  },
  plumbing(st, last, v) {
    if (v === 1) return { art: room("#e9e6df", C.stone) + rect(560, 160, 300, 380, C.white, C.ink, 3, 16) + circle(710, 260, 40, "#d9dde0") + path(`M620 540 V640 M700 540 V640 M780 540 V640`, "none", C.rust, 10), mood: "day" };
    if (v === 2) return { art: room("#efeae1", "#cdb592") + rect(300, 480, 900, 170, C.white) + rect(260, 460, 980, 26, "#d8d4cb") + path(`M760 460 V300 Q 760 250 820 250 H880 Q 920 250 920 300`, "none", C.char, 12), mood: "day" };
    const stage = v >= 0 ? 2 : st;
    let a = `<rect width="${W}" height="${H}" fill="#e6dccb"/>` + rect(200, 120, 1200, 700, stage === 2 ? "#efe6d3" : "#e2d5bd") + line(800, 120, 800, 820, 3);
    a += rect(200, 60, 1200, 60, "#cfc8bc") + path(`M700 120 V 260 Q 700 300 740 300 H 860 Q 900 300 900 260 V 120`, "none", C.ink, 3);
    const pc = stage === 0 ? "#8f8a7d" : C.clay;
    a += path(`M800 300 V 420 Q 800 470 760 470 H 600 Q 560 470 560 510 V 820`, "none", pc, 22) + path(`M480 820 V 560 H 420 M1120 820 V 560 H 1180`, "none", stage === 0 ? "#8f8a7d" : "#e9e7e1", 16);
    a += circle(480, 600, 22, stage === 0 ? "#6b8a6b" : "#cfd3d6") + circle(1120, 600, 22, stage === 0 ? "#6b8a6b" : "#cfd3d6");
    if (stage === 0) a += `<ellipse cx="900" cy="790" rx="220" ry="26" fill="${C.grime}" opacity=".35"/>` + path(`M1180 680 L1200 800 H1320 L1340 680 Z`, "#9da4a8") + blotches("corr", 6, [440, 420, 400, 120], "#6b8a6b", 0.5);
    if (stage === 2) a += rect(220, 780, 1160, 36, "#f6f1e7", C.ink, 2);
    return { art: a, mood: "day" };
  },
  electrical(st, last, v) {
    if (v === 1) return { art: room("#ebe4d8", "#bfa27e", true) + range(4).map((i) => circle(200 + i * 300, 40, 18, "#ffe3a3", C.ink, 2)).join("") + range(4).map((i) => path(`M${200 + i * 300} 60 L ${120 + i * 300} 640 H ${280 + i * 300} Z`, "#fff0c8", "none", 0, ' opacity=".35"')).join("") + rect(240, 520, 520, 130, "#8c9a83", C.ink, 3, 18), mood: "gold" };
    if (v === 2) return { art: room("#e8e5df", C.stone) + rect(640, 220, 220, 300, C.white, C.ink, 3, 22) + rect(690, 300, 120, 60, "#c8d6dc", C.ink, 2, 8) + path(`M750 520 C 760 640 560 620 600 700 C 640 760 860 740 820 650`, "none", C.char, 8), mood: "day" };
    const stage = v >= 0 ? 1 : st;
    let a = `<rect width="${W}" height="${H}" fill="${stage === 2 ? "#ede7dc" : "#e3ddd2"}"/>` + rect(0, 760, W, 140, C.stone, "none", 0) + line(0, 760, W, 760);
    a += rect(560, 120, 480, 600, stage === 0 ? "#b7b2a6" : "#d9dcdc", C.ink, 3, 6);
    if (stage === 0) {
      const r = rng("tangle");
      a += range(18).map(() => path(`M${f(600 + r() * 400)} ${f(160 + r() * 520)} C ${f(560 + r() * 480)} ${f(140 + r() * 560)} ${f(560 + r() * 480)} ${f(140 + r() * 560)} ${f(600 + r() * 400)} ${f(160 + r() * 520)}`, "none", ["#3b3a37", "#8a3b2c", "#d8d2c4"][Math.floor(r() * 3)], 4)).join("");
      a += range(8).map((i) => circle(700 + (i % 2) * 200, 200 + Math.floor(i / 2) * 110, 26, "#cdb995")).join("");
    }
    if (stage === 1) {
      a += rect(600, 160, 400, 520, "#ecefee", C.ink, 2) + line(800, 170, 800, 670, 4, C.char);
      a += range(10).map((i) => rect(640, 190 + i * 46, 130, 32, "#2d2f33", "none", 0, 4) + rect(830, 190 + i * 46, 130, 32, "#2d2f33", "none", 0, 4)).join("");
      a += range(6).map((i) => path(`M${620 + i * 8} 680 V 760`, "none", ["#2d2f33", "#a3342a", C.white][i % 3], 5)).join("");
    }
    if (stage === 2) a += rect(570, 130, 460, 580, "#e9ecec", C.ink, 3, 6) + rect(980, 380, 18, 70, C.stoneD, "none", 0, 6);
    return { art: a, mood: "day" };
  },
  pest(st, last, v) {
    if (v === 1) return { art: `<rect width="${W}" height="${H}" fill="#e4dccd"/>` + range(8).map((i) => rect(80 + i * 190, 100, 40, 520, C.wood, C.woodD, 2)).join("") + rect(0, 80, W, 30, C.woodD) + rect(0, 620, W, 280, "rgba(220,230,232,.7)", C.ink, 2), mood: "day" };
    if (v === 2) return { art: `<rect width="${W}" height="${H}" fill="#efe6d4"/>` + path(`M0 900 L800 120 L1600 900 Z`, "#e7d8bd") + range(12).map((i) => line(100 + i * 120, 900, 800, 120, 2, C.woodD, ' opacity=".4"')).join("") + blotches("ins", 30, [0, 760, W, 120], "#e9c7a1", 0.9) + rect(740, 360, 120, 120, "#cfd6d8", C.ink, 3), mood: "day" };
    const stage = v >= 0 ? 2 : st;
    let a = `<rect width="${W}" height="${H}" fill="${stage === 2 ? "#f2e5cc" : C.sky2}"/>` + rect(0, 0, W, 520, C.white) + range(20).map((i) => line(0, 26 * (i + 1), W, 26 * (i + 1), 1.5, C.ink, ' opacity=".18"')).join("");
    a += rect(0, 520, W, 220, C.stone) + line(0, 520, W, 520, 4) + rect(0, 740, W, 160, "#9aa58a", "none", 0) + line(0, 740, W, 740);
    a += path(`M980 600 H1600`, "none", "#d9d4cb", 34) + circle(980, 600, 26, stage === 0 ? "#3a3530" : C.white, C.ink, stage === 0 ? 3 : 8);
    if (stage === 0) a += rect(300, 512, 360, 14, "#3a3530", "none", 0) + blotches("leaf", 18, [80, 700, 1300, 60], "#9a6c3c", 0.8);
    else a += rect(0, 740, W, 70, "#c9c3b6", "none", 0) + blotches("grv", 90, [0, 745, W, 60], C.stoneD, 0.6, 6) + line(300, 520, 660, 520, 4, C.white);
    return { art: a, mood: stage === 2 ? "gold" : "day" };
  },
  junk(st, last, v) {
    if (v === 1) return { art: backdrop("day") + shrub(300, G, 0.9) + `<ellipse cx="900" cy="${G + 80}" rx="300" ry="40" fill="#a1b986"/>`, mood: "day", raw: true };
    if (v === 2) return { art: room("#efe9df", "#c49a68") + range(10).map((i) => line(0, 650 + i * 26, W, 650 + i * 26, 1.5, C.woodD, ' opacity=".5"')).join(""), mood: "day" };
    const stage = v >= 0 ? 2 : st;
    let a = `<rect width="${W}" height="${H}" fill="#ddd5c6"/>` + rect(160, 80, 1280, 560, "#e9e4da") + line(160, 640, 1440, 640) + rect(0, 640, W, 260, "#c9c3b7", "none", 0);
    a += path(`M160 640 L0 900 M1440 640 L1600 900`, "none", C.ink, 2) + rect(160, 60, 1280, 40, "#cfc8bc");
    const clutter = (seed, x0, x1) => { const r = rng(seed); return range(16).map(() => { const w = 70 + r() * 130, h = 60 + r() * 120, x = x0 + r() * (x1 - x0 - w); return rect(x, 650 - h - r() * 60, w, h, ["#c9a87a", "#b8956a", "#9d8a74", "#d6c2a0"][Math.floor(r() * 4)]); }).join(""); };
    if (stage === 0) a += clutter("all", 180, 1420) + rect(700, 520, 380, 120, "#ece6da", C.ink, 3, 22) + circle(320, 600, 48, "none") + circle(470, 600, 48, "none") + path(`M320 600 L 400 520 L 470 600`, "none", C.ink, 3);
    if (stage === 1) a += clutter("right", 810, 1420) + line(800, 640, 800, 900, 2, C.white);
    return { art: a, mood: "day" };
  },
  cleaning(st, last, v) {
    if (v === 1) return { art: room("#efebe4", "#d6d2ca") + rect(120, 420, 940, 230, C.white) + rect(100, 400, 980, 24, "#e3e0da") + range(5).map((i) => rect(130 + i * 186, 140, 176, 180, C.white)).join("") + path(`M1220 120 l 18 40 l 40 18 l -40 18 l -18 40 l -18 -40 l -40 -18 l 40 -18 Z`, C.gold, "none", 0), mood: "day" };
    const stage = v >= 0 ? 2 : st;
    let a = room(C.paper2, stage === 0 && v < 0 ? "#bda98a" : "#cdb08a", stage === 2);
    if (v !== 2) {
      a += rect(160, 420, 640, 160, "#9aa58a", C.ink, 3, 22) + rect(140, 380, 680, 70, "#a9b399", C.ink, 3, 22) + rect(360, 690, 380, 70, "#d9cdb8", C.ink, 3, 8);
      if (stage === 0) a += path(`M200 410 l 50 -60 l 60 50 Z M640 420 l 40 -70 l 70 60 Z`, "#d6a46c") + rect(420, 790, 240, 50, "#c96f43", C.ink, 2, 6) + blotches("dust", 10, [1080, 160, 330, 320], "#b8b2a6", 0.55) + blotches("crumbs", 10, [360, 680, 380, 30], "#8d7e66", 0.5);
      if (stage >= 1) a += path(`M220 420 l 50 -54 l 56 54 Z M600 420 l 50 -54 l 56 54 Z`, "#d6a46c") + rect(560, 380, 220, 40, "#c96f43", C.ink, 2, 6);
      if (stage === 2) a += path(`M1080 480 L860 900 H1300 L1410 480 Z`, "#fff4d8", "none", 0, ' opacity=".5"') + path(`M1500 220 l 12 28 l 28 12 l -28 12 l -12 28 l -12 -28 l -28 -12 l 28 -12 Z`, C.gold, "none", 0);
    }
    return { art: a, mood: "day" };
  },
  towing(st, last, v) {
    let a = backdrop("dusk", "#3d4756", 330) + drive("#545d6b", 60, 1500, G, 800) + range(6).map((i) => rect(796, G + 10 + i * 34, 8, 18, "#e9d9a8", "none", 0)).join("");
    a += line(800 - 30, G, 800 - 750, H, 3, "#d9d2c0") + line(800 + 30, G, 800 + 750, H, 3, "#d9d2c0");
    const car = (x, y, s = 1, haz = false, hood = false) => path(`M${x - 150 * s} ${y} V${y - 50 * s} Q ${x - 140 * s} ${y - 70 * s} ${x - 100 * s} ${y - 74 * s} L ${x - 70 * s} ${y - 120 * s} H ${x + 70 * s} L ${x + 100 * s} ${y - 74 * s} Q ${x + 140 * s} ${y - 70 * s} ${x + 150 * s} ${y - 50 * s} V ${y} Z`, "#2a2d33", "#11141a", 3)
      + rect(x - 60 * s, y - 112 * s, 120 * s, 34 * s, "#4c5566", "none", 0)
      + circle(x - 120 * s, y - 40 * s, 14 * s, haz ? "#ffb347" : "#7a3b33", "none", 0) + circle(x + 120 * s, y - 40 * s, 14 * s, haz ? "#ffb347" : "#7a3b33", "none", 0)
      + (haz ? circle(x - 120 * s, y - 40 * s, 44 * s, "#ffb347", "none", 0, ' opacity=".25"') + circle(x + 120 * s, y - 40 * s, 44 * s, "#ffb347", "none", 0, ' opacity=".25"') : "")
      + (hood ? path(`M${x - 100 * s} ${y - 74 * s} L ${x - 60 * s} ${y - 170 * s} H ${x + 60 * s} L ${x + 100 * s} ${y - 74 * s}`, "#2a2d33", "#11141a", 3) : "");
    const truck = (x, y, s, loaded) => rect(x - 260 * s, y - 70 * s, 400 * s, 30 * s, "#e9e6df", "#11141a", 3) + rect(x + 140 * s, y - 190 * s, 150 * s, 150 * s, "#f1eee8", "#11141a", 3) + rect(x + 170 * s, y - 170 * s, 90 * s, 60 * s, "#4c5566", "none", 0)
      + circle(x - 180 * s, y - 30 * s, 34 * s, "#1c1f25") + circle(x + 210 * s, y - 30 * s, 34 * s, "#1c1f25") + rect(x + 190 * s, y - 210 * s, 60 * s, 14 * s, "#ffb347", "none", 0)
      + (loaded ? car(x - 60 * s, y - 70 * s, s * 0.95) : "");
    const stage = v >= 0 ? [1, 0, 2][v] : st;
    if (stage === 0) a += car(1040, 860, 1.4, true, v === 1);
    if (stage === 1) a += truck(980, 740, 1.05, false) + car(1080, 880, 1.4, true);
    if (stage === 2) a += truck(1000, 840, 1.3, true);
    return { art: a, mood: "dusk", raw: true };
  },
};

// Outdoor AC or heat pump beside a house wall.
function hvacUnit(old, wide) {
  let a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(0, 80, 980, G - 80, C.paper2) + range(24).map((i) => line(0, 80 + i * 27, 980, 80 + i * 27, 1, C.ink, ' opacity=".14"')).join("");
  a += rect(0, G, W, H - G, C.sage, "none", 0) + line(0, G, W, G) + rect(1040, 180, 220, 260, "#e4ebe7");
  a += rect(380, G - 10, 470, 26, old ? "#a39c8e" : C.stone, C.ink, 3, 4);
  if (old) a += line(560, G - 4, 640, G + 14, 2);
  a += rect(wide ? 390 : 420, G - 300, wide ? 450 : 390, 290, old ? "#b9b2a2" : "#dfe2e0", C.ink, 3, 10);
  a += range(16).map((i) => line(wide ? 410 : 440, G - 270 + i * 16, wide ? 520 : 790, G - 270 + i * 16, 1.5, C.ink, ' opacity=".45"')).join("");
  if (wide) a += circle(690, G - 155, 105, "#c9cecc") + circle(690, G - 155, 22, C.ink, "none");
  if (old) a += blotches("rust", 7, [430, G - 280, 360, 260], C.rust, 0.4) + shrub(330, G + 4, 0.6, "#8b8f5a") + shrub(900, G + 4, 0.5, "#8b8f5a");
  a += path(`M380 ${G - 220} H250 V${G - 380}`, "none", C.ink, 8) + rect(200, G - 470, 90, 110, "#d7d3ca");
  return a;
}

// Before/after pairs that are not story frames: (after) -> art, drawn whole.
const PAIRS = {
  hvac: (after) => hvacUnit(!after, false),
  pressure(after) {
    // Straight-down view, concrete edge to edge: slabs with saw-cut joints.
    let a = rect(0, 0, W, H, after ? C.stone : "#4a4439", "none", 0);
    const joints = after ? "#a9a59c" : "#2b271f";
    a += range(3).map((i) => line(0, 225 * (i + 1), W, 225 * (i + 1), 4, joints)).join("") + range(3).map((i) => line(400 * (i + 1), 0, 400 * (i + 1), H, 4, joints)).join("");
    if (!after) {
      a += blotches("pw-grime", 34, [0, 0, W, H], "#2a261f", 0.5) + blotches("pw-oil", 3, [500, 300, 600, 300], "#15130f", 0.7);
      // moss and mildew along every joint
      const r = rng("pw-joint");
      a += range(70).map(() => { const v = r() < 0.5, k = 1 + Math.floor(r() * 3); const x = v ? 400 * k + (r() - 0.5) * 16 : r() * W, y = v ? r() * H : 225 * k + (r() - 0.5) * 12;
        return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(v ? 8 + r() * 8 : 20 + r() * 40)}" ry="${f(v ? 20 + r() * 40 : 8 + r() * 8)}" fill="#4f6a3f" opacity=".75"/>`; }).join("");
      a += path(`M300 0 C 290 300 340 600 320 900 M1180 0 C 1190 300 1150 600 1170 900`, "none", "#16140f", 70, ' opacity=".35"');
    } else {
      a += `<g opacity=".35">${range(6).map((i) => path(`M${i * 300 - 100} ${H} L${i * 300 + 200} 0 L${i * 300 + 240} 0 L${i * 300 - 60} ${H} Z`, "#ffffff")).join("")}</g>`;
    }
    return a;
  },
  framing(after) {
    let a = room(after ? "#f1ece3" : "#e6d6bb", after ? "#d2b48a" : "#cbb79a", after);
    if (!after) {
      a += range(15).map((i) => rect(40 + i * 70, 90, 14, 560, C.wood, C.woodD, 2)).join("") + rect(30, 80, 1060, 14, C.wood, C.woodD, 2);
      a += range(8).map((i) => line(i * 200, 0, i * 200 + 40, 70, 8, C.woodD)).join("");
      a += line(1380, 650, 1380, 520, 4) + rect(1340, 470, 80, 50, "#f3d08c", C.ink, 3, 6);
    } else {
      a += line(0, 640, 1080, 640, 8, C.white) + range(3).map((i) => circle(300 + i * 300, 40, 14, "#ffe3a3", C.ink, 2)).join("");
    }
    return a;
  },
};

// Which stage and variant a slot draws.
function stageFor(trade, slotId) {
  const k = CINE_KIT[trade];
  const last = k ? k.story.length - 1 : 0;
  if (!k) return { st: 0, last, v: -1 };
  if (slotId === "before") return { st: 0, last, v: -1 };
  if (slotId === "after") return { st: last, last, v: -1 };
  const si = k.story.findIndex((s) => s.id === slotId);
  if (si >= 0) return { st: si, last, v: -1 };
  const vi = k.styles.findIndex((s) => s.id === slotId);
  if (vi >= 0) return { st: last, last, v: vi };
  return { st: last, last, v: -1 };
}

const INTERIOR = new Set(["restoration", "remodeling", "plumbing", "electrical", "junk", "cleaning", "pest"]);

// Gentle looping motion inside the drawing (clouds drift, light breathes),
// off for people who ask for reduced motion.
const MOTION = `<style>.drift{animation:dr 38s ease-in-out infinite alternate}.drift2{animation:dr 56s ease-in-out infinite alternate-reverse}
.glow{animation:gl 5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:center}
.sway{animation:sw 4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:bottom}
.shimmer{animation:sh 7s ease-in-out infinite alternate}.fall{animation:fa 1.6s linear infinite}
@keyframes sw{from{transform:skewX(-4deg)}to{transform:skewX(4deg)}}@keyframes sh{from{transform:translateX(-220px)}to{transform:translateX(220px)}}
@keyframes fa{from{transform:translateY(-30px);opacity:0}30%{opacity:.8}to{transform:translateY(60px);opacity:0}}
@keyframes dr{from{transform:translateX(-60px)}to{transform:translateX(60px)}}@keyframes gl{from{opacity:.25}to{opacity:.75}}
@media (prefers-reduced-motion:reduce){.drift,.drift2,.glow,.sway,.shimmer,.fall{animation:none}}</style>`;

export function placeholderSvg(trade, slotId, labelText) {
  const carbon = CARBON_TRADES.has(trade);
  Object.assign(C, carbon ? CARBON : LIGHT);
  try {
    const { st, last, v } = stageFor(trade, slotId);
    const k = CINE_KIT[trade];
    const isStory = !!(k && k.story.some((s) => s.id === slotId));
    const scene = SCENES[trade];
    let body, mood = "day";
    if (PAIRS[trade] && (slotId === "before" || slotId === "after")) {
      body = PAIRS[trade](slotId === "after");
    } else if (scene) {
      const out = scene(st, last, v);
      // One camera for the whole story: the light of the last frame on every frame,
      // so nothing but the work changes when frames crossfade.
      mood = isStory ? scene(last, last, -1).mood || "day" : out.mood || "day";
      const exterior = !out.raw && !INTERIOR.has(trade);
      const isStyle = !!(k && k.styles.some((s) => s.id === slotId));
      const art = isStyle && exterior ? `<g transform="translate(220 0)">${out.art}</g>` : out.art;
      body = (exterior ? backdrop(mood, out.ground, isStyle ? 1060 : 1250, out.gy || G) : "") + art;
    } else {
      body = backdrop("gold") + house({});
    }
    const dark = mood === "dusk" || carbon;
    // Story frames share one label so it does not ghost during the crossfade.
    const text = isStory ? `Scroll story: ${k.story.length} pictures, one scene` : labelText;
    const vignette = `<defs><radialGradient id="vg" cx="50%" cy="46%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1d1b18" stop-opacity="${dark ? 0.4 : 0.16}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${svgEsc("Sample picture: make in Higgsfield. " + text)}">${MOTION}${body}${vignette}${frameMarks(dark)}${label(text, dark, k && k.styles.some((s) => s.id === slotId) ? 140 : 96)}</svg>`;
  } finally {
    Object.assign(C, LIGHT);
  }
}

export function placeholderArt(trade, slotId, label) {
  const k = CINE_KIT[trade];
  let text = label;
  if (!text && k) {
    const s = k.story.find((x) => x.id === slotId);
    const y = k.styles.find((x) => x.id === slotId);
    text = s ? s.headline : y ? y.name : slotId === "before" ? "Before" : slotId === "after" ? "After" : slotId;
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(placeholderSvg(trade, slotId, text || ""));
}

// A drawn plan sheet (white lines on blueprint blue) for the blueprint tool:
// the engine lays it over the finished picture and wipes it away. It is a
// drawing, not a photo, so it needs no label and costs no Higgsfield picture.
export function blueprintSvg(trade) {
  const B = "#1d4f9c", Ln = "#e8f0ff";
  const l = (x1, y1, x2, y2, w = 2.5) => line(x1, y1, x2, y2, w, Ln);
  const r = (x, y, w, h, sw = 2.5) => rect(x, y, w, h, "none", Ln, sw);
  const grid = range(33).map((i) => line(i * 50, 0, i * 50, H, 1, Ln, ' opacity=".12"')).join("") +
    range(19).map((i) => line(0, i * 50, W, i * 50, 1, Ln, ' opacity=".12"')).join("");
  let plan;
  if (trade === "remodeling") {
    // kitchen plan: counters, island, sink, range
    plan = r(300, 180, 1000, 560, 6) + r(300, 180, 1000, 90) + r(300, 180, 90, 560) + r(620, 420, 360, 140) +
      circle(520, 225, 26, "none", Ln, 2.5) + r(800, 195, 110, 60) + range(4).map((i) => circle(830 + (i % 2) * 50, 210 + Math.floor(i / 2) * 30, 9, "none", Ln, 2)).join("") +
      path(`M1300 600 A 120 120 0 0 0 1180 720`, "none", Ln, 2.5) + l(1180, 720, 1300, 720);
  } else {
    // house floor plan: outer walls, rooms, doors, windows, stair
    plan = r(260, 150, 1080, 600, 7) + l(700, 150, 700, 520) + l(260, 520, 1000, 520) + l(1000, 150, 1000, 750) + l(700, 380, 1000, 380) +
      path(`M700 470 A 50 50 0 0 1 750 520`, "none", Ln, 2) + path(`M1000 600 A 60 60 0 0 0 940 660`, "none", Ln, 2) + path(`M560 750 A 70 70 0 0 1 630 680`, "none", Ln, 2) +
      range(8).map((i) => l(1050 + i * 34, 560, 1050 + i * 34, 740, 2)).join("") + l(1050, 650, 1320, 650, 2) +
      [[380, 150], [880, 150], [1160, 150], [260, 330], [1340, 300]].map(([x, y]) => (y === 150 ? r(x, y - 8, 120, 16, 2) : r(x - 8, y, 16, 120, 2))).join("");
  }
  // dimension lines and a title box drawn with strokes only (no lettering)
  const dims = l(260, 100, 1340, 100, 1.5) + l(260, 88, 260, 112, 1.5) + l(1340, 88, 1340, 112, 1.5) +
    l(1400, 150, 1400, 750, 1.5) + l(1388, 150, 1412, 150, 1.5) + l(1388, 750, 1412, 750, 1.5) +
    r(1180, 790, 360, 80, 2) + l(1180, 820, 1540, 820, 1.5) + l(1300, 820, 1300, 870, 1.5);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Drawn plan"><rect width="${W}" height="${H}" fill="${B}"/>${grid}${plan}${dims}</svg>`;
}

export function blueprintArt(trade) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(blueprintSvg(trade));
}

/* ---------- Editorial look (round 3) ---------- */
// editorialLook(themeKey, tradeKey) -> { css, fontsHref } layered on top of
// editorial.js's base CSS. Same trade palettes as the cinematic look: cream +
// serif trades get warm paper and an AA accent; pressure washing and HVAC keep
// carbon night sections with a true yellow / orange; builders get blueprint blue.
// editorialShape(tradeKey) -> clip-path for the hero picture.
export const ED_LOOK_FONTS =
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..700&family=Manrope:wght@400;500;600;700;800&display=swap";

const ED_HOUSE = "polygon(0% 100%, 0% 40%, 50% 0%, 100% 40%, 100% 100%)";
export function editorialShape(tradeKey) {
  if (tradeKey === "fencing") return null; // the picket line in editorial.js suits it
  if (tradeKey === "tree" || tradeKey === "landscaping") return null; // tree silhouette
  return ED_HOUSE;
}

export function editorialLook(themeKey, tradeKey) {
  const v = cineVars(themeKey, tradeKey);
  const carbon = v.display === "grotesk";
  const darker = { "#a94a0b": "#8f3d08", "#b0261f": "#9a1f19", "#855a00": "#7a5300", "#7a5710": "#6f4f0e" };
  const p = carbon
    ? { cream: v.paper, cream2: v.paper2, paper: "#fbfaf7", line: "rgba(18,18,18,.18)", accent: v.ink, hi: v.accentHi, dark: v.night, mark: v.accent }
    : { cream: "#ece5dc", cream2: "#e2d9cd", paper: "#f5f0e8", line: "rgba(22,20,18,.2)", accent: darker[v.accentText] || v.accentText, hi: v.accentHi, dark: tradeKey && CINE_TRADE_LOOK[tradeKey] === "woodBlueprint" ? "#13284a" : "#14110f", mark: null };
  const css = `
:root{--ed-cream:${p.cream};--ed-cream2:${p.cream2};--ed-paper:${p.paper};--ed-line:${p.line};--ed-accent:${p.accent};--ed-hi:${p.hi};--ed-dark:${p.dark};--ed-muted:${carbon ? v.muted : "#5a5249"}}
::selection{background:${v.accent};color:${v.accentInk}}
body{caret-color:var(--ed-accent);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
html{scrollbar-color:var(--ed-muted) var(--ed-cream)}
.ed-nav{background:color-mix(in srgb,var(--ed-cream) 80%,transparent)}
.ed-logo{color:var(--ed-ink)}
.ed-eyebrow::before{background:${carbon ? "var(--ed-hi)" : "currentColor"};height:2px}
/* Type: Didone capitals with one italic lowercase accent word; display capped at 6rem */
.ed h1,.ed h2,.ed .ed-big{font-weight:500;letter-spacing:.002em;font-optical-sizing:auto}
.ed-hero h1{font-size:clamp(44px,7.4vw,96px);line-height:.93}
.ed-sec h2{font-size:clamp(38px,6.2vw,84px);line-height:.95}
.ed-final h2{font-size:clamp(42px,6.8vw,92px)}
.ed-beat .ed-big{font-size:clamp(40px,7.6vw,96px);text-transform:uppercase;line-height:.94;max-width:12ch}
.ed h1 em,.ed h2 em,.ed .ed-big em{font-style:italic;font-weight:400;text-transform:none;letter-spacing:-.01em;color:var(--ed-accent);padding-right:.04em${carbon ? `;background:linear-gradient(transparent 60%,${p.mark} 60%,${p.mark} 90%,transparent 90%)` : ""}}
.ed-dark h2 em,.ed-final h2 em,.ed-beat .ed-big em{color:var(--ed-hi);background:none}
.ed-card h3{font-size:clamp(40px,6vw,76px);text-shadow:0 2px 30px rgba(0,0,0,.35)}
.ed-meta dt,.ed-pill{font-size:12px}
.ed-row-name{text-transform:uppercase;letter-spacing:.004em;font-size:clamp(28px,4.4vw,48px)}
.ed-num{font-variant-numeric:lining-nums}
/* One authored moment: the hero picture rises into its house shape */
@media (prefers-reduced-motion:no-preference){
.ed-sil[data-shape=house]{animation:ed-rise 1.1s var(--ed-ease) both}
.ed-sil img{animation:ed-settle 1.6s var(--ed-ease) both}
@keyframes ed-rise{from{clip-path:polygon(14% 100%,14% 58%,50% 34%,86% 58%,86% 100%)}to{clip-path:${ED_HOUSE}}}
@keyframes ed-settle{from{transform:scale(1.08)}to{transform:none}}
}
.ed-sil{border-radius:0 0 24px 24px}
.ed-sil.ph img{inset:0;height:100%;object-position:50% 0}
.ed-final{background:var(--ed-dark)}
`;
  return { css, fontsHref: ED_LOOK_FONTS };
}
