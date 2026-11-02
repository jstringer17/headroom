import { VARIANT_NOTES, variantCards } from "./variants.js";
// The one "Pick your ..." section, shared by all three looks (CEO round 2, A and B).
// Every offered variation of the trade is a chip; the open one shows a big picture, one line,
// the owner's price range for it (only if typed), [Compare before and after] (the page's ONLY
// drag slider) and [Ask about this] (picks the job in the form). Trades without variations use
// their styles as chips, plus one "Before and after" chip when the kit has a pair.
// pickerItems() is pure; pickerHtml() takes an img(id, label, attrs) callback so each look keeps
// its own picture handling. PICKER_CSS / PICKER_JS are look-neutral and read --vp-* variables.

// "Pick your roof." per trade: [before, accent, after].
const VP_TITLES = {
  roofing: ["Pick your ", "roof", "."], fencing: ["Pick your ", "fence", "."], pressure: ["Pick what we ", "wash", "."],
  hvac: ["Pick your ", "system", "."], painting: ["Pick your ", "finish", "."], concrete: ["Pick your ", "finish", "."],
  landscaping: ["Pick your ", "yard", "."], remodeling: ["Pick your ", "room", "."], garage: ["Pick your ", "door", "."],
};
export function pickerTitle(tradeKey) { return VP_TITLES[tradeKey] || ["Pick your ", "style", "."]; }
// The heading words and the one-line hint, for one item or several. Escaped HTML.
export function pickerHead(tradeKey, items) {
  const [a0, em, z0] = pickerTitle(tradeKey);
  const solo = items.length === 1, word = em === "wash" ? "clean" : em;
  const [a, z] = solo ? ["Your ", ", before and after."] : [a0, z0];
  const h2 = `${vpEsc(a)}<em>${vpEsc(solo ? word : em)}</em>${vpEsc(z)}`;
  const lede = solo ? "Tap Compare, then drag the line across the picture." : items.some((x) => x.before) ? "Tap one to see it. Then compare the before and after." : "Tap one to see it.";
  return { h2, lede };
}

const vpWords = (s) => new Set(String(s).toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !["and", "the", "only", "look", "new"].includes(w)).map((w) => w.replace(/(es|s)$/, "")));
// The owner's price range for one variation: the estimator option that shares a word with its name,
// lowest low to highest high over every size typed. Null when nothing was typed for it.
export function vpPrice(prices, label, usd) {
  if (!prices || !prices.nums) return null;
  const want = vpWords(label);
  const opt = (prices.options || []).find((o) => [...vpWords(o)].some((w) => want.has(w)));
  if (!opt) return null;
  let lo = Infinity, hi = -Infinity;
  for (const s of prices.sizes || []) { const r = prices.nums[s] && prices.nums[s][opt]; if (r) { lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); } }
  if (!(lo < Infinity)) return null;
  return lo === hi ? usd(lo) : `${usd(lo)} to ${usd(hi)}`;
}

// The chips: [{ key, label, note, after, before|null }]
export function pickerItems(fullKit, kit, cards, tradeKey) {
  const notes = (typeof VARIANT_NOTES !== "undefined" && VARIANT_NOTES[tradeKey]) || {};
  const hasVariants = ((fullKit && fullKit.variants) || []).length >= 2;
  if (hasVariants) {
    // Every offered variation; one ticked = one item (still its own before and after); none ticked = the picked one.
    let list = cards && cards.length ? cards : ((typeof variantCards === "function" ? variantCards(fullKit, [kit.variantKey]) : []));
    const first = list.findIndex((c) => c.key === kit.variantKey);
    const ordered = first > 0 ? [list[first], ...list.filter((_, i) => i !== first)] : list;
    return ordered.map((c) => ({ key: c.key, label: c.label, note: notes[c.key] || "", after: c.after, before: c.before }));
  }
  // No variations: the one before and after first, then the styles (pictures only).
  const out = [];
  const ba = kit.beforeAfter;
  if (ba) out.push({ key: "ba", label: "Before and after", note: ba.title || "", after: (ba.after && ba.after.id) || "after", before: (ba.before && ba.before.id) || "before" });
  (kit.styles || []).forEach((s) => out.push({ key: s.id, label: s.name, note: s.note || "", after: s.id, before: null }));
  return out;
}

