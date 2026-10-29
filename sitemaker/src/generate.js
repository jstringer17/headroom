// Sample Site Maker: the generator.
// generateSite(form) is a pure function: form data in, one self-contained
// HTML document out (only Google Fonts load from the network, with system
// font fallbacks). No invented reviews, people or claims. The only picture is
// a hero picture the owner adds (heroImage: data URI or https URL).
//
// form = {
//   company*, trade* (key of TRADES), city, phone, rating, reviews, years,
//   services: [names] (default: the trade's first `pick`),
//   emergency (default false), freeEstimates (default true, false for
//   towing, junk removal and HVAC),
//   insured (default false), theme (default: trade default), themePicked (true when the owner chose a swatch), year,
//   heroImage (optional),
//   cinematic (default false: the scroll-story site, see cinematic.js), cine,
//   look ("cinematic" default or "editorial", see editorial.js) and editorial
// }
import { TRADES, TRADE_ORDER } from "./trades.js";
import { THEMES, THEME_ORDER } from "./themes.js";
import { generateCinematic } from "./cinematic.js";
import { generateEditorial } from "./editorial.js";
import { reviewsOf, rvwList } from "./reviews.js";
import { variantCards } from "./variants.js";
import { CINE_KIT } from "./cine-kit.js";
import { cineLook, placeholderArt } from "./cine-look.js";

// Cinematic mode needs the art files' CINE_KIT, cineLook and placeholderArt.
let CINE = null;
export function useCine(deps) { CINE = deps; }
useCine({ CINE_KIT, cineLook, placeholderArt });

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function slugify(s) {
  return String(s || "sample").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "sample";
}

export function formatPhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  const ten = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  if (ten.length === 10) return { show: `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`, tel: `+1${ten}` };
  const t = String(raw || "").trim();
  return t ? { show: t, tel: d ? `+${d}` : "" } : null;
}

// Fill in smart defaults so only company + trade are needed.
export function normalize(form) {
  const f = form || {};
  const tradeKey = TRADES[f.trade] ? f.trade : "roofing";
  const trade = TRADES[tradeKey];
  const names = trade.services.map((s) => s[0]);
  let picked = Array.isArray(f.services) ? f.services.filter((n) => names.includes(n)) : names.slice(0, trade.pick);
  if (!picked.length) picked = names.slice(0, 3);
  const rating = parseFloat(f.rating);
  const reviews = parseInt(String(f.reviews ?? "").replace(/[^\d]/g, ""), 10);
  const years = parseInt(String(f.years ?? "").replace(/[^\d]/g, ""), 10);
  return {
    company: String(f.company || "").trim() || "Your Company",
    tradeKey,
    trade,
    city: String(f.city || "").trim(),
    phone: formatPhone(f.phone),
    rating: rating >= 1 && rating <= 5 ? Math.round(rating * 10) / 10 : null,
    reviews: reviews > 0 ? reviews : null,
    years: years > 0 && years < 200 ? years : null,
    services: trade.services.filter((s) => picked.includes(s[0])),
    emergency: !!f.emergency,
    freeEstimates: f.freeEstimates === undefined ? trade.freeEstimates !== false : !!f.freeEstimates,
    insured: !!f.insured,
    themeKey: THEMES[f.theme] ? f.theme : trade.theme,
    themePicked: !!(THEMES[f.theme] && f.themePicked), // the owner chose a swatch: it overrides the trade's own palette
    rv: reviewsOf(f), // review cards: typed ones, or three marked samples
    year: f.year || new Date().getFullYear(),
  };
}

const svg = (inner, size, extra = "") =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
const ICON_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';
const STAR = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>';

