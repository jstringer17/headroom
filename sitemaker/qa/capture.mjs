// Review pack. One command:  node sitemaker/qa/capture.mjs [trade ...]
// Default trades: fencing roofing pressure. Output: sitemaker/qa/out/ (index.html contact sheet).
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { here, loadPlaywright, launchOpts, SEL, buildCine, firstCell, fullTable } from "./lib.mjs";

const trades = process.argv.slice(2).length ? process.argv.slice(2) : ["fencing", "roofing", "pressure"];
const out = join(here, "out");
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const sheet = {}; // trade -> list of {w, kind, file, label}
let realBuild = false;

for (const trade of trades) {
  const [sz, op] = await firstCell(trade);
  const form = { company: "Sample " + trade + " Co", trade, city: "Tulsa, OK", phone: "918-555-0100", year: 2026, rating: "4.8", reviews: "112", years: "12", insured: true, // test facts typed in so trust line can be judged
   
    cine: { prices: await fullTable(trade) } };
  const b = buildCine(form); realBuild ||= b.real;
  writeFileSync(join(out, `${trade}.html`), b.html);
  sheet[trade] = [];
  for (const width of [375, 1280]) {
    const shot = async (page, name, label, opts = {}) => { const f = `${trade}-${width}-${name}.jpg`; await page.screenshot({ path: join(out, f), type: "jpeg", quality: 70, ...opts }); sheet[trade].push({ w: width, file: f, label }); };
    for (const reduced of [false, true]) {
      const ctx = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: reduced ? "reduce" : "no-preference", viewport: { width, height: width === 375 ? 812 : 800 }, hasTouch: width === 375 });
      const page = await ctx.newPage();
      await page.route("**/*", (r) => { const u = r.request().url(); return /^(file|data):/.test(u) || /fonts\.(googleapis|gstatic)\.com/.test(u) ? r.continue() : r.abort(); });
      await page.goto(pathToFileURL(join(out, `${trade}.html`)).href, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      if (reduced) { await shot(page, "reduced-motion", "Reduced motion (full page)", { fullPage: true }); await ctx.close(); continue; }
      const H = await page.evaluate(() => document.documentElement.scrollHeight); // let scroll reveals finish before the full-page shot
      for (let y = 0; y < H; y += 300) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(60); }
      await page.waitForTimeout(500); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
      await shot(page, "full", "Full page (after scrolling through once)", { fullPage: true });
      // 10 frames down the scroll story (or the page if no story marker)
      const story = await page.$(SEL.story);
      const top = story ? await story.evaluate((e) => e.getBoundingClientRect().top + scrollY) : 0;
      const len = story ? await story.evaluate((e) => e.offsetHeight - innerHeight) : await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      for (let i = 0; i < 10; i++) {
        await page.evaluate((y) => scrollTo(0, y), top + (len * i) / 9);
        await page.waitForTimeout(350);
        await shot(page, `frame${String(i + 1).padStart(2, "0")}`, `Scroll frame ${i + 1}/10`);
      }
      // each tab
      const tabs = await page.$$(SEL.tab);
      if (tabs.length) await page.evaluate(() => { const t = document.querySelector('[role="tab"]'); const s = t.closest("section") || t; scrollTo(0, s.getBoundingClientRect().top + scrollY); });
      for (let i = 0; i < tabs.length; i++) { await tabs[i].click(); await page.waitForTimeout(450); await shot(page, `tab${i + 1}`, `Tab ${i + 1}: ${(await tabs[i].textContent()).trim()}`); }
      // slider 0 / 50 / 100
      const sl = await page.$(SEL.slider);
      if (sl) { await sl.scrollIntoViewIfNeeded(); await sl.focus();
        for (const [k, v] of [["Home", 0], ["", 50], ["End", 100]]) {
          if (k) await page.keyboard.press(k); else { await page.keyboard.press("Home"); for (let n = 0; n < 50 && +(await sl.getAttribute("aria-valuenow")) < 50; n++) await page.keyboard.press("ArrowRight"); }
          await page.waitForTimeout(250); await shot(page, `slider${v}`, `Slider at ${v}`);
        } }
      // estimator with a typed price table
      const est = await page.$(SEL.estimator);
      if (est) { await est.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); await shot(page, "estimator", "Estimator (test price table typed in, not real prices)"); }
      else sheet[trade].push({ w: width, file: "", label: "Estimator not found (hidden or not built)" });
      await ctx.close();
    }
  }
}
await browser.close();

const reel = readFileSync(join(here, "..", "..", "org", "inspiration", "lynam_up-reels.md"), "utf8").split("## Update:")[1] || "";
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cine QA pack</title>
<style>body{font:14px system-ui;margin:0;padding:16px;background:#111;color:#eee}h2{margin-top:32px}.g{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0}img{display:block;border:1px solid #444;max-height:420px}.w375 img{max-width:200px}.w1280 img{max-width:420px}figcaption{font-size:12px;color:#aaa;margin-top:4px}pre{white-space:pre-wrap;background:#222;padding:12px;max-width:900px}</style>
<h1>Cine QA pack</h1><p>${realBuild ? "Real cinematic build." : "NOT the real build: hand-made sample page. Do not score."} Rubric: sitemaker/qa/RUBRIC.md</p>
<h2>Reel notes (the bar)</h2><pre>${esc(reel.trim())}</pre>
${trades.map((t) => `<h2>${t}</h2><p><a href="${t}.html">${t}.html</a></p><div class="g">${sheet[t].map((s) => `<figure class="w${s.w}">${s.file ? `<img loading="lazy" src="${s.file}">` : ""}<figcaption>${s.w}px · ${esc(s.label)}</figcaption></figure>`).join("")}</div>`).join("")}`;
writeFileSync(join(out, "index.html"), html);
console.log(`Pack: ${out}/index.html (${realBuild ? "real build" : "sample page, not the real build"}); trades: ${trades.join(", ")}`);