const vpEsc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const VP_ARROWS = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>';
const VP_CHEV = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

// o = { items, tradeKey, tradeName, img(id, label, attrs), prices, usd, unit, tags: [before, after], cls (extra section classes),
//       head (optional html replacing the default heading), askLabel }
export function pickerHtml(o) {
  const tags0 = o.tags || ["Before", "After"];
  const items = (o.items || []).map((it) => it.key === "ba" && !/^before$/i.test(tags0[0]) ? { ...it, label: `${tags0[0]} to ${String(tags0[1]).toLowerCase()}` } : it);
  if (!items.length) return "";
  const solo = items.length === 1;
  const [a, em, z] = pickerTitle(o.tradeKey);
  const tags = o.tags || ["Before", "After"];
  const noun = em === "style" ? "styles" : em === "wash" ? "kinds of job" : `kinds of ${em}`;
  const hd = pickerHead(o.tradeKey, items);
  // "Ask about this" picks a job the form really lists: the item's own name, else a job sharing a word with it, else the first.
  const jobs = o.jobs || [];
  const jobFor = (label, key) => {
    if (!jobs.length || jobs.includes(label)) return label;
    if (key === "ba") return jobs.find((j) => /replac|new |install|restor|remov|clean/i.test(j)) || jobs[0];
    const w = vpWords(label);
    return jobs.find((j) => [...vpWords(j)].some((x) => w.has(x))) || "Something else";
  };

  const head = o.head || `<div class="vp-head"><span class="vp-kicker">${vpEsc(o.tradeName)}</span><h2 id="vp-h">${hd.h2}</h2><p class="vp-lede">${hd.lede}</p></div>`;
  const chips = items.map((it, i) => `<button type="button" class="vp-chip" role="tab" id="vp-t-${i}" aria-controls="vp-p-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${vpEsc(it.label)}</button>`).join("");
  const panels = items.map((it, i) => {
    const price = o.prices ? vpPrice(o.prices, it.label, o.usd) : null;
    const lazy = i === 0 ? 'decoding="async"' : 'loading="lazy" decoding="async"';
    const pic = it.before
      ? `<div class="vp-ba" data-pos="0" style="--pos:0">${o.img(it.after, `${it.label}, after`, `class="vp-after" ${lazy}`, tags[1])}${o.img(it.before, `${it.label}, before`, `class="vp-before" ${lazy}`, tags[0])}<span class="vp-tag vp-tag-b" aria-hidden="true">${vpEsc(tags[0])}</span><span class="vp-tag vp-tag-a" aria-hidden="true">${vpEsc(tags[1])}</span><div class="vp-handle" role="slider" tabindex="-1" aria-hidden="true" aria-label="${vpEsc(it.label)}: ${vpEsc(tags[0]).toLowerCase()} and ${vpEsc(tags[1]).toLowerCase()}" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 percent"><span class="vp-knob">${VP_ARROWS}</span></div></div>`
      : `<div class="vp-ba vp-one">${o.img(it.after, it.label, `class="vp-after" ${lazy}`, "")}</div>`;
    const own = { metal: "50% 12%", flat: "50% 40%", slat: "50% 50%" }[it.key];
    return `<div class="vp-panel" role="tabpanel" id="vp-p-${i}" aria-labelledby="vp-t-${i}" data-i="${i}"${own ? ` style="--fp-m:${own};--fp-d:${own}"` : ""}>
    <div class="vp-stage">${pic}<button type="button" class="vp-nav vp-prev" aria-label="Previous: ${vpEsc(items[(i - 1 + items.length) % items.length].label)}">${VP_CHEV("M15 6l-6 6 6 6")}</button><button type="button" class="vp-nav vp-next" aria-label="Next: ${vpEsc(items[(i + 1) % items.length].label)}">${VP_CHEV("M9 6l6 6-6 6")}</button><span class="vp-count" aria-hidden="true">${i + 1} / ${items.length}</span></div>
    <div class="vp-info"><h3 class="vp-name">${vpEsc(it.label)}</h3>${it.note ? `<p class="vp-note">${vpEsc(it.note)}</p>` : ""}${price ? `<p class="vp-price"><span class="vp-pr"><b>${vpEsc(price)}</b> ${vpEsc(o.unit || "")}</span><span>Estimate from the owner. The exact price comes after we look.</span></p>` : ""}
      <div class="vp-btns">${it.before ? `<button type="button" class="vp-btn vp-ghost vp-cmp" aria-pressed="false" aria-controls="vp-p-${i}">${VP_ARROWS}<span>Compare before and after</span></button>` : ""}<a class="vp-btn vp-solid" href="#contact" data-job="${vpEsc(jobFor(it.label, it.key))}">Ask about this</a></div></div>
  </div>`;
  }).join("\n  ");
  const fp = { roofing: "50% 32%", fencing: "50% 55%", pressure: "50% 62%" }[o.tradeKey];
  return `<section class="vp${solo ? " vp-solo" : ""} ${o.cls || ""}" id="styles"${fp ? ` style="--fp-m:${fp};--fp-d:${fp}"` : ""} aria-labelledby="vp-h" data-vp="1"><div class="vp-wrap">
  ${head}
  <div class="vp-chips-wrap"><div class="vp-chips" role="tablist" aria-label="${vpEsc(noun[0].toUpperCase() + noun.slice(1))}">${chips}</div></div>
  ${panels}
</div></section>`;
}

