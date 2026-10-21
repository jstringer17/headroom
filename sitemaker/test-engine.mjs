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
        for (const t of ba.querySelectorAll(".ba-tag")) {
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
await browser.close();
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log(`PASS: engine layout checks (${TRADE_ORDER.length} trades x 2 widths)`);