function stars(rating, size) {
  const row = (fill) => Array.from({ length: 5 }, (_, i) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="left:${i * (size + 4)}px" fill="${fill}" aria-hidden="true">${STAR}</svg>`).join("");
  const w = 5 * size + 16;
  const on = Math.max(0, Math.min(1, rating / 5)) * w;
  return `<span class="stars" style="width:${w}px;height:${size}px" role="img" aria-label="${rating} out of 5 stars"><span class="stars-row off">${row("currentColor")}</span><span class="stars-row on" style="width:${on.toFixed(1)}px">${row("currentColor")}</span></span>`;
}

// Only a base64 image data URI or a plain https URL is accepted as the hero picture.
export function safeImage(src) {
  const s = String(src || "").trim();
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  if (/^https:\/\/[^\s"'<>()\\]+$/.test(s)) return s;
  return "";
}

const ICON_ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';
const ICON_PLUS = '<path d="M12 5v14M5 12h14"/>';

// Section order and style per layout, so trades do not look like clones.
const LAYOUTS = {
  band: { order: ["services", "all", "process", "reviews", "area", "faq"], services: "list", trust: "dark" },
  ledger: { order: ["services", "all", "process", "reviews", "area", "faq"], services: "numbered", trust: null },
  split: { order: ["process", "services", "all", "reviews", "faq", "area"], services: "columns", trust: "paper" },
  stat: { order: ["services", "all", "reviews", "area", "process", "faq"], services: "columns", trust: "tint" },
};

// Font size that keeps the headline to 3 lines (2 on wide band heroes).
function h1Sizes(text, layout) {
  const n = text.length;
  const per = (lines) => n / lines + 2;
  const mobile = Math.min(76, Math.floor(335 / (per(3) * 0.47)));
  const wide = layout === "band" ? 1200 : 690;
  const desk = Math.min(layout === "band" ? 150 : 128, Math.floor(wide / (per(layout === "band" ? 2 : 3) * 0.47)));
  return `--h1m:${mobile}px;--h1d:${desk}px`;
}

export function generateSite(form) {
  const d = normalize(form);
  const editorial = form && (form.look === "editorial" || (form.cine && form.cine.look === "editorial"));
  if (form && (form.cinematic || editorial) && CINE && CINE.CINE_KIT[d.tradeKey]) return (editorial ? generateEditorial : generateCinematic)(form, d, CINE);
  const t = d.trade;
  const th = THEMES[d.themeKey];
  const lay = LAYOUTS[t.layout] ? t.layout : "band";
  const cineImgs = (form && form.cine && form.cine.images) || {};
  const allCards = variantCards(CINE && CINE.CINE_KIT && CINE.CINE_KIT[d.tradeKey], form && form.cine && form.cine.offer);
  const L = LAYOUTS[lay];
  const tradeName = t.label.replace(/ \(.*\)$/, "");
  const hero = safeImage(form && form.heroImage);
  const name = esc(d.company);
  const area = d.city ? esc(d.city) : "";
  const areaPhrase = area ? `${area} and nearby towns` : "your area and nearby towns";
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  const callHref = d.phone && d.phone.tel ? `tel:${esc(d.phone.tel)}` : "#contact";
  const callText = d.phone ? `Call ${phoneShow}` : "Call us";
  const callBtn = (cls) => `<a class="${cls}" href="${callHref}">${svg(ICON_PHONE, 19)}<span>${callText}</span></a>`;
  const askLabel = d.freeEstimates ? "Get a free estimate" : "Ask for a price";

  // The trade's drawing: a solid shape or heavy strokes.
  const shape = (cls) => t.fill
    ? `<svg class="${cls} solid" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="${t.line} L1200 300 L0 300 Z"/></svg>`
    : `<svg class="${cls} strokes" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="${t.line}"/></svg>`;

  // Trust bar: always four cells, each one a fact the owner typed or ticked.
  const cells = [
    ["Service area", area || "Your town"],
    ["Pricing", d.freeEstimates ? "Free estimates" : "Ask for a price"],
    ["Emergencies", d.emergency ? "Open 24/7" : "Call to ask"],
  ];
  if (d.years) cells.push(["In business", `${d.years} year${d.years === 1 ? "" : "s"}`]);
  else if (d.insured) cells.push(["Coverage", "Licensed and insured"]);
  else cells.push(["Phone", d.phone ? phoneShow : "Call us"]);
  const trust = !L.trust ? "" : `<section class="trust trust-${L.trust}" aria-label="At a glance"><div class="wrap"><dl>${cells.map(([k, v, raw]) => `<div class="cell rv"><dt>${k}</dt><dd>${raw ? v : esc(v)}</dd></div>`).join("")}</dl></div></section>`;

  // Hero
  let stat;
  if (d.emergency) stat = ["24/7", "<span>Open for emergencies</span>"];
  else if (d.years) stat = [String(d.years), `<span>Year${d.years === 1 ? "" : "s"} in business</span>`];
  else if (d.freeEstimates) stat = ["Free", "<span>Estimates</span>"];
  else stat = [area || "Local", `<span>${area ? "Our home base" : "Serving your area"}</span>`];
  const statBig = stat[0].length > 6 ? " long" : "";

  const heroText = `<div class="hero-text">
    <h1 style="${h1Sizes(t.headline, hero ? "split" : lay)}">${esc(t.headline)}</h1>
    <p class="hero-sub">${esc(t.sub)} ${name} serves ${areaPhrase}.</p>
    <div class="hero-cta" id="hero-cta">${callBtn("btn btn-accent")}<a class="btn btn-line" href="#contact">${askLabel}</a></div>
  </div>`;
  let heroInner;
  if (hero) {
    heroInner = `<img class="hero-img" src="${esc(hero)}" alt="" fetchpriority="high"><div class="wrap">${heroText}</div>`;
  } else if (lay === "split") {
    heroInner = `<div class="wrap hero-grid">${heroText}<aside class="panel" aria-label="Call us">
      <div class="panel-art">${shape("art").replace('xMidYMax meet', 'xMidYMax slice')}</div>
      <div class="panel-body"><p class="panel-k">${d.freeEstimates ? "Free estimates" : "Prices before work starts"}</p><p class="panel-v">${d.phone ? phoneShow : "Phone number here"}</p><p class="panel-n">${d.emergency ? "Open 24 hours" : area ? `Serving ${area}` : "Serving your area"}</p></div>
    </aside></div>`;
  } else if (lay === "ledger") {
    const figs = [];
    if (d.rating) figs.push([d.rating.toFixed(1), `${stars(d.rating, 18)}<span>${d.reviews ? `Google rating, ${d.reviews.toLocaleString("en-US")} reviews` : "Google rating"}</span>`]);
    if (d.emergency) figs.push(["24/7", "<span>Open for emergencies</span>"]);
    if (d.years) figs.push([String(d.years), `<span>Year${d.years === 1 ? "" : "s"} in business</span>`]);
    if (d.freeEstimates) figs.push(["Free", "<span>Estimates</span>"]);
    if (figs.length < 3) figs.push([area || "Your town", "<span>And nearby towns</span>"]);
    if (figs.length < 3) figs.push([d.phone ? phoneShow : "Call", `<span>${d.phone ? "Call any time we are open" : "Call to ask"}</span>`]);
    heroInner = `<div class="wrap ledger-top">${heroText}</div>${shape("ledger-art").replace("xMidYMax meet", "none")}
    <div class="wrap"><dl class="figures">${figs.slice(0, 3).map(([v, k]) => `<div class="fig rv"><dt${v.length > 5 ? ' class="long"' : ""}>${esc(v)}</dt><dd>${k}</dd></div>`).join("")}</dl></div>`;
  } else if (lay === "stat") {
    heroInner = `<div class="wrap hero-grid">${heroText}<aside class="stat" aria-label="At a glance">
      <p class="stat-v${statBig}">${esc(stat[0])}</p><div class="stat-k">${stat[1]}</div>
      ${shape("stat-art")}
    </aside></div>`;
  } else {
    heroInner = `<div class="wrap">${heroText}</div>${shape("band-art").replace("xMidYMax meet", "xMidYMax slice")}`;
  }
  const heroSec = `<section class="hero hero-${hero ? "photo" : lay}" aria-label="Intro">${heroInner}</section>`;

  // Sections
  const services = L.services === "numbered"
    ? `<ol class="svcs-num">${d.services.map(([n, desc], i) => `<li class="rv" style="--i:${i % 3}"><span class="num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><h3>${esc(n)}</h3><p>${esc(desc)}</p></li>`).join("")}</ol>`
    : L.services === "list"
    ? `<ul class="svcs-list">${d.services.map(([n, desc], i) => `<li class="rv" style="--i:${i}"><a href="#contact"><span class="svc-name">${esc(n)}</span><span class="svc-desc">${esc(desc)}</span><span class="svc-go">${svg(ICON_ARROW, 20)}</span></a></li>`).join("")}</ul>`
    : `<ul class="svcs-cols">${d.services.map(([n, desc], i) => `<li class="rv" style="--i:${i % 3}"><h3>${esc(n)}</h3><p>${esc(desc)}</p></li>`).join("")}</ul>`;
  const steps = [
    ["Call or send a request", d.phone ? `Call ${phoneShow}, or fill out the form on this page.` : "Call us, or fill out the form on this page."],
    [d.freeEstimates ? "Get your free estimate" : "Get a clear price", "We look at the job and tell you the price before any work starts."],
    ["The work gets done", "We do the job you agreed to."],
  ].map(([h, p], i) => `<li class="rv" style="--i:${i}"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${esc(h)}</h3><p>${p}</p></li>`).join("");
  const svcList = d.services.map((s) => s[0].toLowerCase());
  const svcSentence = svcList.length > 1 ? `${svcList.slice(0, -1).join(", ")}, and ${svcList[svcList.length - 1]}` : svcList[0];
  const faqs = [
    ["How much will it cost?", d.freeEstimates ? "Every job is different. We look at yours and give you a free estimate before any work starts." : "Every job is different. Call us and we will tell you the price before any work starts."],
    ["What areas do you serve?", `${area || "Our town"} and nearby towns. Not sure about your street? Call and ask.`],
    ["Do you take emergency calls?", d.emergency ? `Yes. We are open 24/7 for emergencies.${d.phone ? ` Call ${phoneShow}.` : ""}` : "Call us and ask about emergency service."],
    [`What ${tradeName.toLowerCase()} work do you do?`, `${svcSentence.charAt(0).toUpperCase() + svcSentence.slice(1)}. If your job is not on the list, just ask.`],
    ["How do I get started?", `${d.phone ? `Call ${phoneShow}` : "Call us"} or send the form below. Have the address and a short note about the job ready.`],
  ].map(([q, a]) => `<details class="rv"><summary><span>${esc(q)}</span>${svg(ICON_PLUS, 22)}</summary><p>${a}</p></details>`).join("");

  const sections = {
    services: (tint) => `<section class="sec${tint}" id="services"><div class="wrap grid">
  <div class="head"><div class="sticky rv"><h2>What we do</h2><p class="lede">Here is what ${name} does${area ? ` in ${area}` : ""}. Do not see your job? Just ask.</p></div></div>
  <div class="body">${services}</div>
</div></section>`,
    all: (tint) => allCards.length >= 2 ? `<section class="sec${tint}" id="all"><div class="wrap">
  <h2 class="rv">Everything we do</h2>
  <ul class="all-list">${allCards.map((c) => `<li class="rv"><img class="all-thumb" src="${esc(cineImgs[c.after] && safeImage(cineImgs[c.after]) ? cineImgs[c.after] : placeholderArt(d.tradeKey, c.after, `${c.label}, after`, Object.values(cineImgs).some((v) => safeImage(v)) ? { quiet: true } : undefined))}" alt="${esc(c.label)}" width="120" height="90" loading="lazy"><span class="all-name">${esc(c.label)}</span><a class="all-ask" href="#contact">Ask about this</a></li>`).join("")}</ul>
</div></section>` : "",
    process: (tint) => `<section class="sec${tint}" id="how"><div class="wrap">
  <h2 class="rv">How it works</h2>
  <ol class="steps">${steps}</ol>
</div></section>`,
    reviews: (tint) => `<section class="sec${tint}" id="reviews"><div class="wrap grid">
  <div class="head rv"><h2>What customers say</h2></div>
  <div class="body rev rv">
    ${d.rating && lay !== "ledger" ? `<div class="rating"><span class="rating-num">${d.rating.toFixed(1)}</span><span>${stars(d.rating, 26)}<span class="rating-sub">${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</span></span></div>` : ""}
    ${rvwList(d.rv, esc)}
    ${d.rv.link ? `<a class="btn btn-accent rvw-all" href="${esc(d.rv.link)}" target="_blank" rel="noopener noreferrer">See all reviews</a>` : ""}
  </div>
</div></section>`,
    area: (tint) => `<section class="sec sec-area${tint}" id="area"><div class="wrap area">
  <div class="area-text rv">
    <h2>Where we work</h2>
    <ul class="chips"><li class="chip-main">${area || "Your town"}</li><li>Nearby towns</li><li>Homes and businesses</li></ul>
    <p class="area-sub">Not sure we come to your street? Call and ask.</p>
  </div>
  <svg class="map rv" viewBox="0 0 480 260" aria-hidden="true">
    <g class="streets"><path d="M0 40H480M0 98H480M0 160H480M0 220H480M56 0V260M138 0V260M226 0V260M318 0V260M404 0V260"/></g>
    <g class="roads"><path d="M0 248L480 52M0 124C140 104 300 196 480 168"/></g>
    <circle class="radius" cx="240" cy="132" r="104"/>
    <circle class="pin-ring" cx="240" cy="132" r="17"/><circle class="pin" cx="240" cy="132" r="8"/>
  </svg>
</div></section>`,
    faq: (tint) => `<section class="sec${tint}" id="faq"><div class="wrap grid">
  <div class="head"><div class="sticky rv"><h2>Questions</h2><p class="lede">Straight answers before you call.</p></div></div>
  <div class="body faq">${faqs}</div>
</div></section>`,
  };
  // Alternate paper and tint backgrounds down the page.
  let alt = 0;
  const body = L.order.map((k) => {
    const out = sections[k](alt % 2 ? " tint" : "");
    alt++;
    return out;
  }).join("\n");

  const options = d.services.map(([n]) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name}${area ? ` | ${esc(tradeName)} in ${area}` : ` | ${esc(tradeName)}`}</title>
<meta name="description" content="${name} is a ${esc(t.noun)} serving ${areaPhrase}. ${esc(t.sub)}">
<meta name="theme-color" content="${th.dark}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap">
<style>
/* One accent, two neutrals. Big Shoulders (built, signage letters) for hero and section titles only; Hanken Grotesk for everything else. 12-column grid, 8px rhythm. */
:root{--dark:${th.dark};--dark2:${th.dark2};--accent:${th.accent};--accent-ink:${th.accentInk};--hi:${th.hi};--light:${th.light};--ink:${th.ink};--muted:${th.muted};--line:${th.line};--paper:#ffffff;
--on-dark:#ffffff;--on-dark-2:rgba(255,255,255,.76);--rule-dark:rgba(255,255,255,.18);
--display:"Big Shoulders Display","Arial Narrow","Roboto Condensed",sans-serif;--body:"Hanken Grotesk","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
--ease:cubic-bezier(.16,1,.3,1);--max:1240px;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:80px}
body{margin:0;background:var(--paper);color:var(--ink);font:400 18px/1.6 var(--body);padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))}
::selection{background:var(--accent);color:var(--accent-ink)}
h1,h2{font-family:var(--display);margin:0;text-wrap:balance;font-weight:800;text-transform:uppercase}
h3{font:700 20px/1.25 var(--body);margin:0;letter-spacing:-.01em}
p,dl,dd{margin:0}
a{color:inherit;text-underline-offset:4px}
img,svg{max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}
a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:0 28px;border:0;border-radius:6px;font:600 17px/1 var(--body);text-decoration:none;cursor:pointer;transition:transform .35s var(--ease),box-shadow .35s var(--ease),opacity .35s var(--ease)}
.btn-accent{background:var(--accent);color:var(--accent-ink)}
.btn-accent:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.2)}
.btn-line{color:var(--on-dark);box-shadow:inset 0 0 0 1.5px var(--rule-dark)}
.btn-line:hover{box-shadow:inset 0 0 0 1.5px var(--on-dark)}
/* header */
.top{position:sticky;top:0;z-index:20;background:var(--dark);color:var(--on-dark);transition:box-shadow .4s var(--ease)}
.past .top{box-shadow:0 8px 24px rgba(0,0,0,.18)}
.top .wrap{display:flex;align-items:center;gap:28px;min-height:68px}
.brand-name{font:700 19px/1.15 var(--body);letter-spacing:-.01em;text-decoration:none;margin-right:auto;min-width:0}
.nav{display:none;gap:28px;font-size:15px;font-weight:500}
.nav a{text-decoration:none;color:var(--on-dark-2);transition:color .25s}
.nav a:hover{color:var(--on-dark)}
.top .btn{display:none;min-height:44px;padding:0 18px;font-size:15px}
/* hero */
.hero{position:relative;background:var(--dark);color:var(--on-dark);overflow:hidden;isolation:isolate}
.hero-text{padding-block:48px 56px}
.hero h1{font-size:var(--h1m);font-weight:900;line-height:.9}
.hero-sub{margin-top:24px;font-size:clamp(18px,2vw,21px);line-height:1.5;color:var(--on-dark-2);max-width:36ch}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.hero-cta .btn{flex:1 1 220px}
.band-art{display:block;width:100%;height:clamp(140px,25vw,300px);margin-top:-8px}
.solid path{fill:var(--accent)}
.strokes path{fill:none;stroke:var(--accent);stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
.hero-band .hero-text{padding-bottom:40px}
.hero-grid{display:grid;gap:0}
.panel{background:var(--dark2);border-radius:10px 10px 0 0;overflow:hidden;display:grid}
.panel-art{padding:32px 24px 0;display:flex;align-items:flex-end;border-bottom:1px solid var(--rule-dark)}
.panel-art .art{width:100%;height:clamp(120px,16vw,210px);display:block}
.panel-body{padding:24px}
.panel-k{font-size:14px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--hi)}
.panel-v{margin-top:6px;font:900 clamp(40px,5vw,60px)/1 var(--display);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.panel-n{margin-top:8px;color:var(--on-dark-2)}
.stat{background:var(--accent);color:var(--accent-ink);border-radius:10px 10px 0 0;padding:28px 24px 0;display:grid;align-content:start;overflow:hidden}
.stat-v{font:900 clamp(88px,14vw,168px)/.85 var(--display);letter-spacing:-.01em;font-variant-numeric:tabular-nums;text-transform:uppercase;overflow-wrap:anywhere}
.stat-v.long{font-size:clamp(52px,7vw,84px)}
.stat-k{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:14px;font-weight:600}
.stat .stars{color:var(--accent-ink)}
.stat .stars-row.off{color:rgba(0,0,0,.18)}
.stat-art{display:block;width:100%;height:auto;margin-top:28px}
.stat .solid path{fill:var(--accent-ink);opacity:.9}
.stat .strokes path{stroke:var(--accent-ink)}
.hero-photo .wrap{position:relative;padding-top:200px}
.hero-photo img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover}
.hero-photo::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.5) 55%,rgba(0,0,0,.38) 100%),linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,0) 70%)}
.hero-photo .hero-sub{color:rgba(255,255,255,.9)}
.ledger-top{display:grid;gap:0}
.ledger-art{display:block;width:100%;height:clamp(110px,15vw,200px)}
.ledger-art path{vector-effect:non-scaling-stroke;stroke-width:6}
.figures{display:grid;grid-template-columns:1fr;border-top:1px solid var(--rule-dark)}
.fig{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:4px 18px;padding:18px 0;border-bottom:1px solid var(--rule-dark)}
.fig dt{font:900 clamp(56px,9vw,112px)/.85 var(--display);text-transform:uppercase;color:var(--on-dark);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.fig dt.long{font-size:clamp(40px,5vw,64px);line-height:.95}
.fig dd{display:grid;gap:6px;color:var(--on-dark-2);font-weight:600;font-size:16px}
.fig .stars{color:var(--hi)}
.fig .stars-row.off{color:var(--rule-dark)}
.fig-note{padding:18px 0 40px;color:var(--on-dark-2);font-size:15px;max-width:60ch}
.hero-ledger .wrap:last-child{padding-bottom:0}
.svcs-num{list-style:none;margin:0;padding:0;counter-reset:n}
.svcs-num li{display:grid;grid-template-columns:56px 1fr;gap:2px 16px;padding:22px 0;border-top:1px solid var(--line)}
.svcs-num li:last-child{border-bottom:1px solid var(--line)}
.svcs-num .num{grid-row:1/3;font:900 40px/.9 var(--display);color:var(--accent);font-variant-numeric:tabular-nums}
.svcs-num h3{font-size:22px}
.svcs-num p{color:var(--muted)}
/* trust bar */
.trust dl{display:grid;grid-template-columns:1fr 1fr}
.cell{padding:22px 16px 24px 0}
.cell:nth-child(even){padding-left:16px;border-left:1px solid var(--tr)}
.cell:nth-child(n+3){border-top:1px solid var(--tr)}
.cell dt{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--tk)}
.cell dd{margin-top:6px;font:700 clamp(19px,2.2vw,24px)/1.2 var(--body);letter-spacing:-.01em;display:flex;align-items:center;flex-wrap:wrap;gap:8px;overflow-wrap:anywhere}
.trust-dark{background:var(--dark);color:var(--on-dark);--tr:var(--rule-dark);--tk:var(--on-dark-2)}
.trust-dark dl{border-top:1px solid var(--rule-dark)}
.trust-dark .stars{color:var(--hi)}
.trust-dark .stars-row.off{color:var(--rule-dark)}
.trust-paper{background:var(--paper);--tr:var(--line);--tk:var(--muted);border-bottom:1px solid var(--line)}
.trust-tint{background:var(--light);--tr:var(--line);--tk:var(--muted)}
/* sections */
.sec{padding-block:80px}
.tint{background:var(--light)}
.sec h2{font-size:clamp(44px,7.5vw,80px);line-height:.92}
.lede{margin-top:18px;color:var(--muted);max-width:36ch}
.grid{display:grid;gap:36px}
.svcs-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.svcs-list a{display:grid;grid-template-columns:1fr auto;gap:4px 20px;padding:22px 0;border-bottom:1px solid var(--line);text-decoration:none;transition:padding .45s var(--ease)}
.svc-name{font:700 22px/1.2 var(--body);letter-spacing:-.01em}
.svc-desc{grid-column:1;color:var(--muted);font-size:17px;max-width:44ch}
.svc-go{grid-row:1/3;grid-column:2;align-self:center;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--line);transition:background-color .35s var(--ease),color .35s var(--ease),box-shadow .35s var(--ease),transform .45s var(--ease)}
.svcs-list a:hover{padding-left:10px}
.svcs-list a:hover .svc-go{background:var(--accent);color:var(--accent-ink);box-shadow:none;transform:rotate(-45deg)}
.svcs-cols{list-style:none;margin:0;padding:0;display:grid;gap:0 32px;grid-template-columns:1fr}
.svcs-cols li{padding:22px 0 26px;border-top:2px solid var(--ink)}
.svcs-cols p{margin-top:6px;color:var(--muted);font-size:17px}
.steps{list-style:none;margin:48px 0 0;padding:0;display:grid;gap:40px}
.step-n{display:block;font:900 104px/.8 var(--display);color:transparent;-webkit-text-stroke:1.5px var(--ink);margin-bottom:18px}
.steps h3{font-size:22px}
.steps p{margin-top:8px;color:var(--muted);max-width:32ch}
.rev{display:grid;gap:24px;align-content:start}
.rating{display:flex;align-items:center;gap:24px}
.rating-num{font:900 112px/.8 var(--display);font-variant-numeric:tabular-nums}
.rating-sub{display:block;margin-top:10px;color:var(--muted);font-weight:500}
.stars{position:relative;display:block;flex:none;color:var(--accent)}
.stars-row{position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;height:100%}
.stars-row svg{position:absolute;top:0}
.stars-row.off{color:var(--line);width:100%}
.all-list{list-style:none;margin:28px 0 0;padding:0;display:grid;gap:0}
.all-list li{display:grid;grid-template-columns:96px minmax(0,1fr);gap:4px 16px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}
.all-thumb{grid-row:1/span 2;width:96px;height:72px;object-fit:cover;border-radius:6px;display:block;background:var(--tint,#eee)}
.all-name{font-weight:600;font-size:19px;overflow-wrap:anywhere}
.all-ask{justify-self:start;font-weight:600;color:var(--ink);text-underline-offset:4px;padding:6px 0}
@media (min-width:760px){.all-list{grid-template-columns:1fr 1fr;gap:0 40px}.all-list li{grid-template-columns:120px minmax(0,1fr)}.all-thumb{width:120px;height:90px}}
.rvw-list{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.rvw{border-top:1px solid var(--line);padding-top:18px}
.rvw-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;color:var(--accent)}
.rvw-tag{font-size:12px;font-weight:600;letter-spacing:.04em;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:3px 10px}
.rvw-q{margin:10px 0 0;font-size:19px;line-height:1.5;overflow-wrap:anywhere}
.rvw-by{margin:8px 0 0;color:var(--muted);font-weight:500;overflow-wrap:anywhere}
.rvw-all{justify-self:start}
.sec-area{padding-block:56px}
.area{display:grid;gap:28px;align-items:center}
.chips{list-style:none;margin:22px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.chips li{padding:8px 14px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--line);font-size:15px;font-weight:600;background:var(--paper)}
.chips .chip-main{background:var(--ink);color:var(--paper);box-shadow:none}
.area-sub{margin-top:16px;color:var(--muted)}
.map{display:block;width:100%;height:auto;max-height:240px;border-radius:10px;background:var(--paper);box-shadow:inset 0 0 0 1px var(--line)}
.tint .map{background:var(--paper)}
.streets path{fill:none;stroke:var(--line);stroke-width:2}
.roads path{fill:none;stroke:var(--line);stroke-width:7;stroke-linecap:round}
.radius{fill:var(--accent);fill-opacity:.1;stroke:var(--accent);stroke-width:1.5;stroke-dasharray:5 6}
.pin-ring{fill:var(--paper);stroke:var(--accent);stroke-width:2}
.pin{fill:var(--accent)}
.faq{border-top:1px solid var(--line)}
.faq details{border-bottom:1px solid var(--line)}
.faq summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 0;cursor:pointer;font:600 20px/1.3 var(--body);letter-spacing:-.01em}
.faq summary::-webkit-details-marker{display:none}
.faq summary svg{flex:none;transition:transform .4s var(--ease)}
.faq details[open] summary svg{transform:rotate(45deg)}
.faq details p{padding:0 0 24px;color:var(--muted);max-width:60ch}
/* final call + form */
.final{background:var(--dark);color:var(--on-dark)}
.final h2{font-size:clamp(48px,8.5vw,104px)}
.final .lede{color:var(--on-dark-2)}
.big-phone{display:inline-block;margin-top:28px;font:900 clamp(40px,6.5vw,68px)/1 var(--display);color:var(--hi);text-decoration:none;font-variant-numeric:tabular-nums}
.final dl{display:grid;gap:4px;margin-top:24px;color:var(--on-dark-2)}
.final dl div{display:flex;gap:8px;flex-wrap:wrap}
.final dt{color:var(--on-dark);font-weight:600}
form{display:grid;gap:18px;align-content:start;background:var(--paper);color:var(--ink);border-radius:10px;padding:24px}
label{display:grid;gap:6px;font-size:15px;font-weight:600}
input,select,textarea{width:100%;font:400 17px/1.4 var(--body);color:var(--ink);background:var(--paper);border:1.5px solid #9aa4ae;border-radius:6px;padding:13px 14px;transition:border-color .2s,box-shadow .2s}
input:hover,select:hover,textarea:hover{border-color:var(--ink)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--ink);box-shadow:0 0 0 3px var(--accent)}
textarea{min-height:104px;resize:vertical}
.form-note{font-size:15px;color:var(--muted)}
footer{background:var(--dark2);color:var(--on-dark-2);font-size:15px}
footer .wrap{display:grid;gap:32px;padding-block:56px 28px}
.foot-name{font:700 24px/1.2 var(--body);letter-spacing:-.01em;color:var(--on-dark)}
.foot-tag{margin-top:6px}
.foot-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.foot-cols h3{font:600 13px/1.2 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--on-dark);margin-bottom:12px}
.foot-cols ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.foot-cols a{text-decoration:none}
.foot-cols a:hover{color:var(--on-dark)}
.foot-base{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;padding-top:22px;border-top:1px solid var(--rule-dark);font-size:14px}
.mobile-call{position:fixed;left:0;right:0;bottom:0;z-index:30;padding:10px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:var(--dark);box-shadow:0 -8px 24px rgba(0,0,0,.16);transition:transform .45s var(--ease)}
.mobile-call .btn{width:100%}
.mobile-call{transform:translateY(110%);visibility:hidden}
.past .mobile-call{transform:none;visibility:visible}
/* motion: only when allowed; everything is visible without it */
@media (prefers-reduced-motion:no-preference){
  .motion .rv{transition:opacity .9s var(--ease),transform .9s var(--ease);transition-delay:calc(var(--i,0) * 70ms)}
  .motion .rv:not(.in){opacity:0;transform:translateY(24px)}
  .motion .band-art,.motion .art,.motion .stat-art{animation:rise 1.2s var(--ease) .15s both}
  @keyframes rise{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.svcs-list a,.svc-go,.mobile-call{transition:none}}
@media (min-width:760px){
  .trust dl{grid-template-columns:repeat(4,1fr)}
  .cell,.cell:nth-child(even){padding:26px 24px 28px;border-left:1px solid var(--tr);border-top:0}
  .cell:first-child{padding-left:0;border-left:0}
  .grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:24px}
  .grid>.head{grid-column:1/span 5}
  .grid>.body{grid-column:6/span 7}
  .svcs-cols{grid-template-columns:1fr 1fr}
  .figures{grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--rule-dark)}
  .fig{grid-template-columns:1fr;align-items:start;padding:28px 24px 32px;border-bottom:0;border-left:1px solid var(--rule-dark)}
  .fig:first-child{padding-left:0;border-left:0}
  .steps{grid-template-columns:repeat(3,1fr);gap:32px}
  .area{grid-template-columns:5fr 7fr;gap:48px}
  .foot-cols{grid-template-columns:repeat(3,1fr)}
  .sec{padding-block:112px}
  .sec-area{padding-block:72px}
}
@media (min-width:1024px){
  body{padding-bottom:0}
  .mobile-call{display:none}
  .nav{display:flex}
  .top .btn{display:inline-flex}
  .js:not(.past) .top .btn{display:none}
  .hero h1{font-size:var(--h1d)}
  .hero-text{padding-block:88px 96px}
  .hero-cta .btn{flex:0 0 auto}
  .hero-band .hero-text{display:grid;grid-template-columns:7fr 5fr;column-gap:48px;align-items:end;padding-bottom:8px}
  .hero-band h1{grid-column:1/-1;max-width:none}
  .hero-band .hero-cta{justify-content:flex-end}
  .hero-grid{grid-template-columns:7fr 5fr;gap:56px;align-items:end}
  .hero-grid .hero-text{padding-bottom:88px}
  .panel,.stat{margin-top:88px}
  .hero-photo .wrap{padding-top:260px}
  .hero-photo .hero-text{max-width:820px}
  .svcs-cols{grid-template-columns:repeat(3,1fr)}
  .ledger-top .hero-text{padding-bottom:48px}
  .svcs-num li{grid-template-columns:72px 1fr 1.3fr;align-items:baseline}
  .svcs-num .num{grid-row:auto}
  .grid>.head .sticky{position:sticky;top:120px}
  footer .wrap{grid-template-columns:5fr 7fr;align-items:start}
  .foot-base{grid-column:1/-1}
}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand-name" href="#top">${name}</a>
  <nav class="nav" aria-label="Sections"><a href="#services">Services</a><a href="#how">How it works</a><a href="#area">Service area</a><a href="#faq">Questions</a></nav>
  ${callBtn("btn btn-accent")}
</div></header>
<main id="top">
${heroSec}
${trust}
${body}
<section class="sec final" id="contact"><div class="wrap grid">
  <div class="head rv">
    <h2>${d.freeEstimates ? "Get your free estimate" : "Ask for a price"}</h2>
    <p class="lede">Call now, or send the form and we will call you back.</p>
    ${d.phone ? `<a class="big-phone" href="${callHref}">${phoneShow}</a>` : `<p class="big-phone">Phone number here</p>`}
    <dl>
      <div><dt>Service area:</dt><dd>${area ? `${area} and nearby towns` : "Your town and nearby towns"}</dd></div>
      <div><dt>${d.emergency ? "Hours:" : "Emergencies:"}</dt><dd>${d.emergency ? "Open 24 hours" : "Ask about emergency service"}</dd></div>
    </dl>
  </div>
  <form id="ask" class="body rv" novalidate>
    <label for="f-name">Your name<input id="f-name" name="name" autocomplete="name"></label>
    <label for="f-phone">Phone<input id="f-phone" name="phone" type="tel" autocomplete="tel"></label>
    <label for="f-job">What do you need?<select id="f-job" name="job">${options}</select></label>
    <label for="f-msg">Tell us about the job<textarea id="f-msg" name="message"></textarea></label>
    <button class="btn btn-accent" type="submit">Send request</button>
    <p class="form-note" id="f-note" aria-live="polite">We will call you back.</p>
  </form>
</div></section>
</main>
<footer><div class="wrap">
  <div><p class="foot-name">${name}</p><p class="foot-tag">${esc(tradeName)}${area ? ` in ${area}` : ""}</p></div>
  <div class="foot-cols">
    <div><h3>Services</h3><ul>${d.services.slice(0, 5).map(([n]) => `<li><a href="#services">${esc(n)}</a></li>`).join("")}</ul></div>
    <div><h3>Contact</h3><ul><li>${d.phone ? `<a href="${callHref}">${phoneShow}</a>` : "Phone number here"}</li><li>${area || "Your town"}</li><li>${d.emergency ? "Open 24 hours" : "Call for hours"}</li></ul></div>
    <div><h3>Company</h3><ul>${d.years ? `<li>${d.years} year${d.years === 1 ? "" : "s"} in business</li>` : ""}${d.insured ? "<li>Licensed and insured</li>" : ""}<li><a href="#how">How it works</a></li><li><a href="#faq">Questions</a></li></ul></div>
  </div>
  <div class="foot-base"><span>&copy; ${esc(d.year)} ${name}</span><span>Sample site</span></div>
</div></footer>
<div class="mobile-call">${callBtn("btn btn-accent")}</div>
<script>
(function(){
  var root=document.documentElement;root.classList.add("js");
  document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();document.getElementById("f-note").textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});
  // The extra call buttons show only after the hero's own call button scrolls away.
  var cta=document.getElementById("hero-cta");
  function past(){root.classList.toggle("past",cta.getBoundingClientRect().bottom<0)}
  addEventListener("scroll",past,{passive:true});past();
  if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var els=[].slice.call(document.querySelectorAll(".rv"));
  els.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add("in")});
  root.classList.add("motion");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
  els.forEach(function(el){if(!el.classList.contains("in"))io.observe(el)});
})();
</script>
</body>
</html>
`;
}

// Map a lead's category / niche text to a trade key.
export function guessTrade(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return null;
  let best = null, bestLen = 0;
  for (const key of TRADE_ORDER) {
    for (const m of TRADES[key].match) {
      if (s.includes(m) && m.length > bestLen) { best = key; bestLen = m.length; }
    }
  }
  return best;
}

// Read a pasted lead. Accepts Lead Desk JSON (short keys n,c,r,a,p,w,t,s,q)
// or loose text (name on the first line, then phone / rating / town anywhere).
export function parseLead(text) {
  const raw = String(text || "").trim();
  const out = {};
  if (!raw) return out;
  try {
    const j = JSON.parse(raw);
    const o = Array.isArray(j) ? j[0] : (j && j.items ? j.items[0] : j);
    if (o && typeof o === "object") {
      if (o.n) out.company = String(o.n);
      if (o.p) out.phone = String(o.p);
      if (o.t) out.city = o.s ? `${o.t}, ${o.s}` : String(o.t);
      if (o.r != null && o.r !== "") out.rating = String(o.r);
      const rc = o.rc ?? o.reviews ?? o.u;
      if (rc != null && rc !== "") out.reviews = String(rc);
      const tr = guessTrade(`${o.q || ""} ${o.c || ""}`);
      if (tr) out.trade = tr;
      return out;
    }
  } catch (_) { /* not JSON, fall through */ }
  const lines = raw.split(/\r?\n|\t/).map((l) => l.trim()).filter(Boolean);
  const phone = raw.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if (phone) out.phone = phone[0].trim();
  const rating = raw.match(/(?:^|[^\d.])([1-5]\.\d)(?![\d])/);
  if (rating) out.rating = rating[1];
  const count = raw.match(/\(([\d,]+)\)|([\d,]+)\s*(?:google\s*)?reviews?/i);
  if (count) out.reviews = (count[1] || count[2]).replace(/,/g, "");
  const town = raw.match(/([A-Z][A-Za-z.'-]*(?:\s[A-Z][A-Za-z.'-]*){0,3}),\s*([A-Z]{2})\b/);
  if (town) out.city = `${town[1]}, ${town[2]}`;
  const nameLine = lines.find((l) => /[a-z]/i.test(l) && !/^https?:|www\.|@/.test(l) && !(phone && l.includes(phone[0])) && !/^[\d.\s()★*/]+$/.test(l));
  if (nameLine) out.company = nameLine.replace(/\s+[·|-]\s+.*$/, "").slice(0, 80);
  const tr = guessTrade(raw.replace(out.company || "", " ")) || guessTrade(raw);
  if (tr) out.trade = tr;
  return out;
}
