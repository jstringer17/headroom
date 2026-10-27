// Sample Site Maker: Editorial look.
// generateEditorial(form, d, deps) builds one self-contained HTML page in a
// calm magazine style: cream paper, a huge serif, rounded photo cards, a hero
// picture cut to a simple silhouette, sample project cards, large numbered
// service rows that swap a picture, and a trust strip with only the facts the
// owner ticked or typed. Same rules as cinematic.js: no invented prices,
// reviews, claims or work photos; empty picture slots show labeled placeholder
// art; the "Sample site" label stays.
//
// form.look = "editorial" (with form.cinematic on) picks this page.
// form.editorial = { projects: [{ name, where, job, type, time } x 3] }, all optional.
// form.cine.images / form.cine.prices / form.cine.unit work as in cinematic mode.
// deps = { CINE_KIT, cineLook, placeholderArt, editorialLook? (optional), editorialShape? (optional) }
import { esc, safeImage } from "./generate.js";
import { THEMES } from "./themes.js";
import { cineSlots, cineUnit, offeredPrices } from "./cinematic.js";
import { editorialLook, editorialShape } from "./cine-look.js";

// Simple silhouettes for the hero picture, as CSS polygon() points in percent.
const ED_SHAPES = {
  house: "polygon(0% 100%, 0% 42%, 50% 2%, 100% 42%, 100% 100%)",
  picket: (() => {
    const n = 7, pts = ["0% 100%"];
    for (let i = 0; i < n; i++) { const a = (i / n) * 100, b = ((i + 1) / n) * 100, m = (a + b) / 2; pts.push(`${(a + 0.8).toFixed(1)}% 22%`, `${m.toFixed(1)}% 2%`, `${(b - 0.8).toFixed(1)}% 22%`); }
    pts.push("100% 100%");
    return `polygon(${pts.join(", ")})`;
  })(),
  drop: "polygon(50% 0%, 62% 16%, 76% 34%, 88% 54%, 94% 70%, 90% 86%, 78% 97%, 62% 100%, 38% 100%, 22% 97%, 10% 86%, 6% 70%, 12% 54%, 24% 34%, 38% 16%)",
  arch: "inset(0 round 46% 46% 0 0)",
  tree: "polygon(50% 0%, 66% 22%, 58% 22%, 76% 46%, 64% 46%, 86% 74%, 56% 74%, 56% 100%, 44% 100%, 44% 74%, 14% 74%, 36% 46%, 24% 46%, 42% 22%, 34% 22%)",
};
const ED_SHAPE_FOR = {
  fencing: "picket", pressure: "drop", plumbing: "drop", cleaning: "drop", restoration: "drop",
  hvac: "arch", garage: "arch", tree: "tree", landscaping: "tree",
};

