// Sample Site Maker: Cinematic mode.
// generateCinematic(form, d, deps) builds one scroll-story site as a single
// self-contained HTML document. `d` is normalize(form); `deps` is
// { CINE_KIT, cineLook, placeholderArt } (see "Shared contract" in org/plan.md).
//
// form.cine = {
//   images: { [slotId]: data URI or https URL },   slotId = a story step id,
//                                                   a style id, "before" or "after"
//   unit: "per job" | "per sq ft" | "per linear foot" | "per hour" (default depends on the trade)
//   prices: { [size]: { [option]: { low, high } } } typed by the owner
// }
//
// Rules: no invented numbers, reviews, claims or work photos. A slot with no
// picture shows placeholderArt with its label. The price estimator shows only
// ranges the owner typed; a blank cell means that choice is not offered, and
// no ranges at all hides the section.
import { esc, safeImage } from "./generate.js";
import { THEMES } from "./themes.js";

// The picture slots a trade's kit asks for, in the order the form lists them.
export function cineSlots(kit) {
  if (!kit) return [];
  const out = [];
  (kit.story || []).forEach((s, i) => out.push({ id: s.id, group: "Story", label: `Story ${i + 1}: ${s.headline}`, prompt: s.prompt }));
  (kit.styles || []).forEach((s) => out.push({ id: s.id, group: "Styles", label: `Style: ${s.name}`, prompt: s.prompt }));
  if (kit.beforeAfter) {
    out.push({ id: "before", group: "Before and after", label: "Before picture", prompt: kit.beforeAfter.before && kit.beforeAfter.before.prompt });
    out.push({ id: "after", group: "Before and after", label: "After picture", prompt: kit.beforeAfter.after && kit.beforeAfter.after.prompt });
  }
  return out;
}

// The estimator's unit is a setting. Default per trade (CEO list), switchable in the form.
export const CINE_UNITS = ["per job", "per sq ft", "per linear foot", "per hour"];
const DEFAULT_UNITS = {
  roofing: "per sq ft", fencing: "per linear foot", pressure: "per sq ft", hvac: "per job",
  restoration: "per job", homebuilder: "per sq ft", builder: "per sq ft", homebuilding: "per sq ft", framing: "per sq ft",
};
export function cineUnit(tradeKey, chosen) {
  return CINE_UNITS.includes(chosen) ? chosen : DEFAULT_UNITS[tradeKey] || "per job";
}

// "$2,750" from whatever the owner typed; null if it is not a real number.
function money(v) {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 && n < 1e7 ? Math.round(n) : null;
}
const usd = (n) => "$" + n.toLocaleString("en-US");

// Keep only the ranges the owner typed in full (both numbers, low <= high).
// Returns { sizes: [labels], options: [labels], cells: { size: { option: "$a to $b" } } }
// or null when nothing is offered.
export function offeredPrices(kit, prices) {
  const est = kit && kit.estimator;
  if (!est || !prices || typeof prices !== "object") return null;
  const cells = {};
  const optionUsed = new Set();
  const lows = [];
  for (const size of est.sizes || []) {
    const row = prices[size];
    if (!row || typeof row !== "object") continue;
    for (const opt of est.options || []) {
      const c = row[opt];
      const lo = c && money(c.low), hi = c && money(c.high);
      if (lo == null || hi == null || hi < lo) continue;
      (cells[size] = cells[size] || {})[opt] = lo === hi ? usd(lo) : `${usd(lo)} to ${usd(hi)}`;
      optionUsed.add(opt);
      if (!/tune/i.test(opt)) lows.push(lo);
    }
  }
  const sizes = (est.sizes || []).filter((s) => cells[s]);
  if (!sizes.length) return null;
  return { sizes, options: (est.options || []).filter((o) => optionUsed.has(o)), cells, lows };
}

// Words on the before/after slider, per trade (what the drag shows).
const BA_TAGS = {
  pressure: ["Dirty", "Clean", "Drag to clean"], restoration: ["Damaged", "Restored", "Drag to restore"],
  builder: ["Plan", "Built", "Drag to build"], framing: ["Bare slab", "Framed", "Drag to frame"],
  hvac: ["Dirty", "Clean", "Drag the line"],
};
const baTags = (k) => BA_TAGS[k] || ["Before", "After", "Drag the line"];

