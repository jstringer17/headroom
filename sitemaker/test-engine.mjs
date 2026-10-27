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
  ok(plain.includes('data-look="editorial"') && plain.includes('data-ed="hero"') && plain.includes('data-ed="nav"'), `${trade}: editorial page not built`);
  ok(plain.includes("Sample projects: names and homes are fictional.") && (plain.match(/class="ed-card"/g) || []).length === 3, `${trade}: editorial work cards or note wrong`);
  ok(!plain.includes('id="price"') && !/Insured|Open 24\/7/.test(plain.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "")), `${trade}: editorial shows an unticked fact or a price without typed ranges`);
  ok(!/<script[^>]+src=/i.test(plain), `${trade}: editorial loads an outside script`);
  ok(plain.includes('data-ed="beat"') && plain.includes('data-ed="process"') && (plain.match(/<ol class="ed-steps">[\s\S]*?<\/ol>/)[0].match(/<li /g) || []).length === 4, `${trade}: editorial beat or four-step process missing`);
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
      const rows = await page.$$("[data-ed=row]");
      const src0 = await page.getAttribute("[data-ed=row-img]", "src");
      await rows[1].click(); await page.waitForTimeout(450);
      const src1 = await page.getAttribute("[data-ed=row-img]", "src");
      ok(src1 !== src0 && (await rows[1].getAttribute("aria-expanded")) === "true", `editorial rows: click did not open row 2 / swap picture`);
      await rows[2].focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(450);
      const src2 = await page.getAttribute("[data-ed=row-img]", "src");
      ok(src2 !== src1 && (await rows[2].getAttribute("aria-expanded")) === "true", "editorial rows: Enter did not open row 3 / swap picture");
      // rapid switching: the last row wins (no stale picture from an earlier row)
      for (const r of [rows[0], rows[1], rows[2], rows[3]]) await r.click();
      await page.waitForTimeout(500);
      const want = await rows[3].getAttribute("data-pic");
      ok((await page.getAttribute("[data-ed=row-img]", "data-slot")) === want, "editorial rows: rapid clicks left a stale picture");
      await rows[1].focus(); await page.keyboard.press("ArrowDown");
      ok(await page.evaluate(() => document.querySelectorAll("[data-ed=row]")[2] === document.activeElement), "editorial rows: ArrowDown does not move to the next row");
    }
    await page.close();
  }
}