const ED_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';
const ED_ICONS = {
  insured: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  estimate: '<path d="M4 7h16v10H4z"/><path d="M4 11h16M8 15h3"/>',
  hours: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
  years: '<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
  rating: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  area: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
};
const edIcon = (inner, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

const ED_NAMES = ["Maple Lane", "Cedar Court", "Ridge Road"];
const edPad = (n) => String(n).padStart(2, "0");
// Headline with its one italic accent word (cine-art copy rule).
const edAccent = (text, accent) => {
  const i = accent ? String(text).indexOf(accent) : -1;
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i))}<em>${esc(accent)}</em>${esc(text.slice(i + accent.length))}`;
};

const ED_CSS = `
:root{--ed-serif:"Bodoni Moda","Playfair Display","Didot",Georgia,serif;--ed-sans:"Manrope",system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;--ed-cream:#ece5dc;--ed-cream2:#e2d9cd;--ed-paper:#f5f0e8;--ed-ink:#161412;--ed-muted:#5d564d;--ed-line:rgba(22,20,18,.2);--ed-card:24px;--ed-dark:#14110f;--ed-ease:cubic-bezier(.23,1,.32,1);--ed-max:1240px;--ed-nav:64px;color-scheme:light}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:84px}
section[id]{scroll-margin-top:84px}
body{margin:0;background:var(--ed-cream);color:var(--ed-ink);font:400 17px/1.6 var(--ed-sans);overflow-x:clip}
h1,h2,h3,h4,p,dl,dd,dt,figure,ul,ol{margin:0}
ul,ol{padding:0;list-style:none}
a{color:inherit;text-underline-offset:4px}
img,svg{max-width:100%}
.ed-wrap{max-width:var(--ed-max);margin:0 auto;padding-inline:max(20px,env(safe-area-inset-left,0px)) max(20px,env(safe-area-inset-right,0px))}
.ed h1,.ed h2,.ed .ed-big{font-family:var(--ed-serif);font-weight:500;letter-spacing:-.02em;line-height:.98;text-wrap:balance}
a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible+span,.ed-row:focus-visible{outline:3px solid var(--ed-accent);outline-offset:3px;border-radius:6px}
.ed-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:0 24px;border:0;border-radius:999px;font:600 15px/1 var(--ed-sans);text-decoration:none;cursor:pointer;background:var(--ed-ink);color:var(--ed-cream);transition:transform .16s var(--ed-ease),opacity .25s}
@media (hover:hover){.ed-btn:hover{transform:translateY(-2px)}}
.ed-btn:active{transform:scale(.97)}
.ed-btn.light{background:var(--ed-cream);color:var(--ed-ink)}
.ed-btn.ghost{background:transparent;color:var(--ed-ink);box-shadow:inset 0 0 0 1.5px var(--ed-ink)}
.ed-btn.sm{min-height:42px;padding:0 18px;font-size:14px}
.ed-link{font-weight:600;font-size:15px}
.ed-eyebrow{display:flex;align-items:center;gap:14px;font:600 12px/1.3 var(--ed-sans);letter-spacing:.2em;text-transform:uppercase;color:var(--ed-accent)}
.ed-eyebrow::before{content:"";flex:none;width:36px;height:1.5px;background:currentColor}
/* nav */
.ed-nav{position:sticky;top:0;z-index:40;height:var(--ed-nav);background:rgba(236,229,220,.78);-webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);border-bottom:1px solid var(--ed-line)}
.ed-nav .ed-wrap{display:flex;align-items:center;gap:14px;height:100%}
.ed-logo{font:600 22px/1 var(--ed-serif);letter-spacing:-.01em;color:var(--ed-accent);text-decoration:none;min-width:0;display:flex;align-items:center;gap:8px;margin-right:auto;flex:1 1 auto}
.ed-logo-t{min-width:0;overflow-wrap:anywhere;line-height:1.05;font-size:clamp(15px,4.4vw,22px);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ed-mark{flex:none}
.ed-nav .ed-wrap{gap:10px}
.ed-nav .ed-pill{font-size:10px;padding:5px 9px;letter-spacing:.1em;flex:none}
.ed-nav .ed-call{margin-left:auto}
.ed-pill{display:inline-flex;align-items:center;padding:6px 12px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ed-line);font:600 11px/1 var(--ed-sans);letter-spacing:.14em;text-transform:uppercase;white-space:nowrap}
.ed-links{display:none;gap:26px;font-size:15px;font-weight:500}
.ed-links a{text-decoration:none;color:var(--ed-muted)}
@media (hover:hover){.ed-links a:hover{color:var(--ed-ink)}}
.ed-nav .ed-tel,.ed-nav .ed-btn{display:none}
.ed-call{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--ed-ink);color:var(--ed-cream);flex:none}
/* hero */
.ed-hero{padding-block:18px 44px}
.ed-hero-grid{display:grid;gap:36px}
.ed-hero h1{margin-top:12px;font-size:clamp(40px,11.5vw,132px);text-transform:uppercase;line-height:.92}
.ed-sub{display:none;margin-top:16px;max-width:38ch;color:var(--ed-muted);font-size:18px}
.ed-cta{display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px;margin-top:20px}
.ed-sil{position:relative;aspect-ratio:4/3;background:var(--ed-dark);overflow:hidden;clip-path:var(--ed-clip,polygon(0% 100%,0% 42%,50% 2%,100% 42%,100% 100%))}
.ed-sil img,.ed-beat img,.ed-card img,.ed-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 6%;display:block}
.ed-sil img[data-real],.ed-card img[data-real],.ed-pic img[data-real],.ed-row-pic img[data-real],.ed-process-pic img[data-real]{object-position:72% 45%}
.ed-beat img[data-real]{object-position:85% 50%}
.ed-sil.ph img{inset:auto 0 0 0;height:82%}
/* trust strip */
.ed-trust{padding-block:0 56px}
.ed-trust ul{display:grid;grid-template-columns:1fr;border:1.5px solid var(--ed-line);border-radius:var(--ed-card);overflow:hidden;background:var(--ed-paper)}
.ed-trust li{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto 1fr;align-content:start;align-items:start;gap:4px 14px;padding:20px 22px;border-top:1px solid var(--ed-line)}
.ed-trust li:first-child{border-top:0}
.ed-trust svg{grid-row:1/3;margin-top:3px;color:var(--ed-accent)}
.ed-trust b{font-weight:700;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ed-trust p{color:var(--ed-muted);font-size:15px;line-height:1.45}
/* second beat */
.ed-beat{position:relative;min-height:78vh;min-height:78svh;display:flex;align-items:flex-end;overflow:hidden;background:var(--ed-dark);color:#fff;isolation:isolate}
.ed-beat::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,rgba(0,0,0,.72),rgba(0,0,0,.18) 60%,rgba(0,0,0,.3))}
.ed-beat .ed-wrap{width:100%;display:grid;gap:22px;padding-block:56px}
.ed-beat .ed-big{font-size:clamp(40px,11vw,128px);max-width:11ch;text-shadow:0 2px 26px rgba(0,0,0,.35)}
.ed-beat p{max-width:36ch;color:rgba(255,255,255,.9);font-size:17px}
.ed-beat .ed-big em,.ed-hero h1 em{font-style:italic}
/* work */
.ed-sec{padding-block:72px}
.ed-sec h2{font-size:clamp(40px,8vw,88px);text-transform:uppercase}
.ed-head{display:grid;gap:14px;margin-bottom:36px}
.ed-note{color:var(--ed-muted);font-size:15px;max-width:52ch}
.ed-cards{display:grid;gap:28px}
.ed-card{position:relative;border-radius:var(--ed-card);overflow:hidden;background:var(--ed-dark);color:#fff;aspect-ratio:4/5;isolation:isolate}
.ed-card::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(0deg,rgba(0,0,0,.6),rgba(0,0,0,0) 55%)}
.ed-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.ed-card h3{position:absolute;left:20px;right:20px;bottom:18px;z-index:2;font:500 clamp(40px,10vw,84px)/.95 var(--ed-serif);letter-spacing:-.02em;text-transform:uppercase;overflow-wrap:anywhere}
.ed-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0 18px;margin-top:14px}
.ed-meta div{padding:12px 0;border-top:1px solid var(--ed-line)}
.ed-meta dt{font:600 11px/1.2 var(--ed-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--ed-muted)}
.ed-meta dd{margin-top:5px;font-weight:600;font-size:15px;line-height:1.35;overflow-wrap:anywhere}
.ed-work-note{margin-top:30px;font-size:14px;color:var(--ed-muted)}
/* services */
.ed-dark{background:var(--ed-dark);color:var(--ed-cream)}
.ed-dark .ed-eyebrow{color:var(--ed-hi,var(--ed-accent))}
.ed-svc{display:grid;gap:20px;align-items:start}
.ed-rows{border-top:1px solid rgba(236,229,220,.25)}
.ed-row{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid rgba(236,229,220,.25);padding:18px 0;color:inherit;font:inherit;cursor:pointer}
.ed-row-top{display:flex;align-items:baseline;gap:16px}
.ed-row-n{font:600 13px/1 var(--ed-sans);letter-spacing:.12em;color:rgba(236,229,220,.6);font-variant-numeric:tabular-nums}
.ed-row-name{font:500 clamp(30px,7vw,52px)/1.02 var(--ed-serif);letter-spacing:-.015em;opacity:.55;transition:opacity .25s}
.ed-row[aria-expanded=true] .ed-row-name{opacity:1}
@media (hover:hover){.ed-row:hover .ed-row-name{opacity:1}}
.ed-row-body{display:none;margin:12px 0 4px 40px;max-width:44ch;color:rgba(236,229,220,.82)}
.ed-row[aria-expanded=true] .ed-row-body{display:block}
.ed-no-js .ed-row-body{display:block}
.ed-pic{display:none;position:sticky;top:104px;border-radius:var(--ed-card);overflow:hidden;aspect-ratio:4/5;background:#000}
.ed-row-pic{display:none;position:relative;margin:14px 0 6px 40px;border-radius:16px;overflow:hidden;aspect-ratio:16/10;background:#000}
.ed-row-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 6%;display:block}
.ed-row[aria-expanded=true] .ed-row-pic{display:block}
.ed-pic img{transition:opacity .16s var(--ed-ease)}
.ed-pic img.swap{opacity:0}
/* process, estimate, contact */
.ed-process{display:grid;gap:32px}
.ed-process-pic{position:relative;border-radius:var(--ed-card);overflow:hidden;aspect-ratio:4/3;background:var(--ed-dark)}
.ed-process-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 6%;display:block}
.ed-steps{display:grid;gap:22px;margin-top:8px}
.ed-steps li{padding-top:14px;border-top:1.5px solid var(--ed-ink)}
.ed-steps b{display:block;font:500 40px/1 var(--ed-serif);margin-bottom:10px;color:var(--ed-accent)}
.ed-steps h3{font:700 20px/1.25 var(--ed-sans)}
.ed-steps p{margin-top:6px;color:var(--ed-muted);max-width:32ch}
.ed-est{display:grid;gap:26px}
.ed-est fieldset{border:0;margin:0;padding:0;min-width:0}
.ed-est legend{padding:0;margin-bottom:10px;font:600 12px/1 var(--ed-sans);letter-spacing:.16em;text-transform:uppercase;color:var(--ed-muted)}
.ed-opts{display:flex;flex-wrap:wrap;gap:8px}
.ed-opt{position:relative}
.ed-opt input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.ed-opt span{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:999px;box-shadow:inset 0 0 0 1.5px var(--ed-ink);font:600 15px/1.2 var(--ed-sans)}
.ed-opt input:checked+span{background:var(--ed-ink);color:var(--ed-cream)}
.ed-opt input:disabled+span{opacity:.35}
.ed-out{background:var(--ed-dark);color:var(--ed-cream);border-radius:var(--ed-card);padding:28px 24px;display:grid;gap:8px;align-content:center}
.ed-num{font:500 clamp(36px,9vw,64px)/1.05 var(--ed-serif);letter-spacing:-.02em;overflow-wrap:anywhere}
.ed-unit,.ed-out .ed-note{color:rgba(236,229,220,.78)}
.ed-out .ed-btn{justify-self:start;margin-top:8px}
.ed-list{display:grid;gap:8px}
.ed-list li{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--ed-line)}
.js .ed-list{display:none}
.ed-est-ui{display:none}
.js .ed-est-ui{display:grid;gap:26px}
.ed-rev{display:grid;gap:10px 28px;justify-items:start;align-items:center;border:1.5px solid var(--ed-line);border-radius:var(--ed-card);padding:24px 26px;background:var(--ed-paper)}
.ed-stars{position:relative;display:block;width:146px;height:26px;color:var(--ed-accent)}
.ed-stars-row{position:absolute;inset:0 auto 0 0;overflow:hidden;white-space:nowrap;height:100%}
.ed-stars-row svg{position:absolute;top:0}
.ed-stars-row.off{color:var(--ed-line);width:100%}
.ed-rev b{font:500 clamp(64px,16vw,110px)/.85 var(--ed-serif);font-variant-numeric:tabular-nums}
.ed-final{background:var(--ed-ink);color:var(--ed-cream)}
.ed-final .ed-grid{display:grid;gap:34px}
.ed-final h2{font-size:clamp(44px,9vw,104px)}
.ed-phone{display:inline-block;max-width:100%;margin-top:22px;font:500 clamp(26px,7vw,64px)/1.05 var(--ed-serif);color:var(--ed-hi,var(--ed-cream));text-decoration:none;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.ed-final .ed-note{color:rgba(236,229,220,.75);margin-top:14px}
.ed-form{display:grid;gap:16px;align-content:start;background:var(--ed-cream);color:var(--ed-ink);border-radius:var(--ed-card);padding:24px}
.ed-form label{display:grid;gap:6px;font-size:14px;font-weight:700}
.ed-form input,.ed-form select,.ed-form textarea{width:100%;font:400 17px/1.4 var(--ed-sans);color:var(--ed-ink);background:#fff;border:1.5px solid #a79f8c;border-radius:12px;padding:13px 14px}
.ed-form textarea{min-height:100px;resize:vertical}
.ed-form input:focus,.ed-form select:focus,.ed-form textarea:focus{outline:none;border-color:var(--ed-ink);box-shadow:0 0 0 3px var(--ed-accent)}
.ed-form-note{font-size:14px;color:var(--ed-muted)}
.ed-foot{background:var(--ed-dark);color:rgba(236,229,220,.75);font-size:14px}
.ed-foot .ed-wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 24px;padding-block:32px calc(104px + env(safe-area-inset-bottom,0px))}
.ed-foot b{font:500 22px/1.2 var(--ed-serif);color:var(--ed-cream)}
@media (prefers-reduced-motion:no-preference){
  .ed-rise .ed-rv{transition:opacity .9s var(--ed-ease),transform .9s var(--ed-ease)}
  .ed-rise .ed-rv:not(.in){opacity:0;transform:translateY(22px)}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.ed-btn,.ed-pic img,.ed-row-name{transition:none}}
@media (min-width:760px){
  .ed-meta{grid-template-columns:repeat(var(--n,3),minmax(0,1fr))!important}
  #price{padding-bottom:48px}
  .ed-rev{grid-template-columns:auto 1fr auto;gap:12px 40px;padding:28px 36px}
  .ed-rev .ed-stars{justify-self:end}
  .ed-rev-text{display:grid;gap:4px;align-content:center}
  .ed-phone{white-space:nowrap;font-size:clamp(36px,5vw,64px)}
  .ed-sub{display:block}
  .ed-sec{padding-block:112px}
  .ed-trust ul{grid-template-columns:repeat(var(--cols,4),1fr)}
  .ed-trust li{border-top:0;border-left:1px solid var(--ed-line);padding:24px}
  .ed-trust li:first-child{border-left:0}
  .ed-cards{grid-template-columns:repeat(3,1fr);gap:22px}
  .ed-card{aspect-ratio:3/4}
  .ed-steps{grid-template-columns:1fr 1fr;gap:28px 32px}
  .ed-est{grid-template-columns:1.1fr 1fr;gap:56px;align-items:start}
  .ed-beat .ed-wrap{grid-template-columns:1.2fr 1fr;align-items:end}
  .ed-beat p{justify-self:end;text-align:left}
  .ed-final .ed-grid{grid-template-columns:1.1fr 1fr;gap:56px;align-items:start}
}
@media (min-width:1024px){
  .ed-sil{aspect-ratio:1/1}
  .ed-foot .ed-wrap{padding-block:32px}
  .ed-process{grid-template-columns:1fr 1.15fr;gap:64px;align-items:center}
  .ed-process-pic{aspect-ratio:4/5}
  body{padding-bottom:0}
  .ed-call{display:none}
  .ed-links{display:flex;margin-left:auto}
  .ed-nav .ed-wrap{gap:20px}
  .ed-logo{flex:0 1 auto;margin-right:0}
  .ed-nav .ed-tel{display:inline;font-weight:600;font-size:14px;text-decoration:none;white-space:nowrap}
  .ed-links{gap:18px;font-size:14px}
  .ed-nav .ed-wrap{gap:16px}
  .ed-nav .ed-btn{display:inline-flex}
  .ed-hero{padding-block:64px 88px}
  .ed-hero-grid{grid-template-columns:1.25fr 1fr;align-items:center;gap:48px}
  .ed-svc{grid-template-columns:1.1fr 1fr;gap:64px;align-items:start}
  .ed-rows{grid-column:1;grid-row:1}
  .ed-pic{display:block;grid-column:2;grid-row:1}
  .ed-row-pic{display:none!important}
}
`;

const ED_JS = `(function(){
var root=document.documentElement;root.classList.add("js");root.classList.remove("ed-no-js");
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();document.getElementById("f-note").textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});
/* picture lookup: every picture is in the page once, copies are filled in from it */
var lib={},realMap={};
function scan(r){[].slice.call(r.querySelectorAll("img[data-slot]")).forEach(function(im){var k=im.getAttribute("data-slot"),sr=im.getAttribute("src");if(sr&&sr.indexOf("R0lGODlhAQABAAAAACH5")<0&&!lib[k]){lib[k]=sr;realMap[k]=im.hasAttribute("data-real")}})}
scan(document);var tp=document.getElementById("ed-pool");if(tp&&tp.content)scan(tp.content);
[].slice.call(document.querySelectorAll("img[data-slot]")).forEach(function(im){var sr=im.getAttribute("src");if(sr&&sr.indexOf("R0lGODlhAQABAAAAACH5")>=0&&lib[im.getAttribute("data-slot")])im.src=lib[im.getAttribute("data-slot")]});
/* service rows: hover, focus or tap opens a row and swaps the picture */
var rows=[].slice.call(document.querySelectorAll(".ed-row")),rimg=document.querySelector("[data-ed=row-img]"),swapT=0;
function open(i){
  rows.forEach(function(r,j){r.setAttribute("aria-expanded",j===i?"true":"false")});
  var id=rows[i].getAttribute("data-pic");
  if(rimg&&lib[id]&&rimg.getAttribute("data-slot")!==id){
    rimg.setAttribute("data-slot",id);if(realMap[id])rimg.setAttribute("data-real","1");else rimg.removeAttribute("data-real");clearTimeout(swapT);
    if(reduce){rimg.src=lib[id];rimg.classList.remove("swap")}
    else{rimg.classList.add("swap");swapT=setTimeout(function(){rimg.src=lib[id];rimg.classList.remove("swap")},110)}
  }
}
if(rows.length){
  rows.forEach(function(r,i){
    r.addEventListener("click",function(){open(i)});
    r.addEventListener("mouseenter",function(){if(matchMedia("(hover:hover)").matches)open(i)});
    r.addEventListener("focus",function(){open(i)});
    r.addEventListener("keydown",function(e){
      var k=e.key,to=-1;
      if(k==="ArrowDown")to=Math.min(i+1,rows.length-1);else if(k==="ArrowUp")to=Math.max(i-1,0);else if(k==="Home")to=0;else if(k==="End")to=rows.length-1;
      if(to>=0){e.preventDefault();rows[to].focus()}
    });
  });
}
/* price estimator: only the ranges the owner typed */
var dataEl=document.getElementById("est-data");
if(dataEl){
  var cells=JSON.parse(dataEl.textContent);
  var sizeIn=[].slice.call(document.querySelectorAll("input[name=est-size]"));
  var optIn=[].slice.call(document.querySelectorAll("input[name=est-opt]"));
  var out=document.getElementById("est-num");
  var show=function(){
    var sz=sizeIn.filter(function(i){return i.checked})[0],row=cells[sz.value]||{},first=null;
    optIn.forEach(function(o){o.disabled=!row[o.value];if(!o.disabled&&!first)first=o});
    var cur=optIn.filter(function(o){return o.checked&&!o.disabled})[0];
    if(!cur&&first){first.checked=true;cur=first}
    var nv=cur?row[cur.value]:"";
    if(out.textContent!==nv){out.textContent=nv;if(!reduce&&out.animate)out.animate([{opacity:.35,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:180,easing:"cubic-bezier(.23,1,.32,1)"})}
  };
  sizeIn.concat(optIn).forEach(function(i){i.addEventListener("change",show)});show();
}
/* the floating call button shows after the hero buttons scroll away */
var cta=document.getElementById("ed-cta");function past(){root.classList.toggle("past",cta.getBoundingClientRect().bottom<0)}addEventListener("scroll",past,{passive:true});past();
/* and hides while the form or the estimator is on screen */
if("IntersectionObserver" in window){var seen={};var io0=new IntersectionObserver(function(es){es.forEach(function(e){seen[e.target.id]=e.isIntersecting});root.classList.toggle("nocall",Object.keys(seen).some(function(k){return seen[k]}))});["price","contact","work","services","trust"].forEach(function(id){var el=document.getElementById(id);if(el)io0.observe(el)})}
if(!("IntersectionObserver" in window)||reduce)return;
var els=[].slice.call(document.querySelectorAll(".ed-rv"));
els.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add("in")});
root.classList.add("ed-rise");
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
els.forEach(function(el){if(!el.classList.contains("in"))io.observe(el)});
})();`;

// Letters-only text typed by the owner, trimmed and capped.
const edText = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function generateEditorial(form, d, deps) {
  const { CINE_KIT, placeholderArt } = deps;
  const kit = CINE_KIT[d.tradeKey];
  const th = THEMES[d.themeKey];
  const t = d.trade;
  const cine = (form && form.cine) || {};
  const images = cine.images || {};
  const typed = (form && form.editorial && Array.isArray(form.editorial.projects)) ? form.editorial.projects : [];
  const tradeName = t.label.replace(/ \(.*\)$/, "");
  const name = esc(d.company);
  const area = d.city ? esc(d.city) : "";
  const areaPhrase = area ? `${area} and nearby towns` : "your area and nearby towns";
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  const callHref = d.phone && d.phone.tel ? `tel:${esc(d.phone.tel)}` : "#contact";
  const callText = d.phone ? `Call ${phoneShow}` : "Request a call";
  const askLabel = d.freeEstimates ? "Get a free estimate" : "Ask for a price";
  const prices = offeredPrices(kit, cine.prices);

  const slots = cineSlots(kit);
  // Optional service pictures (kit.editorial.extra) behave like slots here.
  const extras = (kit.editorial && kit.editorial.extra) || [];
  const slotLabel = (id) => (slots.find((s) => s.id === id) || extras.find((x) => x.id === id) || {}).label || id;
  // Once the owner has real photos, leftover drawn placeholders switch to a quieter style.
  const anyReal = Object.values(images).some((v) => safeImage(v));
  const src = (id, o) => safeImage(images[id]) || placeholderArt(d.tradeKey, id, slotLabel(id), anyReal ? { ...(o || {}), quiet: true } : o);
  // An uploaded picture is large, so each one is written into the page once; later uses
  // carry only data-slot and the script copies the picture over (keeps the file small).
  const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  const written = new Set();
  const pic = (id, attrs = "", o) => {
    const big = /^data:image\/(jpeg|png|webp)/.test(src(id));
    const dupe = big && written.has(id);
    written.add(id);
    return `<img src="${dupe ? BLANK : esc(src(id, o))}" data-slot="${esc(id)}"${safeImage(images[id]) ? ' data-real="1"' : ""} alt="" ${attrs}>`;
  };

  const story = kit.story || [], styles = kit.styles || [];
  const exists = (id) => slots.some((s) => s.id === id) || extras.some((x) => x.id === id);
  const pool = [...styles.map((s) => s.id), ...story.map((s) => s.id)];
  const e = kit.editorial || {};
  const pick = (id, fb) => (id && exists(id) ? id : fb);
  // The owner's own pictures come first: hero, second beat, process, then they cycle through the
  // work cards and service rows before any drawing is used (never the same picture on neighbours).
  const isUp = (id) => !!safeImage(images[id]);
  const ups = slots.map((x) => x.id).filter(isUp);
  const upStory = story.map((x) => x.id).filter(isUp);
  let heroId = pick(e.hero, story.length ? story[story.length - 1].id : pool[0]);
  let beatId = pick(e.beat, styles.length ? styles[0].id : pool[0]);
  let processId = pick(e.process, story.length > 1 ? story[1].id : pool[0]);
  let workIds = [0, 1, 2].map((i) => pick(e.work && e.work[i], pool[i % pool.length]));
  let svcFromUps = null;
  if (ups.length) {
    heroId = upStory.length ? upStory[upStory.length - 1] : ups[ups.length - 1];
    const others = ups.filter((id) => id !== heroId);
    if (others.length) beatId = others[others.length - 1];
    const rest = others.filter((id) => id !== beatId);
    processId = rest.length ? rest[rest.length - 1] : (others.length ? others[0] : heroId);
    let order = ups.slice();
    if (order.length > 1 && order[0] === heroId) order = [...order.slice(1), order[0]];
    workIds = workIds.map((fb, i) => (order.length >= 2 ? order[i % order.length] : i === 0 ? order[0] : fb));
    if (order.length >= 2) svcFromUps = order;
  }
  const rows = d.services.slice(0, 6);
  const svcPool = e.services && e.services.length ? e.services.filter(exists) : [...story.map((s) => s.id), ...styles.map((s) => s.id)];
  // A row gets the picture whose name shares words with the service ("Vinyl fences" -> "White vinyl");
  // with no shared word it gets the plain finished scene, never a picture of something else.
  const STOP = new Set(["and", "the", "for", "of", "a", "new", "repair", "repairs", "install", "installs", "service", "services", "work", "help", "your"]);
  const toks = (txt) => new Set(String(txt).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).map((w) => w.replace(/(es|s)$/, "")));
  const cand = [...styles.map((x) => ({ id: x.id, t: toks(`${x.name} ${x.note || ""}`) })), ...story.map((x) => ({ id: x.id, t: toks(x.headline) }))];
  const svcIds = rows.map(([n], i) => {
    if (svcFromUps) return svcFromUps[i % svcFromUps.length];
    if (e.rows && e.rows[n] && exists(e.rows[n])) return e.rows[n];
    if (e.services && e.services.length) return svcPool[i % svcPool.length];
    const want = toks(n);
    let best = null, bestScore = 0;
    for (const c of cand) { let sc = 0; want.forEach((w) => { if (c.t.has(w)) sc++; }); if (sc > bestScore) { best = c; bestScore = sc; } }
    return best ? best.id : null;
  });
  // Rows with no matching picture rotate through the trade's own scene frames, and two
  // neighbours never share a picture, so the swap is always visible.
  const scene = story.map((x) => x.id);
  let turn = 0;
  if (!svcFromUps && ups.length === 1) svcIds[0] = ups[0];
  for (let i = 0; i < svcIds.length; i++) {
    if (svcIds[i] && svcIds[i] !== svcIds[i - 1]) continue;
    let id = null;
    for (let k = 0; k < scene.length && !id; k++) { const c = scene[(turn + k) % scene.length]; if (c !== svcIds[i - 1] && c !== svcIds[i + 1]) id = c; }
    svcIds[i] = id || heroId; turn++;
  }

  const fam = (deps.editorialShape || editorialShape)(d.tradeKey) || ED_SHAPES[ED_SHAPE_FOR[d.tradeKey] || "house"];
  const shapeName = /50% 0%, 100% 40%/.test(fam) ? "house" : "other";
  const lookExtra = (deps.editorialLook || editorialLook)(d.themeKey, d.tradeKey) || {};
  const fontsHref = lookExtra.fontsHref || "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,700;1,6..96,500&family=Manrope:wght@400;500;600;700&display=swap";

  const heroWords = story.length ? story[story.length - 1] : { headline: t.headline, accent: "" };
  const eyebrow = `${esc(tradeName)}${area ? ` &middot; ${area}` : ""}`;

  // Hero
  const hero = `<section class="ed-hero" data-ed="hero" aria-label="Intro"><div class="ed-wrap ed-hero-grid">
  <div><p class="ed-eyebrow">${eyebrow}</p><h1>${e.headline ? edAccent(e.headline, e.accent) : esc(t.headline)}</h1>
    <p class="ed-sub">${esc(t.sub)} ${name} serves ${areaPhrase}.</p>
    <div class="ed-cta" id="ed-cta"><a class="ed-btn" href="${prices ? "#price" : "#contact"}">${askLabel}</a>${d.phone ? `<a class="ed-btn ghost" href="${callHref}" aria-label="${callText}">${phoneShow}</a>` : ""}</div></div>
  <div class="ed-sil${safeImage(images[heroId]) ? "" : " ph"}" data-shape="${shapeName}" style="--ed-clip:${fam}">${pic(heroId, 'fetchpriority="high"', { labelY: 560, hero: true })}</div>
