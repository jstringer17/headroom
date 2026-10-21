// Cinematic engine layout checks (owned by cine-engine).
//   node sitemaker/build.mjs && node sitemaker/test-engine.mjs
// For every trade at 375 and 1280 wide: only one story headline shows at a time,
// pictures cross-fade (two labels overlap only in a short window), the headline
// never sits on the call buttons, slider labels never touch the handle, and the
// repair-or-replace tool shows no verdict unless the owner typed a percent.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { generateSite } from "./src/generate.js";
import { TRADE_ORDER } from "./src/trades.js";

const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const browser = await pw.chromium.launch();

for (const trade of TRADE_ORDER) {
  const html = generateSite({ company: "Test Co", trade, year: 2026, phone: "9185550100", cinematic: true });
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 800 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.setContent(html, { waitUntil: "load" });
    const r = await page.evaluate(async () => {
      const story = document.getElementById("story"), pin = story.querySelector(".pin");
      const top = story.getBoundingClientRect().top + scrollY - 64, len = story.offsetHeight - pin.offsetHeight;
      let maxLines = 0, overlapSamples = 0, ctaHits = 0, N = 120;
      for (let i = 0; i <= N; i++) {
        scrollTo(0, top + len * i / N);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const lines = [...story.querySelectorAll(".line")].filter((l) => +l.style.opacity > 0.05);
        maxLines = Math.max(maxLines, lines.length);
        const mid = [...story.querySelectorAll(".frame")].filter((f) => +f.style.opacity > 0.05 && f.style.visibility !== "hidden").length;
        if (mid > 2) overlapSamples += 10; else if (mid === 2) overlapSamples++;
        const cta = story.querySelector(".story-cta").getBoundingClientRect();
        for (const l of lines) { const h = l.querySelector(".h").getBoundingClientRect(); if (h.bottom > cta.top + 1 && h.top < cta.bottom) ctaHits++; }
      }
      return { maxLines, share: overlapSamples / (N + 1), ctaHits };
    });
    ok(errs.length === 0, `${trade}@${width}: page error ${errs[0]}`);
    ok(r.maxLines <= 1, `${trade}@${width}: ${r.maxLines} story headlines show at once`);
    ok(r.share < 0.3, `${trade}@${width}: pictures cross-fade too long (${Math.round(r.share * 100)}% of the scroll has two or more visible)`);
    ok(r.ctaHits === 0, `${trade}@${width}: headline overlaps the call buttons`);
    const s = await page.evaluate(() => {
      const ba = document.getElementById("ba"); if (!ba) return null;
      const sl = ba.querySelector("[role=slider]"), out = [];
      sl.focus();
      const key = (k) => sl.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      for (const v of [0, 10, 20, 50, 80, 90, 100]) {
        key("Home");
        for (let n = 0; n < 40 && +sl.getAttribute("aria-valuenow") < v; n++) key(v === 100 ? "End" : "ArrowRight");
        const hb = sl.querySelector(".ba-knob").getBoundingClientRect(), line = sl.getBoundingClientRect();
        for (const t of ba.querySelectorAll(".ba-cap span")) {
          if (getComputedStyle(t).visibility === "hidden") continue;
          const b = t.getBoundingClientRect();
          if (b.right > line.left - 4 && b.left < line.right + 4) out.push(`${v}: ${t.textContent} touches the handle`);
        }
      }
      return out;
    });
    if (s) ok(s.length === 0, `${trade}@${width}: slider labels cut: ${s.join("; ")}`);
    await page.close();
  }
}

// HVAC calculator: blank percent = two numbers, no verdict; typed percent = verdict.
for (const [pct, verdict] of [["", false], ["50", true]]) {
  const html = generateSite({ company: "T", trade: "hvac", cinematic: true, cine: { repairPct: pct, prices: { "Small home": { "Central air": { low: "6000", high: "9000" } } } } });
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.fill("#rr-quote", "4000");
  const out = await page.textContent("#rr-out"), nums = await page.textContent(".rr-nums");
  ok(/\$4,000/.test(nums) && /\$6,000/.test(nums), `hvac calc (${pct || "blank"}): the two numbers are missing`);
  ok(verdict ? /new one/.test(out) : out.trim() === "", `hvac calc (${pct || "blank"}): verdict wrong: "${out}"`);
  await page.close();
}
// Editorial look: every trade builds, nothing overflows sideways, the fixed note is there,
// the trust strip shows only ticked or typed facts, and service rows open on click and arrow keys.
for (const trade of TRADE_ORDER) {
  const base = { company: "Test Co", trade, year: 2026, phone: "9185550100", cinematic: true, look: "editorial" };
  const plain = generateSite(base);
  ok(/class="ed-no-js"|class="ed"/.test(plain) && plain.includes('<body class="ed">'), `${trade}: editorial page not built`);
  ok(plain.includes("Sample projects: names and homes are fictional.") && (plain.match(/class="ed-card"/g) || []).length === 3, `${trade}: editorial work cards or note wrong`);
  ok(!plain.includes('id="price"') && !/Insured|Open 24\/7/.test(plain.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "")), `${trade}: editorial shows an unticked fact or a price without typed ranges`);
  ok(!/<script[^>]+src=/i.test(plain), `${trade}: editorial loads an outside script`);
  const full = generateSite({ ...base, insured: true, emergency: true, years: "9", city: "Tulsa, OK" });
  ok((full.match(/<li class="ed-rv"><svg/g) || []).length === 4, `${trade}: editorial trust strip should show 4 facts when 4+ are ticked`);
  for (const width of [375, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
    await page.setContent(full, { waitUntil: "load" });
    const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    ok(sw[0] <= sw[1], `${trade}@${width}: editorial scrolls sideways (${sw[0]} > ${sw[1]})`);
    ok(errs.length === 0, `${trade}@${width}: editorial page error ${errs[0]}`);
    if (width === 1280 && trade === TRADE_ORDER[0]) {
      const rows = await page.$$(".ed-row");
      await rows[1].click();
      const st = await page.evaluate(() => [...document.querySelectorAll(".ed-row")].map((r) => r.getAttribute("aria-expanded")).join() + "|" + [...document.querySelectorAll(".ed-pic img")].map((i) => i.className).join());
      ok(st.startsWith("false,true") && /^[^|]*\|(?:,)?on/.test(st) === false && st.split("|")[1].split(",")[1] === "on", `editorial rows: click did not open row 2 / swap picture (${st})`);
      await rows[1].focus(); await page.keyboard.press("ArrowDown");
      ok(await page.evaluate(() => document.activeElement.classList.contains("ed-row") && document.querySelectorAll(".ed-row")[2] === document.activeElement), "editorial rows: ArrowDown does not move to the next row");
    }
    await page.close();
  }
}

await browser.close();
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log(`PASS: engine layout checks (${TRADE_ORDER.length} trades x 2 widths)`);
