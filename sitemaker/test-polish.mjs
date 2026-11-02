// Polish checks for the $10k bar (QA report org/art/qa-10k-report.txt, fix list items 1-9).
//   node sitemaker/build.mjs --test && node sitemaker/test-polish.mjs
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { here, loadPlaywright, launchOpts } from "./qa/lib.mjs";
import { generateSite, formatPhone } from "./src/generate.js";
import { offeredPrices } from "./src/cinematic.js";
import { reviewsOf } from "./src/reviews.js";
import { CINE_KIT } from "./src/cine-kit.js";

const MAKER = pathToFileURL(join(here, "..", "maker.html")).href;
const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = (s) => { const v = (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); return /^color\(/.test(s) ? v.map((x) => x * 255) : v; };

async function maker(width = 1280, fn) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 812 : 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.route("**/*", (q) => (/^(file|data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.goto(MAKER, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const r = await fn(page);
  await ctx.close();
  return r;
}
const srcdoc = (page) => page.$eval("#frame", (f) => f.srcdoc);
async function site(html, width = 375, fn) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 812 : 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const r = await fn(page, errs);
  await ctx.close();
  return r;
}
const pick = async (page, trade, look) => { await page.fill("#company", "Ridge Roofing and Restoration"); await page.selectOption("#trade", trade); await page.selectOption("#look", look); await page.waitForTimeout(500); };

// ---- 1. Everything we do (Cinematic): one card at rest, keyboard reaches all
for (const trade of ["roofing", "pressure"]) {
  const html = await maker(375, async (p) => { await pick(p, trade, "cinematic"); return srcdoc(p); });
  await site(html, 375, async (page, errs) => {
    const m = await page.$$eval("#all .all-item", (e) => e.length);
    const geo = await page.evaluate(() => { const st = document.querySelector("#all .all-stage"), pin = document.querySelector("#all .all-pin"); return { top: st.getBoundingClientRect().top + scrollY, total: st.offsetHeight - pin.offsetHeight }; });
    for (const f of [0.5, 1.5, 2.6, 4.45]) {
      await page.evaluate((y) => scrollTo(0, y), geo.top + geo.total * f / (m - 1));
      await page.waitForTimeout(1300); // scroll stops: the story settles by itself
      const ops = await page.$$eval("#all .all-item", (e) => e.map((x) => +(+x.style.opacity).toFixed(2)));
      const strong = ops.filter((o) => o > 0.5).length, faint = ops.filter((o) => o > 0.03 && o < 0.97).length;
      ok(strong === 1 && faint === 0, `${trade}: stopping at step ${f} leaves ${strong} cards showing and ${faint} half-faded (${ops.join(",")})`);
    }
    ok((await page.$$eval("#all .all-dots button", (e) => e.length)) === m, `${trade}: Everything we do has no one-button-per-card control (${m} cards)`);
    // every card is reachable with the keyboard: dots, then arrows move to the next card
    await page.focus("#all .all-dots button >> nth=0", { timeout: 1500 }).catch(() => {});
    for (let i = 1; i < m; i++) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1500);
    ok((await page.evaluate(() => document.activeElement && document.activeElement.closest(".all-dots") ? document.activeElement.textContent.length >= 0 : false)), `${trade}: focus left the card buttons on ArrowRight`);
    const act = await page.$$eval("#all .all-item", (e) => e.map((x) => +x.style.opacity > 0.5));
    ok(act[m - 1] && act.filter(Boolean).length === 1, `${trade}: arrow keys did not step to card ${m}: ${act}`);
    const focusable = await page.$$eval("#all .all-item", (e) => e.map((x) => x.inert || getComputedStyle(x).visibility === "hidden" ? 0 : x.querySelectorAll("button,a,[tabindex='0']").length));
    ok(focusable[m - 1] >= 3 && focusable.filter((n) => n > 0).length === 1, `${trade}: only the active card should be focusable, got ${focusable}`);
    ok(errs.length === 0, `${trade}: page errors ${errs.join("; ")}`);
  });
}

// ---- 2. Contrast of the reviews beat (Cinematic)
for (const trade of ["pressure", "roofing", "fencing"]) {
  const html = await maker(1280, async (p) => { await pick(p, trade, "cinematic"); return srcdoc(p); });
  await site(html, 1280, async (page) => {
    const c = await page.evaluate(() => {
      const bgOf = (el) => { for (; el; el = el.parentElement) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)") return b; } return "rgb(255,255,255)"; };
      const out = {};
      for (const [k, sel] of [["em", "#reviews h2 em"], ["tag", "#reviews .rvw-tag"], ["by", "#reviews .rvw-by"], ["kicker", "#all .kicker"]]) { const e = document.querySelector(sel); out[k] = e ? [getComputedStyle(e).color, bgOf(e)] : null; }
      return out;
    });
    if (c.em) ok(contrast(rgb(c.em[0]), rgb(c.em[1])) >= 4.5, `${trade}: reviews heading accent ${c.em[0]} on ${c.em[1]} is ${contrast(rgb(c.em[0]), rgb(c.em[1])).toFixed(1)}:1 (needs 4.5)`);
    for (const k of ["tag", "by", "kicker"]) if (c[k]) ok(contrast(rgb(c[k][0]), rgb(c[k][1])) >= 4.5, `${trade}: ${k} ${c[k][0]} on ${c[k][1]} is ${contrast(rgb(c[k][0]), rgb(c[k][1])).toFixed(1)}:1 (needs 4.5)`);
  });
}
// Editorial small accent text on cream
for (const trade of ["pressure", "roofing", "fencing"]) {
  const html = await maker(1280, async (p) => { await pick(p, trade, "editorial"); return srcdoc(p); });
  await site(html, 1280, async (page) => {
    const c = await page.evaluate(() => { const bgOf = (el) => { for (; el; el = el.parentElement) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)") return b; } return "rgb(255,255,255)"; }; const s = document.querySelector(".ed-sec:not(.ed-dark):not(.ed-final) .ed-eyebrow") || document.querySelector(".ed-eyebrow"); return [getComputedStyle(s).color, bgOf(s)]; });
    ok(contrast(rgb(c[0]), rgb(c[1])) >= 4.5, `${trade}: editorial eyebrow ${c[0]} on ${c[1]} is ${contrast(rgb(c[0]), rgb(c[1])).toFixed(1)}:1 (needs 4.5)`);
  });
}

// ---- 3. Editorial "The work": different picture and details per card
for (const trade of ["roofing", "fencing", "pressure"]) {
  const html = generateSite({ company: "Ridge Co", trade, city: "Tulsa, OK", cinematic: true, look: "editorial", cine: { look: "editorial" } });
  const cards = [...html.matchAll(/data-ed="card"><img[^>]*data-slot="([^"]+)"/g)].map((m) => m[1]);
  ok(cards.length === 3 && new Set(cards).size === 3, `${trade}: The work cards repeat a picture (${cards})`);
  const metas = [...html.matchAll(/<dl class="ed-meta"[^>]*>(.*?)<\/dl>/g)].map((m) => m[1].replace(/<[^>]+>/g, "|"));
  ok(metas.length === 3 && new Set(metas).size === 3, `${trade}: The work cards have identical details`);
  ok(new Set([...html.matchAll(/<dt>Type<\/dt><dd>([^<]*)/g)].map((m) => m[1])).size >= 2, `${trade}: every work card has the same Type`);
}

// ---- 4. "Ask about this": closes the dialog, goes to the form, picks the job
for (const look of ["editorial", "cinematic"]) {
  const html = await maker(1280, async (p) => { await pick(p, "roofing", look); return srcdoc(p); });
  await site(html, 375, async (page) => {
    if (look === "editorial") {
      await page.click('[data-ed="all-card"] >> nth=1'); await page.waitForTimeout(300);
      ok(await page.$eval("#ed-dlg-1", (d) => d.open), "editorial: the card did not open its dialog");
      await page.click("#ed-dlg-1 a.ed-btn"); await page.waitForTimeout(900);
      ok(!(await page.$eval("#ed-dlg-1", (d) => d.open)), "editorial: Ask about this left the dialog open");
    } else {
      await page.evaluate(() => document.querySelector("#all .all-item:nth-child(2) a.btn-accent").click()); await page.waitForTimeout(900);
    }
    const r = await page.evaluate(() => { const c = document.getElementById("contact").getBoundingClientRect(); return { inView: c.top < innerHeight * 0.8 && c.bottom > 0, job: (document.querySelector("#ask select") || {}).value }; });
    ok(r.inView, `${look}: Ask about this did not scroll to the contact form`);
    ok(/metal/i.test(r.job || ""), `${look}: Ask about this did not preselect the job (got "${r.job}")`);
  });
}

// ---- 5. Phone numbers
{
  const t = (raw) => (formatPhone(raw) || {}).tel || "";
  ok(t("9185550142") === "+19185550142" && t("(918) 555-0142") === "+19185550142" && t("1-918-555-0142") === "+19185550142", "phone: 10 or 11 digits must become +1...");
  ok(t("918555014") === "", `phone: 9 digits must give no call link, got ${t("918555014")}`);
  ok(t("(918) 555-0142 ext. 12") === "+19185550142;ext=12", `phone: extension must be tel:+1...;ext=12, got ${t("(918) 555-0142 ext. 12")}`);
  ok(/^\+44/.test(t("+44 20 7946 0958")), "phone: a +country number must keep its country code");
  const h = generateSite({ company: "T", trade: "roofing", phone: "918555014" });
  ok(!/href="tel:/.test(h) && !h.includes("Phone number here"), "phone: 9 digits still gives a call link or placeholder");
  await maker(1280, async (p) => {
    await p.fill("#phone", "918555014"); await p.waitForTimeout(300);
    ok(await p.locator("#phone-warn").isVisible().catch(() => false), "phone: the form shows no warning for a 9-digit number");
    await p.fill("#phone", "9185550142"); await p.waitForTimeout(300);
    ok(!(await p.locator("#phone-warn").isVisible().catch(() => false)), "phone: warning stays for a good number");
  });
}

// ---- 6. Estimator: cents, low>high, quantity
{
  const kit = CINE_KIT.pressure;
  const sizes = kit.estimator.sizes, opts = kit.estimator.options;
  const cell = (lo, hi) => ({ low: lo, high: hi });
  const prices = { [sizes[0]]: { [opts[0]]: cell("0.25", "0.45"), [opts[1]]: cell("900", "500") } };
  const p = offeredPrices(kit, prices);
  ok(p && p.cells[sizes[0]][opts[0]] === "$0.25 to $0.45", `estimator: cents lost, got ${p && p.cells[sizes[0]][opts[0]]}`);
  ok(p && p.cells[sizes[0]][opts[1]] === "$500 to $900", `estimator: low>high was dropped or not swapped, got ${p && p.cells[sizes[0]][opts[1]]}`);
  const html = generateSite({ company: "Ridge Co", trade: "pressure", cinematic: true, look: "cinematic", cine: { look: "cinematic", prices, unit: "per sq ft" } });
  await site(html, 375, async (page) => {
    ok(await page.isVisible("#est-qty"), "estimator: no quantity input for a per sq ft price");
    let t = "";
    if (await page.isVisible("#est-qty")) { await page.fill("#est-qty", "1000"); await page.waitForTimeout(300); t = (await page.textContent("#est-total")) || ""; }
    ok(/\$250/.test(t) && /\$450/.test(t), `estimator: 1000 sq ft x $0.25-0.45 should show $250 to $450, got "${t}"`);
  });
  await maker(1280, async (pg) => {
    await pick(pg, "pressure", "cinematic");
    const first = await pg.$("#cine-prices input"); const ins = await pg.$$("#cine-prices input[type=number], #cine-prices input[type=text]");
    await ins[0].fill("900"); await ins[1].fill("500"); await pg.waitForTimeout(300);
    ok(await pg.locator("#price-warn").isVisible().catch(() => false), "estimator: no warning in the form when the low price is higher than the high price");
  });
}

// ---- 7. No placeholders in what ships
for (const trade of ["hvac", "roofing"]) for (const look of ["cinematic", "editorial", "classic"]) {
  const r = await maker(1280, async (p) => {
    await p.fill("#company", "Ridge Co"); await p.selectOption("#trade", trade); await p.selectOption("#look", look); await p.waitForTimeout(600);
    const prev = await srcdoc(p);
    const dl = p.waitForEvent("download"); await p.click("#download"); const f = await dl;
    const { readFileSync } = await import("node:fs");
    return { prev, down: readFileSync(await f.path(), "utf8") };
  });
  const dec = (s) => s.replace(/data:image\/svg\+xml[^"')]*/g, (m) => { try { return decodeURIComponent(m); } catch { return m; } });
  ok(!r.down.includes("Phone number here") && !r.prev.includes("Phone number here"), `${trade}/${look}: "Phone number here" ships`);
  ok(!/Sample picture: make in Higgsfield/.test(dec(r.down)), `${trade}/${look}: the downloaded file has "Sample picture: make in Higgsfield" notes`);
}

// ---- 8. Charset
for (const [name, html] of [["maker.html", (await import("node:fs")).readFileSync(join(here, "..", "maker.html"), "utf8")], ["cinematic", generateSite({ company: "T", trade: "roofing", cinematic: true, look: "cinematic", cine: { look: "cinematic" }, years: "14", insured: true })], ["editorial", generateSite({ company: "T", trade: "roofing", cinematic: true, look: "editorial", cine: { look: "editorial" } })], ["classic", generateSite({ company: "T", trade: "roofing" })]]) {
  ok(/<meta charset="?utf-8"?/i.test(html.slice(0, 1200)), `${name}: no <meta charset="utf-8"> near the top`);
}

// ---- 9. Minor items
{
  const w = reviewsOf({ reviewList: [{ text: ("word ".repeat(80)).trim(), stars: 5 }] }).items[0].text;
  ok(w.length <= 240 && /…$/.test(w) && !/\bwor…$/.test(w), `reviews: long text must cut at a word with an ellipsis, got "${w.slice(-20)}"`);
  const hero = (trade, v) => generateSite({ company: "Ridge Co", trade, cinematic: true, look: "editorial", cine: { look: "editorial", variant: v } }).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, "");
  ok(new Set(CINE_KIT.roofing.variants.map((v) => hero("roofing", v.key))).size >= 4, "editorial: the hero headline is the same for most variations");
  const longName = "Wiśniewska-Kowalczyk & Fitzgerald Roofing, Exteriors and Restoration Holdings LLC";
  const ch = generateSite({ company: longName, trade: "roofing", cinematic: true, look: "cinematic", cine: { look: "cinematic" } });
  await site(ch, 375, async (page) => {
    const m = await page.evaluate(() => { const b = document.querySelector(".top .brand"), h = document.querySelector(".top").getBoundingClientRect(), r = b.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(b).lineHeight) || 20; return { lines: Math.round(r.height / lh), inside: r.top >= h.top - 1 && r.bottom <= h.bottom + 1, ellipsis: getComputedStyle(b).textOverflow, h1: parseFloat(getComputedStyle(document.querySelector(".story h1")).fontSize) }; });
    ok(m.lines <= 1 && m.inside && m.ellipsis === "ellipsis", `cinematic: a long company name is not shortened in the header (${JSON.stringify(m)})`);
    ok(m.h1 >= 46, `cinematic: phone hero text is ${m.h1}px, should be 46px or more`);
  });
  const cf = generateSite({ company: "Ridge Co", trade: "roofing", cinematic: true, look: "cinematic", cine: { look: "cinematic" } });
  for (const [look, html] of [["cinematic", cf], ["editorial", generateSite({ company: "Ridge Co", trade: "roofing", cinematic: true, look: "editorial", cine: { look: "editorial" } })], ["classic", generateSite({ company: "Ridge Co", trade: "roofing" })]]) {
    await site(html, 375, async (page) => {
      await page.evaluate(() => document.getElementById("ask").requestSubmit ? document.getElementById("ask").requestSubmit() : document.querySelector("#ask [type=submit]").click());
      await page.waitForTimeout(300);
      const note = await page.textContent("#f-note");
      ok(!/Thanks/i.test(note) && /name|phone/i.test(note), `${look}: the sample form says "${note}" when it is empty`);
    });
  }
  const sticky = generateSite({ company: "Ridge Co", trade: "roofing", cinematic: true, look: "cinematic", cine: { look: "cinematic" } });
  await site(sticky, 375, async (page) => {
    await page.evaluate(() => document.getElementById("all").scrollIntoView()); await page.waitForTimeout(700);
    const hidden = await page.evaluate(() => { const m = document.querySelector(".mobile-call"); const r = m.getBoundingClientRect(); return getComputedStyle(m).visibility === "hidden" || r.top >= innerHeight; });
    ok(hidden, "cinematic: the Call pill stays over Everything we do (it covers Ask about this)");
  });
}

await browser.close();
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log("PASS: polish checks (everything-we-do snap and keys, contrast, work cards, ask-about-this, phone, estimator, placeholders, charset, minor items)");
