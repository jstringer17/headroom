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
//   insured (default false), theme (default: trade default), year,
//   heroImage (optional)
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

export function generateSite(form) {
  const d = normalize(form);
  const t = d.trade;
  const th = THEMES[d.themeKey];
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

  // Trust bar: always four cells, each one a fact the owner typed or ticked.
  const cells = [
    ["Service area", area || "Your town"],
    ["Pricing", d.freeEstimates ? "Free estimates" : "Ask for a price"],
    ["Emergencies", d.emergency ? "Open 24/7" : "Call to ask"],
  ];
  if (d.rating) cells.push(["Google rating", `${d.rating.toFixed(1)} ${stars(d.rating, 16)}`, true]);
  else if (d.years) cells.push(["In business", `${d.years} year${d.years === 1 ? "" : "s"}`]);
  else if (d.insured) cells.push(["Coverage", "Licensed and insured"]);
  else cells.push(["Phone", d.phone ? phoneShow : "Call us"]);
  const trust = cells.map(([k, v, raw]) => `<div class="cell rv"><dt>${k}</dt><dd>${raw ? v : esc(v)}</dd></div>`).join("");

  const services = d.services.map(([n, desc], i) =>
    `<li class="rv" style="--i:${i}"><a href="#contact"><span class="svc-name">${esc(n)}</span><span class="svc-desc">${esc(desc)}</span><span class="svc-go">${svg(ICON_ARROW, 22)}</span></a></li>`).join("");

  const steps = [
    ["Call or send a request", d.phone ? `Call ${phoneShow}, or fill out the form on this page.` : "Call us, or fill out the form on this page."],
    [d.freeEstimates ? "Get your free estimate" : "Get a clear price", "We look at the job and tell you the price before any work starts."],
    ["The work gets done", "We do the job you agreed to."],
  ].map(([h, p], i) => `<li class="rv" style="--i:${i}"><span class="step-n" aria-hidden="true">${i + 1}</span><h3>${esc(h)}</h3><p>${p}</p></li>`).join("");

  const reviews = d.rating ? `<section class="sec" id="reviews"><div class="wrap grid">
  <div class="head rv"><h2>What customers say</h2></div>
  <div class="body rev rv">
    <div class="rating"><span class="rating-num">${d.rating.toFixed(1)}</span><span>${stars(d.rating, 26)}<span class="rating-sub">${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</span></span></div>
    <p class="rev-note"><strong>Real reviews go here.</strong> Customer reviews from ${name}'s Google profile get added when the site goes live.</p>
  </div>
</div></section>` : "";

  const svcList = d.services.map((s) => s[0].toLowerCase());
  const svcSentence = svcList.length > 1 ? `${svcList.slice(0, -1).join(", ")}, and ${svcList[svcList.length - 1]}` : svcList[0];
  const faqs = [
    ["How much will it cost?", d.freeEstimates ? "Every job is different. We look at yours and give you a free estimate before any work starts." : "Every job is different. Call us and we will tell you the price before any work starts."],
    ["What areas do you serve?", `${area || "Our town"} and nearby towns. Not sure about your street? Call and ask.`],
    ["Do you take emergency calls?", d.emergency ? `Yes. We are open 24/7 for emergencies.${d.phone ? ` Call ${phoneShow}.` : ""}` : "Call us and ask about emergency service."],
    [`What ${tradeName.toLowerCase()} work do you do?`, `${svcSentence.charAt(0).toUpperCase() + svcSentence.slice(1)}. If your job is not on the list, just ask.`],
    ["How do I get started?", `${d.phone ? `Call ${phoneShow}` : "Call us"} or send the form below. Have the address and a short note about the job ready.`],
  ].map(([q, a]) => `<details class="rv"><summary><span>${esc(q)}</span>${svg(ICON_PLUS, 22)}</summary><p>${a}</p></details>`).join("");

  const options = d.services.map(([n]) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";
  const sig = `<svg class="sig" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="${t.line}" pathLength="1"/></svg>`;

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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap">
<style>
/* One accent, two neutrals. Big Shoulders (built, signage letters) over Hanken Grotesk. 12-column grid, 8px rhythm. */
:root{--dark:${th.dark};--dark2:${th.dark2};--accent:${th.accent};--accent-ink:${th.accentInk};--hi:${th.hi};--light:${th.light};--ink:${th.ink};--muted:${th.muted};--line:${th.line};--paper:#ffffff;
--on-dark:#ffffff;--on-dark-2:rgba(255,255,255,.74);--rule-dark:rgba(255,255,255,.16);
--display:"Big Shoulders Display","Arial Narrow","Roboto Condensed",Impact,sans-serif;--body:"Hanken Grotesk","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
--ease:cubic-bezier(.16,1,.3,1);--max:1240px;--gut:max(20px,env(safe-area-inset-left,0px));color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:80px}
body{margin:0;background:var(--paper);color:var(--ink);font:400 18px/1.6 var(--body);padding-bottom:76px}
::selection{background:var(--accent);color:var(--accent-ink)}
h1,h2,h3{font-family:var(--display);margin:0;text-wrap:balance;font-weight:800;text-transform:uppercase;letter-spacing:.005em}
p,dl,dd{margin:0}
a{color:inherit;text-underline-offset:4px}
img,svg{max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding-left:var(--gut);padding-right:max(20px,env(safe-area-inset-right,0px))}
a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:0 28px;border:0;border-radius:4px;font:600 17px/1 var(--body);letter-spacing:.01em;text-decoration:none;cursor:pointer;transition:transform .35s var(--ease),background-color .35s var(--ease)}
.btn-accent{background:var(--accent);color:var(--accent-ink)}
.btn-accent:hover{transform:translateY(-2px)}
.btn-line{color:var(--on-dark);box-shadow:inset 0 0 0 1.5px var(--rule-dark)}
.btn-line:hover{box-shadow:inset 0 0 0 1.5px var(--on-dark)}
/* header */
.top{position:sticky;top:0;z-index:20;background:var(--dark);color:var(--on-dark);transition:box-shadow .4s var(--ease)}
.top.scrolled{box-shadow:0 8px 24px rgba(0,0,0,.18)}
.top .wrap{display:flex;align-items:center;gap:28px;min-height:68px}
.brand-name{font:800 24px/1 var(--display);text-transform:uppercase;letter-spacing:.01em;text-decoration:none;margin-right:auto;overflow-wrap:anywhere;min-width:0}
.nav{display:none;gap:28px;font-size:15px;font-weight:500}
.nav a{text-decoration:none;color:var(--on-dark-2);transition:color .25s}
.nav a:hover{color:var(--on-dark)}
.top .btn{display:none;min-height:44px;padding:0 18px;font-size:15px}
/* hero */
.hero{position:relative;background:var(--dark);color:var(--on-dark);overflow:hidden;isolation:isolate}
.hero .wrap{position:relative;padding-block:48px 0}
.hero h1{font-size:clamp(60px,16.5vw,168px);font-weight:900;line-height:.86;letter-spacing:-.005em;max-width:9.5ch}
.hero-sub{margin-top:28px;font-size:clamp(18px,2.2vw,22px);line-height:1.5;color:var(--on-dark-2);max-width:34ch}
.hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:36px}
.hero-cta .btn{flex:1 1 240px}
.sig{display:block;width:100%;height:auto;margin-top:40px;overflow:visible}
.sig path{fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.hero-img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover}
.has-img::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.5) 55%,rgba(0,0,0,.38) 100%),linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,0) 70%)}
.has-img .wrap{padding-block:220px 56px}
.has-img .hero-sub{color:rgba(255,255,255,.88)}
/* trust bar */
.trust{background:var(--dark);color:var(--on-dark)}
.trust dl{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--rule-dark)}
.cell{padding:22px 16px 26px 0}
.cell:nth-child(even){padding-left:16px;border-left:1px solid var(--rule-dark)}
.cell:nth-child(n+3){border-top:1px solid var(--rule-dark)}
.cell dt{font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--on-dark-2)}
.cell dd{margin-top:6px;font:800 clamp(24px,3vw,32px)/1.05 var(--display);text-transform:uppercase;display:flex;align-items:center;flex-wrap:wrap;gap:10px;overflow-wrap:anywhere}
.cell .stars{color:var(--hi)}
/* sections */
.sec{padding-block:88px}
.tint{background:var(--light)}
.sec h2{font-size:clamp(44px,8vw,84px);line-height:.9}
.lede{margin-top:20px;color:var(--muted);max-width:36ch}
.grid{display:grid;gap:40px}
.svcs{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.svcs a{display:grid;grid-template-columns:1fr auto;gap:6px 20px;padding:24px 0;border-bottom:1px solid var(--line);text-decoration:none;transition:padding .45s var(--ease)}
.svc-name{font:800 clamp(26px,3.4vw,36px)/1 var(--display);text-transform:uppercase}
.svc-desc{grid-column:1;color:var(--muted);font-size:17px;max-width:44ch}
.svc-go{grid-row:1/3;grid-column:2;align-self:center;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--line);color:var(--ink);transition:background-color .35s var(--ease),color .35s var(--ease),box-shadow .35s var(--ease),transform .45s var(--ease)}
.svcs a:hover{padding-left:12px}
.svcs a:hover .svc-go{background:var(--accent);color:var(--accent-ink);box-shadow:none;transform:rotate(-45deg)}
.steps{list-style:none;margin:56px 0 0;padding:0;display:grid;gap:48px;counter-reset:s}
.step-n{display:block;font:900 120px/.8 var(--display);color:transparent;-webkit-text-stroke:1.5px var(--ink);margin-bottom:20px}
.steps h3{font-size:30px;line-height:1}
.steps p{margin-top:10px;color:var(--muted);max-width:30ch}
.rev{display:grid;gap:24px;align-content:start}
.rating{display:flex;align-items:center;gap:24px}
.rating-num{font:900 120px/.8 var(--display);font-variant-numeric:tabular-nums}
.rating-sub{display:block;margin-top:10px;color:var(--muted);font-weight:500}
.stars{position:relative;display:block;flex:none;color:var(--accent)}
.stars-row{position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;height:100%}
.stars-row svg{position:absolute;top:0}
.stars-row.off{color:var(--line);width:100%}
.trust .stars-row.off{color:var(--rule-dark)}
.rev-note{color:var(--muted);max-width:44ch;padding-top:24px;border-top:1px solid var(--line)}
.rev-note strong{color:var(--ink);font-weight:600}
.area-town{font:900 clamp(56px,12vw,128px)/.85 var(--display);text-transform:uppercase;overflow-wrap:anywhere}
.area-sub{margin-top:18px;color:var(--muted);max-width:34ch}
.rings{display:block;width:100%;max-width:440px;height:auto;justify-self:end}
.rings circle{fill:none;stroke:var(--line);stroke-width:1.5}
.rings .r2{stroke-dasharray:4 8}
.rings .dot{fill:var(--accent);stroke:none}
.rings .pulse{stroke:var(--accent);stroke-width:1.5;transform-origin:220px 220px}
.faq{border-top:1px solid var(--line)}
.faq details{border-bottom:1px solid var(--line)}
.faq summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:24px 0;cursor:pointer;font:700 clamp(22px,2.6vw,28px)/1.15 var(--display);text-transform:uppercase}
.faq summary::-webkit-details-marker{display:none}
.faq summary svg{flex:none;transition:transform .4s var(--ease)}
.faq details[open] summary svg{transform:rotate(45deg)}
.faq details p{padding:0 0 26px;color:var(--muted);max-width:60ch}
/* final call + form */
.final{background:var(--dark);color:var(--on-dark)}
.final h2{font-size:clamp(52px,10vw,120px)}
.final .lede{color:var(--on-dark-2)}
.big-phone{display:inline-block;margin-top:32px;font:900 clamp(40px,7vw,72px)/1 var(--display);color:var(--hi);text-decoration:none;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.final dl{display:grid;gap:4px;margin-top:28px;color:var(--on-dark-2)}
.final dl div{display:flex;gap:8px;flex-wrap:wrap}
.final dt{color:var(--on-dark);font-weight:600}
form{display:grid;gap:18px;align-content:start}
label{display:grid;gap:8px;font-size:15px;font-weight:500;color:var(--on-dark-2)}
input,select,textarea{width:100%;font:400 17px/1.4 var(--body);color:var(--on-dark);background:transparent;border:0;border-bottom:1.5px solid var(--rule-dark);border-radius:0;padding:10px 0 12px;transition:border-color .3s}
select{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='white' stroke-width='2'%3E%3Cpath d='M2 5l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 2px center}
select option{color:#111111}
input:focus,select:focus,textarea:focus{border-bottom-color:var(--accent);outline:none}
textarea{min-height:96px;resize:vertical}
form .btn{margin-top:10px}
.form-note{font-size:15px;color:var(--on-dark-2)}
footer{background:var(--dark2);color:var(--on-dark-2);font-size:15px}
footer .wrap{display:grid;gap:36px;padding-block:64px 32px}
.foot-name{font:900 clamp(40px,7vw,72px)/.9 var(--display);text-transform:uppercase;color:var(--on-dark);overflow-wrap:anywhere}
.foot-cols{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.foot-cols h3{font:600 13px/1.2 var(--body);letter-spacing:.08em;color:var(--on-dark);margin-bottom:12px}
.foot-cols ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.foot-cols a{text-decoration:none}
.foot-cols a:hover{color:var(--on-dark)}
.foot-base{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 24px;padding-top:24px;border-top:1px solid var(--rule-dark);font-size:14px}
.mobile-call{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:10px;padding:10px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:var(--dark);box-shadow:0 -8px 24px rgba(0,0,0,.16)}
.mobile-call .btn{flex:1}
/* motion: only when the browser allows it; everything is visible without it */
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes pulse{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1);opacity:0}}
@media (prefers-reduced-motion:no-preference){
  .motion .sig path{stroke-dasharray:1;animation:draw 2.2s var(--ease) .2s both}
  .motion .rv{transition:opacity .9s var(--ease),transform .9s var(--ease);transition-delay:calc(var(--i,0) * 70ms)}
  .motion .rv:not(.in){opacity:0;transform:translateY(24px)}
  .rings .pulse{animation:pulse 3.2s var(--ease) infinite}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.svcs a,.svc-go{transition:none}.rings .pulse{display:none}}
@media (min-width:760px){
  .trust dl{grid-template-columns:repeat(4,1fr)}
  .cell,.cell:nth-child(even){padding:28px 24px 32px;border-left:1px solid var(--rule-dark);border-top:0}
  .cell:first-child{padding-left:0;border-left:0}
  .grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:24px}
  .grid>.head{grid-column:1/span 5}
  .grid>.body{grid-column:6/span 7}
  .steps{grid-template-columns:repeat(3,1fr);gap:32px}
  .foot-cols{grid-template-columns:repeat(3,1fr)}
  .sec{padding-block:128px}
}
@media (min-width:1024px){
  body{padding-bottom:0}
  .mobile-call{display:none}
  .nav{display:flex}
  .top .btn{display:inline-flex}
  .hero .wrap{padding-block:72px 88px}
  .hero h1{font-size:clamp(96px,10.5vw,140px)}
  .sig{position:absolute;right:max(20px,env(safe-area-inset-right,0px));bottom:88px;width:50%;margin:0}
  .hero-sub{max-width:30ch}
  .hero-cta .btn{flex:0 0 auto}
  .has-img .wrap{padding-block:300px 88px}
  .grid>.head .sticky{position:sticky;top:120px}
  footer .wrap{grid-template-columns:5fr 7fr;align-items:end}
  .foot-base{grid-column:1/-1}
}
</style>
</head>
<body>
<header class="top" id="top-bar"><div class="wrap">
  <a class="brand-name" href="#top">${name}</a>
  <nav class="nav" aria-label="Sections"><a href="#services">Services</a><a href="#how">How it works</a><a href="#area">Service area</a><a href="#faq">Questions</a></nav>
  ${callBtn("btn btn-accent")}
</div></header>
<main id="top">
<section class="hero${hero ? " has-img" : ""}" aria-label="Intro">${hero ? `<img class="hero-img" src="${esc(hero)}" alt="" fetchpriority="high">` : ""}<div class="wrap">
  <h1>${esc(t.headline)}</h1>
  <p class="hero-sub">${esc(t.sub)} ${name} serves ${areaPhrase}.</p>
  <div class="hero-cta">${callBtn("btn btn-accent")}<a class="btn btn-line" href="#contact">${askLabel}</a></div>
  ${hero ? "" : sig}
</div></section>
<section class="trust" aria-label="At a glance"><div class="wrap"><dl>${trust}</dl></div></section>
<section class="sec" id="services"><div class="wrap grid">
  <div class="head"><div class="sticky rv"><h2>What we do</h2><p class="lede">${esc(tradeName)} work for homes and businesses${area ? ` in ${area}` : ""}. Do not see your job? Just ask.</p></div></div>
  <ul class="svcs body">${services}</ul>
</div></section>
<section class="sec tint" id="how"><div class="wrap">
  <h2 class="rv">How it works</h2>
  <ol class="steps">${steps}</ol>
</div></section>
${reviews}
<section class="sec${d.rating ? " tint" : ""}" id="area"><div class="wrap grid">
  <div class="head rv"><h2>Where we work</h2></div>
  <div class="body area rv">
    <p class="area-town">${area || "Your town"}</p>
    <p class="area-sub">And the towns nearby. Not sure we come to your street? Call and ask.</p>
    <svg class="rings" viewBox="0 0 440 440" aria-hidden="true"><circle cx="220" cy="220" r="210"/><circle class="r2" cx="220" cy="220" r="140"/><circle cx="220" cy="220" r="70"/><circle class="pulse" cx="220" cy="220" r="210"/><circle class="dot" cx="220" cy="220" r="8"/></svg>
  </div>
</div></section>
<section class="sec${d.rating ? "" : " tint"}" id="faq"><div class="wrap grid">
  <div class="head"><div class="sticky rv"><h2>Questions</h2><p class="lede">Straight answers before you call.</p></div></div>
  <div class="body faq">${faqs}</div>
</div></section>
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
  <p class="foot-name">${name}</p>
  <div class="foot-cols">
    <div><h3>SERVICES</h3><ul>${d.services.slice(0, 5).map(([n]) => `<li><a href="#services">${esc(n)}</a></li>`).join("")}</ul></div>
    <div><h3>CONTACT</h3><ul><li>${d.phone ? `<a href="${callHref}">${phoneShow}</a>` : "Phone number here"}</li><li>${area || "Your town"}</li><li>${d.emergency ? "Open 24 hours" : "Call for hours"}</li></ul></div>
    <div><h3>COMPANY</h3><ul><li>${esc(tradeName)}</li>${d.years ? `<li>${d.years} year${d.years === 1 ? "" : "s"} in business</li>` : ""}${d.insured ? "<li>Licensed and insured</li>" : ""}<li><a href="#faq">Questions</a></li></ul></div>
  </div>
  <div class="foot-base"><span>&copy; ${esc(d.year)} ${name}</span><span>Sample site</span></div>
</div></footer>
<div class="mobile-call">${callBtn("btn btn-accent")}</div>
<script>
(function(){
  var bar=document.getElementById("top-bar");
  addEventListener("scroll",function(){bar.classList.toggle("scrolled",scrollY>8)},{passive:true});
  document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();document.getElementById("f-note").textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});
  if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var els=[].slice.call(document.querySelectorAll(".rv"));
  els.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add("in")});
  document.documentElement.classList.add("motion");
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
