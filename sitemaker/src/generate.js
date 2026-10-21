// Sample Site Maker: the generator.
// generateSite(form) is a pure function: form data in, one self-contained
// HTML document out (only Google Fonts load from the network, with system
// font fallbacks). No photos, no invented reviews, no invented people.
//
// form = {
//   company*, trade* (key of TRADES), city, phone, rating, reviews, years,
//   services: [names] (default: the trade's first `pick`),
//   emergency (default false), freeEstimates (default true, false for
//   towing, junk removal and HVAC),
//   insured (default false), theme (default: trade default), year
// }
import { TRADES, TRADE_ORDER } from "./trades.js";
import { THEMES, THEME_ORDER } from "./themes.js";

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
    year: f.year || new Date().getFullYear(),
  };
}

const svg = (inner, size, extra = "") =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
const ICON_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';
const ICON_CHECK = '<path d="M4.5 12.5l4.5 4.5 10.5-11"/>';
const ICON_CLOCK = '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>';
const ICON_SHIELD = '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>';
const ICON_TAG = '<path d="M3.5 12.5V4h8.5l8.5 8.5-8 8z"/><circle cx="8" cy="8.5" r="1.4"/>';
const ICON_PIN = '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>';
const ICON_CAL = '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>';
const STAR = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>';