</div></section>`;

  // Trust strip: only facts the owner ticked or typed
  const facts = [];
  if (d.insured) facts.push(["insured", "Insured", "Licensed and insured."]);
  if (d.freeEstimates) facts.push(["estimate", "Free estimates", "We look at the job and tell you the price first."]);
  if (d.emergency) facts.push(["hours", "Open 24/7", "Call any hour for emergencies."]);
  if (d.years) facts.push(["years", `${d.years} year${d.years === 1 ? "" : "s"}`, "In business."]);
  // The rating has its own block below, so it is not repeated here.
  if (area) facts.push(["area", "Service area", `${area} and nearby towns.`]);
  // Fewer than three real facts: add honest generic cells (the same promises the rest of the page makes).
  const generic = [
    ["estimate", "Price first", "We tell you the price before any work starts."],
    ["area", "Local", area ? `${area} and nearby towns.` : "Your area and nearby towns."],
    ["home", "Home or business", "Big jobs and small ones, just ask."],
  ];
  for (const g of generic) { if (facts.length >= 3) break; if (!facts.some((f) => f[0] === g[0])) facts.push(g); }
  const cells = facts.slice(0, 4);
  const trust = cells.length ? `<section class="ed-trust" id="trust" aria-label="At a glance"><div class="ed-wrap"><ul data-ed="trust" style="--cols:${cells.length}">${cells.map(([k, h, p]) => `<li class="ed-rv">${edIcon(ED_ICONS[k])}<b>${esc(h)}</b><p>${esc(p)}</p></li>`).join("")}</ul></div></section>` : "";

  // Second beat
  const beat = `<section class="ed-beat" data-ed="beat" aria-label="${esc(heroWords.headline)}">${pic(beatId)}<div class="ed-wrap">
  <p class="ed-big">${d.city ? `${esc(d.city.split(",")[0].trim())}<br><em>${esc(tradeName.toLowerCase())}</em>` : story.length > 1 ? edAccent(story[0].headline, story[0].accent) : esc(t.headline)}</p>
  <p class="ed-beat-note">${esc(e.beatNote || "Tell us what you have in mind and we will come and take a look.")}</p>