export const PICKER_CSS = `
.vp{--vp-r:18px;color:var(--vp-ink)}
.vp-wrap{max-width:var(--vp-max,1200px);margin:0 auto;padding-inline:max(20px,env(safe-area-inset-left,0px)) max(20px,env(safe-area-inset-right,0px))}
.vp-head{margin-bottom:24px}
.vp-kicker{display:block;font:700 13px/1 var(--vp-sans,inherit);letter-spacing:.14em;text-transform:uppercase;color:var(--vp-muted);margin-bottom:14px}
.vp h2{font-family:var(--vp-head,inherit);margin:0;font-size:clamp(38px,7vw,72px);line-height:1.02;letter-spacing:-.015em;text-wrap:balance}
.vp h2 em{color:var(--vp-em,var(--vp-accent))}
.vp-lede{margin:12px 0 0;color:var(--vp-muted);max-width:46ch}
.vp-chips-wrap{position:relative;margin:0 calc(-1 * max(20px,env(safe-area-inset-left,0px))) 16px;}
.vp-chips{display:flex;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x proximity;scrollbar-width:none;padding:4px max(20px,env(safe-area-inset-left,0px));-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent 100%);mask-image:linear-gradient(90deg,#000 calc(100% - 28px),transparent 100%)}
.vp-chips::-webkit-scrollbar{display:none}
.vp-chip{flex:none;scroll-snap-align:start;min-height:48px;padding:0 20px;border:0;border-radius:999px;background:var(--vp-chip-bg);color:var(--vp-chip-ink);box-shadow:inset 0 0 0 1.5px var(--vp-chip-line,transparent);font:600 15px/1 var(--vp-sans,inherit);cursor:pointer;white-space:nowrap;transition:background-color .2s ease,color .2s ease,box-shadow .2s ease,transform .16s ease}
.vp-chip:active{transform:scale(.97)}
@media (hover:hover){.vp-chip:not([aria-selected=true]):hover{box-shadow:inset 0 0 0 1.5px var(--vp-ink)}}
.vp-chip[aria-selected=true]{background:var(--vp-on-bg);color:var(--vp-on-ink);box-shadow:none}
.vp-chip:focus-visible,.vp-btn:focus-visible,.vp-nav:focus-visible{outline:3px solid var(--vp-focus,var(--vp-accent));outline-offset:3px}
.vp-panel{display:grid;gap:18px}
.js .vp-panel[hidden]{display:none}
.vp-panel+.vp-panel{margin-top:36px}
.js .vp-panel+.vp-panel{margin-top:0}
.vp-stage{position:relative;border-radius:var(--vp-r);overflow:hidden;background:var(--vp-stage-bg,#222);aspect-ratio:4/3}
.vp-ba{position:absolute;inset:0;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.vp-ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:var(--fp-m,50% 55%);pointer-events:none;-webkit-user-drag:none}
.vp-before{clip-path:inset(0 calc((100 - var(--pos)) * 1%) 0 0)}
.vp-in .vp-ba{animation:vp-fade .32s cubic-bezier(.22,1,.36,1)}
@keyframes vp-fade{from{opacity:.25}to{opacity:1}}
.vp-tag{position:absolute;top:14px;z-index:2;font:700 12px/1 var(--vp-sans,inherit);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.6);padding:8px 11px;border-radius:999px;opacity:0;transition:opacity .2s ease;pointer-events:none}
.vp-tag-b{left:14px}.vp-tag-a{right:14px}
.vp-handle{position:absolute;top:0;bottom:0;left:calc(var(--pos) * 1%);width:48px;margin-left:-24px;z-index:3;display:grid;place-items:center;cursor:ew-resize;touch-action:none;opacity:0;pointer-events:none;transition:opacity .2s ease}
.vp-handle::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.45)}
.vp-knob{position:relative;width:48px;height:48px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;box-shadow:0 4px 16px rgba(0,0,0,.35);transform:translateX(var(--kx,0px))}
.vp-handle:focus-visible{outline:none}
.vp-handle:focus-visible .vp-knob{box-shadow:0 0 0 3px var(--vp-focus,var(--vp-accent)),0 4px 16px rgba(0,0,0,.35)}
.vp-cmp-on .vp-handle,.vp-cmp-on .vp-tag{opacity:1;pointer-events:auto}
.vp-cmp-on .vp-tag{pointer-events:none}
.vp-cmp-on .vp-ba{cursor:ew-resize}
.vp-nav{position:absolute;top:50%;z-index:4;width:48px;height:48px;margin-top:-24px;border:0;border-radius:50%;display:grid;place-items:center;background:rgba(15,15,15,.62);color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);cursor:pointer;transition:opacity .2s ease,transform .16s ease}
.vp-nav:active{transform:scale(.94)}
.vp-prev{left:10px}.vp-next{right:10px}
.vp-cmp-on .vp-nav{opacity:0;pointer-events:none}
.vp-count{position:absolute;right:12px;bottom:12px;z-index:4;font:700 12px/1 var(--vp-sans,inherit);letter-spacing:.12em;color:#fff;background:rgba(0,0,0,.6);padding:7px 10px;border-radius:999px;font-variant-numeric:tabular-nums}
.vp-cmp-on .vp-count{opacity:0}
.vp-solo .vp-chips-wrap,.vp-solo .vp-nav,.vp-solo .vp-count{display:none}
.vp-info{display:grid;gap:10px;align-content:start;justify-items:start}
.vp-name{margin:0;font:500 clamp(28px,5vw,40px)/1.08 var(--vp-head,inherit);letter-spacing:-.01em}
.vp-note{margin:0;color:var(--vp-muted);font-size:17px;line-height:1.5;max-width:42ch}
.vp-price{margin:0;display:grid;gap:2px;font-size:16px;color:var(--vp-ink)}
.vp-price b{font:700 21px/1.2 var(--vp-sans,inherit);letter-spacing:-.01em}
.vp-price>span:last-child{font-size:14px;color:var(--vp-muted)}
.vp-btns{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.vp-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 22px;border:0;border-radius:var(--vp-btn-r,999px);font:700 16px/1 var(--vp-sans,inherit);text-decoration:none;cursor:pointer;transition:transform .16s ease,box-shadow .2s ease,background-color .2s ease,color .2s ease}
.vp-btn:active{transform:scale(.97)}
.vp-solid{background:var(--vp-accent);color:var(--vp-accent-ink)}
.vp-ghost{background:transparent;color:var(--vp-ink);box-shadow:inset 0 0 0 2px var(--vp-ink)}
.vp-ghost[aria-pressed=true]{background:var(--vp-ink);color:var(--vp-bg)}
@media (hover:hover){.vp-solid:hover{box-shadow:0 8px 20px rgba(0,0,0,.22);transform:translateY(-1px)}.vp-ghost:not([aria-pressed=true]):hover{background:var(--vp-ink);color:var(--vp-bg)}}
@media (max-width:519px){.vp-btns{width:100%}.vp-btn{flex:1 1 100%}}
@media (min-width:900px){
  .vp-chips-wrap{margin-inline:0}
  .vp-chips{flex-wrap:wrap;overflow:visible;padding-inline:0;-webkit-mask-image:none;mask-image:none}
  .vp-panel{grid-template-columns:minmax(0,1.7fr) minmax(280px,1fr);gap:40px;align-items:center}
  .vp-stage{aspect-ratio:3/2}
  .vp-ba img{object-position:var(--fp-d,50% 50%)}
  .vp-nav{opacity:0}
  .vp-stage:hover .vp-nav,.vp-nav:focus-visible{opacity:1}
  .vp-cmp-on .vp-stage:hover .vp-nav{opacity:0}
}
@media (prefers-reduced-motion:reduce){.vp-in .vp-ba{animation:none}.vp-chip,.vp-btn,.vp-nav,.vp-handle,.vp-tag{transition:none}}
`;

