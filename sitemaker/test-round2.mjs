// CEO round 2 (A-F) checks, all three looks, with the real picture library.
//   node sitemaker/test-round2.mjs
// A  one before/after: no standalone slider section, one slider per picker panel only
// B  the picker lists every offered variation; Compare moves the line; Ask about this picks the job; the page opens at the top
// C  credibility: typed facts appear in hero, proof bar, reviews, contact, footer and JSON-LD (live); nothing typed = nothing shown
// D  phone action bar hides while typing and never sits on a focused field; header call always visible on phones
// F  phones (375 and 390, Chromium and WebKit): no sideways scroll, no letterbox, pinned story spans exactly its runway,
//    layout shift under 0.1, smooth story scroll under 4x CPU throttle
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPlaywright, launchOpts } from "./qa/lib.mjs";
import { generateSite } from "./src/generate.js";
import { CINE_KIT } from "./src/cine-kit.js";
import { TRADE_ORDER } from "./src/trades.js";
import { promiseFor } from "./src/promise.js";

const here = dirname(fileURLToPath(import.meta.url));
const tmp = join(here, "qa", "round2-tmp"); mkdirSync(tmp, { recursive: true });
const lib = join(here, "library");
const files = (d) => readdirSync(d).flatMap((f) => statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]);
const imgs = (t) => existsSync(join(lib, t)) ? Object.fromEntries(files(join(lib, t)).filter((f) => f.endsWith(".webp")).map((f) => [relative(join(lib, t), f).replace(/\.webp$/, ""), `https://lib.test/${t}/${relative(join(lib, t), f)}`])) : {};
const LOOKS = ["cinematic", "editorial", "classic"], TRADES = ["roofing", "fencing", "pressure"];
const CRED = { rating: "4.9", reviews: "127", insured: true, cred: { founded: "2011", googleUrl: "https://g.page/r/x", bbb: { rating: "A+", accredited: true }, license: "ROC 334512", bonded: true, coverage: "$1M", warranty: "10-year workmanship warranty", jobs: "1200", family: true, certs: ["GAF Master Elite"] } };
const form = (look, trade, extra = {}) => ({ company: "Ridgeline Roofing and Restoration of Northeastern Oklahoma", trade, city: "Tulsa, OK", phone: "9185550142", look, cinematic: look === "cinematic", year: 2026, ...CRED, cine: { images: imgs(trade) }, ...extra });
let pass = 0; const bad = [];
const ok = (c, m) => { if (c) pass++; else bad.push(m); };
const write = (name, html) => { const f = join(tmp, name); writeFileSync(f, html); return pathToFileURL(f).href; };
const strip = (h) => h.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// ---- static (no browser)
for (const look of LOOKS) for (const trade of TRADES) {
  const h = generateSite(form(look, trade));
  const n = CINE_KIT[trade].variants.length;
  ok(!/id="before-after"/.test(h) && !/class="all-item"|data-ed="all-card"|class="all-list"/.test(h), `A ${look}/${trade}: an old before/after or Everything-we-do section is still there`);
  const dead = [...new Set([...h.matchAll(/href="#([A-Za-z][\w-]*)"/g)].map((x) => x[1]))].filter((id) => !h.includes(`id="${id}"`));
  ok(!dead.length, `A ${look}/${trade}: links to missing sections #${dead.join(", #")}`);
  const tabs = (h.match(/role="tab"/g) || []).length;
  ok(tabs === n, `B ${look}/${trade}: picker has ${tabs} chips, expected ${n}`);
  const sliders = (h.match(/role="slider"/g) || []).length, rng = (h.match(/type="range"/g) || []).length;
  ok(sliders + rng === n, `A ${look}/${trade}: ${sliders + rng} sliders, expected one per variation (${n})`);
  const off = generateSite(form(look, trade, { cine: { images: imgs(trade), offer: CINE_KIT[trade].variants.slice(0, 3).map((v) => v.key) } }));
  ok((off.match(/role="tab"/g) || []).length === 3, `B ${look}/${trade}: unticked variations still listed`);
  const one = generateSite(form(look, trade, { cine: { images: imgs(trade), offer: [CINE_KIT[trade].variants[1].key] } }));
  ok((one.match(/class="vp-chip"/g) || []).length === 1 && (one.match(/class="vp-handle"/g) || []).length === 1 && !/class="(?:tab|pk-panel|ed-pk|ba)"/.test(one), `A ${look}/${trade}: one ticked variation must give the picker with that one and its one slider`);
  const t = strip(h);
  for (const w of ["BBB A+", "ROC 334512", "Since 2011", "Family", "GAF Master Elite", "10-year workmanship warranty"]) ok(t.includes(w), `C ${look}/${trade}: "${w}" missing`);
  ok(!/warranty warranty/i.test(t), `C ${look}/${trade}: "warranty warranty"`);
  const empty = strip(generateSite({ company: "Plain Co", trade, look, cinematic: look === "cinematic", phone: "9185550142" }));
  for (const w of ["BBB", "Lic", "Since 2", "Bonded", "Family owned", "Veteran", "jobs completed", "Warranty"]) ok(!empty.includes(w), `C ${look}/${trade}: "${w}" shown with nothing typed`);
  const live = generateSite(form(look, trade, { live: { siteId: "x", canonical: "https://x.example/" } }));
  const ld = JSON.parse((live.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [, "{}"])[1]);
  ok(ld.foundingDate == 2011 || ld.foundingDate === "2011", `C ${look}/${trade}: JSON-LD foundingDate missing`);
  const liveNoCount = generateSite(form(look, trade, { rating: "", reviews: "", live: { siteId: "x" } }));
  ok(!/aggregateRating/.test(liveNoCount), `C ${look}/${trade}: aggregateRating without a typed rating and count`);
}