</div></section>`;

  // Work: three sample project cards
  const cards = workIds.map((id, i) => {
    const p = typed[i] || {};
    const st = styles[i % Math.max(styles.length, 1)];
    const nm = edText(p.name, 28) || ED_NAMES[i];
    const jobName = edText(p.job, 40) || (styles.find((x) => x.id === id) || {}).name || d.services[i % d.services.length][0];
    const meta = [
      ["Where", edText(p.where, 40) || d.city || "Local"],
      ["Job", jobName],
      ["Type", edText(p.type, 40) || tradeName],
    ];
    if (edText(p.time, 40)) meta.push(["Time", edText(p.time, 40)]);
    return `<li class="ed-rv"><article><div class="ed-card" data-ed="card">${pic(id)}<h3>${esc(nm)}</h3></div>
    <p class="ed-tags"><span class="ed-pill">Sample project</span><span class="ed-pill">${edPad(i + 1)} / 03</span></p>
    <dl class="ed-meta" style="--n:${meta.length}">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></article></li>`;
  }).join("");
  const work = `<section class="ed-sec" id="work" data-ed="work"><div class="ed-wrap">
  <div class="ed-head ed-rv"><p class="ed-eyebrow">Sample projects</p><h2>The <em>work</em></h2></div>
  <ul class="ed-cards">${cards}</ul>
  <p class="ed-work-note">Sample projects: names and homes are fictional.</p>
