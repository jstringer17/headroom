// Step 1b (cinematic mode) checks, one result per plan.md criterion 1-5.
//   node sitemaker/test-cine.mjs
// Real-build checks are SKIPPED (not passed) until generateSite({cinematic:true}) emits data-cine.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { here, loadPlaywright, launchOpts, SEL, buildCine, samplePage, isEditorial, ED, NEW_TRADES, unitFor, placeholderText, firstCell } from "./qa/lib.mjs";
import { TRADE_ORDER, TRADES } from "./src/trades.js";
const ALL = [...TRADE_ORDER, ...NEW_TRADES.filter((k) => !TRADE_ORDER.includes(k))]; // 19 trades

const outDir = join(here, "test-out-cine");
rmSync(outDir, { recursive: true, force: true }); mkdirSync(outDir, { recursive: true });
const results = []; // { crit, name, status: pass|fail|skip, note }
const rec = (crit, name, status, note = "") => results.push({ crit, name, status, note });
const check = (crit, name, cond, note = "") => rec(crit, name, cond ? "pass" : "fail", cond ? "" : note);

const probe = buildCine({ company: "Probe Co", trade: "fencing", year: 2026 });
const REAL = probe.real;
const real = async (crit, name, fn) => (REAL ? await fn() : rec(crit, name, "skip", "needs real cinematic build"));

const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const open = async (html, name, { width = 1280, reduced = false, tag = "" } = {}) => {
  const file = join(outDir, `${name}${tag}.html`); writeFileSync(file, html);
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, reducedMotion: reduced ? "reduce" : "no-preference", viewport: { width, height: width < 700 ? 812 : 800 }, hasTouch: width < 700 });
  const page = await ctx.newPage();
  const outside = []; page.__outside = outside;
  await page.route("**/*", (r) => { const u = r.request().url(); if (/^(file|data):/.test(u) || /fonts\.(googleapis|gstatic)\.com/.test(u)) return r.continue(); outside.push(u); return r.abort(); });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  return { page, ctx };
};

// ---- Crit 1: 16 trades build, no empty sections, no stray "$", placeholders labeled ----
for (const key of ALL) {
  if (!TRADES[key]) { rec(1, `${key}: trade exists in trades.js (17-19 are new)`, "skip", "not added yet (cine-art)"); continue; }
  const b = buildCine({ company: "Sample Co", trade: key, year: 2026 });
  if (!b.real) { rec(1, `${key}: builds cinematic, no empty sections`, "skip", "needs real cinematic build"); continue; }
  const { page, ctx } = await open(b.html, key);
  const r = await page.evaluate(() => {
    const empty = [];
    document.querySelectorAll("header, section, footer").forEach((el) => {
      if (getComputedStyle(el).display === "none") return;
      if (el.innerText.trim().length < 8 && !el.querySelector("img,svg,[role=slider],[data-placeholder]")) empty.push(el.id || el.className || el.tagName);
    });
    return { empty, text: document.body.innerText };
  });
  check(1, `${key}: no empty sections`, r.empty.length === 0, r.empty.join(","));
  check(1, `${key}: no "$" unless typed`, !/\$/.test(b.html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "")), "found $");
  const ph = await page.$$eval(SEL.placeholder, (els) => els.map((e) => e.getAttribute("src") || e.textContent));
  check(1, `${key}: placeholders exist and each shows its label`, ph.length > 0 && ph.every((t) => /sample picture/i.test(placeholderText(t))), `${ph.length} placeholders, one unlabeled`);
  await ctx.close();
  if (key === ALL[0] || ["roofing", "fencing", "pressure", "hvac", ...NEW_TRADES].includes(key)) {
    const [sz, op] = await firstCell(key);
    const f = buildCine({ company: "T", trade: key, year: 2026, cine: { prices: { [sz]: { [op]: { low: "2750", high: "4550" } } } } });
    const { page: p2, ctx: c2 } = await open(f.html, key, { tag: "-priced" });
    const unit = await p2.$eval(SEL.unit, (e) => e.textContent.trim()).catch(() => "");
    check(4, `${key}: estimator unit is "${unitFor(key)}" by default`, unit === unitFor(key), `got "${unit}"`);
    await c2.close();
    const u = buildCine({ company: "T", trade: key, year: 2026, cine: { unit: "per hour", prices: { [sz]: { [op]: { low: "2750", high: "4550" } } } } });
    const { page: p3, ctx: c3 } = await open(u.html, key, { tag: "-unit" });
    const unit2 = await p3.$eval(SEL.unit, (e) => e.textContent.trim()).catch(() => "");
    check(4, `${key}: chosen unit "per hour" overrides default`, unit2 === "per hour", `got "${unit2}"`);
    await c3.close();
  }
  continue;
}
// Contract-level checks on the hand-made sample (always run, proves the harness itself works).
{
  const { page, ctx } = await open(samplePage(), "sample");
  const ph = await page.$$eval(SEL.placeholder, (els) => els.map((e) => e.textContent));
  check(1, "harness: placeholder label detected on sample", ph.length > 0 && ph.every((t) => /sample picture/i.test(t)));
  await ctx.close();
}