// trades without variations: exactly one before/after in every look, and Ask about this names a real job
for (const look of LOOKS) for (const trade of ["hvac", "towing", "concrete"]) {
  const h = generateSite({ company: "Plain Co", trade, look, cinematic: look === "cinematic", phone: "9185550142" });
  ok((h.match(/class="vp-handle"/g) || []).length === 1, `A ${look}/${trade}: needs exactly one before/after, found ${(h.match(/class="vp-handle"/g) || []).length}`);
  const opts = [...h.matchAll(/<option>([^<]*)</g)].map((x) => x[1]);
  ok([...h.matchAll(/data-job="([^"]*)"/g)].every((x) => opts.includes(x[1])), `B ${look}/${trade}: Ask about this names a job the form does not list`);
}

// round 3: every trade opens on a promise (the result), in every look; Cinematic shows it over the FINISHED picture
for (const look of ["cinematic", "classic"]) for (const trade of TRADE_ORDER) { // Editorial has its own promise lines per trade
  const h = generateSite({ company: "Plain Co", trade, look, cinematic: look === "cinematic", phone: "9185550142" });
  const kit = CINE_KIT[trade], vkey = kit && kit.variants ? kit.variants[0].key : undefined;
  const want = (promiseFor(trade, vkey) || {}).headline;
  const h1 = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  ok(want && h1 === want, `R3 ${look}/${trade}: H1 "${h1}" is not the promise "${want}"`);
  if (look === "cinematic") {
    const srcs = [...h.matchAll(/<div class="step"[^>]*><div class="frame"><img src="([^"]+)"/g)].map((x) => x[1]);
    ok(srcs.length >= 2 && srcs[0] === srcs[srcs.length - 1], `R3 cinematic/${trade}: the promise frame does not show the finished picture`);
  }
}

// ---- browser
const pw = loadPlaywright();
const route = (ctx) => ctx.route("https://lib.test/**", (r) => { const p = join(lib, decodeURIComponent(new URL(r.request().url()).pathname.slice(1))); return existsSync(p) ? r.fulfill({ path: p, contentType: "image/webp" }) : r.fulfill({ status: 404 }); });
const fontsOff = (ctx) => ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
for (const engineName of ["chromium", "webkit"]) {
  const engine = pw[engineName];
  let browser;
  try { browser = await engine.launch(engineName === "chromium" ? launchOpts() : {}); } catch (e) { if (engineName === "webkit") { console.log("SKIPPED: WebKit is not installed here (iOS Safari emulation not run)"); continue; } throw e; }
  for (const look of LOOKS) for (const trade of TRADES) for (const w of engineName === "chromium" ? [375, 390, 1280] : [375, 390]) {
    const tag = `${engineName} ${look}/${trade}@${w}`;
    const url = write(`${look}-${trade}.html`, generateSite(form(look, trade)));
    const ctx = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : w === 375 ? 812 : 860 }, hasTouch: w < 600, ...(engineName === "chromium" && w < 600 ? { isMobile: true } : {}) });
    await route(ctx); await fontsOff(ctx);
    const page = await ctx.newPage();
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(900);
    ok(errs.length === 0, `${tag}: page errors ${errs.join(" | ")}`);
    ok((await page.evaluate(() => scrollY)) === 0, `B ${tag}: the page did not open at the top (scrollY ${await page.evaluate(() => scrollY)})`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `F ${tag}: sideways scroll`);
    if (w < 600) {
      // header call is always visible on phones
      ok(await page.evaluate(() => { const a = [...document.querySelectorAll('header a[href^="tel:"]')].find((x) => { const r = x.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && getComputedStyle(x).visibility !== "hidden" && r.top >= 0 && r.bottom <= 120; }); return !!a; }), `D ${tag}: no visible header call button`);
    }
    // picker: every chip, Compare, Ask about this
    const chips = await page.$$("#styles [role=tab]");
    ok(chips.length === CINE_KIT[trade].variants.length, `B ${tag}: ${chips.length} chips`);
    if (chips.length) {
      await page.evaluate(() => { const s = document.getElementById("styles"); scrollTo(0, s.getBoundingClientRect().top + scrollY - 80); }); await page.waitForTimeout(400);
      const last = chips[chips.length - 1];
      await last.scrollIntoViewIfNeeded(); await last.click(); await page.waitForTimeout(450);
      const shown = await page.evaluate(() => { const t = [...document.querySelectorAll("#styles [role=tab]")]; const i = t.findIndex((x) => x.getAttribute("aria-selected") === "true"); const p = document.getElementById(t[i].getAttribute("aria-controls")); return { i, n: t.length, vis: p && !p.hidden && p.getBoundingClientRect().height > 100 }; });
      ok(shown.i === shown.n - 1 && shown.vis, `B ${tag}: the last chip does not open its panel`);
      const cmp = await page.evaluate(async () => { const p = [...document.querySelectorAll("#styles [role=tabpanel]")].find((x) => !x.hidden); const b = [...p.querySelectorAll("button")].find((x) => /compare/i.test(x.textContent)); if (!b) return "no button"; b.click(); await new Promise((r) => setTimeout(r, 600)); const s = p.querySelector("[role=slider], input[type=range]"); return s ? (s.getAttribute("aria-valuenow") || s.value) : "no slider"; });
      ok(String(cmp) === "50", `A ${tag}: Compare did not move the line to 50 (${cmp})`);
      const job = await page.evaluate(async () => { const p = [...document.querySelectorAll("#styles [role=tabpanel]")].find((x) => !x.hidden); const a = p.querySelector("[data-job]"); a.click(); await new Promise((r) => setTimeout(r, 900)); const sel = document.querySelector("#ask select"); return [a.getAttribute("data-job"), sel.options[sel.selectedIndex].text]; });
      ok(job[0] === job[1], `B ${tag}: Ask about this picked "${job[1]}" not "${job[0]}"`);
    }
    if (w < 600 && look === "classic") {
      // round 3 (QA: 8,300 px of stacked white cards): the Classic phone page stays under a height budget
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      ok(H <= 7400, `R3 ${tag}: Classic phone page is ${H}px tall (budget 7400)`);
    }
    if (w < 600) {
      // a long company name ends with an ellipsis in the header, never cut mid-letter
      const nm = await page.evaluate(() => { const e = document.querySelector(".brand-name, .brand, .ed-logo-t"); if (!e) return "none"; const cs = getComputedStyle(e); return e.scrollWidth <= e.clientWidth + 1 || (cs.textOverflow === "ellipsis" && !/flex|grid/.test(cs.display)) ? "ok" : `${cs.display}/${cs.textOverflow}`; });
      ok(nm === "ok", `R3 ${tag}: the company name in the header is cut without an ellipsis (${nm})`);
      // proof badges: 4 strongest + "+N more" on phones (impeccable Working Memory Rule); the button reveals every one
      const pb = await page.evaluate(() => { const b = document.querySelector(".pb-more button"); if (!b) { const ul = document.querySelector("#proof ul"); if (!ul) return { before: 0, after: 0, total: 0, btn: false }; const n = [...ul.children].filter((li) => getComputedStyle(li).display !== "none").length; return { before: n, after: n, total: n, btn: false }; } const u = b.closest("ul"); const vis = () => [...u.children].filter((li) => !li.classList.contains("pb-more") && getComputedStyle(li).display !== "none").length; const total = u.children.length - 1, before = vis(); b.click(); return { before, after: vis(), total, btn: !!u.querySelector(".pb-more") }; });
      ok(pb && pb.before <= 4 && pb.after === pb.total && !pb.btn, `C ${tag}: proof badges on phones ${JSON.stringify(pb)}`);
      // action bar: hidden while a field has focus, never on top of the focused field
      await page.evaluate(() => { const f = document.getElementById("f-name"); scrollTo(0, f.getBoundingClientRect().top + scrollY - innerHeight + 140); }); await page.waitForTimeout(300);
      await page.focus("#f-name"); await page.waitForTimeout(450);
      const cover = await page.evaluate(() => { const bar = document.querySelector(".mbar, .ed-mbar, .ab"); if (!bar) return "no bar"; const b = bar.getBoundingClientRect(), f = document.getElementById("f-name").getBoundingClientRect(); const shown = getComputedStyle(bar).visibility !== "hidden" && b.top < innerHeight - 2; return shown && b.top < f.bottom && b.bottom > f.top ? "covers" : shown ? "shown" : "hidden"; });
      ok(cover === "hidden", `D ${tag}: action bar is ${cover} while typing`);
      await page.evaluate(() => document.activeElement.blur());
      // layout shift on load, and the pinned story
      const url2 = write(`${look}-${trade}-cls.html`, generateSite(form(look, trade)));
      const p2 = await ctx.newPage();
      await p2.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: "layout-shift", buffered: true }); } catch (_) { window.__cls = -1; } });
      await p2.goto(url2, { waitUntil: "load" }); await p2.waitForTimeout(1200);
      const cls = await p2.evaluate(() => window.__cls);
      ok(cls < 0.1, `F ${tag}: layout shift ${cls.toFixed(3)} on load`);
      if (look === "cinematic") {
        const pin = await p2.evaluate(async () => { const s = document.getElementById("story"); if (!s || !document.documentElement.classList.contains("cine-motion")) return { skip: 1 }; const pin = s.querySelector(".pin"), bar = s.querySelector(".prog-bar i");
          const top = s.getBoundingClientRect().top + scrollY, run = s.offsetHeight - pin.offsetHeight;
          const at = async (y) => { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); return { pinTop: pin.getBoundingClientRect().top, p: parseFloat((bar.style.transform.match(/[\d.]+/) || [0])[0]) }; };
          const a = await at(top - 64 + run), b = await at(top - 64 + run + 40), c = await at(0);
          const frame = s.querySelector(".frame img").getBoundingClientRect();
          return { endP: a.p, endPin: a.pinTop, afterPin: b.pinTop, pinH: pin.offsetHeight, vh: innerHeight, imgW: frame.width, imgH: frame.height, startP: c.p };
        });
        if (!pin.skip) {
          ok(pin.endP > 0.99 && pin.startP === 0, `F ${tag}: story progress ${pin.startP}..${pin.endP} does not run 0..1 over the pinned runway`);
          ok(pin.afterPin < pin.endPin, `F ${tag}: story did not let go after its runway`);
          ok(pin.pinH >= pin.vh - 80 && pin.pinH <= pin.vh, `F ${tag}: pinned story is ${pin.pinH}px tall in a ${pin.vh}px screen`);
          // round 3 (QA: frames were upscaled 2-2.6x): on phones the picture fills the width and the top part of the screen,
          // and a 1600 px library picture is drawn at no more than 1.5x on a 3x screen
          const shown = Math.max(pin.imgW, pin.imgH * 1600 / 893) * 3 / 1600;
          ok(pin.imgW >= w - 1 && pin.imgH >= pin.pinH * 0.4 && shown <= 1.5, `F ${tag}: story picture ${pin.imgW}x${pin.imgH} (upscale ${shown.toFixed(2)}x at 3x)`);
        }
      }
      await p2.close();
    }
    await ctx.close();
  }
  // smooth story under 4x CPU throttle (Chromium only: CDP)
  if (engineName === "chromium") for (const trade of TRADES) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    await route(ctx); await fontsOff(ctx);
    const page = await ctx.newPage();
    await page.goto(write(`perf-${trade}.html`, generateSite(form("cinematic", trade))), { waitUntil: "load" }); await page.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const r = await page.evaluate(async () => {
      const s = document.getElementById("story"), end = s.offsetHeight; const gaps = []; let last = performance.now(), y = 0;
      await new Promise((done) => { const f = (t) => { gaps.push(t - last); last = t; y += 14; scrollTo(0, y); if (y < end) requestAnimationFrame(f); else done(); }; requestAnimationFrame(f); });
      gaps.sort((a, b) => a - b); return { p95: gaps[Math.floor(gaps.length * 0.95)], max: gaps[gaps.length - 1], n: gaps.length };
    });
    ok(r.p95 < 50, `F chromium cinematic/${trade}: story scroll p95 frame ${r.p95.toFixed(1)} ms under 4x throttle (max ${r.max.toFixed(0)})`);
    console.log(`perf ${trade}: p95 ${r.p95.toFixed(1)} ms, max ${r.max.toFixed(0)} ms over ${r.n} frames (4x CPU throttle)`);
    await ctx.close();
  }
  await browser.close();
}
console.log(bad.length ? bad.map((b) => " - " + b).join("\n") : "");
console.log(`${bad.length ? "FAIL" : "PASS"}: round 2 checks (${pass} pass, ${bad.length} fail)`);
process.exit(bad.length ? 1 : 0);
