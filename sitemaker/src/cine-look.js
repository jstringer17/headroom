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
@media (hover:hover) and (pointer:fine){.cine-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px -12px rgba(0,0,0,.5)}}
.cine-btn:active{transform:scale(.97);transition:transform 160ms cubic-bezier(.23,1,.32,1)}
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
.big-phone{white-space:normal;overflow-wrap:anywhere;max-width:100%}
.final .grid>*{min-width:0}
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
function house({ x = 800, w = 640, wallH = 250, roof = "new", wall = C.white, worn = false, windows = true, door = "#55463a", lit = false, garage = null, trim = C.white, base = G, roofH = 190, roofFill = null } = {}) {
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
    const fill = roofFill || { old: "#a99d89", deck: "#dcc095", wrap: "#d3d1cb", new: C.char, metal: "#5b4636", slate: C.slate,
      tile: "#b8613b", tileOld: "#c99a7b", battens: "#d3d1cb", slateOld: "#8a8f94", felt: "#46423d", shake: "#b98a55", shakeOld: "#8d877c", skip: "#e4d3b5" }[roof] || C.char;
    out += path(tri, fill);
    // Variant roof materials (tile, slate, shake), each with an aged first look.
    if (roof === "tile" || roof === "tileOld") out += range(Math.ceil((eY - peak) / 18)).map((i) => {
      const y = peak + 18 * (i + 1), t = (y - peak) / (eY - peak), a = x - (x - eL) * t, b = x + (eR - x) * t;
      return range(Math.max(1, Math.floor((b - a) / 22))).map((j) => path(`M${f(a + j * 22)} ${f(y)} q 11 -16 22 0`, "none", roof === "tile" ? "#8a4426" : "#9a7a62", 1.6)).join("");
    }).join("");
    if (roof === "tileOld") { const r = rng("tile-old"); out += range(8).map(() => rect(x - 220 + r() * 440, peak + 40 + r() * (eY - peak - 60), 22, 14, "#5e5048", "none", 0)).join(""); }
    if (roof === "battens") out += rows(26, C.woodD, 4);
    if (roof === "slateOld") { out += rows(20, "#6e747a", 1.5); const r = rng("slate-old"); out += range(14).map(() => `<ellipse cx="${f(x - 200 + r() * 400)}" cy="${f(peak + 60 + r() * (eY - peak - 80))}" rx="${f(10 + r() * 22)}" ry="6" fill="#5f7a4a" opacity=".7"/>`).join("") + range(5).map(() => rect(x - 180 + r() * 360, peak + 80 + r() * (eY - peak - 110), 20, 18, "#4a4440", "none", 0)).join(""); }
    if (roof === "felt") out += rows(40, "#5d5852", 1.2) + path(`M${x - 60} ${peak + 40} l 0 -50 l 50 0 l 0 ${f(50 + 50 * 0.6)}`, "#b8734a", "#8f5232", 3);
    if (roof === "shake" || roof === "shakeOld") out += rows(24, roof === "shake" ? "#8a6440" : "#6b665e", 3) + range(Math.ceil((eY - peak) / 24) * 14).map((i) => {
      const row = Math.floor(i / 14), y = peak + 24 * (row + 1), t = (y - peak) / (eY - peak), a = x - (x - eL) * t, b = x + (eR - x) * t, xx = a + (b - a) * (((i % 14) + (row % 2) * 0.5) / 14);
      return xx < b ? line(xx, y - 22, xx, y, 1.2, roof === "shake" ? "#8a6440" : "#6b665e") : "";
    }).join("");
    if (roof === "shakeOld") { const r = rng("shake-old"); out += range(12).map(() => `<ellipse cx="${f(x - 200 + r() * 400)}" cy="${f(peak + 70 + r() * (eY - peak - 90))}" rx="${f(12 + r() * 20)}" ry="7" fill="#5f7a4a" opacity=".65"/>`).join(""); }
    if (roof === "skip") out += rows(30, C.woodD, 6, 0.8);
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
function label(text, dark, y = 96, cx = 800) {
  const t1 = "Sample picture: make in Higgsfield";
  const t2 = text.length > 40 ? text.slice(0, 39) + "\u2026" : text;
  return `<g font-family="Helvetica, Arial, sans-serif" text-anchor="middle">
<rect x="${cx - 200}" y="${y}" width="400" height="74" rx="12" fill="${dark ? "rgba(250,246,238,.92)" : "rgba(29,27,24,.86)"}"/>
<text x="${cx}" y="${y + 32}" font-size="20" font-weight="700" fill="${dark ? "#1d1b18" : "#faf6ee"}">${svgEsc(t1)}</text>
<text x="${cx}" y="${y + 59}" font-size="17" fill="${dark ? "#4a443b" : "#d8cfbf"}">${svgEsc(t2)}</text></g>`;
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
    if (v === 1) {
      // House washing: the front wall up close, clean siding, trim and a window
      let a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(0, 120, W, 680, "#e9e6df", C.ink, 3);
      a += range(26).map((i) => line(0, 120 + i * 26, W, 120 + i * 26, 1.5, "#b9b4a9")).join("");
      a += rect(980, 240, 300, 340, "#9fb2bd", C.ink, 4) + line(1130, 240, 1130, 580, 3) + line(980, 410, 1280, 410, 3) + rect(960, 220, 340, 380, "none", "#f6f3ec", 14);
      a += rect(0, 800, W, 100, C.stone, "none", 0) + line(0, 800, W, 800, 3);
      return { art: a, mood: "day", raw: true };
    }
    if (v === 2) {
      // Decks: clean wood boards in perspective, a railing and the house wall behind
      let a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(0, 0, W, 420, "#e9e6df") + range(14).map((i) => line(0, 30 * (i + 1), W, 30 * (i + 1), 1.5, "#b9b4a9")).join("");
      a += rect(620, 120, 360, 300, "#3c4148", C.ink, 3) + line(800, 120, 800, 420, 3);
      a += path(`M0 420 H${W} V${H} H0 Z`, "#c79e6c", "none", 0);
      a += range(22).map((i) => line(800 + (i - 11) * 18, 420, 800 + (i - 11) * 150, H, 2, "#8e6a43")).join("");
      a += range(10).map((i) => line(60 + i * 160, 330, 60 + i * 160, 430, 6, "#f3efe7")).join("") + line(0, 330, W, 330, 8, "#f3efe7");
      return { art: a, mood: "day", raw: true };
    }
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

// Optional service pictures for the editorial rows (kit.editorial.extra[].mod).
const EXTRA = {
  roofing: {
    gutters: () => backdrop("gold") + house({ roof: "new" }) + line(270, G - 244, 1330, G - 244, 14, C.rust) + line(1300, G - 244, 1300, G, 10, C.rust) + line(300, G - 244, 300, G, 10, C.rust),
    flat: () => backdrop("day") + rect(380, G - 300, 840, 300, C.paper2) + rect(360, G - 330, 880, 34, C.stone) + range(6).map((i) => rect(440 + i * 130, G - 240, 90, 120, "#9fb2bd")).join("") + rect(760, G - 110, 90, 110, C.char),
    skylight: () => backdrop("day") + house({ roof: "new" }) + [[620, 360], [900, 360]].map(([x, y]) => path(`M${x} ${y} l 80 0 l 18 70 l -80 0 Z`, "#9fc0d6", C.ink, 3)).join(""),
  },
  fencing: {
    chain: () => backdrop("gold") + rect(0, G, W, H - G, C.sage, "none", 0) + range(29).map((i) => line(60 + i * 50, 480, 60 + i * 50 + 50, 690, 1.5, "#8c9298") + line(60 + i * 50 + 50, 480, 60 + i * 50, 690, 1.5, "#8c9298")).join("") + line(60, 480, 1540, 480, 6, "#8c9298") + range(8).map((i) => line(60 + i * 211, 470, 60 + i * 211, 700, 8, "#7d838a")).join(""),
    gate: () => backdrop("gold") + rect(0, G, W, H - G, C.sage, "none", 0) + rect(80, 470, 1440, 240, C.wood) + range(60).map((i) => line(80 + i * 24, 470, 80 + i * 24, 710, 1.5, C.woodD)).join("") + rect(680, 440, 240, 270, "#d9b07c", C.ink, 4) + path("M680 700 L920 460", "none", C.woodD, 6) + rect(690, 490, 24, 10, C.char) + rect(690, 640, 24, 10, C.char) + circle(900, 580, 8, C.char, "none", 0),
    repair: () => backdrop("day") + rect(0, G, W, H - G, C.sage, "none", 0) + rect(80, 470, 1440, 240, "#a99a86") + range(60).map((i) => line(80 + i * 24, 470, 80 + i * 24, 710, 1.5, "#7d7262")).join("") + rect(704, 470, 120, 240, C.wood) + range(5).map((i) => line(704 + i * 24, 470, 704 + i * 24, 710, 1.5, C.woodD)).join(""),
    farm: () => backdrop("gold") + rect(0, G - 40, W, H - G + 40, C.sage, "none", 0) + range(9).map((i) => line(40 + i * 190, 560, 40 + i * 190, 740, 10, C.woodD)).join("") + [600, 640, 680].map((y) => line(0, y, W, y + 20, 9, C.wood)).join(""),
  },
  pressure: {
    roof: () => backdrop("day", C.sage, 1250, G) + house({ roof: "new" }) + `<clipPath id="lh"><rect x="0" y="0" width="800" height="900"/></clipPath><g clip-path="url(#lh)">${range(14).map((i) => line(420 + i * 30, 300, 380 + i * 30, 460, 10, "#0a0a0a", ' opacity=".45"')).join("")}</g>` + line(800, 280, 800, 470, 3, C.ink),
    gutter: () => rect(0, 0, W, H, C.sky2, "none", 0) + path("M0 360 L1600 360 L1600 300 L0 300 Z", C.char) + rect(0, 360, W, 90, "#eeeeea", C.ink, 3) + range(9).map((i) => path(`M${40 + i * 80} 370 l 20 70`, "none", "#2a2a2a", 9, ' opacity=".55"')).join("") + line(800, 350, 800, 460, 3, C.ink) + rect(0, 450, W, 450, "#e9e6df") + range(16).map((i) => line(0, 470 + i * 26, W, 470 + i * 26, 1.5, "#b9b4a9")).join(""),
    store: () => rect(0, 0, W, H, C.sky2, "none", 0) + rect(200, 140, 1200, 560, "#e9e6df", C.ink, 3) + rect(200, 120, 1200, 40, C.stone) + rect(280, 320, 440, 380, "#9fb2bd", C.ink, 3) + rect(880, 320, 440, 380, "#9fb2bd", C.ink, 3) + rect(740, 360, 120, 340, C.char) + rect(0, 700, W, 200, C.stone, "none", 0) + line(0, 700, W, 700, 3),
    window: () => rect(0, 0, W, H, "#e9e6df", "none", 0) + range(34).map((i) => line(0, 26 * (i + 1), W, 26 * (i + 1), 1.5, "#b9b4a9")).join("") + rect(460, 150, 680, 560, "#f6f3ec", C.ink, 3) + rect(500, 190, 600, 480, "#a9c1cf", C.ink, 3) + line(800, 190, 800, 670, 4) + path("M540 600 L700 240 M600 640 L760 280", "none", "#ffffff", 10, ' opacity=".55"'),
  },
};

// Variant pictures (kit.variants): one scene per variant, drawn at story stage
// st (0 = first look, 3 = finished). Each variant has its own house and region.
const pine = (x, y, s = 1) => path(`M${x} ${y - 190 * s} L${x + 46 * s} ${y - 60 * s} L${x + 26 * s} ${y - 60 * s} L${x + 60 * s} ${y} L${x - 60 * s} ${y} L${x - 26 * s} ${y - 60 * s} L${x - 46 * s} ${y - 60 * s} Z`, "#5f7a5a", C.ink, 2);
const palm = (x, y) => path(`M${x} ${y} q 10 -120 -10 -230`, "none", "#8a6a48", 12) + range(6).map((i) => path(`M${x - 10} ${y - 230} q ${-90 + i * 36} -40 ${-120 + i * 48} ${10 + (i % 2) * 30}`, "none", "#6f8c5a", 10)).join("");
const stakes = (x0, x1, y, n) => line(x0, y + 60, x1, y + 60, 3, C.clay) + range(n + 1).map((i) => line(x0 + i * (x1 - x0) / n, y + 50, x0 + i * (x1 - x0) / n, y + 100, 5, C.woodD)).join("");
const VSCENES = {
  roofing(key, st) {
    const stage = (kinds) => kinds[st];
    if (key === "flat") {
      // Low modern building seen from a little above, so the roof itself shows.
      const top = G - 260, back = G - 400, fill = ["#8f8d87", "#b9b2a5", "#e7dfc9", "#f4f4f1"][st];
      let a = rect(380, top, 840, 260, C.paper2) + range(6).map((i) => rect(440 + i * 130, top + 70, 90, 110, "#9fb2bd")).join("") + rect(760, G - 110, 90, 110, C.char);
      a += path(`M380 ${top} L1220 ${top} L1150 ${back} L450 ${back} Z`, fill);
      if (st === 0) a += blotches("flat-pond", 6, [520, back + 30, 560, 90], "#3f3c37", 0.5) + range(4).map((i) => rect(500 + i * 170, back + 40 + (i % 2) * 40, 70, 30, "#a7a49c", C.ink, 1.5)).join("");
      if (st === 1) a += range(5).map((i) => rect(520 + i * 120, back + 50, 70, 40, "#efe6cf", C.ink, 2)).join("");
      if (st === 2) a += range(7).map((i) => line(450 + i * 100 - (i - 3) * 8, back, 380 + i * 140, top, 1.5, "#b9ad8f")).join("") + range(3).map((i) => line(430 - i * 18, back + 35 * (i + 1), 1170 + i * 18, back + 35 * (i + 1), 1.5, "#b9ad8f")).join("");
      if (st === 3) a += range(6).map((i) => line(450 + i * 120 - (i - 3) * 8, back, 380 + i * 168, top, 2, "#d5d6d2")).join("");
      a += rect(1000, back + 20, 90, 50, C.stone, C.ink, 2);
      a += line(380, top, 1220, top, st === 3 ? 10 : 6, st === 3 ? "#9aa0a6" : C.ink);
      return { art: a, mood: "day" };
    }
    if (key === "metal") {
      let a = house({ roof: stage(["old", "deck", "wrap", "metal"]), roofFill: st === 3 ? "#2e2d2b" : null, wall: "#f4f1ea" });
      a += range(15).map((i) => line(500 + i * 43, G - 250, 500 + i * 43, G, 1.2, C.ink, ' opacity=".2"')).join("");
      a += rect(420, G - 120, 760, 14, st === 3 ? "#2e2d2b" : "#a99d89") + range(5).map((i) => line(440 + i * 180, G - 106, 440 + i * 180, G, 6, C.white)).join("");
      return { art: a + shrub(300, G, 0.8), mood: "gold" };
    }
    if (key === "tile") {
      let a = house({ roof: stage(["tileOld", "wrap", "battens", "tile"]), wall: "#f3efe6", roofH: 110, w: 720, trim: "#f3efe6" });
      if (st === 1) a += range(3).map((i) => rect(700 + i * 70, 470, 56, 26, "#b8613b", C.ink, 2)).join("");
      return { art: a + palm(260, G) + palm(1380, G), mood: "gold", ground: "#d9c49a" };
    }
    if (key === "slate") {
      let a = house({ roof: stage(["slateOld", "deck", "felt", "slate"]), roofFill: st === 3 ? "#6d7a86" : null, wall: "#cfc8bb", roofH: 250, wallH: 270 });
      a += rect(980, 240, 60, 120, "#a99f90", C.ink, 3);
      if (st >= 2) a += line(980, 360, 1040, 360, 5, "#b8734a");
      return { art: a + shrub(380, G, 1.1) + shrub(1240, G, 1), mood: "day" };
    }
    if (key === "shake") {
      let a = path(`M0 ${G - 220} L260 ${G - 420} L520 ${G - 240} L820 ${G - 470} L1120 ${G - 250} L1380 ${G - 430} L1600 ${G - 260} L1600 ${G} L0 ${G} Z`, "#c3ccd2", "none", 0);
      a += house({ roof: stage(["shakeOld", "skip", "felt", "shake"]), wall: "#8a6440", trim: "#e9dcc4" });
      a += rect(380, G - 40, 840, 40, "#a39b8f", C.ink, 2);
      return { art: a + pine(220, G, 1.3) + pine(1400, G, 1.4) + pine(1520, G, 1), mood: "gold" };
    }
    return { art: house({}), mood: "gold" };
  },
  fencing(key, st) {
    const y0 = 600, x0 = 660, x1 = 1520, n = 8, step = (x1 - x0) / n;
    const post = { vinyl: C.white, aluminum: C.char, chainlink: "#9aa0a6", splitrail: "#7a5a3a", slat: "#3a3b3d" }[key] || C.woodD;
    let a = "";
    // vinyl: backyard with a small deck at left and a maple; aluminum: red-brick colonial front lawn with hedges.
    if (key === "vinyl") a += circle(1180, G - 300, 150, "#7f9a68") + rect(1166, G - 160, 28, 160, "#6b5038");
    if (key === "aluminum") a += house({ x: 1060, w: 520, wallH: 230, roofH: 150, roof: "new", wall: "#a8553f", trim: C.white });
    if (key === "chainlink") a += rect(1240, G - 200, 360, 200, "#e6ddcd", C.ink, 3) + path(`M1220 ${G - 200} L1420 ${G - 290} L1600 ${G - 230} L1600 ${G - 200} Z`, C.char) + rect(1300, G - 150, 220, 150, "#f3efe7", C.ink, 2);
    if (key === "slat") a += range(9).map((i) => path(`M${120 + i * 50} ${G} q -20 -90 -40 -130 M${120 + i * 50} ${G} q 10 -100 30 -140`, "none", "#9aa77a", 4)).join("");
    if (key === "splitrail") a += path(`M0 ${G - 60} C 400 ${G - 160} 900 ${G - 40} 1600 ${G - 140} L1600 ${G} L0 ${G} Z`, "#a9bf8f", "none", 0) + rect(1180, G - 210, 120, 80, "#a5523a", C.ink, 2) + circle(420, G - 260, 110, "#6f8c5a") + rect(408, G - 160, 24, 120, "#6b5038");
    a += rect(0, G - 2, W, H - G, C.sage, "none", 0);
    if (key === "vinyl") a += path(`M0 ${G + 20} L520 ${G + 20} L600 ${H} L0 ${H} Z`, C.wood) + range(8).map((i) => line(0, G + 30 + i * 22, 520 + i * 10, G + 30 + i * 22, 2, C.woodD)).join("");
    if (key === "chainlink") a += rect(0, G + 70, W, 50, "#cfc6b5", "none", 0);
    if (key === "slat") a += path(`M0 ${G + 40} L760 ${G + 40} L820 ${H} L0 ${H} Z`, "#d6d2c9") + range(4).map((i) => line(i * 200, G + 40, i * 210 + 30, H, 2, "#b4afa4")).join("") + rect(820, G + 120, W - 820, H - G - 120, "#c9c0ae", "none", 0);
    if (key === "splitrail") a += path(`M300 ${H} C 420 ${G + 80} 560 ${G + 10} 640 ${G - 40} L670 ${G - 40} C 600 ${G + 20} 520 ${G + 90} 460 ${H} Z`, "#cbbf9f");
    if (key === "aluminum") a += path(`M1010 ${G} L1110 ${G} L1180 ${H} L940 ${H} Z`, "#b5735a") + range(4).map((i) => `<ellipse cx="${700 + i * 130 + (i > 1 ? 380 : 0)}" cy="${G - 10}" rx="70" ry="34" fill="#6f8c5a"/>`).join("");
    if (st === 0) return { art: a + stakes(x0, x1, y0, n), mood: "gold" };
    if (key === "chainlink" && st >= 3) a += range(n * 10).map((i) => line(x0 + i * step / 10, y0 - 120, x0 + i * step / 10 + 40, y0 + 110, 1.2, "#8c9298") + line(x0 + i * step / 10 + 40, y0 - 120, x0 + i * step / 10, y0 + 110, 1.2, "#8c9298")).join("");
    if (key === "vinyl" && st >= 3) a += range(n).map((i) => rect(x0 + i * step + 6, y0 - 120, step - 12, 230, C.white)).join("");
    if (key === "aluminum" && st >= 3) a += range(n * 6).map((i) => line(x0 + i * step / 6, y0 - 90, x0 + i * step / 6, y0 + 100, 3, C.char)).join("");
    if (key === "slat") a += range(st >= 3 ? 14 : 3).map((i) => rect(x0, y0 + 90 - i * 16, x1 - x0, 11, "#b98a55", "none", 0)).join("");
    const pw = key === "splitrail" ? 22 : key === "aluminum" || key === "chainlink" ? 12 : 18;
    const ph = key === "splitrail" ? 170 : 250;
    a += range(n + 1).map((i) => rect(x0 + i * step - pw / 2, y0 + 110 - ph, pw, ph, post)).join("");
    if (key === "splitrail" && st >= 2) a += (st >= 3 ? [0, 1, 2] : [1]).map((r) => line(x0, y0 - 30 + r * 45, x1, y0 - 24 + r * 45, 12, "#9a7650")).join("");
    else if (key !== "slat" && st >= 2) a += line(x0, y0 - 100, x1, y0 - 100, 8, post) + (key === "chainlink" ? "" : line(x0, y0 + 80, x1, y0 + 80, 8, post));
    return { art: a, mood: "gold" };
  },
  pressure(key, st) {
    // The clean scene, then the grime layer over the part not washed yet.
    let a = "", dirt = "", clip;
    const done = [0, 1 / 3, 2 / 3, 1][st];
    if (key === "siding") {
      a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(0, 60, W, 640, "#f4f3ef", C.ink, 3) + range(24).map((i) => line(0, 60 + i * 26, W, 60 + i * 26, 1.5, "#c3c2bc")).join("");
      a += rect(980, 200, 300, 300, "#9fb2bd", C.ink, 4) + rect(960, 180, 340, 340, "none", "#f6f3ec", 14) + rect(0, 700, W, 200, C.sage, "none", 0) + shrub(300, 700) + shrub(600, 700, 0.8);
      dirt = rect(0, 60, W, 640, "#7f8a6a", "none", 0, 0, ' opacity=".35"') + blotches("sd-alg", 40, [0, 400, W, 300], "#4f6a3f", 0.5) + range(18).map((i) => line(40 + i * 90, 70, 40 + i * 90 + 6, 230, 8, "#5c5a52", ' opacity=".35"')).join("");
      clip = [0, 60 + 640 * done, W, 640 * (1 - done)];
    } else if (key === "deck") {
      a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(0, 0, W, 360, "#e9e6df") + rect(620, 80, 360, 280, "#3c4148", C.ink, 3);
      a += path(`M0 360 H${W} V640 H0 Z`, "#c79e6c", "none", 0) + range(22).map((i) => line(800 + (i - 11) * 18, 360, 800 + (i - 11) * 110, 640, 2, "#8e6a43")).join("");
      a += rect(0, 640, W, 260, "#cfc8bb", "none", 0) + range(8).map((i) => line(i * 200, 640, i * 200 - 60, H, 3, "#a49c8e")).join("") + range(3).map((i) => line(0, 700 + i * 70, W, 700 + i * 70, 3, "#a49c8e")).join("");
      dirt = rect(0, 360, W, 280, "#6f6a60", "none", 0, 0, ' opacity=".7"') + blotches("dk-mil", 30, [0, 380, W, 240], "#2e2b25", 0.45) + rect(0, 640, W, 260, "#6d7a5a", "none", 0, 0, ' opacity=".35"');
      clip = [W * done, 360, W * (1 - done), 540];
    } else if (key === "fence") {
      a = backdrop("gold") + rect(0, G, W, H - G, C.sage, "none", 0) + path(`M0 380 L${W} 470 L${W} 760 L0 800 Z`, C.wood) + range(70).map((i) => line(i * 23, 380 + i * 1.3, i * 23, 800 - i * 0.6, 1.5, C.woodD)).join("");
      dirt = path(`M0 380 L${W} 470 L${W} 760 L0 800 Z`, "#7a776f", "none", 0, ' opacity=".75"') + blotches("fn-mil", 30, [0, 640, W, 140], "#4f6a3f", 0.6);
      clip = [W * done, 0, W * (1 - done), H];
    } else if (key === "roof") {
      a = backdrop("day") + house({ roof: "new", roofFill: "#b5b6b2", wall: "#efe5d2", roofH: 160 });
      dirt = range(26).map((i) => line(330 + i * 36, 330 + Math.abs(i - 13) * 9, 334 + i * 36, 500, 12, "#141414", ' opacity=".4"')).join("");
      clip = [W * (0.2 + 0.6 * done), 0, W, H];
    } else {
      a = rect(0, 0, W, H, C.sky2, "none", 0) + rect(160, 140, 1280, 440, "#b0705a", C.ink, 3) + range(16).map((i) => line(160, 160 + i * 26, 1440, 160 + i * 26, 1, "#7d4a3a", ' opacity=".45"')).join("") + rect(140, 120, 1320, 40, C.stone);
      a += range(3).map((i) => rect(220 + i * 420, 260, 340, 260, "#9fb2bd", C.ink, 3)).join("") + rect(160, 520, 1280, 60, "#d8d2c5", C.ink, 2);
      a += rect(0, 580, W, 320, C.stone, "none", 0) + range(7).map((i) => line(120 + i * 230, 660, 60 + i * 250, H, 5, st === 3 ? "#ffffff" : "#e6e3dc")).join("");
      dirt = rect(0, 520, W, 380, "#5d5a53", "none", 0, 0, ' opacity=".55"') + blotches("sf-gum", 50, [0, 520, W, 380], "#1c1a16", 0.55);
      clip = [[0, 520, W, 380], [0, 580, W, 320], [W / 2, 580, W / 2, 320]][st];
    }
    if (done < 1) a += `<clipPath id="vw"><rect x="${f(clip[0])}" y="${f(clip[1])}" width="${f(Math.max(0, clip[2]))}" height="${f(Math.max(0, clip[3]))}"/></clipPath><g clip-path="url(#vw)">${dirt}</g>`;
    return { art: a, mood: "day", raw: key !== "fence" && key !== "roof" };
  },
};
// Close-up focus for a variant's before/after pair (scene x, y, zoom).
const VFOCUS = { roofing: [800, 400, 1.7], fencing: [1090, 580, 1.8], pressure: [800, 560, 1.5] };
function variantOf(trade, slotId) {
  const k = CINE_KIT[trade], m = /^([a-z]+)\/(?:s(\d)|(before|after))$/.exec(slotId || "");
  const v = m && k && (k.variants || []).find((x) => !x.default && x.key === m[1]);
  return v ? { key: v.key, v, part: m[2] || m[3] } : null;
}

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
.glow{transform-box:fill-box;transform-origin:center}
.sway{animation:sw 4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:bottom}
.shimmer{animation:sh 7s ease-in-out infinite alternate}.fall{animation:fa 1.6s linear infinite}
@keyframes sw{from{transform:skewX(-4deg)}to{transform:skewX(4deg)}}@keyframes sh{from{transform:translateX(-220px)}to{transform:translateX(220px)}}
@keyframes fa{from{transform:translateY(-30px);opacity:0}30%{opacity:.8}to{transform:translateY(60px);opacity:0}}
@keyframes dr{from{transform:translateX(-60px)}to{transform:translateX(60px)}}@keyframes gl{from{opacity:.25}to{opacity:.75}}
@media (prefers-reduced-motion:reduce){.drift,.drift2,.glow,.sway,.shimmer,.fall{animation:none}}</style>`;

export function placeholderSvg(trade, slotId, labelText, opts = {}) {
  const carbon = CARBON_TRADES.has(trade);
  Object.assign(C, carbon ? CARBON : LIGHT);
  try {
    const { st, last, v } = stageFor(trade, slotId);
    const k = CINE_KIT[trade];
    const isStory = !!(k && k.story.some((s) => s.id === slotId));
    const scene = SCENES[trade];
    let body, mood = "day";
    const extra = k && k.editorial && (k.editorial.extra || []).find((x) => x.id === slotId);
    const vr = VSCENES[trade] && variantOf(trade, slotId);
    if (vr) {
      // Variant slots: quiet drawn style, one scene per variant; before/after is a close-up.
      opts = { ...opts, quiet: true };
      const pair = vr.part === "before" || vr.part === "after";
      const out = VSCENES[trade](vr.key, pair ? (vr.part === "after" ? 3 : 0) : Math.min(3, Number(vr.part) - 1));
      mood = out.mood || "day";
      body = (out.raw ? "" : backdrop(mood, out.ground || C.sage, 1250, G)) + out.art;
      if (pair) { const [fx, fy, z] = VFOCUS[trade]; body = `<g transform="translate(800 450) scale(${z}) translate(${-fx} ${-fy})">${body}</g>`; }
      if (!labelText || labelText === slotId) labelText = pair ? `${vr.v.label}: ${vr.part} picture` : vr.v.label;
    } else if (extra && EXTRA[trade] && EXTRA[trade][extra.mod]) {
      body = EXTRA[trade][extra.mod]();
      if (!labelText || labelText === slotId) labelText = extra.label;
    } else if (PAIRS[trade] && (slotId === "before" || slotId === "after")) {
      body = PAIRS[trade](slotId === "after");
    } else if (scene) {
      const heroV = opts.hero && trade === "fencing" && v < 0 ? 0 : v; // hero: full-width fence, house centred
      const out = scene(st, last, heroV);
      // One camera for the whole story: the light of the last frame on every frame,
      // so nothing but the work changes when frames crossfade.
      mood = isStory ? scene(last, last, -1).mood || "day" : out.mood || "day";
      const exterior = !out.raw && !INTERIOR.has(trade);
      const isStyle = !!(k && k.styles.some((s) => s.id === slotId));
      const art = isStyle && exterior && trade !== "pressure" ? `<g transform="translate(220 0)">${out.art}</g>` : out.art;
      body = (exterior ? backdrop(mood, out.ground, isStyle ? 1060 : 1250, out.gy || G) : "") + art;
    } else {
      body = backdrop("gold") + house({});
    }
    const dark = mood === "dusk" || carbon;
    // Story frames share one label so it does not ghost during the crossfade.
    const text = isStory ? `Scroll story: ${k.story.length} pictures, one scene` : vr && !/before|after/.test(vr.part) ? `${vr.v.label}. Scroll story: ${vr.v.story.length} pictures, one scene` : labelText;
    if (opts.hero) {
      // Hero crop: zoom toward the subject so the house (or fence) fills the silhouette.
      // Roof peak (scene y) -> just above the gable apex, scaled so the roof covers the triangle.
      const [peakY, k] = { fencing: [330, 1.6], pressure: [180, 1.45] }[trade] || [280, 1.75];
      body = `<g transform="translate(800 -12) scale(${k}) translate(-800 ${-peakY})">${body}</g>`;
    }
    const vignette = `<defs><radialGradient id="vg" cx="50%" cy="46%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1d1b18" stop-opacity="${dark ? 0.4 : 0.16}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
    // Quiet mode (real photos exist on the page): the drawing steps back so it does not fight
    // the photos: desaturated warm tone, softened edges (no crisp cartoon outlines), photo-like
    // grain and light falloff, no viewfinder marks. The label stays sharp.
    const quiet = opts.quiet ? `<defs><filter id="qt" x="0" y="0" width="100%" height="100%">
<feColorMatrix type="saturate" values=".35"/><feGaussianBlur stdDeviation="1.4"/>
<feComponentTransfer><feFuncR type="linear" slope=".92" intercept=".06"/><feFuncG type="linear" slope=".9" intercept=".05"/><feFuncB type="linear" slope=".82" intercept=".03"/></feComponentTransfer></filter>
<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .22 0"/></filter>
<linearGradient id="ql" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3d6" stop-opacity=".18"/><stop offset="1" stop-color="#1a140c" stop-opacity=".22"/></linearGradient></defs>` : "";
    const drawn = opts.quiet ? `${quiet}<g filter="url(#qt)">${body}</g><rect width="${W}" height="${H}" fill="url(#ql)"/><rect width="${W}" height="${H}" filter="url(#gr)"/>` : body;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${svgEsc("Sample picture: make in Higgsfield. " + text)}">${MOTION}${drawn}${vignette}${opts.quiet ? "" : frameMarks(dark)}${label(text, dark, opts.labelY || (k && k.styles.some((s) => s.id === slotId) ? 140 : 96), opts.labelSide === "left" ? 440 : opts.labelSide === "right" ? 1160 : 800)}</svg>`;
  } finally {
    Object.assign(C, LIGHT);
  }
}

