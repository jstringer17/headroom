// Sample Site Maker tests.
//   node sitemaker/build.mjs --test && node sitemaker/test.mjs
// Uses the Playwright install on this machine (global or local) and its
// Chromium. Writes screenshots to sitemaker/test-shots/ and generated
// sites to sitemaker/test-out/ (gitignored).
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, rmSync, statSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { generateSite, parseLead, guessTrade } from "./src/generate.js";
import { TRADES, TRADE_ORDER } from "./src/trades.js";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch {
  playwright = require(join(execSync("npm root -g").toString().trim(), "playwright"));
}

const outDir = join(here, "test-out");
const shotDir = join(here, "test-shots");
rmSync(outDir, { recursive: true, force: true });
rmSync(shotDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(shotDir, { recursive: true });

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const BANNED = /award[- ]winning|best in (town|the)|#1\b|number one|trusted by|5-star service|guaranteed|top[- ]rated|same day|cleans? up after|fixed fast|fix it fast|done right|built to last/i;

// ---- 1. pure function checks ----
for (const key of TRADE_ORDER) {
  const html = generateSite({ company: "Test Co", trade: key, year: 2026 });
  ok(html === generateSite({ company: "Test Co", trade: key, year: 2026 }), `${key}: generator is not deterministic`);
  ok(!/<img\b/i.test(html), `${key}: has <img> without a hero picture`);
  ok(/no people/i.test(TRADES[key].prompt) && /no text/i.test(TRADES[key].prompt), `${key}: Higgsfield prompt must say no people and no text`);
  ok(TRADES[key].line && /class="[a-z-]*art (solid|strokes)"/.test(html), `${key}: trade drawing missing`);
  ok(!BANNED.test(html.replace(/<style[\s\S]*?<\/style>/, "")), `${key}: banned claim in copy`);
  ok(!/<script[^>]+src=/i.test(html), `${key}: loads an outside script`);
  const ext = [...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  ok(ext.length === 0, `${key}: outside links ${ext.join(",")}`);
}
// no rating typed -> no stars or count, but the reviews block shows 3 marked SAMPLE reviews
{
  const html = generateSite({ company: "Test Co", trade: "roofing" });
  ok(html.includes('id="reviews"') && !html.includes("out of 5 stars\"><span class=\"stars-row") && html.includes("Sample review, replace with a real one"), "no-rating: reviews block must show marked samples and no rating");
  ok(!html.includes("24/7") && !html.includes("Open 24 hours"), "default: 24/7 claim shown");
  ok(html.includes("Ask about emergency service"), "default: emergency line missing");
  ok(html.includes("Free estimates"), "default: roofing free estimates missing");
  for (const k of ["towing", "junk", "hvac"]) ok(!generateSite({ company: "T", trade: k }).includes("Free estimates"), `default: ${k} shows free estimates`);
  const e = generateSite({ company: "T", trade: "plumbing", emergency: true, rating: "4.2" });
  ok(e.includes("Open 24 hours") && !e.includes("Ask about emergency service") && e.includes('id="reviews"') && e.includes("Sample review, replace with a real one"), "ticked: 24/7 or reviews wrong");
  const h2 = generateSite({ company: "<b>x</b>", trade: "hvac", rating: "4.6", reviews: "38" });
  ok(h2.includes("4.6") && h2.includes("From 38 Google reviews"), "rating: typed numbers not shown");
  ok(!h2.includes("<b>x</b>"), "escape: company name not escaped");
}
// hero picture: data URI or https only, one <img>, no signature line
{
  const px = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
  const h = generateSite({ company: "T", trade: "roofing", heroImage: px });
  ok((h.match(/<img\b/g) || []).length === 1 && h.includes("hero-img") && !/art (solid|strokes)/.test(h), "hero: data picture not used");
  ok(generateSite({ company: "T", trade: "roofing", heroImage: "https://example.com/a.jpg" }).includes('src="https://example.com/a.jpg"'), "hero: https link not used");
  for (const bad of ["javascript:alert(1)", 'https://x.com/a.jpg" onerror="x', "data:text/html;base64,AAAA"]) ok(!/<img\b/.test(generateSite({ company: "T", trade: "roofing", heroImage: bad })), "hero: unsafe picture accepted: " + bad);
}
// lead paste
{
  const a = parseLead('{"n":"Acme Roofing LLC","c":"Roofing contractor","r":4.6,"p":"(918) 555-0142","t":"Tulsa","s":"OK","q":"roofer"}');
  ok(a.company === "Acme Roofing LLC" && a.trade === "roofing" && a.city === "Tulsa, OK" && a.rating === "4.6" && a.phone === "(918) 555-0142", "lead json: " + JSON.stringify(a));
  const b = parseLead("Cool Breeze Heating & Air\n4.8 (112)\nHVAC contractor\n123 Main St, Broken Arrow, OK 74012\n(918) 555-0199");
  ok(b.company === "Cool Breeze Heating & Air" && b.trade === "hvac" && b.rating === "4.8" && b.reviews === "112" && b.city === "Broken Arrow, OK" && b.phone === "(918) 555-0199", "lead text: " + JSON.stringify(b));
  ok(guessTrade("Tree service") === "tree" && guessTrade("Garage door supplier") === "garage", "guessTrade");
}

// ---- 2. browser checks: every trade, phone + computer width ----
const browser = await playwright.chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctxOpts = { ignoreHTTPSErrors: true, reducedMotion: "reduce" }; // only fonts go out, through the sandbox proxy
const offsite = [];

async function checkPage(page, label, imgCount = 0, fontsLoaded = true) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const empty = [];
    document.querySelectorAll("header, section, footer").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === "none") return;
      const txt = el.innerText.trim();
      if (txt.length < 8 || el.getBoundingClientRect().height < 30) empty.push(el.id || el.className || el.tagName);
    });
    const wide = [...document.querySelectorAll("body *")].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.right > doc.clientWidth + 1 || b.left < -1) && getComputedStyle(el).position !== "absolute";
    }).slice(0, 3).map((el) => el.tagName + "." + el.className);
    const h1 = document.querySelector("h1");
    const h1Lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
    const calls = [...document.querySelectorAll('a[href^="tel:"].btn, a[href="#contact"].btn')].filter((a) => {
      const b = a.getBoundingClientRect(); const cs = getComputedStyle(a);
      let vis = b.width > 0 && b.bottom > 0 && b.top < innerHeight && cs.visibility !== "hidden" && cs.opacity !== "0";
      for (let el = a; el && vis; el = el.parentElement) { const c = getComputedStyle(el); if (c.opacity === "0" || c.display === "none") vis = false; if (el.classList.contains("mobile-call") && c.transform !== "none" && el.getBoundingClientRect().top >= innerHeight - 1) vis = false; }
      return vis && /Call/.test(a.textContent);
    }).length;
    return { sw: doc.scrollWidth, cw: doc.clientWidth, empty, wide, imgs: document.images.length, h1Lines, calls };
  });
  ok(r.sw <= r.cw, `${label}: sideways scroll (${r.sw} > ${r.cw}) ${r.wide.join(" ")}`);
  ok(r.empty.length === 0, `${label}: empty sections ${r.empty.join(",")}`);
  ok(r.imgs === imgCount, `${label}: ${r.imgs} images, expected ${imgCount}`);
  // Line count is set for the web font; offline the fallback font is wider.
  if (fontsLoaded) ok(r.h1Lines <= 3, `${label}: headline is ${r.h1Lines} lines`);
  ok(r.calls === 1, `${label}: ${r.calls} call buttons in the first screen`);
  return r;
}