// The real maker form: type a company, pick a trade, nothing else. The preview must be the Editorial
// site by default, and the Look select must switch it to Cinematic and to Classic.
{
  const makerFile = new URL("./maker.html", import.meta.url).href;
  for (const [trade, word] of [["roofing", "roof"], ["fencing", "fenc"], ["pressure", "wash"]]) {
    for (const width of [375, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errs = []; page.on("pageerror", (e) => errs.push(e.message));
      await page.route("**/*", (q) => (/^(file|data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
      await page.goto(makerFile, { waitUntil: "load" });
      ok((await page.inputValue("#look")) === "editorial", `maker@${width}: Look defaults to ${await page.inputValue("#look")}, not editorial`);
      ok(await page.isVisible("#look"), `maker@${width}: Look select is hidden`);
      await page.fill("#company", "Ridge Top Roofing");
      await page.selectOption("#trade", trade);
      await page.waitForTimeout(450);
      const src = () => page.$eval("#frame", (f) => f.srcdoc);
      const ed = await src();
      ok(ed.includes('data-look="editorial"') && ed.includes('data-ed="hero"'), `maker ${trade}@${width}: default form output is not the Editorial site`);
      ok(new RegExp(word, "i").test(ed), `maker ${trade}@${width}: Editorial preview is missing the trade`);
      ok(await page.isVisible("#cine-prices") && await page.isVisible("#cine-slots"), `maker ${trade}@${width}: picture or price fields are hidden for Editorial`);
      ok(await page.isVisible("#ed-projects"), `maker ${trade}@${width}: Editorial project cards fields are hidden`);
      await page.selectOption("#look", "cinematic"); await page.waitForTimeout(450);
      const ci = await src();
      ok(ci.includes('id="story"') && !ci.includes('data-look="editorial"'), `maker ${trade}@${width}: Cinematic option did not change the output`);
      ok(await page.isVisible("#cine-prices"), `maker ${trade}@${width}: price fields hidden for Cinematic`);
      await page.selectOption("#look", "classic"); await page.waitForTimeout(450);
      const cl = await src();
      ok(!cl.includes('id="story"') && !cl.includes('data-look="editorial"') && cl.includes('class="hero'), `maker ${trade}@${width}: Classic option did not change the output`);
      ok(errs.length === 0, `maker ${trade}@${width}: page error ${errs[0]}`);
      await page.close();
    }
  }
}

// The owner's own pictures: Editorial uses them first (hero, beat, process, cards, rows, never the same
// picture on neighbours) and the cinematic story keeps the subject on phones with a readable counter.
{
  const px = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  const imgs = Object.fromEntries(["stakes", "posts", "rails", "done"].map((k, i) => [k, px + "".padEnd(0) ]));
  // make each picture distinct so de-duplication does not merge them
  const distinct = Object.fromEntries(Object.keys(imgs).map((k, i) => [k, "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP" + "A".repeat(i + 1) + "//wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="]));
  const ed = generateSite({ company: "Cedar Post", trade: "fencing", cinematic: true, look: "editorial", cine: { images: distinct } });
  const slot = (re) => (ed.match(re) || [])[1];
  ok(slot(/class="ed-sil[^"]*"[^>]*><img[^>]*data-slot="([^"]+)"/) === "done", "editorial: hero is not the owner's last picture");
  const beat = slot(/<section class="ed-beat"[^>]*><img[^>]*data-slot="([^"]+)"/);
  ok(["stakes", "posts", "rails"].includes(beat), `editorial: second beat is not an owner picture (${beat})`);
  const cards = [...ed.matchAll(/data-ed="card"><img[^>]*data-slot="([^"]+)"/g)].map((m) => m[1]);
  ok(cards.length === 3 && cards.every((c) => c in distinct) && cards[0] !== cards[1] && cards[1] !== cards[2], `editorial: work cards do not cycle the owner pictures (${cards})`);
  const rowsPics = [...ed.matchAll(/data-ed="row" data-pic="([^"]+)"/g)].map((m) => m[1]);
  ok(rowsPics.length >= 4 && rowsPics.slice(0, 4).every((c) => c in distinct) && rowsPics.every((c, i) => c !== rowsPics[i - 1]), `editorial: service rows do not use the owner pictures first (${rowsPics})`);
  ok((ed.match(/data-real="1"/g) || []).length >= 4, "editorial: owner pictures not marked for the focal crop");
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.setContent(generateSite({ company: "Cedar Post", trade: "fencing", cinematic: true, cine: { images: distinct } }), { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const im = document.querySelector(".frame img[data-real]"); const c = document.querySelector(".prog-count");
    return { pos: im ? getComputedStyle(im).objectPosition : "", bg: c ? getComputedStyle(c).backgroundColor : "" };
  });
  ok(/^8\d%|88%/.test(r.pos), `cinematic: phone crop does not favour the subject side (${r.pos})`);
  ok(/rgba\(0, 0, 0, 0\.5/.test(r.bg), `cinematic: story counter has no dark backing (${r.bg})`);
  await page.close();
}

// The picture library: type only a company and pick Fencing, and the CEO's four pictures are in the site
// (Editorial and Cinematic) without any upload. Roofing has no library; the checkbox, uploads and Remove work.
{
  const makerFile = new URL("./maker.html", import.meta.url).href;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.route("**/*", (q) => (/^(file|data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.goto(makerFile, { waitUntil: "load" });
  await page.fill("#company", "Cedar Post Fencing");
  await page.selectOption("#trade", "fencing");
  await page.waitForTimeout(600);
  const prefix = (id) => page.evaluate((k) => PICTURE_LIBRARY.fencing[k].slice(0, 160), id);
  const srcdoc = () => page.$eval("#frame", (f) => f.srcdoc);
  const ids = ["stakes", "posts", "rails", "done"];
  const pre = Object.fromEntries(await Promise.all(ids.map(async (k) => [k, await prefix(k)])));
  ok(ids.every((k) => pre[k].startsWith("data:image/webp;base64,")), "library: fencing pictures are not embedded in maker.html");
  ok(await page.isVisible("#lib-wrap") && (await page.isChecked("#use-library")), "library: checkbox missing or not on by default for fencing");
  ok((await page.$$eval("#cine-slots .slot .lib-tag:not([hidden])", (e) => e.length)) === 4, "library: the four spots do not show 'Library picture'");
  let ed = await srcdoc();
  ok(ed.includes('data-look="editorial"') && ids.every((k) => ed.includes(pre[k])), "library: Editorial preview is missing library pictures");
  ok(/class="ed-sil[^"]*"[^>]*><img src="data:image\/webp/.test(ed), "library: Editorial hero is not a library picture");
  ok(/<section class="ed-beat"[^>]*><img src="data:image\/webp/.test(ed), "library: Editorial second beat is not a library picture");
  const proc = (ed.match(/class="ed-how-pic[^"]*"[^>]*>\s*<img[^>]*data-slot="([^"]+)"[^>]*data-real="1"/) || [])[1];
  ok(ids.includes(proc), `library: Editorial process picture is not a library picture (${proc})`);
    await page.selectOption("#look", "cinematic"); await page.waitForTimeout(500);
  const ci = await srcdoc();
  ok(ci.includes('id="story"') && ids.every((k) => ci.includes(pre[k])), "library: Cinematic story is missing library pictures");
  await page.selectOption("#look", "editorial"); await page.waitForTimeout(400);
  // download is one sane file
  const dl = page.waitForEvent("download");
  await page.click("#download");
  const file = await dl; const path2 = await file.path();
  const size = (await import("node:fs")).statSync(path2).size;
  ok(size > 1.2e6 && size < 6e6, `library: download size ${Math.round(size / 1024)} KB is not sane`);
  // checkbox off -> drawings only
  await page.uncheck("#use-library"); await page.waitForTimeout(500);
  ed = await srcdoc();
  ok(!ed.includes(pre.posts) && !ed.includes(pre.done), "library: unticking the checkbox still shows library pictures");
  await page.check("#use-library"); await page.waitForTimeout(500);
  // Remove on one spot -> that spot goes back to the drawing, the rest stay
  await page.click('#cine-slots .slot[data-slot="posts"] .slot-clear'); await page.waitForTimeout(500);
  ed = await srcdoc();
  ok(!ed.includes(pre.posts) && ed.includes(pre.done), "library: Remove did not drop only that picture");
  // an upload wins over the library picture
  await page.check("#use-library"); await page.waitForTimeout(200);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  await page.setInputFiles('#cine-slots .slot[data-slot="done"] input[type=file]', { name: "mine.png", mimeType: "image/png", buffer: png });
  await page.waitForTimeout(900);
  ed = await srcdoc();
  ok(!ed.includes(pre.done) && ed.includes("data:image/jpeg"), "library: an uploaded picture did not replace the library picture");
  // roofing has no library
  await page.selectOption("#trade", "roofing"); await page.waitForTimeout(600);
  ed = await srcdoc();
  ok(!(await page.isVisible("#lib-wrap")) && !ed.includes("data:image/webp") && ed.includes("image/svg+xml"), "library: roofing should keep drawings and no library box");
  ok(errs.length === 0, `library: page error ${errs[0]}`);
  await page.close();
}

await browser.close();
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log(`PASS: engine layout checks (${TRADE_ORDER.length} trades x 2 widths)`);
