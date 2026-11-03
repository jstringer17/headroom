// Sample Site Maker: the Classic look, rebuilt in round 3 on the pattern of a strong local contractor site
// (org/inspiration/lifetime/NOTES.md; ideas only, no copied text or pictures):
//   offer bar > header > hero (promise H1, proof line, 3 checks, the quote form in the hero on desktop)
//   > proof strip (big number, small label) > service cards with a tag > the one picker (pictures + its before/after)
//   > featured project (only with real pictures) > owner card beside reviews > how it works > FAQ
//   > dark call-to-action band > full footer, plus the phone action bar.
// Rules (unchanged): only facts the owner typed or ticked; samples are marked; no outside scripts; deterministic.
import { esc, safeImage, liveHead, liveFormAttrs, liveFormFields, liveScript, liveFootLink, liveBeacon, LIVE_SAMPLE_SUBMIT } from "./generate.js";
import { THEMES } from "./themes.js";
import { rvwList } from "./reviews.js";
import { credBadges, credTop, credLine, credPlatformLis } from "./credibility.js";
import { pickerItems, pickerHtml, PICKER_CSS, PICKER_JS } from "./picker.js";
import { mobileBarHtml, ACTIONS_JS, PROOF_MORE_CSS } from "./actions.js";
import { variantCards, kitVariant } from "./variants.js";
import { promiseFor } from "./promise.js";
import { offeredPrices, cineUnit, baTags } from "./cinematic.js";
import { ltTrust, ltBase, ltBrand, ltOffer, ltChecksHtml, ltRating, ltCta, ltForm, ltTag, ltIncluded, ltFeatured, ltSteps, ltFaq, ltAreas, ltBand, ltFooter, LT_CSS } from "./lifetime.js";