</div></section>`;

  // Services: large numbered rows, the open row swaps the picture
  const svcPics = rows.map((_, i) => svcIds[i]);
  const svc = `<section class="ed-sec ed-dark" id="services"><div class="ed-wrap">
  <div class="ed-head ed-rv"><p class="ed-eyebrow">Services</p><h2>What we <em>do</em></h2></div>
  <div class="ed-svc"><div class="ed-pic" aria-hidden="true">${pic(svcPics[0], 'data-ed="row-img"')}</div><div class="ed-rows" role="list">${rows.map(([n, desc], i) => `<button class="ed-row" data-ed="row" data-pic="${esc(svcPics[i])}" type="button" role="listitem" aria-expanded="${i === 0}"><span class="ed-row-top"><span class="ed-row-n">${edPad(i + 1)}</span><span class="ed-row-name">${esc(n)}</span></span><span class="ed-row-body">${esc(desc)}</span><span class="ed-row-pic" aria-hidden="true">${pic(svcPics[i])}</span></button>`).join("")}</div></div>
  <template id="ed-pool">${[...new Set(svcPics.slice(1))].map((id) => pic(id)).join("")}</template>
</div></section>`;

  // Estimate: typed ranges only, hidden when there are none
  let est = "";
  if (prices) {
    const e2 = kit.estimator;
    const first = prices.sizes[0];
    const firstOpt = prices.options.find((o) => prices.cells[first][o]);
    const radio = (g, label, on) => `<label class="ed-opt"><input type="radio" name="${g}" value="${esc(label)}"${on ? " checked" : ""}><span>${esc(label)}</span></label>`;
    const list = prices.sizes.map((s) => prices.options.filter((o) => prices.cells[s][o]).map((o) => `<li><span>${esc(s)}, ${esc(o)}</span><strong>${esc(prices.cells[s][o])}</strong></li>`).join("")).join("");
    est = `<section class="ed-sec" id="price"><div class="ed-wrap">
  <div class="ed-head ed-rv"><h2>Price it in <em>seconds</em></h2><p class="ed-note">Pick the size and the kind of job. These ranges come from ${name}.</p></div>
  <div class="ed-est ed-rv">
    <div class="ed-est-ui">
      <fieldset><legend>${esc(e2.sizeLabel || "Size")}</legend><div class="ed-opts">${prices.sizes.map((s) => radio("est-size", s, s === first)).join("")}</div></fieldset>
      <fieldset><legend>${esc(e2.optionLabel || "Option")}</legend><div class="ed-opts">${prices.options.map((o) => radio("est-opt", o, o === firstOpt)).join("")}</div></fieldset>
    </div>
    <div><div class="ed-out" aria-live="polite"><p class="ed-num" id="est-num">${esc(prices.cells[first][firstOpt])}</p><p class="ed-unit">${esc(cineUnit(d.tradeKey, cine.unit))}</p><p class="ed-note">An estimate, not a final price. The exact price comes after we look at the job.</p><a class="ed-btn light" href="#contact">${askLabel}</a></div>
    <ul class="ed-list">${list}</ul></div>
  </div>
  <script type="application/json" id="est-data">${JSON.stringify(prices.cells).replace(/</g, "\\u003c")}</script>
