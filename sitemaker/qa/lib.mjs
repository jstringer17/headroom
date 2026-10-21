// Shared helpers for test-cine.mjs and qa/capture.mjs (owned by cine-qa).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateSite, useCine } from "../src/generate.js";
import { CINE_KIT } from "../src/cine-kit.js";
import { cineLook, placeholderArt } from "../src/cine-look.js";
useCine({ CINE_KIT, cineLook, placeholderArt }); // same wiring build.mjs appends to maker.html

export const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function loadPlaywright() {
  try { return require("playwright"); } catch {
    return require(join(execSync("npm root -g").toString().trim(), "playwright"));
  }
}
export const launchOpts = () => (process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});

// Selectors the cinematic build is expected to expose (see org/plan.md contract).
export const SEL = {
  story: "#story, [data-cine-story]",
  tab: '[role="tab"]',
  slider: '[role="slider"]',
  estimator: "#price, [data-cine-estimator], #estimator",
  unit: ".est-unit",
  // Placeholder art is an inline SVG data URI (placeholderArt); its label is inside the SVG text.
  placeholder: 'img[src^="data:image/svg+xml"], [data-placeholder]',
};

// A tiny hand-made page that follows the contract. Used until the real build lands.
// 19 trades: the 16 classic ones plus the three new ones (CEO 2026-10-21).
// Editorial look (org/inspiration/northpeak-editorial.md). The build is "editorial" when its output says so.
export const isEditorial = (html) => /data-look="editorial"|class="[^"]*\beditorial\b/.test(html);
export const ED = {
  hero: '[data-ed="hero"], .ed-hero',
  work: '[data-ed="work"] [data-ed="card"], .ed-work .ed-card',
  rows: '[data-ed="row"], .ed-row',
  rowImg: '[data-ed="row-img"], .ed-row-img img, .ed-service-img img',
  trust: '[data-ed="trust"], .ed-trust',
  trustCell: '[data-ed="trust"] > *',
  nav: "nav, header",
};
export const NEW_TRADES = ["restoration", "homebuilder", "framing"];
// Expected estimator unit text per trade (engine default; everything else is "per job").
export const UNIT_BY_TRADE = { roofing: "per sq ft", fencing: "per linear foot", pressure: "per sq ft", hvac: "per job", restoration: "per job", homebuilder: "per sq ft", framing: "per sq ft" };
export const unitFor = (t) => UNIT_BY_TRADE[t] || "per job";

// Label text of a placeholder: decodes an SVG data URI, or reads element text.
export const placeholderText = (src) => { try { return decodeURIComponent(src.replace(/^data:image\/svg\+xml[^,]*,/, "")); } catch { return src; } };

// First (size, option) of the trade's kit, for filling one price cell. Falls back to placeholders if the kit is missing.
// Every size x option of the kit as a typed price table (test data, clearly not real prices).
// Test-only sample ranges so the pack looks sane for each unit. Typed data, not real prices.
const SAMPLE_RANGE = { "per linear foot": [22, 34, 4], "per sq ft": [6, 11, 2], "per job": [900, 1600, 250] };
export async function fullTable(trade) {
  try { const k = (await import("./../src/cine-kit.js")).CINE_KIT[trade].estimator; const base = SAMPLE_RANGE[unitFor(trade)] || SAMPLE_RANGE["per job"]; const t = {}; k.sizes.forEach((sz, i) => { t[sz] = {}; k.options.forEach((op, j) => { t[sz][op] = { low: String(base[0] + (i * 3 + j) * base[2]), high: String(base[1] + (i * 3 + j) * base[2]) }; }); }); return t; } catch { return {}; }
}
export async function firstCell(trade) {
  try { const k = (await import("./../src/cine-kit.js")).CINE_KIT[trade].estimator; return [k.sizes[0], k.options[0]]; } catch { return ["__first", "__first"]; }
}

export function samplePage({ prices = false } = {}) {
  const est = prices
    ? `<section id="estimator" data-cine-estimator><h2>Price it</h2><select id="sz"><option>Small</option></select><button id="go" type="button">Show</button><p id="out">$1,000 to $2,000</p><p class="est-unit">per job</p></section>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sample</title>
<style>body{margin:0;font:16px sans-serif}section{padding:40px 16px}.story{height:300vh}.frame{position:sticky;top:0;height:100vh;background:#456;color:#fff;transition:opacity .3s}
.ph{display:block;width:100%;height:200px;background:#ccc}.sl{position:relative;height:40px;background:#eee}.knob{position:absolute;left:50%;width:20px;height:40px;background:#c60}
@media (prefers-reduced-motion:reduce){.frame{transition:none}}</style></head><body>
<div class="story" data-cine-story><div class="frame"><h1>Sample story</h1></div></div>
<section><div role="tablist"><button role="tab" aria-selected="true" id="t1">One</button><button role="tab" aria-selected="false" id="t2">Two</button></div>
<div data-placeholder>Sample picture: make in Higgsfield</div></section>
<section><div class="sl"><div class="knob" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div></div></section>
${est}<section id="contact"><a href="tel:9185550100" class="btn">Call</a><form><input name="n"></form></section>
<script>
document.querySelectorAll('[role=tab]').forEach(function(t,i,all){t.addEventListener('click',function(){all.forEach(function(x){x.setAttribute('aria-selected',x===t)})});t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){var n=all[(i+1)%all.length];n.focus();n.click()}})});
var k=document.querySelector('[role=slider]');function s(v){v=Math.max(0,Math.min(100,v));k.setAttribute('aria-valuenow',v);k.style.left=v+'%'}
k.addEventListener('keydown',function(e){var v=+k.getAttribute('aria-valuenow');if(e.key==='ArrowRight')s(v+10);if(e.key==='ArrowLeft')s(v-10);if(e.key==='Home')s(0);if(e.key==='End')s(100)});
k.parentElement.addEventListener('pointerdown',function(e){var r=k.parentElement.getBoundingClientRect();s((e.clientX-r.left)/r.width*100)});
</script></body></html>`;
}

// Builds a cinematic site. real=true only when the engine output has the scroll story; without the cine-art files generateSite quietly returns the classic site.
// look: "cinematic" (default) or "editorial". Passed both as form.look and form.cine.look until the engine fixes its name.
export function buildCine(form, look = "cinematic") {
  let html = "";
  try { html = generateSite({ ...form, cinematic: true, look, cine: { ...(form.cine || {}), look } }); } catch { /* engine not merged yet */ }
  const real = (/id="story"/.test(html) && /id="contact"/.test(html)) || isEditorial(html);
  return real ? { html, real } : { html: samplePage({ prices: !!form.cine?.prices }), real: false };
}
