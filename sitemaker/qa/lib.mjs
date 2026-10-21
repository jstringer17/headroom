// Shared helpers for test-cine.mjs and qa/capture.mjs (owned by cine-qa).
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateSite } from "../src/generate.js";

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
  story: "[data-cine-story], .cine-story",
  tab: '[role="tab"]',
  slider: '[role="slider"]',
  estimator: "[data-cine-estimator], #estimator",
  placeholder: "[data-placeholder]",
};

// A tiny hand-made page that follows the contract. Used until the real build lands.
export function samplePage({ prices = false } = {}) {
  const est = prices
    ? `<section id="estimator" data-cine-estimator><h2>Price it</h2><select id="sz"><option>Small</option></select><button id="go" type="button">Show</button><p id="out">$1,000 to $2,000</p></section>`
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

// Builds a cinematic site. real=true only when the engine marks its output with data-cine.
export function buildCine(form) {
  let html = "";
  try { html = generateSite({ ...form, cinematic: true }); } catch { /* engine not merged yet */ }
  const real = /data-cine/.test(html);
  return real ? { html, real } : { html: samplePage({ prices: !!form.cine?.prices }), real: false };
}