const clIcon = (p, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const CL_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';
const CL_CHECK = '<path d="M5 12.5l4.5 4.5L19 7"/>';
const CL_PLUS = '<path d="M12 5v14M5 12h14"/>';
const CL_ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';
const clStars = (n, s = 22) => `<span class="cl-stars" role="img" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path fill="currentColor"${i + 0.5 <= n ? "" : ' opacity=".25"'} d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>`).join("")}</span>`;
// The accent word of a headline in the highlight color.
const clAccent = (text, word) => { const i = word ? text.indexOf(word) : -1; return i < 0 ? esc(text) : `${esc(text.slice(0, i))}<em>${esc(word)}</em>${esc(text.slice(i + word.length))}`; };
// A tag for a service card from its own words (no claims: what kind of job it is).
const clTag = (n, d) => ltTag(n, d);
// Headline size that keeps the H1 to 3 lines or fewer (Archivo 800 is ~0.56em per character).
const clH1 = (text) => { const n = Math.max(text.length, 12); return `--h1m:${Math.max(30, Math.min(40, Math.floor((3 * 335) / (n * 0.7))))}px;--h1d:${Math.max(56, Math.min(76, Math.floor((3 * 600) / (n * 0.62))))}px`; };

// form, d = normalize(form) (+ live), o = { phArt, CINE }
export function generateClassic(form, d, o) {
  const { phArt, CINE } = o;
  const t = d.trade, th = THEMES[d.themeKey];
  const tradeName = t.label.replace(/ \(.*\)$/, "");
  const name = esc(d.company), area = d.city ? esc(d.city) : "";
  const areaPhrase = area ? `${area} and nearby towns` : "your area and nearby towns";
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  const callHref = d.phone && d.phone.tel ? `tel:${esc(d.phone.tel)}` : "#contact";
  const callText = d.phone ? `Call ${phoneShow}` : "Contact us";
  const callIco = d.phone ? CL_PHONE : CL_ARROW;
  const callBtn = (cls) => `<a class="${cls}" href="${callHref}">${clIcon(callIco, 19)}<span>${callText}</span></a>`;
  const askLabel = d.freeEstimates ? "Get a free estimate" : "Ask for a price";
  const kitFull = CINE && CINE.CINE_KIT && CINE.CINE_KIT[d.tradeKey];
  const kit = kitFull ? kitVariant(kitFull, form && form.cine && form.cine.variant) : null;
  const imgs = (form && form.cine && form.cine.images) || {};
  const anyReal = Object.values(imgs).some((v) => safeImage(v));
  const allCards = kitFull ? variantCards(kitFull, form && form.cine && form.cine.offer) : [];
  const prices = kitFull ? (() => { try { return offeredPrices(kitFull, form.cine.prices); } catch (_) { return null; } })() : null;

  // Hero picture: the form's hero picture, else the finished frame the owner or the library gave the picked variation.
  const story = (kit && kit.story) || [];
  const finishedId = story.length ? story[story.length - 1].id : "";
  const hero = safeImage(form && form.heroImage) || (finishedId ? safeImage(imgs[finishedId]) : "");
  const promise = promiseFor(d.tradeKey, kit && kit.variantKey);
  const h1Text = promise ? promise.headline : t.headline;
  const shape = (cls) => t.fill
    ? `<svg class="${cls} solid" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="${t.line} L1200 300 L0 300 Z"/></svg>`
    : `<svg class="${cls} strokes" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="${t.line}"/></svg>`;

  // 1. Offer bar: only what the owner ticked or typed.
  const offerBar = ltOffer(d, promise);

  // 2. Hero checks: license, certification, warranty, else the ticks (src/lifetime.js).
  const top = ltTrust(d);
  const items = kitFull ? pickerItems(kitFull, kit, allCards, d.tradeKey) : [];
  const jobNames = [...items.filter((x) => x.key !== "ba").map((x) => x.label), ...d.services.map(([n]) => n)].filter((n, i, a) => a.indexOf(n) === i);
  const formCard = ltForm(d, jobNames, { btn: "btn btn-accent", cls: "cl-formcard" });
  const heroSec = `<section class="cl-hero${hero ? " has-photo" : ""}" aria-label="Intro" data-hero-end>
  ${hero ? `<img class="hero-img" src="${esc(hero)}" alt="" fetchpriority="high">` : shape("cl-art")}
  <div class="wrap cl-hero-grid">
    <div class="cl-hero-text">
      <p class="cl-pill">${esc(tradeName)}${area ? ` in ${area}` : ""}</p>
      <h1 style="${clH1(h1Text)}">${promise ? clAccent(h1Text, promise.accent) : esc(h1Text)}</h1>
      <p class="hero-sub"><span class="cl-sub-txt">${esc(t.sub)} ${name} serves ${areaPhrase}.</span>${top.length ? ` <b class="hero-trust">${esc(top.join(" · "))}</b>` : ""}</p>
      ${ltChecksHtml(d, "lt-checks cl-checks")}
      ${ltCta(d, "btn btn-accent")}${ltRating(d)}
    </div>
    ${formCard}
  </div>