// ---- Crit 2: widths, tabs, slider (pointer + keyboard), reduced motion ----
const targets = REAL ? ["fencing", "roofing", "pressure"].map((t) => ({ name: t, html: buildCine({ company: "Sample Co", trade: t, year: 2026 }).html })) : [{ name: "sample", html: samplePage({ prices: true }) }];
for (const { name, html } of targets) {
  const sk = (REAL ? "" : "harness/sample: ");
  for (const width of [375, 1280]) {
    const { page, ctx } = await open(html, name, { width, tag: `-${width}` });
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(2, `${sk}${name}@${width}: no sideways scroll`, r.sw <= r.cw, `${r.sw}>${r.cw}`);
    if (width === 375) {
      // tabs by keyboard
      const tabs = await page.$$(SEL.tab);
      if (tabs.length > 1) {
        await tabs[0].focus(); await page.keyboard.press("ArrowRight");
        const sel = await page.$$eval(SEL.tab, (t) => t.map((x) => x.getAttribute("aria-selected")));
        check(2, `${sk}${name}: tabs move by keyboard`, sel[0] === "false" && sel.includes("true"), sel.join());
        await tabs[0].click(); // pointer
        const sel2 = await page.$$eval(SEL.tab, (t) => t.map((x) => x.getAttribute("aria-selected")));
        check(2, `${sk}${name}: tabs work by pointer`, sel2[0] === "true", sel2.join());
      } else check(2, `${sk}${name}: tabs present`, false, "fewer than 2 tabs");
      // slider by keyboard and pointer
      const sl = await page.$(SEL.slider);
      if (sl) {
        await sl.focus(); const a = +(await sl.getAttribute("aria-valuenow"));
        await page.keyboard.press("ArrowLeft"); const b = +(await sl.getAttribute("aria-valuenow"));
        await page.keyboard.press("End"); const c = +(await sl.getAttribute("aria-valuenow"));
        check(2, `${sk}${name}: slider moves by keyboard`, b < a && c === 100, `${a},${b},${c}`);
        const box = await (await sl.evaluateHandle((e) => e.parentElement)).asElement().boundingBox();
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.up();
        const d = +(await sl.getAttribute("aria-valuenow"));
        check(2, `${sk}${name}: slider moves by pointer`, d < 50 && d !== c, `${d}`);
      } else check(2, `${sk}${name}: slider present`, false, "no role=slider");
    }
    await ctx.close();
  }
  // reduced motion: nothing animates
  const { page, ctx } = await open(html, name, { reduced: true, tag: "-rm" });
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).length);
  const trans = await page.evaluate(() => [...document.querySelectorAll("*")].filter((e) => { const s = getComputedStyle(e); return s.animationName !== "none" && parseFloat(s.animationDuration) > 0; }).length);
  check(2, `${name}: reduced motion has no running animation`, anims === 0 && trans === 0, `${anims} running, ${trans} styled`);
  await ctx.close();
}