const sets = TRADE_ORDER.map((key, i) => ({
  key,
  form: {
    company: `Sample ${TRADES[key].label.replace(/ \(.*\)/, "")} Co`, trade: key, city: "Tulsa, OK", phone: "918-555-01" + String(i).padStart(2, "0"),
    rating: (4 + (i % 10) / 10).toFixed(1), reviews: String(20 + i * 7), years: String(3 + i), insured: i % 2 === 0, emergency: i % 3 === 0, year: 2026,
  },
}));
// bare minimum (name + trade only) for the two lead trades
sets.push({ key: "roofing-min", form: { company: "Ridge Top Roofing", trade: "roofing", year: 2026 } });
sets.push({ key: "hvac-min", form: { company: "North Wind Heating and Air", trade: "hvac", year: 2026 } });

const ctx = await browser.newContext(ctxOpts);
for (const { key, form } of sets) {
  const file = join(outDir, `${key}.html`);
  writeFileSync(file, generateSite(form));
  for (const width of [375, 1280]) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height: width === 375 ? 812 : 800 });
    await page.route("**/*", (route) => {
      const u = route.request().url();
      if (u.startsWith("file:") || /fonts\.(googleapis|gstatic)\.com/.test(u) || u.startsWith("data:")) return route.continue();
      offsite.push(`${key}: ${u}`);
      return route.abort();
    });
    await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await checkPage(page, `${key}@${width}`);
    if (form.rating) {
      const txt = await page.evaluate(() => document.body.innerText);
      const times = txt.split(form.rating).length - 1;
      ok(times === 1, `${key}@${width}: rating ${form.rating} shown ${times} times`);
      ok(txt.includes("Sample review, replace with a real one"), `${key}@${width}: sample review tag missing`);
    }
    // Full page for the two lead trades; first screen for the rest keeps the folder small.
    const full = /^(roofing|hvac|towing)$/.test(key);
    await page.screenshot({ path: join(shotDir, `${key}-${width}.jpg`), type: "jpeg", quality: full ? 45 : 40, fullPage: full });
    await page.close();
  }
}
ok(offsite.length === 0, `sites asked the network for: ${offsite.slice(0, 5).join(" | ")}`);