function accentHtml(text, accent) {
  const i = accent ? text.indexOf(accent) : -1;
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i))}<em>${esc(accent)}</em>${esc(text.slice(i + accent.length))}`;
}

const svgIcon = (inner, size) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const CINE_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';

const ENGINE_CSS = `
:root{--serif:Georgia,"Times New Roman",serif;--sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--cream:#f6f0e4;--cream2:#ece4d3;--card:rgba(255,255,255,.14);--ease:cubic-bezier(.16,1,.3,1);--hh:64px;--max:1200px;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:72px}
body{margin:0;background:var(--cream);color:var(--ink);font:400 18px/1.6 var(--sans);overflow-x:clip;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}
h1,h2,h3,p,dl,dd,figure{margin:0}
h1,h2{font-family:var(--serif);font-weight:500;letter-spacing:-.015em;line-height:1.04;text-wrap:balance}
h1 em,h2 em,.line em{font-style:italic;color:var(--accent)}
a{color:inherit;text-underline-offset:4px}
img,svg{max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding-inline:max(20px,env(safe-area-inset-left,0px)) max(20px,env(safe-area-inset-right,0px))}
a:focus-visible,button:focus-visible,summary:focus-visible,[role=slider]:focus-visible,input:focus-visible+span{outline:3px solid var(--accent);outline-offset:3px;border-radius:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border:0;border-radius:999px;font:600 16px/1 var(--sans);text-decoration:none;cursor:pointer;transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.btn-accent{background:var(--accent);color:var(--accent-ink)}
.btn-accent:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.25)}
.btn-glass{color:#fff;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.4);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.btn-sm{min-height:40px;padding:0 18px;font-size:15px}
/* header */
.top{position:sticky;top:0;z-index:40;background:var(--dark);color:#fff;height:var(--hh)}
.top .wrap{display:flex;align-items:center;gap:24px;height:100%}
.brand{font:600 18px/1.15 var(--sans);text-decoration:none;margin-right:auto;min-width:0;overflow-wrap:anywhere}
.nav{display:none;gap:24px;font-size:15px}
.nav a{text-decoration:none;color:rgba(255,255,255,.78)}
.nav a:hover{color:#fff}
.top .btn{display:none}
/* story: stacked frames by default, pinned scroll story when .cine-motion is set */
.story{background:var(--dark);color:#fff}
.step{position:relative;min-height:78vh;min-height:78svh;display:flex;align-items:flex-end;overflow:hidden}
.frame{position:absolute;inset:0}
.frame img{display:block;width:100%;height:100%;object-fit:cover}
.frame::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.28) 48%,rgba(0,0,0,.18) 100%)}
.line{position:relative;z-index:2;width:100%;max-width:var(--max);margin:0 auto;padding:0 max(20px,env(safe-area-inset-left,0px)) 56px}
.line .h{display:block;font:500 clamp(40px,10.5vw,104px)/1 var(--serif);letter-spacing:-.02em;max-width:14ch;text-wrap:balance;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.story-cta{position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:28px max(20px,env(safe-area-inset-left,0px));max-width:var(--max);margin:0 auto}
.story-sub{flex:1 1 100%;color:rgba(255,255,255,.88);max-width:44ch;font-size:clamp(17px,2vw,20px);line-height:1.5}
.prog{display:none}
.cine-motion .story{height:calc(var(--n) * 100vh);height:calc(var(--n) * 100svh)}
.cine-motion .pin{position:sticky;top:var(--hh);height:calc(100vh - var(--hh));height:calc(100svh - var(--hh));overflow:hidden}
.cine-motion .step{position:absolute;inset:0;min-height:0;display:block}
.cine-motion .frame img{transform-origin:50% 55%;will-change:transform,opacity}
.cine-motion .frame{will-change:opacity}
.cine-motion .step .line{position:absolute;left:0;right:0;bottom:calc(150px + env(safe-area-inset-bottom,0px));padding-bottom:0;will-change:transform,opacity}
.cine-motion .step:not(:first-child) .line{opacity:0}
.cine-motion .story-cta{position:absolute;left:0;right:0;bottom:0;padding-bottom:calc(28px + env(safe-area-inset-bottom,0px));padding-top:0;margin:0 auto;pointer-events:none}
.cine-motion .story-cta>*{pointer-events:auto}
.cine-motion .story-sub{display:none}
.cine-motion .prog{display:flex;gap:6px;position:absolute;right:max(20px,env(safe-area-inset-right,0px));bottom:calc(36px + env(safe-area-inset-bottom,0px));z-index:4}
.prog i{display:block;width:6px;height:28px;border-radius:3px;background:rgba(255,255,255,.35);transition:background-color .3s,transform .3s}
.prog i.on{background:var(--accent);transform:scaleY(1.2)}
.cue{display:none}
.cine-motion .cue{display:block;position:absolute;left:50%;top:14px;z-index:4;transform:translateX(-50%);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.75)}
/* sections on cream */
.sec{padding-block:72px}
.sec h2{font-size:clamp(38px,7vw,72px)}
.sec h2 em{color:var(--accent-text,color-mix(in srgb,var(--accent) 52%,#000))}
.dark-sec h2 em,.final h2 em{color:var(--accent)}
.kicker{display:block;font:600 13px/1 var(--sans);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.sec .lede{margin-top:14px;color:var(--muted);max-width:44ch}
.sec-head{margin-bottom:32px}
/* style tabs over a photo */
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.tab{min-height:44px;padding:0 20px;border:0;border-radius:999px;background:var(--cream2);color:var(--ink);font:600 15px/1 var(--sans);cursor:pointer;transition:background-color .25s,color .25s}
.tab[aria-selected=true]{background:var(--ink);color:var(--cream)}
.cine-no-js .tabs{display:none}
.panel{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/5;background:var(--dark);color:#fff}
.panel[hidden]{display:none}
.panel img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.panel .glass{position:absolute;left:14px;right:14px;bottom:14px;padding:20px;border-radius:14px;background:var(--card);-webkit-backdrop-filter:blur(14px) saturate(140%);backdrop-filter:blur(14px) saturate(140%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28);display:grid;gap:10px;justify-items:start}
.glass h3{font:500 28px/1.1 var(--serif)}
.glass p{color:rgba(255,255,255,.92);font-size:16px;line-height:1.45;max-width:40ch}
.glass::before{content:"";position:absolute;inset:0;border-radius:inherit;background:rgba(0,0,0,.34);z-index:-1}
.glass{isolation:isolate}
.cine-no-js .panel[hidden]{display:block}
.cine-no-js .panel{margin-bottom:16px}
@media (prefers-reduced-motion:no-preference){.panel:not([hidden]){animation:fadein .6s var(--ease)}@keyframes fadein{from{opacity:0}to{opacity:1}}}
/* before / after */
.dark-sec{background:var(--dark);color:#fff}
.dark-sec .kicker,.dark-sec .lede{color:rgba(255,255,255,.7)}
.ba{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3;background:var(--dark2);touch-action:pan-y;user-select:none;-webkit-user-select:none;--pos:50}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
.ba .before{clip-path:inset(0 calc((100 - var(--pos)) * 1%) 0 0)}
.ba-tag{position:absolute;top:14px;z-index:2;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font:600 13px/1 var(--sans);letter-spacing:.06em;text-transform:uppercase;pointer-events:none}
.ba-tag.l{left:14px}.ba-tag.r{right:14px}
.ba-handle{position:absolute;top:0;bottom:0;left:calc(var(--pos) * 1%);width:44px;margin-left:-22px;z-index:3;display:grid;place-items:center;cursor:ew-resize;touch-action:pan-y}
.ba-handle::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.4)}
.ba-knob{position:relative;width:44px;height:44px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 16px rgba(0,0,0,.35)}
.ba-knob svg{width:22px;height:22px}
/* hvac tools */
.tools{display:grid;gap:28px}
.dial-card{display:grid;gap:12px;justify-items:center}
.dial{position:relative;width:min(300px,80vw);aspect-ratio:1;touch-action:none;cursor:grab;border-radius:50%}
.dial svg{width:100%;height:100%;display:block}
.d-track,.d-arc{fill:none;stroke-width:12;stroke-linecap:round}
.d-track{stroke:#d9d0bc}
.d-arc{stroke:var(--accent);stroke-dasharray:var(--len,0) 999}
.d-knob{fill:var(--ink)}
.d-read{position:absolute;inset:0;display:grid;place-content:center;text-align:center;font:500 clamp(56px,16vw,84px)/1 var(--serif);font-variant-numeric:tabular-nums}
.d-read small{font:600 16px/1 var(--sans);color:var(--muted)}
.rr{display:grid;gap:16px;align-content:start;background:#fff;border-radius:18px;padding:24px}
.rr h3{font:500 30px/1.1 var(--serif)}
.rr fieldset{border:0;margin:0;padding:0}
.rr legend{padding:0;margin-bottom:10px;font:600 14px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.rr input[type=number]{width:100%;font:400 17px/1.4 var(--sans);border:1.5px solid #a79f8c;border-radius:10px;padding:13px 14px;margin-top:6px}
.rr-out{font:500 22px/1.3 var(--serif);min-height:3em}
/* price estimator */
.est{display:grid;gap:28px}
.est fieldset{border:0;margin:0;padding:0;min-width:0}
.est legend{padding:0;margin-bottom:10px;font:600 14px/1 var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.opts{display:flex;flex-wrap:wrap;gap:8px}
.opt{position:relative}
.opt input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.opt span{display:inline-flex;align-items:center;min-height:46px;padding:0 20px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1.5px #cfc6b2;font:600 16px/1.2 var(--sans)}
.opt input:checked+span{background:var(--ink);color:var(--cream);box-shadow:none}
.opt input:disabled+span{opacity:.4}
.opt input:disabled{cursor:not-allowed}
.est-out{background:var(--dark);color:#fff;border-radius:18px;padding:28px 24px;display:grid;gap:8px;align-content:center}
.est-num{font:500 clamp(36px,9vw,64px)/1.05 var(--serif);letter-spacing:-.02em;overflow-wrap:anywhere}
.est-unit{color:rgba(255,255,255,.78);font-size:16px}
.est-note{color:rgba(255,255,255,.7);font-size:14px;margin-top:8px}
.est-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.est-list li{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #d9d0bc}
.js .est-list{display:none}
.est-ui{display:none}
.js .est-ui{display:grid;gap:28px}
/* services, reviews, contact */
.svcs{list-style:none;margin:0;padding:0;display:grid;gap:0 32px;grid-template-columns:1fr}
.svcs li{padding:22px 0;border-top:1px solid #d9d0bc}
.svcs p{margin-top:6px;color:var(--muted)}
.svcs h3{font:500 26px/1.15 var(--serif)}
.rating{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.rating-num{font:500 96px/.85 var(--serif);font-variant-numeric:tabular-nums}
.stars{position:relative;display:block;flex:none;color:var(--accent)}
.stars-row{position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;height:100%}
.stars-row svg{position:absolute;top:0}
.stars-row.off{color:#d4cbb6;width:100%}
.rating-sub{display:block;margin-top:8px;color:var(--muted)}
.rev-note{margin-top:20px;color:var(--muted);max-width:48ch}
.final{background:var(--dark);color:#fff}
.final .lede{color:rgba(255,255,255,.78)}
.big-phone{display:inline-block;margin-top:24px;font:500 clamp(38px,8vw,64px)/1 var(--serif);color:var(--hi);text-decoration:none;font-variant-numeric:tabular-nums}
.grid{display:grid;gap:36px}
form{display:grid;gap:16px;align-content:start;background:var(--cream);color:var(--ink);border-radius:18px;padding:24px}
label{display:grid;gap:6px;font-size:15px;font-weight:600}
input[type=text],input[type=tel],select,textarea{width:100%;font:400 17px/1.4 var(--sans);color:var(--ink);background:#fff;border:1.5px solid #a79f8c;border-radius:10px;padding:13px 14px}
input[type=text]:focus,input[type=tel]:focus,select:focus,textarea:focus{outline:none;border-color:var(--ink);box-shadow:0 0 0 3px var(--accent)}
textarea{min-height:100px;resize:vertical}
.form-note{font-size:15px;color:var(--muted)}
footer{background:var(--dark2);color:rgba(255,255,255,.76);font-size:15px}
footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 24px;padding-block:36px}
.foot-name{font:500 22px/1.2 var(--serif);color:#fff}
.mobile-call{position:fixed;left:0;right:0;bottom:0;z-index:50;padding:10px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:var(--dark)}
.mobile-call .btn{width:100%}
.mobile-call{transform:translateY(110%);visibility:hidden;transition:transform .45s var(--ease)}
.past .mobile-call{transform:none;visibility:visible}
@media (prefers-reduced-motion:no-preference){
  .cine-reveal .rv{transition:opacity .9s var(--ease),transform .9s var(--ease)}
  .cine-reveal .rv:not(.in){opacity:0;transform:translateY(22px)}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.tab,.prog i,.mobile-call{transition:none}}
@media (min-width:760px){
  .sec{padding-block:112px}
  .svcs{grid-template-columns:1fr 1fr}
  .panel{aspect-ratio:16/9}
  .panel .glass{left:28px;bottom:28px;right:auto;width:min(420px,calc(100% - 56px));padding:26px}
  .ba{aspect-ratio:16/9}
  .est{grid-template-columns:1.1fr 1fr;gap:56px;align-items:start}
  .tools{grid-template-columns:1fr 1fr;gap:56px;align-items:center}
  .grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:24px}
  .grid>.head{grid-column:1/span 5}
  .grid>.body{grid-column:7/span 6}
  .story-sub{flex:0 1 auto}
  .cine-motion .step .line{bottom:150px}
}
@media (min-width:1024px){
  body{padding-bottom:0}
  .mobile-call{display:none}
  .nav{display:flex}
  .top .btn{display:inline-flex}
  .line .h{max-width:16ch}
}
`;

// The scroll engine and the three tools. Plain ES5, no libraries.
const ENGINE_JS = `(function(){
var root=document.documentElement;root.classList.add("js");root.classList.remove("cine-no-js");
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function clamp(v,a,b){return v<a?a:v>b?b:v}
document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();document.getElementById("f-note").textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});

/* the bottom call bar shows once the story is behind you */
function past(){var s=document.getElementById("story");root.classList.toggle("past",s.getBoundingClientRect().bottom<innerHeight*0.5)}
addEventListener("scroll",past,{passive:true});past();

/* 1. scroll story: only opacity and transform change; the page scrolls normally */
var story=document.getElementById("story");
if(story&&!reduce){
  var steps=[].slice.call(story.querySelectorAll(".step")),n=steps.length;
  var frames=steps.map(function(s){return s.querySelector(".frame")});
  var imgs=steps.map(function(s){return s.querySelector(".frame img")});
  var lines=steps.map(function(s){return s.querySelector(".line")});
  var ticks=[].slice.call(story.querySelectorAll(".prog i"));
  var pin=story.querySelector(".pin"),live=false,queued=false;
  var paint=function(){
    queued=false;
    var r=story.getBoundingClientRect(),total=r.height-pin.offsetHeight;
    var p=total>0?clamp(-r.top/total,0,1):0;
    var pos=p*(n-1);
    for(var i=0;i<n;i++){
      frames[i].style.opacity=i===0?1:clamp(pos-(i-1),0,1);
      var z=clamp(pos-i+1,0,2);
      imgs[i].style.transform="scale("+(1+0.045*z).toFixed(4)+")";
      var d=Math.abs(pos-i),o=clamp(1.15-d*2.1,0,1);
      lines[i].style.opacity=o;
      lines[i].style.transform="translateY("+((pos-i)*-36).toFixed(1)+"px)";
      lines[i].style.visibility=o<0.02?"hidden":"visible";
      if(ticks[i])ticks[i].className=Math.round(pos)===i?"on":"";
    }
  };
  var ask=function(){if(!queued){queued=true;requestAnimationFrame(paint)}};
  root.classList.add("cine-motion");
  paint();
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){
      var on=es[0].isIntersecting;
      if(on&&!live){addEventListener("scroll",ask,{passive:true});addEventListener("resize",ask);live=true;ask()}
      else if(!on&&live){removeEventListener("scroll",ask);removeEventListener("resize",ask);live=false;ask()}
    },{rootMargin:"20% 0px"}).observe(story);
  }else{addEventListener("scroll",ask,{passive:true});addEventListener("resize",ask)}
}

/* 2. style tabs: real buttons, arrow keys, aria-selected */
var tabs=[].slice.call(document.querySelectorAll("#styles [role=tab]"));
var panels=tabs.map(function(t){return document.getElementById(t.getAttribute("aria-controls"))});
function pick(i,focus){
  tabs.forEach(function(t,j){var on=j===i;t.setAttribute("aria-selected",on?"true":"false");t.tabIndex=on?0:-1;panels[j].hidden=!on});
  if(focus)tabs[i].focus();
}
if(tabs.length){
  pick(0,false);
  tabs.forEach(function(t,i){
    t.addEventListener("click",function(){pick(i,false)});
    t.addEventListener("keydown",function(e){
      var k=e.key,to=-1;
      if(k==="ArrowRight"||k==="ArrowDown")to=(i+1)%tabs.length;
      else if(k==="ArrowLeft"||k==="ArrowUp")to=(i-1+tabs.length)%tabs.length;
      else if(k==="Home")to=0;else if(k==="End")to=tabs.length-1;
      if(to>=0){e.preventDefault();pick(to,true)}
    });
  });
}

/* 3. before / after slider: pointer, touch and keyboard */
var ba=document.getElementById("ba");
if(ba){
  var h=ba.querySelector("[role=slider]");
  var set=function(v){v=clamp(Math.round(v),0,100);ba.style.setProperty("--pos",v);h.setAttribute("aria-valuenow",v);h.setAttribute("aria-valuetext",v+" percent")};
  var fromX=function(x){var r=ba.getBoundingClientRect();set((x-r.left)/r.width*100)};
  var drag=false;
  ba.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0)return;drag=true;try{ba.setPointerCapture(e.pointerId)}catch(_){}fromX(e.clientX);h.focus({preventScroll:true})});
  ba.addEventListener("pointermove",function(e){if(drag)fromX(e.clientX)});
  var stop=function(){drag=false};
  ba.addEventListener("pointerup",stop);ba.addEventListener("pointercancel",stop);
  h.addEventListener("keydown",function(e){
    var v=+h.getAttribute("aria-valuenow"),k=e.key,nv=v;
    if(k==="ArrowLeft"||k==="ArrowDown")nv=v-5;else if(k==="ArrowRight"||k==="ArrowUp")nv=v+5;
    else if(k==="PageDown")nv=v-20;else if(k==="PageUp")nv=v+20;
    else if(k==="Home")nv=0;else if(k==="End")nv=100;else return;
    e.preventDefault();set(nv);
  });
  set(50);
}

/* 5. hvac dial and repair-or-replace */
var dial=document.getElementById("dial");
if(dial){
  var arc=document.getElementById("d-arc"),knob=document.getElementById("d-knob"),dv=document.getElementById("d-val"),LEN=2*Math.PI*82*0.75;
  var setT=function(t){
    t=clamp(Math.round(t),60,85);var f=(t-60)/25,a=(-135+f*270)*Math.PI/180;
    dial.setAttribute("aria-valuenow",t);dial.setAttribute("aria-valuetext",t+" degrees");dv.textContent=t;
    arc.style.setProperty("--len",(f*LEN).toFixed(1));
    knob.setAttribute("cx",(100+82*Math.sin(a)).toFixed(1));knob.setAttribute("cy",(100-82*Math.cos(a)).toFixed(1));
  };
  var dragD=false;
  var fromPt=function(e){var r=dial.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);var ang=Math.atan2(dx,-dy)*180/Math.PI;if(ang>135||ang<-135)ang=dx<0?-135:135;setT(60+(ang+135)/270*25)};
  dial.addEventListener("pointerdown",function(e){dragD=true;try{dial.setPointerCapture(e.pointerId)}catch(_){}fromPt(e);dial.focus({preventScroll:true})});
  dial.addEventListener("pointermove",function(e){if(dragD)fromPt(e)});
  dial.addEventListener("pointerup",function(){dragD=false});dial.addEventListener("pointercancel",function(){dragD=false});
  dial.addEventListener("keydown",function(e){var v=+dial.getAttribute("aria-valuenow"),k=e.key,nv=v;
    if(k==="ArrowRight"||k==="ArrowUp")nv=v+1;else if(k==="ArrowLeft"||k==="ArrowDown")nv=v-1;else if(k==="Home")nv=60;else if(k==="End")nv=85;else return;
    e.preventDefault();setT(nv)});
  setT(72);
}
var rr=document.getElementById("rr");
if(rr){
  var low=+rr.getAttribute("data-low"),q=document.getElementById("rr-quote"),ro=document.getElementById("rr-out");
  var calc=function(){
    var v=parseFloat(q.value);
    if(!(v>0)){ro.textContent="Type your repair quote.";return}
    var age=+(rr.querySelector("input[name=rr-age]:checked")||{value:1}).value,ratio=v/low;
    var money="$"+low.toLocaleString("en-US");
    ro.textContent=(ratio>=0.5||(age===2&&ratio>=0.3))
      ?"Worth pricing a new system. This repair is a big share of a new system, which starts at "+money+" here."
      :"A repair may make sense. A new system starts at "+money+" here.";
  };
  q.addEventListener("input",calc);[].slice.call(rr.querySelectorAll("input[name=rr-age]")).forEach(function(i){i.addEventListener("change",calc)});
  calc();
}

/* 4. price estimator: shows only ranges the owner typed */
var dataEl=document.getElementById("est-data");
if(dataEl){
  var cells=JSON.parse(dataEl.textContent);
  var sizeIn=[].slice.call(document.querySelectorAll("input[name=est-size]"));
  var optIn=[].slice.call(document.querySelectorAll("input[name=est-opt]"));
  var out=document.getElementById("est-num");
  var show=function(){
    var sz=sizeIn.filter(function(i){return i.checked})[0];
    var row=cells[sz.value]||{},first=null;
    optIn.forEach(function(o){o.disabled=!row[o.value];if(!o.disabled&&!first)first=o});
    var cur=optIn.filter(function(o){return o.checked&&!o.disabled})[0];
    if(!cur&&first){first.checked=true;cur=first}
    out.textContent=cur?row[cur.value]:"";
  };
  sizeIn.concat(optIn).forEach(function(i){i.addEventListener("change",show)});
  show();
}

/* the rest fades in on scroll */
if(!("IntersectionObserver" in window)||reduce)return;
var els=[].slice.call(document.querySelectorAll(".rv"));
els.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add("in")});
root.classList.add("cine-reveal");
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
els.forEach(function(el){if(!el.classList.contains("in"))io.observe(el)});
})();`;

export function generateCinematic(form, d, deps) {
  const { CINE_KIT, cineLook, placeholderArt } = deps;
  const kit = CINE_KIT[d.tradeKey];
  const th = THEMES[d.themeKey];
  const look = cineLook(d.themeKey);
  const t = d.trade;
  const cine = (form && form.cine) || {};
  const images = cine.images || {};
  const tradeName = t.label.replace(/ \(.*\)$/, "");
  const name = esc(d.company);
  const area = d.city ? esc(d.city) : "";
  const areaPhrase = area ? `${area} and nearby towns` : "your area and nearby towns";
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  const callHref = d.phone && d.phone.tel ? `tel:${esc(d.phone.tel)}` : "#contact";
  const callText = d.phone ? `Call ${phoneShow}` : "Call us";
  const callBtn = (cls) => `<a class="${cls}" href="${callHref}">${svgIcon(CINE_PHONE, 18)}<span>${callText}</span></a>`;
  const askLabel = d.freeEstimates ? "Get a free estimate" : "Ask for a price";

  // A slot's picture: the owner's, or labeled placeholder art drawn in code.
  const slotSrc = (id, label) => safeImage(images[id]) || placeholderArt(d.tradeKey, id, label);
  const slots = cineSlots(kit);
  const slotLabel = (id) => (slots.find((s) => s.id === id) || {}).label || id;
  const pic = (id, attrs = "") => `<img src="${esc(slotSrc(id, slotLabel(id)))}" alt="" ${attrs}>`;

  const story = kit.story || [];
  const styles = kit.styles || [];
  const ba = kit.beforeAfter;
  const prices = offeredPrices(kit, cine.prices);

  // 1. Scroll story
  const steps = story.map((s, i) => {
    const tag = i === 0 ? "h1" : "p";
    return `<div class="step" data-step="${i}"><div class="frame">${pic(s.id, i === 0 ? 'fetchpriority="high"' : 'loading="lazy"')}</div><div class="line"><${tag} class="h">${accentHtml(s.headline, s.accent)}</${tag}></div></div>`;
  }).join("");
  const storySec = `<section class="story" id="story" style="--n:${story.length}" aria-label="Intro">
  <div class="pin">${steps}
    <div class="story-cta"><p class="story-sub">${esc(t.sub)} ${name} serves ${areaPhrase}.</p>${callBtn("btn btn-accent")}<a class="btn btn-glass" href="${prices ? "#price" : "#contact"}">${askLabel}</a></div>
    <div class="prog" aria-hidden="true">${story.map(() => "<i></i>").join("")}</div>
    <span class="cue" aria-hidden="true">Scroll</span>
  </div>
</section>`;

  // 2. Pick your style
  const stylesSec = styles.length ? `<section class="sec" id="styles"><div class="wrap">
  <div class="sec-head rv"><span class="kicker">${esc(tradeName)}</span><h2>Pick your <em>style</em>.</h2></div>
  <div class="tabs" role="tablist" aria-label="Styles">${styles.map((s, i) => `<button class="tab" role="tab" type="button" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(s.name)}</button>`).join("")}</div>
  ${styles.map((s, i) => `<div class="panel rv" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}"${i ? " hidden" : ""}>${pic(s.id, 'loading="lazy"')}<div class="glass"><h3>${esc(s.name)}</h3><p>${esc(s.note)}</p><a class="btn btn-accent btn-sm" href="#contact">Ask about this style</a></div></div>`).join("")}
</div></section>` : "";

  // 3. Drag the line
  const baSec = ba ? `<section class="sec dark-sec" id="before-after"><div class="wrap">
  <div class="sec-head rv"><span class="kicker">${esc(baTags(d.tradeKey)[0])} to ${esc(baTags(d.tradeKey)[1]).toLowerCase()}</span><h2>${esc(ba.title || "Drag the line.")}</h2><p class="lede">${baTags(d.tradeKey)[2]}.</p></div>
  <div class="ba rv" id="ba">
    <img class="after" src="${esc(slotSrc("after", slotLabel("after")))}" alt="${esc(baTags(d.tradeKey)[1])}" loading="lazy">
    <img class="before" src="${esc(slotSrc("before", slotLabel("before")))}" alt="${esc(baTags(d.tradeKey)[0])}" loading="lazy">
    <span class="ba-tag l">${esc(baTags(d.tradeKey)[0])}</span><span class="ba-tag r">${esc(baTags(d.tradeKey)[1])}</span>
    <div class="ba-handle" role="slider" tabindex="0" aria-label="${esc(baTags(d.tradeKey)[0])} and ${esc(baTags(d.tradeKey)[1]).toLowerCase()}" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50 percent"><span class="ba-knob">${svgIcon('<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>', 22)}</span></div>
  </div>
</div></section>` : "";

  // 4. Price estimator: typed ranges only, hidden when there are none
  let priceSec = "";
  if (prices) {
    const est = kit.estimator;
    const first = prices.sizes[0];
    const firstOpt = prices.options.find((o) => prices.cells[first][o]);
    const radio = (group, label, checked) => `<label class="opt"><input type="radio" name="${group}" value="${esc(label)}"${checked ? " checked" : ""}><span>${esc(label)}</span></label>`;
    const list = prices.sizes.map((s) => prices.options.filter((o) => prices.cells[s][o]).map((o) => `<li><span>${esc(s)}, ${esc(o)}</span><strong>${esc(prices.cells[s][o])}</strong></li>`).join("")).join("");
    const json = JSON.stringify(prices.cells).replace(/</g, "\\u003c");
    priceSec = `<section class="sec" id="price"><div class="wrap">
  <div class="sec-head rv"><span class="kicker">Estimate</span><h2>Price it in <em>seconds</em>.</h2><p class="lede">Pick the size and the kind of job. These ranges come from ${name}.</p></div>
  <div class="est rv">
    <div class="est-ui">
      <fieldset><legend>${esc(est.sizeLabel || "Size")}</legend><div class="opts">${prices.sizes.map((s) => radio("est-size", s, s === first)).join("")}</div></fieldset>
      <fieldset><legend>${esc(est.optionLabel || "Option")}</legend><div class="opts">${prices.options.map((o) => radio("est-opt", o, o === firstOpt)).join("")}</div></fieldset>
    </div>
    <div>
      <div class="est-out" aria-live="polite"><p class="est-num" id="est-num">${esc(prices.cells[first][firstOpt])}</p><p class="est-unit">${esc(cineUnit(d.tradeKey, cine.unit))}</p><p class="est-note">An estimate, not a final price. The exact price comes after we look at the job.</p><a class="btn btn-accent" href="#contact" style="justify-self:start;margin-top:8px">${askLabel}</a></div>
      <ul class="est-list">${list}</ul>
    </div>
  </div>
  <script type="application/json" id="est-data">${json}</script>
</div></section>`;
  }

  // HVAC extras: a thermostat dial to play with, and a repair-or-replace check.
  // The only dollar figure used is the lowest range the owner typed (never invented).
  let hvacSec = "";
  if (d.tradeKey === "hvac") {
    const replaceLow = prices && prices.lows.length ? Math.min(...prices.lows) : null;
    hvacSec = `<section class="sec" id="comfort"><div class="wrap">
  <div class="sec-head rv"><span class="kicker">Comfort</span><h2>Dial it <em>in</em>.</h2></div>
  <div class="tools rv">
    <div class="dial-card"><div class="dial" id="dial" role="slider" tabindex="0" aria-label="Thermostat" aria-valuemin="60" aria-valuemax="85" aria-valuenow="72" aria-valuetext="72 degrees"><svg viewBox="0 0 200 200" aria-hidden="true"><path class="d-track" d="M 42 158 A 82 82 0 1 1 158 158"/><path class="d-arc" id="d-arc" d="M 42 158 A 82 82 0 1 1 158 158"/><circle class="d-knob" id="d-knob" r="9" cx="100" cy="100"/></svg><div class="d-read"><span id="d-val">72</span><small>&deg;F</small></div></div><p class="est-note" style="color:var(--muted)">Drag the dial or use the arrow keys. This is just for fun; it does not control anything.</p></div>
    ${replaceLow ? `<div class="rr" id="rr" data-low="${replaceLow}"><h3>Repair it or replace it?</h3>
      <fieldset class="opts"><legend>How old is your system?</legend>${["Under 8 years", "8 to 12 years", "Over 12 years"].map((a, i) => `<label class="opt"><input type="radio" name="rr-age" value="${i}"${i === 1 ? " checked" : ""}><span>${a}</span></label>`).join("")}</fieldset>
      <label for="rr-quote">What was the repair quote? ($)<input type="number" id="rr-quote" inputmode="numeric" min="0" step="1" placeholder="Like 1200"></label>
      <p class="rr-out" id="rr-out" aria-live="polite">Type your repair quote.</p>
      <p class="est-note" style="color:var(--muted)">A rule of thumb, not advice. We will look at your system and tell you straight.</p></div>` : ""}
  </div>
</div></section>`;
  }

  // 5. Cream sections: services, reviews, call and contact form
  const services = `<section class="sec" id="services"><div class="wrap">
  <div class="sec-head rv"><span class="kicker">Services</span><h2>What we <em>do</em>.</h2><p class="lede">Here is what ${name} does${area ? ` in ${area}` : ""}. Do not see your job? Just ask.</p></div>
  <ul class="svcs">${d.services.map(([n, desc]) => `<li class="rv"><h3>${esc(n)}</h3><p>${esc(desc)}</p></li>`).join("")}</ul>
</div></section>`;
  const starRow = (fill, size) => Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="left:${i * (size + 4)}px" fill="${fill}" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`).join("");
  const reviews = d.rating ? `<section class="sec" id="reviews" style="padding-top:0"><div class="wrap">
  <div class="sec-head rv"><h2>What customers <em>say</em>.</h2></div>
  <div class="rating rv"><span class="rating-num">${d.rating.toFixed(1)}</span><span><span class="stars" style="width:${5 * 26 + 16}px;height:26px" role="img" aria-label="${d.rating} out of 5 stars"><span class="stars-row off">${starRow("currentColor", 26)}</span><span class="stars-row" style="width:${(Math.max(0, Math.min(1, d.rating / 5)) * (5 * 26 + 16)).toFixed(1)}px">${starRow("currentColor", 26)}</span></span><span class="rating-sub">${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</span></span></div>
  <p class="rev-note rv"><strong>Real reviews go here.</strong> Customer reviews from ${name}'s Google profile get added when the site goes live.</p>
</div></section>` : "";
  const options = d.services.map(([n]) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";
  const contact = `<section class="sec final" id="contact"><div class="wrap grid">
  <div class="head rv">
    <h2>${d.freeEstimates ? "Get your free <em>estimate</em>" : "Ask for a <em>price</em>"}</h2>
    <p class="lede">Call now, or send the form and we will call you back.</p>
    ${d.phone ? `<a class="big-phone" href="${callHref}">${phoneShow}</a>` : `<p class="big-phone">Phone number here</p>`}
  </div>
  <form id="ask" class="body rv" novalidate>
    <label for="f-name">Your name<input type="text" id="f-name" name="name" autocomplete="name"></label>
    <label for="f-phone">Phone<input type="tel" id="f-phone" name="phone" autocomplete="tel"></label>
    <label for="f-job">What do you need?<select id="f-job" name="job">${options}</select></label>
    <label for="f-msg">Tell us about the job<textarea id="f-msg" name="message"></textarea></label>
    <button class="btn btn-accent" type="submit">Send request</button>
    <p class="form-note" id="f-note" aria-live="polite">We will call you back.</p>
  </form>
</div></section>`;

  const nav = [
    styles.length && ["#styles", "Styles"], hvacSec && ["#comfort", "Comfort"], ba && ["#before-after", "Before and after"],
    prices && ["#price", "Price"], ["#services", "Services"], ["#contact", "Contact"],
  ].filter(Boolean).map(([h, l]) => `<a href="${h}">${l}</a>`).join("");

  const fonts = look && look.fontsHref ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(look.fontsHref)}">` : "";

  return `<!doctype html>
<html lang="en" class="cine-no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name}${area ? ` | ${esc(tradeName)} in ${area}` : ` | ${esc(tradeName)}`}</title>
<meta name="description" content="${name} is a ${esc(t.noun)} serving ${areaPhrase}. ${esc(t.sub)}">
<meta name="theme-color" content="${th.dark}">
${fonts}
<style>
:root{--dark:${th.dark};--dark2:${th.dark2};--accent:${th.accent};--accent-ink:${th.accentInk};--hi:${th.hi};--ink:${th.ink};--muted:${th.muted}}
${ENGINE_CSS}
${look && look.css ? look.css : ""}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="#top">${name}</a>
  <nav class="nav" aria-label="Sections">${nav}</nav>
  ${callBtn("btn btn-accent btn-sm")}
</div></header>
<main id="top">
${storySec}
${stylesSec}
${hvacSec}
${baSec}
${priceSec}
${services}
${reviews}
${contact}
</main>
<footer><div class="wrap"><div><p class="foot-name">${name}</p><p>${esc(tradeName)}${area ? ` in ${area}` : ""}</p></div><p>&copy; ${esc(d.year)} ${name} &middot; Sample site</p></div></footer>
<div class="mobile-call">${callBtn("btn btn-accent")}</div>
<script>
${ENGINE_JS}
</script>
</body>
</html>
`;
}