// ---- Crit 3: offline, size, no outside scripts ----
{
  const form = { company: "Big Co", trade: "fencing", year: 2026, cine: { images: {} } };
  const jpeg = "data:image/jpeg;base64," + Buffer.alloc(450 * 1024, 7).toString("base64"); // ~600 KB each, stand-in for a 1600px photo
  for (let i = 0; i < 12; i++) form.cine.images["slot" + i] = jpeg;
  const b = buildCine(form);
  await real(3, "12 x 1600px pictures stay under 6 MB", () => check(3, "12 x 1600px pictures stay under 6 MB", Buffer.byteLength(b.html) < 6 * 1024 * 1024, `${(Buffer.byteLength(b.html) / 1048576).toFixed(1)} MB`));
  await real(3, "no outside scripts or links", () => {
    check(3, "no outside scripts", !/<script[^>]+src=/i.test(b.html), "script src");
    const ext = [...b.html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u));
    check(3, "no outside links (fonts only)", ext.length === 0, ext.join(","));
  });
}

// ---- Crit 4: estimator hidden when blank, exact numbers when typed ----
await real(4, "estimator hidden when prices blank", async () => {
  const blank = buildCine({ company: "T", trade: "fencing", year: 2026 });
  const { page, ctx } = await open(blank.html, "est-blank");
  const vis = await page.$$eval(SEL.estimator, (els) => els.filter((e) => e.offsetHeight > 0).length);
  check(4, "estimator hidden when prices blank", vis === 0, `${vis} visible`);
  await ctx.close();
  const [sz, op] = await firstCell("fencing");
  const filled = buildCine({ company: "T", trade: "fencing", year: 2026, cine: { prices: { [sz]: { [op]: { low: "2750", high: "4550" } } } } });
  const text = filled.html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "");
  const dollars = [...text.matchAll(/\$[\d,]+/g)].map((m) => m[0]);
  check(4, "estimator shows only typed numbers", dollars.every((d) => ["$2,750", "$4,550", "$2750", "$4550"].includes(d)), dollars.join(","));
});

// ---- Crit 5: CLS ~0 while scrolling, only transform/opacity animate ----
for (const { name, html } of targets.slice(0, 1)) {
  const { page, ctx } = await open(html, name, { tag: "-cls" });
  await page.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 200) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(40); }
  const cls = await page.evaluate(() => window.__cls);
  check(5, `${name}: CLS during scroll is ~0`, cls < 0.02, cls.toFixed(3));
  const bad = await page.evaluate(() => document.getAnimations().map((a) => a.effect?.getKeyframes?.() || []).flat().flatMap((k) => Object.keys(k)).filter((p) => !["offset", "easing", "composite", "computedOffset", "transform", "opacity"].includes(p)));
  check(5, `${name}: scroll animations touch only transform/opacity`, bad.length === 0, [...new Set(bad)].join(","));
  await ctx.close();
}
await real(5, "classic mode unchanged", () => {}); // classic byte-identity is test.mjs + cine-engine's diff; not duplicated here