// phone, first screen, viewport only: one call button, call bar off screen, with and without JavaScript
for (const js of [true, false]) {
  const c = await browser.newContext({ ...ctxOpts, javaScriptEnabled: js, viewport: { width: 375, height: 667 } });
  for (const key of ["roofing", "hvac", "towing"]) {
    const page = await c.newPage();
    await page.goto(pathToFileURL(join(outDir, `${key}.html`)).href, { waitUntil: "load" });
    await page.waitForTimeout(300);
    const r = await checkPage(page, `${key}@375x667${js ? "" : "-nojs"}`);
    const bar = await page.evaluate(() => { const b = document.querySelector(".mobile-call"); return { top: b.getBoundingClientRect().top, vis: getComputedStyle(b).visibility }; });
    ok(bar.top >= 667 || bar.vis === "hidden", `${key}@375x667${js ? "" : "-nojs"}: call bar visible in first screen`);
    if (js) await page.screenshot({ path: join(shotDir, `${key}-375x667-first-screen.jpg`), type: "jpeg", quality: 50 });
    await page.close();
  }
  await c.close();
}

// phone: at the very bottom, the call bar must not cover the footer
{
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(pathToFileURL(join(outDir, "roofing.html")).href, { waitUntil: "load" });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const cover = await page.evaluate(() => {
    const bar = document.querySelector(".mobile-call").getBoundingClientRect();
    const last = document.querySelector(".foot-base").getBoundingClientRect();
    return { barTop: bar.top, lastBottom: last.bottom };
  });
  ok(cover.lastBottom <= cover.barTop + 1, `call bar covers the footer (${JSON.stringify(cover)})`);
  await page.close();
}