function stars(rating, size) {
  const row = (fill) => Array.from({ length: 5 }, (_, i) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="left:${i * (size + 4)}px" fill="${fill}" aria-hidden="true">${STAR}</svg>`).join("");
  const w = 5 * size + 16;
  const on = Math.max(0, Math.min(1, rating / 5)) * w;
  return `<span class="stars" style="width:${w}px;height:${size}px" role="img" aria-label="${rating} out of 5 stars"><span class="stars-row off">${row("currentColor")}</span><span class="stars-row on" style="width:${on.toFixed(1)}px">${row("currentColor")}</span></span>`;
}

export function generateSite(form) {
  const d = normalize(form);
  const t = d.trade;
  const tradeName = t.label.replace(/ \(.*\)$/, "");
  const th = THEMES[d.themeKey];
  const name = esc(d.company);
  const area = d.city ? esc(d.city) : "";
  const areaPhrase = area ? `${area} and nearby towns` : "your area and nearby towns";
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  const callLabel = d.phone ? `Call ${phoneShow}` : "Call us";
  const callBtn = (cls) => d.phone && d.phone.tel
    ? `<a class="${cls}" href="tel:${esc(d.phone.tel)}">${svg(ICON_PHONE, 20)}<span>${callLabel}</span></a>`
    : `<a class="${cls}" href="#contact">${svg(ICON_PHONE, 20)}<span>${callLabel}</span></a>`;
  const askLabel = d.freeEstimates ? "Get a free estimate" : "Ask for a price";

  const trust = [];
  if (d.emergency) trust.push([ICON_CLOCK, "Open 24/7 for emergencies"]);
  if (d.freeEstimates) trust.push([ICON_TAG, "Free estimates"]);
  if (d.insured) trust.push([ICON_SHIELD, "Licensed and insured"]);
  if (d.years) trust.push([ICON_CAL, `${d.years} year${d.years === 1 ? "" : "s"} in business`]);
  trust.push([ICON_PIN, area ? `Serving ${area}` : "Serving your area"]);

  const services = d.services.map(([n, desc]) =>
    `<li class="svc"><span class="svc-mark">${svg(ICON_CHECK, 18)}</span><div><h3>${esc(n)}</h3><p>${esc(desc)}</p></div></li>`).join("");

  const steps = [
    ["Call or send a request", d.phone ? `Call ${phoneShow} or fill out the form below.` : "Call us or fill out the form below."],
    [d.freeEstimates ? "Get your free estimate" : "Get a clear price", "We look at the job and tell you the price before any work starts."],
    ["The work gets done", "We do the job you agreed to."],
  ].map(([h, p], i) => `<li class="step"><span class="step-n">${i + 1}</span><div><h3>${esc(h)}</h3><p>${p}</p></div></li>`).join("");

  let ratingBlock;
  if (d.rating) {
    ratingBlock = `<div class="rating"><div class="rating-num">${d.rating.toFixed(1)}</div><div>${stars(d.rating, 26)}<p class="rating-sub">${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</p></div></div>`;
  } else {
    ratingBlock = "";
  }

  const options = d.services.map(([n]) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";
  const pattern = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M0 28L28 0" stroke="${th.accent}" stroke-opacity=".22" stroke-width="7"/></svg>`);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${name}${area ? ` | ${esc(tradeName)} in ${area}` : ` | ${esc(tradeName)}`}</title>
<meta name="description" content="${name} is a ${esc(t.noun)} serving ${areaPhrase}. ${esc(t.sub)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,600..800&family=Public+Sans:wght@400;600&display=swap">
<style>
:root{--dark:${th.dark};--dark2:${th.dark2};--accent:${th.accent};--accent-ink:${th.accentInk};--hi:${th.hi};--light:${th.light};--ink:${th.ink};--muted:${th.muted};--line:${th.line};--white:#ffffff;
--display:"Archivo","Arial Narrow","Helvetica Neue",Arial,sans-serif;--body:"Public Sans","Segoe UI",Roboto,Helvetica,Arial,sans-serif;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--white);color:var(--ink);font:400 17px/1.6 var(--body);padding-bottom:76px}
h1,h2,h3{font-family:var(--display);font-stretch:85%;line-height:1.1;margin:0;text-wrap:balance}
p{margin:0}
a{color:inherit}
.wrap{max-width:1120px;margin:0 auto;padding-left:max(18px,env(safe-area-inset-left,0px));padding-right:max(18px,env(safe-area-inset-right,0px))}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 22px;border-radius:6px;font:700 17px/1 var(--display);font-stretch:90%;letter-spacing:.01em;text-decoration:none;border:2px solid transparent;cursor:pointer}
.btn-accent{background:var(--accent);color:var(--accent-ink)}
.btn-ghost{border-color:rgba(255,255,255,.45);color:var(--white)}
.btn:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
/* header */
.top{background:var(--dark);color:var(--white);border-bottom:1px solid rgba(255,255,255,.08)}
.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px}
.brand{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none}
.brand-mark{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:6px;background:var(--accent);color:var(--accent-ink)}
.brand-name{font:800 19px/1.1 var(--display);font-stretch:85%;overflow-wrap:anywhere}
.top-call{display:none}
/* hero */
.hero{background:var(--dark);color:var(--white);position:relative;overflow:hidden}
.hero .wrap{display:grid;gap:28px;padding-block:40px 44px;position:relative}
.eyebrow{display:inline-block;font:700 13px/1 var(--display);letter-spacing:.12em;text-transform:uppercase;color:var(--hi)}
.hero h1{font-size:clamp(34px,8.6vw,60px);font-weight:800;margin-top:14px}
.hero-sub{margin-top:16px;font-size:18px;color:rgba(255,255,255,.82);max-width:34em}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.hero-cta .btn{flex:1 1 220px}
.hero-art{display:none}
.sign{position:relative;aspect-ratio:1;max-width:100%;border-radius:10px;background:var(--dark2) url("data:image/svg+xml,${pattern}");display:grid;place-items:center;color:var(--hi)}
.sign::after{content:"";position:absolute;inset:18px;border:2px solid rgba(255,255,255,.14);border-radius:6px}
.sign-badge{position:absolute;left:24px;bottom:24px;right:24px;background:var(--dark);color:var(--white);border-radius:6px;padding:14px 16px;font:700 16px/1.25 var(--display);font-stretch:90%;z-index:1}
.sign-badge small{display:block;font:600 12px/1.3 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--hi);margin-bottom:4px}
/* trust */
.trust{background:var(--light);border-bottom:1px solid var(--line)}
.trust ul{list-style:none;margin:0;padding:18px 0;display:flex;flex-wrap:wrap;gap:10px 22px}
.trust li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:15px;color:var(--ink)}
.trust li svg{color:var(--dark2);flex:none}
/* sections */
.sec{padding-block:56px}
.sec-alt{background:var(--light)}
.sec-head{max-width:40em;margin-bottom:28px}
.sec-head h2{font-size:clamp(28px,6vw,40px);font-weight:800}
.sec-head p{margin-top:10px;color:var(--muted)}
.svcs{list-style:none;margin:0;padding:0;display:grid;gap:12px;grid-template-columns:1fr}
.svc{display:flex;gap:14px;align-items:flex-start;background:var(--white);border:1px solid var(--line);border-radius:8px;padding:18px}
.svc-mark{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--dark);color:var(--hi)}
.svc h3{font-size:20px;font-weight:700}
.svc p{margin-top:4px;color:var(--muted);font-size:16px}
.sec-alt .svc{background:var(--white)}
.urgent{background:var(--accent);color:var(--accent-ink)}
.urgent .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;padding-block:24px}
.urgent p{font:800 clamp(22px,5vw,30px)/1.15 var(--display);font-stretch:85%}
.urgent .btn{background:var(--dark);color:var(--white)}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.step{display:flex;gap:16px;align-items:flex-start}
.step-n{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:2px solid var(--dark);font:800 20px/1 var(--display);color:var(--dark)}
.step h3{font-size:20px;font-weight:700;margin-top:8px}
.step p{margin-top:4px;color:var(--muted)}
.reviews{display:grid;gap:18px}
.rating{display:flex;align-items:center;gap:18px;background:var(--white);border:1px solid var(--line);border-radius:8px;padding:20px}
.rating-num{font:800 56px/1 var(--display);font-stretch:85%;color:var(--dark);font-variant-numeric:tabular-nums}
.rating-sub{margin-top:6px;color:var(--muted);font-weight:600}
.stars{position:relative;display:block;color:var(--accent)}
.stars-row{position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;height:100%}
.stars-row svg{position:absolute;top:0}
.stars-row.off{color:var(--line);width:100%}
.review-slot{border:2px dashed var(--line);border-radius:8px;padding:20px;color:var(--muted);background:var(--white)}
.review-slot strong{display:block;color:var(--ink);font:700 18px/1.3 var(--display);font-stretch:90%;margin-bottom:4px}
.contact{display:grid;gap:28px}
.contact-info{display:grid;gap:16px;align-content:start}
.contact-line{display:flex;gap:12px;align-items:flex-start}
.contact-line svg{flex:none;margin-top:3px;color:var(--dark2)}
.contact-line b{display:block;font:700 13px/1.2 var(--display);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.contact-line span{font-size:19px;font-weight:600;overflow-wrap:anywhere}
form{display:grid;gap:14px;background:var(--light);border:1px solid var(--line);border-radius:8px;padding:20px}
label{display:grid;gap:6px;font-weight:600;font-size:15px}
input,select,textarea{width:100%;font:400 17px/1.4 var(--body);color:var(--ink);background:var(--white);border:1px solid #b9c2cb;border-radius:6px;padding:12px}
textarea{min-height:96px;resize:vertical}
.form-note{font-size:15px;color:var(--muted)}
.form-done{background:var(--white);border-radius:6px;padding:12px;font-weight:600}
footer{background:var(--dark);color:rgba(255,255,255,.8);font-size:15px}
footer .wrap{display:grid;gap:8px;padding-block:32px}
footer strong{color:var(--white);font:800 20px/1.2 var(--display);font-stretch:85%}
.mobile-call{position:fixed;left:0;right:0;bottom:0;z-index:5;background:var(--dark);padding:10px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));box-shadow:0 -4px 16px rgba(0,0,0,.18)}
.mobile-call .btn{width:100%}
@media (min-width:720px){
  .svcs{grid-template-columns:1fr 1fr}
  .steps{grid-template-columns:repeat(3,1fr)}
  .step{flex-direction:column}
  .step h3{margin-top:0}
  .reviews{grid-template-columns:auto 1fr;align-items:stretch}
  .contact{grid-template-columns:1fr 1.2fr}
}
@media (min-width:960px){
  body{padding-bottom:0}
  .mobile-call{display:none}
  .top-call{display:inline-flex;min-height:44px;font-size:16px}
  .hero .wrap{grid-template-columns:1.25fr 1fr;align-items:center;padding-block:72px}
  .hero-art{display:block}
  .hero-cta .btn{flex:0 0 auto}
  .svcs{grid-template-columns:repeat(3,1fr)}
  .sec{padding-block:80px}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="#top"><span class="brand-mark">${svg(t.icon, 24)}</span><span class="brand-name">${name}</span></a>
  ${callBtn("btn btn-accent top-call")}
</div></header>
<main id="top">
<section class="hero" aria-label="Intro"><div class="wrap">
  <div>
    <span class="eyebrow">${esc(tradeName)}${area ? ` in ${area}` : ""}</span>
    <h1>${esc(t.headline)}</h1>
    <p class="hero-sub">${esc(t.sub)} ${name} serves ${areaPhrase}.</p>
    <div class="hero-cta">${callBtn("btn btn-accent")}<a class="btn btn-ghost" href="#contact">${askLabel}</a></div>
  </div>
  <div class="hero-art" aria-hidden="true"><div class="sign">${svg(t.icon, 170, 'stroke-width="1.3"')}<div class="sign-badge"><small>${esc(tradeName)}</small>${d.emergency ? "Open 24/7 for emergencies" : (area ? `Serving ${area}` : "Serving your area")}</div></div></div>
</div></section>
<section class="trust" aria-label="Why call us"><div class="wrap"><ul>${trust.map(([i, txt]) => `<li>${svg(i, 20)}${esc(txt)}</li>`).join("")}</ul></div></section>
<section class="sec" id="services"><div class="wrap">
  <div class="sec-head"><h2>What we do</h2><p>${name} handles these ${esc(tradeName.toLowerCase())} jobs${area ? ` in ${area}` : ""}. Do not see your job? Just ask.</p></div>
  <ul class="svcs">${services}</ul>
</div></section>
${d.emergency ? `<section class="urgent" aria-label="Emergency service"><div class="wrap"><p>Need help right now? We answer 24/7.</p>${callBtn("btn")}</div></section>` : ""}
<section class="sec sec-alt" id="how"><div class="wrap">
  <div class="sec-head"><h2>How it works</h2></div>
  <ol class="steps">${steps}</ol>
</div></section>
${ratingBlock ? `<section class="sec" id="reviews"><div class="wrap">
  <div class="sec-head"><h2>What customers say</h2></div>
  <div class="reviews">${ratingBlock}<div class="review-slot"><strong>Real reviews go here</strong>Customer reviews from ${name}'s Google profile get added when the site goes live.</div></div>
</div></section>` : ""}
<section class="sec sec-alt" id="contact"><div class="wrap contact">
  <div class="contact-info">
    <div class="sec-head" style="margin-bottom:4px"><h2>${d.freeEstimates ? "Get your free estimate" : "Ask for a price"}</h2><p>Call us, or send the form and we will call you back.</p></div>
    <div class="contact-line">${svg(ICON_PHONE, 22)}<div><b>Phone</b><span>${d.phone ? phoneShow : "Phone number here"}</span></div></div>
    <div class="contact-line">${svg(ICON_PIN, 22)}<div><b>Service area</b><span>${area ? `${area} and nearby towns` : "Your town and nearby towns"}</span></div></div>
    <div class="contact-line">${svg(ICON_CLOCK, 22)}<div><b>${d.emergency ? "Hours" : "Emergencies"}</b><span>${d.emergency ? "Open 24 hours" : "Ask about emergency service"}</span></div></div>
  </div>
  <form id="ask" novalidate>
    <label for="f-name">Your name<input id="f-name" name="name" autocomplete="name"></label>
    <label for="f-phone">Phone<input id="f-phone" name="phone" type="tel" autocomplete="tel"></label>
    <label for="f-job">What do you need?<select id="f-job" name="job">${options}</select></label>
    <label for="f-msg">Tell us about the job<textarea id="f-msg" name="message"></textarea></label>
    <button class="btn btn-accent" type="submit">Send request</button>
    <p class="form-note" id="f-note">We will call you back.</p>
  </form>
</div></section>
</main>
<footer><div class="wrap">
  <strong>${name}</strong>
  <span>${esc(tradeName)}${area ? ` &middot; ${area}` : ""}${d.phone ? ` &middot; ${phoneShow}` : ""}${d.insured ? " &middot; Licensed and insured" : ""}</span>
  <span>&copy; ${esc(d.year)} ${name}. Sample site.</span>
</div></footer>
<div class="mobile-call">${callBtn("btn btn-accent")}</div>
<script>
document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();var n=document.getElementById("f-note");n.className="form-done";n.textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});
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