// ---- Editorial look (Step 1c): SKIPPED until the build says data-look="editorial" ----
{
  const edTrades = ["roofing", "fencing", "pressure"];
  const probeEd = buildCine({ company: "Probe Co", trade: "roofing", year: 2026 }, "editorial");
  if (!(probeEd.real && isEditorial(probeEd.html))) {
    rec("E", "editorial look checks", "skip", "needs the editorial build (data-look=\"editorial\")");
  } else for (const trade of edTrades) {
    const [sz, op] = await firstCell(trade);
    const b = buildCine({ company: "Sample Co", trade, city: "Tulsa, OK", phone: "918-555-0100", year: 2026, insured: true, years: "12", rating: "4.8", reviews: "112", cine: { prices: { [sz]: { [op]: { low: "100", high: "200" } } } } }, "editorial");
    {
      const bare = buildCine({ company: "Sample Co", trade, year: 2026 }, "editorial");
      const { page, ctx } = await open(bare.html, `ed-bare-${trade}`);
      const txt = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => e.innerText).join(" "), ED.trustCell);
      check("E", `${trade}: no trust claims when nothing is ticked`, !/insured|licensed|warranty|24\/7|years|google/i.test(txt), txt.slice(0, 80));
      await ctx.close();
    }
    for (const width of [375, 1280]) {
      const tag = `${trade}@${width}`;
      const { page, ctx } = await open(b.html, `ed-${trade}`, { width, tag: `-${width}` });
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
      const r = await page.evaluate((ED) => {
        const q = (s) => [...document.querySelectorAll(s)];
        const hero = document.querySelector(ED.hero);
        const heroEls = hero ? [hero, ...hero.querySelectorAll("*")] : [];
        const clip = heroEls.some((e) => { const c = getComputedStyle(e); return (c.clipPath && c.clipPath !== "none") || (c.webkitMaskImage && c.webkitMaskImage !== "none") || (c.maskImage && c.maskImage !== "none"); });
        const cards = q(ED.work);
        const radii = cards.map((c) => parseFloat(getComputedStyle(c).borderTopLeftRadius) || 0);
        const rows = q(ED.rows);
        const nums = rows.filter((r) => /^\s*0?\d/.test(r.innerText)).length;
        const trust = document.querySelector(ED.trust);
        const cells = q(ED.trustCell).length;
        const nav = q(ED.nav).find((n) => ["sticky", "fixed"].includes(getComputedStyle(n).position));
        const body = document.body.innerText;
        return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, hero: !!hero, clip, cards: cards.length, minRadius: radii.length ? Math.min(...radii) : 0, rows: rows.length, nums, trust: !!trust, cells, nav: !!nav, sample: /sample projects|fictional|sample picture/i.test(body) };
      }, ED);
      check("E", `${tag}: no sideways scroll`, r.sw <= r.cw, `${r.sw}>${r.cw}`);
      check("E", `${tag}: hero picture is cut to a silhouette (clip-path/mask)`, r.hero && r.clip, "no clip-path or mask in hero");
      check("E", `${tag}: work cards are rounded (>=16px) and labeled as sample`, r.cards > 0 && r.minRadius >= 16 && r.sample, `${r.cards} cards, min radius ${r.minRadius}, sample label ${r.sample}`);
      check("E", `${tag}: numbered service rows (3+)`, r.rows >= 3 && r.nums >= 3, `${r.rows} rows, ${r.nums} numbered`);
      check("E", `${tag}: trust strip has 4 cells when 4+ facts are typed`, r.trust && r.cells === 4, `${r.cells} cells`);
      check("E", `${tag}: sticky nav`, r.nav, "no sticky/fixed nav");
      // service rows: pick the 2nd row (pointer) and a key press; the picture must change
      const rows = await page.$$(ED.rows);
      if (rows.length >= 3) {
        const img = async () => page.$eval(ED.rowImg, (e) => e.getAttribute("src") || e.getAttribute("data-src") || e.innerHTML).catch(() => "");
        const before = await img();
        await rows[1].scrollIntoViewIfNeeded(); await rows[1].click(); await page.waitForTimeout(400);
        const after = await img();
        check("E", `${tag}: clicking a service row swaps the picture`, before !== after && after !== "", "picture did not change");
        await rows[2].focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
        const third = await img();
        check("E", `${tag}: a service row works by keyboard`, third !== after, "no change on Enter");
      }
      check("E", `${tag}: no "$" unless typed`, !/\$/.test((await page.evaluate(() => document.body.innerText)).replace(/\$\d[\d,]*/g, "")), "stray $");
      await ctx.close();
    }
  }
}

await browser.close();

// ---- report ----
const crit = [...new Set(results.map((r) => r.crit))].sort();
let failed = 0;
for (const c of crit) {
  const rs = results.filter((r) => r.crit === c);
  const f = rs.filter((r) => r.status === "fail"), s = rs.filter((r) => r.status === "skip"), p = rs.filter((r) => r.status === "pass");
  failed += f.length;
  console.log(`Criterion ${c}: ${f.length ? "FAIL" : p.length ? "PASS" : "SKIPPED"} (${p.length} pass, ${f.length} fail, ${s.length} skipped)`);
  for (const r of f) console.log(`   FAIL ${r.name} ${r.note}`);
}
console.log(REAL ? "Build: REAL cinematic build" : "Build: no cinematic build yet. Ran on hand-made sample; real-build checks SKIPPED, not passed.");
process.exit(failed ? 1 : 0);