// motion on: every section still ends up visible after scrolling through
{
  const mctx = await browser.newContext({ ...ctxOpts, reducedMotion: "no-preference" });
  const page = await mctx.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(pathToFileURL(join(outDir, "roofing.html")).href, { waitUntil: "load" });
  for (let y = 0; y < 9000; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(1200);
  const hidden = await page.evaluate(() => [...document.querySelectorAll(".rv")].filter((el) => getComputedStyle(el).opacity !== "1").length);
  ok(hidden === 0, `motion: ${hidden} parts still hidden after scrolling`);
  await mctx.close();
}

// a big test picture for the hero upload
const bigJpg = join(outDir, "big-hero.jpg");
execSync(`ffmpeg -loglevel error -y -f lavfi -i testsrc2=size=3200x2000 -frames:v 1 -q:v 2 "${bigJpg}"`);

// ---- 3. the maker page itself ----
const makerFile = pathToFileURL(join(here, "maker.html")).href;
for (const width of [375, 1280]) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(makerFile, { waitUntil: "load" });
  await page.selectOption("#look", "classic"); // these checks are about the classic site; the default look is Cinematic
  await page.fill("#company", "Ridge Top Roofing");
  await page.fill("#city", "Tulsa, OK");
  await page.waitForTimeout(400);
  let doc = await page.frameLocator("#frame").locator("h1").innerText();
  ok(/roof/i.test(doc), `maker@${width}: roofing preview missing (${doc})`);
  ok((await page.frameLocator("#frame").locator(".brand-name").textContent()) === "Ridge Top Roofing", `maker@${width}: name not in preview`);
  await page.selectOption("#trade", "hvac");
  await page.fill("#company", "North Wind Heating and Air");
  await page.waitForTimeout(400);
  doc = await page.frameLocator("#frame").locator("h1").innerText();
  ok(/heating/i.test(doc), `maker@${width}: HVAC preview missing (${doc})`);
  // lead paste
  await page.click("#lead-box summary");
  await page.fill("#lead-paste", "Cool Breeze Heating & Air\n4.8 (112)\n(918) 555-0199\nBroken Arrow, OK");
  await page.click("#lead-fill");
  await page.waitForTimeout(400);
  ok((await page.inputValue("#company")) === "Cool Breeze Heating & Air" && (await page.inputValue("#rating")) === "4.8", `maker@${width}: lead fill failed`);
  ok((await page.frameLocator("#frame").locator(".rating-num").innerText()) === "4.8", `maker@${width}: rating not in preview`);
  // Higgsfield prompt follows the trade
  ok(/no people/i.test(await page.inputValue("#higgs-prompt")) && /air conditioner/i.test(await page.inputValue("#higgs-prompt")), `maker@${width}: Higgsfield prompt missing`);
  // hero picture upload gets shrunk and embedded
  await page.setInputFiles("#hero-file", bigJpg);
  await page.waitForFunction(() => /Picture added/.test(document.getElementById("hero-status").textContent), null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const hero = await page.frameLocator("#frame").locator(".hero-img").evaluate((im) => ({ w: im.naturalWidth, len: im.getAttribute("src").length }));
  ok(hero.w <= 1600 && hero.w > 0 && hero.len * 0.75 <= 410 * 1024, `maker@${width}: hero picture not shrunk (${hero.w}px, ${Math.round(hero.len * 0.75 / 1024)} KB)`);
  // download (outside Claude it is a plain browser download)
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
  const saved = join(outDir, `maker-download-${width}.html`);
  await dl.saveAs(saved);
  ok(statSync(saved).size > 10000 && dl.suggestedFilename() === "cool-breeze-heating-and-air-sample-site.html", `maker@${width}: download bad (${dl.suggestedFilename()})`);
  const sw = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  ok(sw[0] <= sw[1], `maker@${width}: sideways scroll ${sw}`);
  ok(errors.length === 0, `maker@${width}: page errors ${errors.join(";")}`);
  await page.screenshot({ path: join(shotDir, `maker-${width}.jpg`), type: "jpeg", quality: 50, fullPage: width === 375 ? false : true });
  await page.close();
}
// the downloaded file opens alone with the network off (no fonts either)
{
  const off = await browser.newContext({ offline: true });
  const page = await off.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(pathToFileURL(join(outDir, "maker-download-375.html")).href, { waitUntil: "load" });
  const r = await checkPage(page, "download-offline@375", 1, false);
  ok((await page.locator(".brand-name").textContent()) === "Cool Breeze Heating & Air", "download-offline: wrong content");
  ok((await page.locator(".hero-img").count()) === 1, "download-offline: hero picture not inside the file");
  await off.close();
}
await browser.close();

const shots = readdirSync(shotDir);
const kb = shots.reduce((s, f) => s + statSync(join(shotDir, f)).size, 0) / 1024;
console.log(`trades: ${TRADE_ORDER.length}, sites rendered: ${sets.length} x 2 widths, screenshots: ${shots.length} (${kb.toFixed(0)} KB)`);
if (fails.length) { console.log("FAIL\n- " + fails.join("\n- ")); process.exit(1); }
console.log("PASS: all checks");