export function placeholderArt(trade, slotId, label, opts) {
  const k = CINE_KIT[trade];
  let text = label;
  if (!text && k) {
    const s = k.story.find((x) => x.id === slotId);
    const y = k.styles.find((x) => x.id === slotId);
    text = s ? s.headline : y ? y.name : slotId === "before" ? "Before" : slotId === "after" ? "After" : slotId;
  }
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(placeholderSvg(trade, slotId, text || "", opts || {}));
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
  return ED_HOUSE; // one shape for every trade: it keeps the picture's label readable
}

export function editorialLook(themeKey, tradeKey, opts = {}) {
  const tl = opts.tradeLook !== false; // false: the owner picked a swatch, use it
  const v = cineVars(themeKey, tradeKey, opts);
  const carbon = v.display === "grotesk";
  // One accent per trade for display words, icons and rules: at least 3:1 on the paper and on the night.
  const ONE = { carbonYellow: "#a87d00", carbonOrange: "#c25a12", woodBlueprint: "#4572c4", creamSerif: "#b5551a" };
  const BY_THEME = { navy: "#b5551a", forest: "#8f6b12", steel: "#c0392b", sky: "#3f6fb5" };
  const one = (tl && ONE[CINE_TRADE_LOOK[tradeKey]]) || BY_THEME[themeKey] || "#b5551a";
  const p = carbon
    ? { cream: v.paper, cream2: v.paper2, paper: "#fbfaf7", line: "rgba(18,18,18,.18)", accent: tl ? one : v.accentText, hi: tl ? one : v.accentHi, dark: v.night, mark: null }
    : { cream: "#ece5dc", cream2: "#e2d9cd", paper: "#f5f0e8", line: "rgba(22,20,18,.2)", accent: tl ? one : v.accentText, hi: tl ? one : v.accentHi, dark: !tl ? v.night : tradeKey && CINE_TRADE_LOOK[tradeKey] === "woodBlueprint" ? "#13284a" : "#14110f", mark: null };
  // Phone hero size: as large as fits, capped by the longest word of this trade's line.
  const edLine = (CINE_KIT[tradeKey] && CINE_KIT[tradeKey].editorial && CINE_KIT[tradeKey].editorial.headline) || "";
  const edLongest = Math.max(6, ...edLine.split(/\s+/).map((w) => w.replace(/[^A-Za-z]/g, "").length));
  const edHeroSize = `min(16.5vw, calc((100vw - 40px) / ${(edLongest * 0.7).toFixed(2)}), 92px)`;
  const css = `
:root{--ed-sky:${carbon ? "#121417" : "#dccdb5"};--ed-cream:${p.cream};--ed-cream2:${p.cream2};--ed-paper:${p.paper};--ed-line:${p.line};--ed-accent:${p.accent};--ed-hi:${p.hi};--ed-dark:${p.dark};--ed-muted:${carbon ? v.muted : "#5a5249"}}
::selection{background:${v.accent};color:${v.accentInk}}
body{caret-color:var(--ed-accent);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
html{scrollbar-color:var(--ed-muted) var(--ed-cream)}
.ed-nav{background:color-mix(in srgb,var(--ed-cream) 80%,transparent)}
.ed-logo{color:var(--ed-ink)}
.ed-eyebrow::before{height:2px}
/* Type: Didone capitals with one italic lowercase accent word; display capped at 6rem */
.ed h1,.ed h2,.ed .ed-big{font-weight:500;letter-spacing:.002em;font-optical-sizing:auto}
.ed-hero h1{font-size:clamp(44px,7.4vw,96px);line-height:.93}
.ed-sec h2{font-size:clamp(38px,6.2vw,84px);line-height:.95}
.ed-final h2{font-size:clamp(42px,6.8vw,92px)}
.ed-beat .ed-big{font-size:clamp(40px,7.6vw,96px);text-transform:uppercase;line-height:.94;max-width:12ch}
.ed h1 em,.ed h2 em,.ed .ed-big em{font-style:italic;font-weight:400;text-transform:none;letter-spacing:-.01em;color:var(--ed-accent);padding-right:.04em}
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
.ed-sil.ph{background:var(--ed-sky)}
.ed-sil.ph img{inset:0;height:100%;object-position:50% 100%}
.ed-final{background:var(--ed-dark)}
.ed-phone{white-space:normal;overflow-wrap:anywhere;max-width:100%}
.ed-final .ed-grid>*{min-width:0}
/* Motion (Emil Kowalski review): strong ease-out, sub-300ms UI, opacity-only picture swap */
:root{--ed-ease-out:cubic-bezier(.23,1,.32,1)}
.ed-pic img{transition:opacity 240ms var(--ed-ease-out)}
.ed-pic img.swap{opacity:0}
.ed-row-name{transition:opacity 200ms var(--ed-ease-out)}
.ed-btn:active{transform:scale(.97);transition:transform 160ms var(--ed-ease-out)}
@media (prefers-reduced-motion:reduce){.ed-pic img{transition:opacity 200ms linear}.ed-btn:active{transform:none}}
/* Readable on any picture: titles get their own scrim and shadow */
.ed-card::after{background:linear-gradient(0deg,rgba(10,10,12,.78) 0%,rgba(10,10,12,.45) 30%,rgba(10,10,12,0) 62%)!important}
.ed-card h3{text-shadow:0 1px 2px rgba(0,0,0,.45),0 4px 30px rgba(0,0,0,.45)}
/* Small sizes: low optical size (thicker hairlines); numbers in a tabular lining sans */
.ed-row-name,.ed-steps h3,.ed-trust b,.ed-logo{font-variation-settings:"opsz" 11}
.ed-num,.ed-rev b,.ed-phone{font-family:var(--ed-sans)!important;font-weight:600;letter-spacing:-.01em;font-variant-numeric:lining-nums proportional-nums}
.ed h1,.ed h2,.ed .ed-big,.ed-card h3{font-variation-settings:"opsz" 36;-webkit-text-stroke:.012em currentColor;paint-order:stroke fill}
@media (max-width:759px){
.ed h1,.ed h2,.ed .ed-big,.ed-card h3{font-variation-settings:"opsz" 11}
.ed-hero h1{font-size:${edHeroSize}!important;line-height:.88!important}
.ed-hero{padding-block:24px 40px}
}
/* Picture titles: smaller optical size + heavier weight so hairlines never break over photos */
.ed-card h3,.ed-beat .ed-big{font-variation-settings:"opsz" 18;font-weight:700;letter-spacing:.005em}
.ed-beat::after{background:linear-gradient(90deg,rgba(8,8,10,.62) 0%,rgba(8,8,10,.25) 55%,rgba(8,8,10,0) 80%),linear-gradient(0deg,rgba(8,8,10,.72),rgba(8,8,10,.15) 55%,rgba(8,8,10,.25))!important}
.ed-beat .ed-big{text-shadow:0 2px 24px rgba(0,0,0,.4)}
/* Default path: calm empty states */
.ed-trust ul[style="--cols:1"],.ed-trust ul[style="--cols:2"]{width:fit-content;max-width:100%}
.ed-trust ul[style="--cols:1"] li{grid-template-columns:auto 1fr;column-gap:16px;align-items:center;padding:22px 28px}
.ed-trust ul[style="--cols:1"] svg{grid-row:span 2;margin:0}
/* Proportion pass (reference study, our own design) */
.ed h1,.ed h2,.ed .ed-big,.ed-card h3{font-weight:600}
.ed-logo{display:inline-flex;align-items:center;gap:10px;font-size:23px;color:var(--ed-ink)}
.ed-mark{flex:none;color:var(--ed-ink)}
.ed-btn.ghost{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ed-ink) 35%,transparent)}
.ed-eyebrow{font-size:12px;letter-spacing:.22em;color:var(--ed-muted)!important}
.ed-dark .ed-eyebrow,.ed-final .ed-eyebrow{color:rgba(236,229,220,.72)!important}
.ed-eyebrow::before{background:var(--ed-accent)!important}
.ed-steps b{color:var(--ed-muted)!important}
/* rating: one compact row, no empty half */
#reviews{padding-block:0 72px!important}
.ed-rev{grid-template-columns:auto minmax(0,1fr) minmax(0,1.2fr);column-gap:48px;align-items:end;border-top:1px solid var(--ed-line);padding-top:40px}
.ed-rev .ed-eyebrow{grid-column:1/-1}
.ed-rev>b{grid-column:1}
.ed-rev>p:not(.ed-eyebrow):not(.ed-note){grid-column:2;font-size:20px;font-weight:600}
.ed-rev>.ed-note{grid-column:3;justify-self:end;max-width:44ch}
@media (max-width:759px){.ed-rev{grid-template-columns:minmax(0,1fr)}.ed-rev>*{grid-column:1!important;justify-self:start!important}}
.ed-head{gap:22px}
/* hero */
.ed-hero h1{font-size:clamp(46px,8.4vw,108px);line-height:.9;letter-spacing:-.005em}
.ed-sub{font-size:18px;line-height:1.65;max-width:34ch}
.ed-cta{gap:12px;margin-top:34px}
.ed-sil{border-radius:0;aspect-ratio:9/10}
/* second beat: place line top-left, note bottom-right */
.ed-beat{min-height:min(84svh,720px);align-items:stretch}
.ed-beat img{z-index:-2}
.ed-beat .ed-wrap{position:relative;z-index:1}
.ed-beat .ed-wrap{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-content:end;align-items:end;gap:32px;padding-block:clamp(56px,7vw,96px) clamp(40px,5vw,64px)}
.ed-beat .ed-big{justify-self:start;text-align:left;overflow-wrap:anywhere;min-width:0;color:#f3eee6;font-size:clamp(52px,9.6vw,124px);line-height:.9;max-width:none}
.ed-beat .ed-beat-note{justify-self:end;text-align:right;max-width:34ch;font-size:17px;line-height:1.6;color:rgba(243,238,230,.88)}
/* trust: one outlined box, four equal cells */
.ed-trust ul{background:transparent;border:1px solid var(--ed-line)}
.ed-trust li{grid-template-columns:1fr;gap:10px;padding:30px 30px 32px}
.ed-trust svg{grid-row:auto;margin:0 0 14px;width:24px;height:24px}
.ed-trust b{font-size:18px}
/* work: wide stacked cards, giant name, 4-column meta under rules */
.ed-cards{grid-template-columns:minmax(0,1fr)!important;gap:clamp(56px,7vw,96px)!important}
.ed-card{aspect-ratio:16/8!important}
.ed-card h3{font-size:clamp(56px,11vw,140px);left:clamp(18px,3vw,40px);bottom:clamp(8px,1.6vw,20px);line-height:.88}
.ed-card .ed-pill{top:18px}
.ed-card .ed-pill:not(.ed-sample){left:18px;right:auto}
.ed-card .ed-sample{left:auto!important;right:18px!important}
.ed-meta{grid-template-columns:repeat(4,minmax(0,1fr));gap:0 24px;margin-top:20px}
.ed-meta div{border-top:1px solid var(--ed-line);padding:16px 0 0}
.ed-meta dt{letter-spacing:.2em}
/* services: mixed-case serif rows, dimmed until open */
.ed-row{padding:22px 0}
.ed-row-name{text-transform:none;font-size:clamp(34px,4.6vw,60px);letter-spacing:-.012em;opacity:.42}
.ed-row-body{margin-left:56px;font-size:16px}
.ed-row-top{gap:24px}
/* process: picture beside the heading */
.ed-how{display:grid;gap:40px}
.ed-how-pic{position:relative;border-radius:24px;overflow:hidden;aspect-ratio:4/5;background:var(--ed-dark)}
.ed-how-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ed-steps{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:28px 32px!important;margin-top:12px}
.ed-steps li{border-top:1px solid var(--ed-line)}
.ed-steps b{font:600 13px/1 var(--ed-sans);letter-spacing:.14em;color:var(--ed-accent);margin:14px 0 12px}
@media (min-width:1024px){
.ed-links{margin-inline:auto}
.ed-logo{margin-right:0}
.ed-hero-grid{grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:56px}
.ed-how{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:72px;align-items:center}
}
@media (max-width:759px){
.ed-meta{grid-template-columns:repeat(2,minmax(0,1fr))}
.ed-meta div:nth-child(n+3){margin-top:16px}
.ed-card{aspect-ratio:4/3!important}
.ed-steps{grid-template-columns:minmax(0,1fr)!important}
.ed-beat .ed-wrap{grid-template-columns:minmax(0,1fr)}.ed-beat .ed-beat-note{justify-self:start;text-align:left}
}
`;
  return { css, fontsHref: ED_LOOK_FONTS };
}