</div></section>`;
  }

  // Process, reviews note, contact
  const steps = [
    ["Call or send a request", d.phone ? `Call ${phoneShow}, or fill out the form on this page.` : "Call us, or fill out the form on this page."],
    ["We come and look", "We see the job in person, measure and listen."],
    [d.freeEstimates ? "Get your free estimate" : "Get a clear price", "You get the price before any work starts."],
    ["The work, then the clean-up", "We do the job you agreed to and leave the place tidy."],
  ];
  const process = `<section class="ed-sec" id="how" data-ed="process"><div class="ed-wrap ed-how">
  <div class="ed-how-pic ed-rv" aria-hidden="true">${pic(processId)}</div>
  <div><div class="ed-head ed-rv"><p class="ed-eyebrow">How it goes</p><h2>Four steps, <em>plainly</em></h2></div>
  <ol class="ed-steps">${steps.map(([h, p], i) => `<li class="ed-rv"><b>${edPad(i + 1)}</b><h3>${esc(h)}</h3><p>${p}</p></li>`).join("")}</ol></div>
</div></section>`;
  const edStars = (r) => { const row = (c) => Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" width="26" height="26" style="left:${i * 30}px" fill="${c}" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`).join(""); return `<span class="ed-stars" role="img" aria-label="${r} out of 5 stars"><span class="ed-stars-row off">${row("currentColor")}</span><span class="ed-stars-row" style="width:${(Math.max(0, Math.min(1, r / 5)) * 146).toFixed(1)}px">${row("currentColor")}</span></span>`; };
  const reviews = d.rating ? `<section class="ed-sec" id="reviews" style="padding-top:0"><div class="ed-wrap"><div class="ed-rev ed-rv">
  <b>${d.rating.toFixed(1)}</b><div class="ed-rev-text"><p class="ed-eyebrow">Google rating</p><p>${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</p></div>${edStars(d.rating)}
</div></div></section>` : "";
  const options = d.services.map(([n]) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";
  const contact = `<section class="ed-sec ed-final" id="contact"><div class="ed-wrap ed-grid">
  <div class="ed-rv"><h2>${d.freeEstimates ? "Get your free <em>estimate</em>" : "Ask for a <em>price</em>"}</h2>
    <p class="ed-note">${d.phone ? "Call now, or send the form and we will call you back." : "Send the form and we will get back to you."}</p>
    ${d.phone ? `<a class="ed-phone" href="${callHref}">${phoneShow}</a>` : ""}</div>
  <form id="ask" class="ed-form ed-rv" novalidate>
    <label for="f-name">Your name<input type="text" id="f-name" name="name" autocomplete="name"></label>
    <label for="f-phone">Phone<input type="tel" id="f-phone" name="phone" autocomplete="tel"></label>
    <label for="f-job">What do you need?<select id="f-job" name="job">${options}</select></label>
    <label for="f-msg">Tell us about the job<textarea id="f-msg" name="message"></textarea></label>
    <button class="ed-btn" type="submit">Send request</button>
    <p class="ed-form-note" id="f-note" aria-live="polite">We will call you back.</p>
  </form>
</div></section>`;

  const links = [["#work", "Work"], ["#services", "Services"], prices && ["#price", "Price"], ["#contact", "Contact"]].filter(Boolean)
    .map(([h, l]) => `<a href="${h}">${l}</a>`).join("");

  return `<!doctype html>
<html lang="en" class="ed-no-js editorial" data-look="editorial">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${name}${area ? ` | ${esc(tradeName)} in ${area}` : ` | ${esc(tradeName)}`}</title>
<meta name="description" content="${name} is a ${esc(t.noun)} serving ${areaPhrase}. ${esc(t.sub)}">
<meta name="theme-color" content="#ece5dc">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(fontsHref)}">
<style>
:root{--ed-accent:color-mix(in srgb,${th.accent} 62%,#2a1204);--ed-hi:${th.hi}}
${ED_CSS}
${lookExtra.css || ""}
</style>
</head>
<body class="ed">
<header class="ed-nav" data-ed="nav"><div class="ed-wrap">
  <a class="ed-logo" href="#top"><svg class="ed-mark" viewBox="0 0 28 20" width="28" height="20" aria-hidden="true"><path d="M2 18 14 4l12 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M8.5 18 14 11.5 19.5 18" fill="none" stroke="var(--ed-accent)" stroke-width="2.4" stroke-linejoin="round"/></svg><span class="ed-logo-t">${name}</span></a><span class="ed-pill">Sample site</span>
  <nav class="ed-links" aria-label="Sections">${links}</nav>
  ${d.phone ? `<a class="ed-tel" href="${callHref}">${phoneShow}</a>` : ""}<a class="ed-btn sm" href="#contact">${askLabel}</a>
  <a class="ed-call" href="${callHref}" aria-label="${callText}">${edIcon(ED_PHONE, 20)}</a>
</div></header>
<main id="top">
${hero}
${trust}
${beat}
${work}
${svc}
${est}
${process}
${reviews}
${contact}
</main>
<footer class="ed-foot"><div class="ed-wrap"><div><b>${name}</b><p>${esc(tradeName)}${area ? ` in ${area}` : ""}</p></div><p>&copy; ${esc(d.year)} ${name} &middot; Sample site</p></div></footer>
<script>
${ED_JS}
</script>
</body>
</html>
`;
}
