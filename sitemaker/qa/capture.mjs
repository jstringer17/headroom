// Review pack. One command:  node sitemaker/qa/capture.mjs [trade ...]
// Default trades: fencing roofing pressure. Output: sitemaker/qa/out/ (index.html contact sheet).
import { mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { here, loadPlaywright, launchOpts, SEL, buildCine, firstCell, fullTable, isEditorial, ED } from "./lib.mjs";

// node sitemaker/qa/capture.mjs [--look=editorial] [trade ...]   (default look: cinematic)
const args = process.argv.slice(2);
const look = (args.find((a) => a.startsWith("--look=")) || "--look=cinematic").split("=")[1];
const trades = args.filter((a) => !a.startsWith("--")).length ? args.filter((a) => !a.startsWith("--")) : ["fencing", "roofing", "pressure"];
const outName = (args.find((a) => a.startsWith("--out=")) || "").split("=")[1];
const out = join(here, outName || (look === "cinematic" ? "out" : `out-${look}`));
try { rmSync(out, { recursive: true, force: true }); } catch { /* stuck empty dir: reuse it */ } mkdirSync(out, { recursive: true });
const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const sheet = {}; // trade -> list of {w, kind, file, label}
let realBuild = false;

const toSection = (page, sel) => page.evaluate((q) => { const e = document.querySelector(q); const sec = e.closest("section") || e; scrollTo(0, sec.getBoundingClientRect().top + scrollY - 70); }, sel);
for (const trade of trades) {
  const [sz, op] = await firstCell(trade);
  const form = { company: "Sample " + trade + " Co", trade, city: "Tulsa, OK", phone: "918-555-0100", year: 2026, rating: "4.8", reviews: "112", years: "12", insured: true, // test facts typed in so trust line can be judged
   
    cine: { prices: await fullTable(trade) } };
  const b = buildCine(form, look); realBuild ||= b.real;
  if (look === "editorial" && !isEditorial(b.html)) { console.log(`NOTE ${trade}: build is not editorial yet, shots would be the cinematic look`); }
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
      if (tabs.length) await toSection(page, SEL.tab);
      for (let i = 0; i < tabs.length; i++) { await tabs[i].click(); await page.waitForTimeout(450); await shot(page, `tab${i + 1}`, `Tab ${i + 1}: ${(await tabs[i].textContent()).trim()}`); }
      // slider 0 / 50 / 100
      const sl = await page.$(SEL.slider);
      if (sl) { await toSection(page, SEL.slider); await page.waitForTimeout(300); await sl.focus({ preventScroll: true });
        for (const [k, v] of [["Home", 0], ["", 50], ["End", 100]]) {
          if (k) await page.keyboard.press(k); else { await page.keyboard.press("Home"); for (let n = 0; n < 50 && +(await sl.getAttribute("aria-valuenow")) < 50; n++) await page.keyboard.press("ArrowRight"); }
          await page.waitForTimeout(250); await shot(page, `slider${v}`, `Slider at ${v}`);
        } }
      // estimator with a typed price table
      const est = await page.$(SEL.estimator);
      if (est) { await toSection(page, SEL.estimator); await page.waitForTimeout(400); await shot(page, "estimator", "Estimator (test price table typed in, not real prices)"); }
      else sheet[trade].push({ w: width, file: "", label: "Estimator not found (hidden or not built)" });
      if (look === "editorial") {
        const el = async (sel, name, label) => { const h = await page.$(sel); if (!h) { sheet[trade].push({ w: width, file: "", label: `${label}: NOT FOUND (${sel})` }); return; } await toSection(page, sel); await page.waitForTimeout(500); await shot(page, name, label); };
        await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
        await shot(page, "ed-hero", "Editorial: hero silhouette");
        await el(ED.work, "ed-work", "Editorial: work cards");
        const rows = await page.$$(ED.rows);
        for (let i = 0; i < Math.min(rows.length, 3); i++) { if (i === 0) await toSection(page, ED.rows); await rows[i].click().catch(() => {}); await page.waitForTimeout(500); await shot(page, `ed-row${i + 1}`, `Editorial: service row ${i + 1} (picture swap)`); }
        await el(ED.trust, "ed-trust", "Editorial: trust strip");
        await page.evaluate(() => scrollTo(0, 600)); await page.waitForTimeout(300); await shot(page, "ed-nav", "Editorial: sticky nav while scrolled");
      }
      await ctx.close();
    }
  }
}
await browser.close();

const insp = (f) => readFileSync(join(here, "..", "..", "org", "inspiration", f), "utf8");
const reel = look === "editorial" ? insp("northpeak-editorial.md") : insp("lynam_up-reels.md").split("## Update:")[1] || "";
const cover = (t, w) => { const f = sheet[t].filter((x) => x.w === w && x.file); const n = (k) => f.filter((x) => x.file.includes(k)).length; return `<tr><td>${t}</td><td>${w}</td><td>${n("-frame")}/10</td>${look === "editorial" ? "" : `<td>${n("-tab")}</td><td>${n("-slider")}/3</td>`}<td>${n("-estimator")}/1</td><td>${n("-full")}/1</td><td>${n("-reduced")}/1</td>${look === "editorial" ? `<td>${n("-ed-")}</td>` : ""}</tr>`; };
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cine QA pack (${look})</title>
<style>body{font:14px system-ui;margin:0;padding:16px;background:#111;color:#eee}h2{margin-top:32px}.g{display:flex;flex-wrap:wrap;gap:10px}figure{margin:0}img{display:block;border:1px solid #444;max-height:420px}.w375 img{max-width:200px}.w1280 img{max-width:420px}figcaption{font-size:12px;color:#aaa;margin-top:4px}pre{white-space:pre-wrap;background:#222;padding:12px;max-width:900px}</style>
<h1>Cine QA pack: ${look} look</h1><p>${realBuild ? "Real cinematic build." : "NOT the real build: hand-made sample page. Do not score."} Rubric: sitemaker/qa/RUBRIC.md</p>
<h2>Review coverage (open every listed file; a missing count means a defect in the pack)</h2><table border="1" cellpadding="4" style="border-collapse:collapse"><tr><th>trade</th><th>width</th><th>frames</th>${look === "editorial" ? "" : "<th>tabs</th><th>sliders</th>"}<th>estimator</th><th>full</th><th>reduced</th>${look === "editorial" ? "<th>editorial shots</th>" : ""}</tr>${trades.flatMap((t) => [375, 1280].map((w) => cover(t, w))).join("")}</table>
<h2>Reel notes (the bar)</h2><pre>${esc(reel.trim())}</pre>
${trades.map((t) => `<h2>${t}</h2><p><a href="${t}.html">${t}.html</a></p><div class="g">${sheet[t].map((s) => `<figure class="w${s.w}">${s.file ? `<img loading="lazy" src="${s.file}">` : ""}<figcaption>${s.w}px · ${esc(s.label)}</figcaption></figure>`).join("")}</div>`).join("")}`;
writeFileSync(join(out, "index.html"), html);
console.log(`Pack: ${out}/index.html (${realBuild ? "real build" : "sample page, not the real build"}); trades: ${trades.join(", ")}`);