// Plain ES5. Chips are tabs (arrow keys, Home/End); prev/next buttons and a sideways swipe on the picture step through
// them; Compare turns on the drag line (pointer, touch, arrow keys); "Ask about this" picks the job in the form.
export const PICKER_JS = `(function(){var S=document.querySelector("[data-vp]");if(!S)return;
var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function cl(v,a,b){return v<a?a:v>b?b:v}
var tabs=[].slice.call(S.querySelectorAll(".vp-chip")),panels=[].slice.call(S.querySelectorAll(".vp-panel")),strip=S.querySelector(".vp-chips"),cur=0;
function setPos(p,v){var ba=p.querySelector(".vp-ba"),h=p.querySelector(".vp-handle");if(!h)return;v=cl(Math.round(v),0,100);ba.style.setProperty("--pos",v);h.setAttribute("aria-valuenow",v);h.setAttribute("aria-valuetext",v+" percent");var w=ba.offsetWidth,x=v/100*w;h.style.setProperty("--kx",(Math.min(Math.max(x,26),w-26)-x).toFixed(1)+"px")}
function slide(p,to){var h=p.querySelector(".vp-handle");if(!h)return;var from=+h.getAttribute("aria-valuenow");if(reduce||!window.requestAnimationFrame){setPos(p,to);return}var t0=null;(function f(ts){if(t0===null)t0=ts;var u=cl((ts-t0)/320,0,1);u=1-Math.pow(1-u,3);setPos(p,from+(to-from)*u);if(u<1)requestAnimationFrame(f)})(performance.now())}
function cmp(p,on){var b=p.querySelector(".vp-cmp"),h=p.querySelector(".vp-handle");if(!b)return;b.setAttribute("aria-pressed",on?"true":"false");b.querySelector("span").textContent=on?"Hide before and after":"Compare before and after";p.classList.toggle("vp-cmp-on",on);h.tabIndex=on?0:-1;if(on)h.removeAttribute("aria-hidden");else h.setAttribute("aria-hidden","true");slide(p,on?50:0)}
function show(i,focus){i=(i+tabs.length)%tabs.length;if(i===cur&&!focus&&panels[i].hidden===false)return;var old=panels[cur];if(old&&old.classList.contains("vp-cmp-on"))cmp(old,false);cur=i;
tabs.forEach(function(t,j){var on=j===i;t.setAttribute("aria-selected",on?"true":"false");t.tabIndex=on?0:-1;panels[j].hidden=!on;panels[j].classList.toggle("vp-in",on)});
var t=tabs[i];if(strip.scrollWidth>strip.clientWidth){var l=t.offsetLeft-strip.offsetLeft-24;strip.scrollTo?strip.scrollTo({left:l,behavior:reduce?"auto":"smooth"}):(strip.scrollLeft=l)}
if(focus)t.focus({preventScroll:true})}
tabs.forEach(function(t,i){t.addEventListener("click",function(){show(i,false)});t.addEventListener("keydown",function(e){var k=e.key,to=-1;if(k==="ArrowRight"||k==="ArrowDown")to=i+1;else if(k==="ArrowLeft"||k==="ArrowUp")to=i-1;else if(k==="Home")to=0;else if(k==="End")to=tabs.length-1;if(to!==-1){e.preventDefault();show(to,true)}})});
panels.forEach(function(p,i){
  p.hidden=i!==0;
  var pv=p.querySelector(".vp-prev"),nx=p.querySelector(".vp-next");pv.addEventListener("click",function(){show(cur-1,false);panels[cur].querySelector(".vp-prev").focus({preventScroll:true})});nx.addEventListener("click",function(){show(cur+1,false);panels[cur].querySelector(".vp-next").focus({preventScroll:true})});
  var b=p.querySelector(".vp-cmp");if(b)b.addEventListener("click",function(){cmp(p,b.getAttribute("aria-pressed")!=="true")});
  var ba=p.querySelector(".vp-ba"),h=p.querySelector(".vp-handle"),drag=false,sx=0,sy=0,swipe=false;
  var fromX=function(x){var r=ba.getBoundingClientRect();setPos(p,(x-r.left)/r.width*100)};
  ba.addEventListener("pointerdown",function(e){if(e.pointerType==="mouse"&&e.button!==0)return;if(p.classList.contains("vp-cmp-on")){drag=true;try{ba.setPointerCapture(e.pointerId)}catch(_){}fromX(e.clientX)}else{swipe=true;sx=e.clientX;sy=e.clientY}});
  ba.addEventListener("pointermove",function(e){if(drag)fromX(e.clientX)});
  ba.addEventListener("pointerup",function(e){drag=false;if(swipe){swipe=false;var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)show(cur+(dx<0?1:-1),false)}});
  ba.addEventListener("pointercancel",function(){drag=false;swipe=false});
  if(h)h.addEventListener("keydown",function(e){if(!p.classList.contains("vp-cmp-on")&&/^(Arrow|Page|Home|End)/.test(e.key)){var cb=p.querySelector(".vp-cmp");p.classList.add("vp-cmp-on");h.tabIndex=0;h.removeAttribute("aria-hidden");if(cb){cb.setAttribute("aria-pressed","true");cb.querySelector("span").textContent="Hide before and after"}}var v=+h.getAttribute("aria-valuenow"),k=e.key,nv=v;if(k==="ArrowLeft"||k==="ArrowDown")nv=v-5;else if(k==="ArrowRight"||k==="ArrowUp")nv=v+5;else if(k==="PageDown")nv=v-20;else if(k==="PageUp")nv=v+20;else if(k==="Home")nv=0;else if(k==="End")nv=100;else return;e.preventDefault();setPos(p,nv)});
});
panels[0].hidden=false;
/* load every picture once the section is near, so switching never flashes */
var warm=function(){[].forEach.call(S.querySelectorAll("img[loading=lazy]"),function(im){im.loading="eager"})};
if("IntersectionObserver" in window){var wio=new IntersectionObserver(function(es){if(es[0].isIntersecting){warm();wio.disconnect()}},{rootMargin:"600px 0px"});wio.observe(S)}else warm();
addEventListener("resize",function(){var p=panels[cur],h=p&&p.querySelector(".vp-handle");if(h)setPos(p,+h.getAttribute("aria-valuenow"))});
/* "Ask about this": close any open dialog and pick the matching job in the form; the link scrolls to it */
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-job]");if(!a)return;var dlg=a.closest("dialog");if(dlg&&dlg.open)dlg.close();var sel=document.querySelector("#ask select"),v=a.getAttribute("data-job");if(sel)for(var i=0;i<sel.options.length;i++)if(sel.options[i].text===v){sel.selectedIndex=i;break}});
})();`;