</section>`;

  // 3. Proof strip: the strongest facts as big number + small label (4 on phones).
  const badges = credBadges(d);
  const proof = badges.length ? `<section class="cl-proof" id="proof" aria-label="Why people trust us"><div class="wrap"><ul>${badges.slice(0, 5).map((b, i) => `<li class="rv${i >= 4 ? " cl-p5" : ""}">${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">` : ""}<b>${esc(b.label)}</b>${b.sub ? `<span>${esc(b.sub)}</span>` : ""}${b.url ? "</a>" : ""}</li>`).join("")}</ul></div></section>` : "";

  // 3b. Phones: one full-width photo of finished work between the proof strip and the cards (real pictures only).
  // never the picture the hero or the picker opens on
  const bandItem = items.slice(1).find((x) => safeImage(imgs[x.after]) && imgs[x.after] !== hero);
  const photoBand = bandItem ? `<figure class="cl-photo-band"><img src="${esc(imgs[bandItem.after])}" alt="${esc(bandItem.label)}" loading="lazy" decoding="async"><figcaption>${esc(bandItem.label)}</figcaption></figure>` : "";
  // 4. Service cards with a small tag.
  const services = `<section class="sec" id="services"><div class="wrap">
  <div class="cl-head rv"><p class="cl-kicker">Services</p><h2>Every ${esc(tradeName.toLowerCase())} job, one crew${area ? ` in ${area}` : ""}</h2></div>
  <ul class="cl-cards">${d.services.map(([n, desc]) => `<li class="rv">${clTag(n, d) ? `<span class="cl-tag">${esc(clTag(n, d))}</span>` : ""}<h3>${esc(n)}</h3><p>${esc(desc)}</p><a class="cl-more" href="#ask" data-job="${esc(n)}">${d.freeEstimates ? "Free estimate" : "Ask about this"} ${clIcon(CL_ARROW, 18)}</a></li>`).join("")}</ul>
</div></section>`;

  // 5. The one picker (pictures and the page's only before/after slider).
  const anyRealCl = anyReal;
  const pickImg = (id, label, attrs) => `<img src="${esc(safeImage(imgs[id]) || phArt(d.tradeKey, id, label, anyRealCl ? { quiet: true } : undefined))}" alt="${esc(label)}" ${attrs}>`;
  const picker = pickerHtml({ items, tradeKey: d.tradeKey, tradeName, img: pickImg, prices, usd: (n) => "$" + (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2)), unit: kitFull ? cineUnit(d.tradeKey, form && form.cine && form.cine.unit) : "", tags: baTags(d.tradeKey), cls: "sec tint cl-vp", jobs: jobNames });

  // 6. Featured project: the picked variation's own first and last story frames, only when they are real pictures.
  const fb = story.length > 1 ? story[0].id : "", fa = finishedId;
  const featured = !d.live && fb && safeImage(imgs[fb]) && safeImage(imgs[fa]) ? ltFeatured(d, { before: imgs[fb], after: imgs[fa], cls: "lt-tint", title: `${(allCards.find((x) => x.key === (kit && kit.variantKey)) || {}).label || tradeName}${area ? `, ${d.city}` : ""}`, steps: story.slice(1).map((s) => s.headline) }) : "";

  // 7. Owner card beside the reviews.
  const fine = credLine(d);
  const ownerFacts = [d.cred.founded ? `In business since ${d.cred.founded}` : d.years ? `${d.years} year${d.years === 1 ? "" : "s"} in business` : "", d.cred.family ? "Family owned" : "", d.cred.veteran ? "Veteran owned" : "", d.cred.license ? `License #${esc(d.cred.license)}` : "", d.insured ? (d.cred.bonded ? "Insured and bonded" : "Insured") : ""].filter(Boolean);
  // every other typed fact the proof strip had no room for (jobs, awards, more certifications, ...)
  badges.slice(5).forEach((b) => { if (b.label === "Bonded" && d.insured) return; const f = esc(`${b.label}${b.sub ? ` ${b.sub.toLowerCase()}` : ""}`); if (!ownerFacts.some((x) => x.startsWith(esc(b.label)) || f.startsWith(x))) ownerFacts.push(f); });
  let initials = esc(String(d.company).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase());
  if (["NO", "OK", "OR", "SO", "AT", "IN", "ON", "US", "IT", "IF", "GO", "UP", "AM", "AS", "BE", "DO", "HI", "ME", "MY", "WE"].includes(initials)) initials = initials[0];
  const reviews = d.live && !d.rv.items.length && !d.rating && !d.rv.link ? "" : `<section class="sec" id="reviews"><div class="wrap cl-rev-grid">
  <aside class="cl-owner rv"><span class="cl-mono" aria-hidden="true">${initials}</span><p class="cl-kicker">${d.cred.family ? "Family owned" : "Local crew"}</p><h3>${name}</h3>
    <p>${esc(t.sub)} We answer the phone, show up when we say, and give you the price before any work starts.</p>
    ${ownerFacts.length ? `<ul>${ownerFacts.map((x) => `<li>${clIcon(CL_CHECK, 16)}<span>${x}</span></li>`).join("")}</ul>` : ""}</aside>
  <div class="cl-revs rv">
    <h2>What customers say</h2>
    ${d.rating ? `<div class="rating"><span class="rating-num">${d.rating.toFixed(1)}</span><span>${clStars(d.rating)}<span class="rating-sub">${d.reviews ? `From ${d.reviews.toLocaleString("en-US")} Google review${d.reviews === 1 ? "" : "s"}` : "Google rating"}</span></span></div>` : ""}
    ${credPlatformLis(d, esc) ? `<ul class="plat-list">${credPlatformLis(d, esc)}</ul>` : ""}
    ${d.rv.items.length ? rvwList(d.rv, esc) : ""}
    ${d.rv.link ? `<a class="btn btn-dark rvw-all" href="${esc(d.rv.link)}" target="_blank" rel="noopener noreferrer">See all reviews</a>` : ""}
  </div>
</div></section>`;

  // 8. What's included, how it works, FAQ, service areas, final call band, footer (src/lifetime.js)
  const included = ltIncluded(d, { cls: "cl-inc-open" });
  const how = ltSteps(d, { cls: "lt-tint" });
  const faq = ltFaq(d);
  const areas = ltAreas(d, { cls: "lt-tint" });
  const band = ltBand(d);
  const footer = ltFooter(form, d);

  const title = `${name}${area ? ` | ${esc(tradeName)} in ${area}` : ` | ${esc(tradeName)}`}`;
  const descr = `${name} is a ${esc(t.noun)} serving ${areaPhrase}. ${esc(t.sub)}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${descr}">
<meta name="theme-color" content="${th.dark}">
${liveHead(d, form, title, descr)}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700&display=swap">
<style>
:root{--dark:${th.dark};--dark2:${th.dark2};--accent:${th.accent};--accent-ink:${th.accentInk};--hi:${th.hi};--light:${th.light};--ink:${th.ink};--muted:${th.muted};--line:${th.line};--paper:#ffffff;--on-dark:#fff;--on-dark-2:rgba(255,255,255,.8);--rule-dark:rgba(255,255,255,.2);--head:"Archivo","Arial",sans-serif;--body:"Hanken Grotesk","Segoe UI",Roboto,Helvetica,Arial,sans-serif;--ease:cubic-bezier(.16,1,.3,1);--max:1240px;--r:14px;color-scheme:light}
${CL_CSS}
${LT_CSS}
${PICKER_CSS}
${PROOF_MORE_CSS}
:root{--lt-head:var(--head);--lt-body:var(--body);--lt-hw:800;--lt-ink:var(--ink);--lt-muted:var(--muted);--lt-paper:var(--paper);--lt-tint:var(--light);--lt-card:#fff;--lt-line:var(--line);--lt-dark:var(--dark);--lt-accent:var(--accent);--lt-accent-ink:var(--accent-ink);--lt-hi:var(--hi);--lt-em:var(--dark);--lt-r:var(--r);--lt-btn-r:10px;--lt-max:var(--max)}
.lt-h2,.lt-inc h3,.lt-steps h3,.lt-faq summary{color:var(--dark)}
.lt-h2 em{font-style:normal;box-shadow:inset 0 -.2em 0 var(--accent)}
.lt-band h2 em{font-style:normal;box-shadow:none}
/* QA 9e7dbb8 MINOR 7: "What's included" as an open list on white (rules, no cards), so no white-card run */
.cl-inc-open .lt-inc li{background:transparent;border:0;border-top:3px solid var(--dark);border-radius:0;padding:18px 0 4px}
</style>
</head>
<body>
${offerBar}
<header class="top"><div class="wrap">
  ${ltBrand(form, d, `<a class="brand-name" href="#top">${name}</a>`)}
  <nav class="nav" aria-label="Sections"><a href="#services">Services</a>${picker ? `<a href="#styles">${items.some((x) => x.before) ? "Before and after" : "Styles"}</a>` : ""}<a href="#reviews">Reviews</a><a href="#faq">Questions</a></nav>
  ${callBtn("btn btn-accent cl-top-btn")}<a class="btn btn-dark cl-top-btn cl-top-est" href="#ask">${d.freeEstimates ? "Free estimate" : "Get a price"}</a>
  <a class="top-call" href="${callHref}" aria-label="${callText}">${clIcon(callIco, 22)}</a>
</div></header>
<main id="top">
${heroSec}
${proof}
${photoBand}
${picker}
${services}
${featured}
${reviews}
${included}
${how}
${faq}
${areas}
${band}
</main>
${footer}
${mobileBarHtml(d, esc, "mbar", askLabel)}
<script>
${liveScript(`(function(){
  var root=document.documentElement;root.classList.add("js");
  ${LIVE_SAMPLE_SUBMIT}
  ${ACTIONS_JS}
  ${PICKER_JS}
  /* the phone bar shows once the hero's own buttons are behind you */
  var cta=document.getElementById("hero-cta");function past(){root.classList.toggle("past",cta.getBoundingClientRect().bottom<0)}addEventListener("scroll",past,{passive:true});past();
  /* Ask about this / Free estimate on a card: pick that job in the form */
  document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-job]");if(!a)return;var s=document.querySelector("#ask select"),v=a.getAttribute("data-job");if(s)for(var i=0;i<s.options.length;i++)if(s.options[i].text===v){s.selectedIndex=i;break}});
  if(!("IntersectionObserver" in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var els=[].slice.call(document.querySelectorAll(".rv"));
  els.forEach(function(el){if(el.getBoundingClientRect().top<innerHeight)el.classList.add("in")});
  root.classList.add("motion");
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{rootMargin:"0px 0px -8% 0px"});
  els.forEach(function(el){if(!el.classList.contains("in"))io.observe(el)});
})();
`, d)}</script>
${liveBeacon(d)}</body>
</html>
`;
}

const CL_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:84px}
body{margin:0;background:var(--paper);color:var(--ink);font:400 17px/1.6 var(--body);overflow-x:clip;padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}
h1,h2,h3,p,dl,dd,figure,ul,ol{margin:0}
h1,h2,h3{font-family:var(--head);letter-spacing:-.02em;line-height:1.08;text-wrap:balance}
a{color:inherit;text-underline-offset:3px}
img,svg{max-width:100%}
.wrap{max-width:var(--max);margin:0 auto;padding-inline:max(20px,env(safe-area-inset-left,0px)) max(20px,env(safe-area-inset-right,0px))}
a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 24px;border:0;border-radius:10px;font:700 17px/1 var(--body);text-decoration:none;cursor:pointer;transition:transform .16s var(--ease),box-shadow .2s var(--ease),background-color .2s var(--ease)}
.btn:active{transform:scale(.97)}
.btn-accent{background:var(--accent);color:var(--accent-ink)}
@media (hover:hover){.btn-accent:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(0,0,0,.22)}}
.btn-line{color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.85);background:rgba(0,0,0,.18)}
@media (hover:hover){.btn-line:hover{background:rgba(255,255,255,.14)}}
.btn-dark{background:var(--dark);color:#fff}
/* offer bar + header */
.cl-offer{background:var(--dark2);color:#fff;font:600 14px/1.4 var(--body);text-align:center;padding:9px 16px}
.cl-photo-band{display:none;margin:0;position:relative}
.cl-photo-band img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.cl-photo-band figcaption{position:absolute;left:12px;bottom:12px;font:800 12px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.6);padding:7px 10px;border-radius:6px}
@media (max-width:1023px){.cl-photo-band{display:block}}
@media (max-width:639px){.cl-sub-txt{display:none}.hero-sub b{margin-top:0}}
.cl-offer a{color:var(--hi);font-weight:700;display:inline-flex;align-items:center;min-height:48px;margin-block:-9px}
.top{position:sticky;top:0;z-index:30;background:#fff;box-shadow:0 1px 0 var(--line)}
.top .wrap{display:flex;align-items:center;gap:24px;min-height:68px}
.brand-name{display:block;min-height:48px;font:800 20px/48px var(--head);letter-spacing:-.02em;text-decoration:none;color:var(--dark);margin-right:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav{display:none;gap:22px;font-weight:600;font-size:15px}
.nav a{text-decoration:none;color:var(--ink);display:inline-flex;align-items:center;min-height:48px}
@media (hover:hover){.nav a:hover{color:var(--accent)}}
.cl-top-btn{display:none;min-height:48px;font-size:15px;padding:0 18px}
.top-call{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--accent);color:var(--accent-ink);flex:none}
/* hero */
.cl-hero{position:relative;isolation:isolate;background:var(--dark);color:#fff;overflow:hidden}
.cl-hero .hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 60%;z-index:-2}
.cl-hero.has-photo::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,rgba(0,0,0,.72) 60%,rgba(0,0,0,.82) 100%)}
@media (min-width:1024px){.cl-hero.has-photo::before{background:linear-gradient(90deg,rgba(0,0,0,.74) 0%,rgba(0,0,0,.5) 42%,rgba(0,0,0,.12) 72%,rgba(0,0,0,.06) 100%)}}
.cl-art{position:absolute;left:0;right:0;bottom:0;width:100%;height:46%;z-index:-1}
.cl-art.solid path{fill:color-mix(in srgb,var(--accent) 26%,var(--dark2))}
.cl-art.strokes path{fill:none;stroke:color-mix(in srgb,var(--accent) 45%,var(--dark2));stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
.cl-hero:not(.has-photo){background:radial-gradient(120% 90% at 85% 0%,color-mix(in srgb,var(--accent) 22%,var(--dark)) 0%,var(--dark) 60%) var(--dark)}
.cl-hero-grid{display:grid;gap:28px;padding-block:36px 40px}
.cl-pill{background:rgba(0,0,0,.45)!important;display:inline-flex;align-items:center;gap:8px;font:700 13px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--hi);background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);padding:8px 12px;border-radius:999px}
.cl-pill::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--hi)}
.cl-hero-text{display:flex;flex-direction:column;align-items:flex-start}
.cl-hero h1{margin-top:16px;font-weight:900;font-size:var(--h1m);line-height:1.02;letter-spacing:-.025em}
.cl-hero h1 em{font-style:normal;color:var(--hi)}
.hero-sub{margin-top:14px;color:var(--on-dark-2);font-size:17px;max-width:46ch}
.hero-sub b{display:block;margin-top:8px;color:#fff;font-weight:600}
.cl-hero .lt-orcall a{color:var(--hi)}
.cl-hero .lt-rate{color:#fff}
/* one slow settle on the hero photo (transform only; none with reduced motion) */
@media (prefers-reduced-motion:no-preference){.cl-hero .hero-img{animation:cl-settle 14s cubic-bezier(.16,1,.3,1) both;transform-origin:60% 40%}}
@keyframes cl-settle{from{transform:scale(1.09)}to{transform:scale(1)}}
@media (max-width:1023px){.cl-hero .hero-img{position:relative;inset:auto;display:block;width:100%;height:auto;aspect-ratio:16/10;object-position:50% 55%;z-index:0}.cl-hero.has-photo::before{display:none}.cl-hero-text .lt-cta{order:1;margin-top:18px}.cl-hero-text .lt-rate{order:1}.cl-hero-text .hero-sub{order:2;margin-top:20px}.cl-hero-text .cl-checks{order:3}}
/* proof strip */
.cl-proof{background:#fff;border-bottom:1px solid var(--line)}
.cl-proof ul{list-style:none;padding:18px 0;display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
.cl-proof li,.cl-proof a{display:grid;gap:2px;text-decoration:none;color:inherit}
.cl-proof a{min-height:48px}
.cl-proof b{font:800 24px/1.1 var(--head);color:var(--dark);letter-spacing:-.02em}
.cl-proof span{font-size:14px;color:var(--muted);font-weight:600}
.cl-proof a span{text-decoration:underline;text-underline-offset:3px}
.cl-proof li.cl-p5{display:none}
/* sections */
.sec{padding-block:64px}
.tint{background:var(--light)}
.cl-head{max-width:760px;margin-bottom:30px}
.cl-kicker{display:flex;align-items:center;gap:10px;font:800 13px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--dark);margin-bottom:12px}
.cl-kicker::before{content:"";width:28px;height:4px;border-radius:2px;background:var(--accent)}
.cl-head h2,.cl-revs h2,.cl-feat-text h2{font-size:clamp(30px,6vw,46px);font-weight:800;color:var(--dark)}
.cl-cards{list-style:none;padding:0;display:grid;gap:14px}
.cl-cards li{display:grid;gap:8px;align-content:start;background:var(--light);border:1px solid var(--line);border-top:4px solid var(--dark);border-radius:var(--r);padding:20px}
.cl-tag{justify-self:start;font:800 12px/1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--dark);background:#fff;padding:7px 10px;border-radius:6px}
.cl-cards h3{font-size:21px;font-weight:800;color:var(--dark)}
.cl-cards p{color:var(--muted);font-size:16px}
.cl-more{display:inline-flex;align-items:center;gap:6px;min-height:48px;font-weight:700;color:var(--dark);text-decoration:none}
@media (hover:hover){.cl-more:hover{color:var(--accent)}}
.cl-vp{--vp-ink:var(--ink);--vp-bg:var(--light);--vp-muted:var(--muted);--vp-accent:var(--accent);--vp-accent-ink:var(--accent-ink);--vp-em:var(--dark);--vp-chip-bg:#fff;--vp-chip-ink:var(--ink);--vp-chip-line:var(--line);--vp-on-bg:var(--dark);--vp-on-ink:#fff;--vp-head:var(--head);--vp-sans:var(--body);--vp-stage-bg:#dfe3e8;--vp-max:var(--max);--vp-r:var(--r);--vp-btn-r:10px;--vp-focus:var(--accent)}
.cl-vp h2{font-weight:800;color:var(--dark)}
.cl-vp h2 em{font-style:normal;color:var(--dark);box-shadow:inset 0 -.2em 0 var(--accent)}
.cl-vp .vp-name{font-weight:800;color:var(--dark)}
/* owner + reviews */
.cl-rev-grid{display:grid;gap:28px}
@media (max-width:1023px){.cl-revs{order:-1}}
.cl-owner{border:1px solid var(--line);border-radius:var(--r);padding:24px;display:grid;gap:10px;align-content:start;background:#fff}
.cl-mono{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:var(--dark);color:var(--hi);font:800 26px/1 var(--head);box-shadow:0 0 0 4px #fff,0 0 0 6px var(--accent)}
.cl-owner h3{font-size:24px;font-weight:800;color:var(--dark)}
.cl-owner p{color:var(--muted)}
.cl-owner ul{list-style:none;padding:0;display:grid;gap:8px;margin-top:6px}
.cl-owner li{display:flex;gap:8px;align-items:flex-start;font-weight:600}
.cl-owner li svg{color:var(--dark);margin-top:4px;flex:none}
.cl-revs{display:grid;gap:18px;align-content:start;min-width:0}
.rating{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.rating-num{font:800 72px/.9 var(--head);color:var(--dark);letter-spacing:-.03em}
.cl-stars{display:inline-flex;gap:2px;color:#f5a623}
.rating-sub{display:block;margin-top:6px;color:var(--muted);font-weight:600}
.plat-list{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.plat-list li{display:flex;align-items:center;gap:6px;border:1.5px solid var(--line);border-radius:999px;min-height:48px;padding:0 16px;font-size:15px;font-weight:700;background:#fff}
.plat-list span{font-weight:500;color:var(--muted)}
.plat-list a{display:flex;gap:6px;align-items:center;min-height:48px;color:inherit;text-decoration:none}
.rvw-list{list-style:none;padding:0;display:grid;gap:14px}
.rvw{border-left:4px solid var(--accent);background:var(--light);border-radius:0 var(--r) var(--r) 0;padding:18px 20px}
.rvw-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;color:#f5a623}
.rvw-tag{font:700 12px/1 var(--body);letter-spacing:.04em;color:var(--ink);background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 10px}
.rvw-q{margin:10px 0 0;font-size:18px;line-height:1.5;color:var(--ink);overflow-wrap:anywhere}
.rvw-by{margin-top:8px;font-weight:700;color:var(--muted);overflow-wrap:anywhere}
.rvw-all{justify-self:start}
/* phone action bar */
.mbar{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;padding:8px max(12px,env(safe-area-inset-right,0px)) calc(8px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));background:var(--dark);box-shadow:0 -8px 24px rgba(0,0,0,.2);transform:translateY(110%);visibility:hidden;transition:transform .25s var(--ease),visibility 0s linear .25s}
.mbar-a{flex:1 1 0;min-height:52px;font-size:17px!important;display:grid;place-items:center;border-radius:10px;font:700 16px/1 var(--body);text-decoration:none;color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7)}
.mbar-a.go{flex:1 1 0;background:var(--accent);color:var(--accent-ink);box-shadow:none}
.mbar-a.call{background:#fff;color:#111;box-shadow:none}
.mbar-a:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.past .mbar{transform:none;visibility:visible;transition:transform .25s var(--ease),visibility 0s}
.kbd .mbar{transform:translateY(110%);visibility:hidden}
/* reveal */
@media (prefers-reduced-motion:no-preference){.motion .rv{transition:opacity .7s var(--ease),transform .7s var(--ease)}.motion .rv:not(.in){opacity:0;transform:translateY(20px)}}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.btn,.mbar,.faq summary svg{transition:none}}
@media (max-width:639px){
  .cl-cards{grid-template-columns:1fr 1fr;gap:10px}
  .cl-cards li{padding:14px;gap:6px}
  .cl-cards h3{font-size:17px}
  .cl-cards p{display:none}
  .cl-more{min-height:44px;font-size:15px}
  #how{display:none} /* phones: the FAQ answers "How do I get started?"; the page stays short */
  .sec{padding-block:52px}
}
@media (max-width:1023px){#styles{padding-bottom:110px}}
@media (min-width:640px){
  .cl-proof ul{grid-template-columns:repeat(4,1fr)}
  .cl-cards{grid-template-columns:1fr 1fr}
}
@media (min-width:1024px){
  body{padding-bottom:0}
  .mbar,.top-call{display:none}
  .nav{display:flex}
  .cl-top-btn{display:inline-flex}
  .cl-hero-grid{grid-template-columns:minmax(0,1.15fr) minmax(360px,.85fr);gap:56px;align-items:center;padding-block:72px 80px}
  .cl-hero h1{font-size:var(--h1d)}
  .cl-hero-text .lt-primary{display:none}
  .cl-hero-text .lt-cta{margin-top:14px}
  .cl-proof ul{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));padding:24px 0}
  .cl-proof li.cl-p5{display:grid}
  .cl-proof b{font-size:30px}
  .sec{padding-block:96px}
  .cl-cards{grid-template-columns:repeat(3,1fr);gap:18px}
  .cl-rev-grid{grid-template-columns:minmax(300px,.8fr) 1.6fr;gap:40px;align-items:start}
}
`;
