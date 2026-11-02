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

// ---- 1. One style picker with every variation and the page's only before/after
for (const look of ["cinematic", "editorial", "classic"]) for (const trade of ["roofing", "fencing", "pressure"]) {
  const html = await maker(375, async (p) => { await pick(p, trade, look); return srcdoc(p); });
  const n = CINE_KIT[trade].variants.length;
  await site(html, 375, async (page, errs) => {
    const chips = look === "cinematic" ? "#styles [role=tab]" : look === "editorial" ? "#styles [role=tab]" : "#styles [role=tab]";
    ok((await page.$$eval(chips, (e) => e.length)) === n, `${trade}/${look}: the style picker should list all ${n} variations`);
    ok(!(await page.$("#before-after")) && !(await page.$("#all")), `${trade}/${look}: the old separate before/after or Everything we do section is still there`);
    if (look === "classic") return;
    const sliders = await page.$$eval("[role=slider],input[type=range]", (e) => e.filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && getComputedStyle(x).visibility !== "hidden" && !x.closest("[hidden]"); }).length);
    ok(sliders === 1, `${trade}/${look}: ${sliders} before/after sliders are showing, there must be exactly one`);
    // phone: the chips scroll sideways and every one is reachable by keyboard
    const sc = await page.$eval("#styles .vp-chips", (e) => ({ sw: e.scrollWidth, cw: e.clientWidth, ox: getComputedStyle(e).overflowX }));
    ok(sc.ox === "auto" && sc.sw >= sc.cw, `${trade}/${look}: the chips are not a sideways-scrolling row (${JSON.stringify(sc)})`);
    await page.focus("#styles [role=tab] >> nth=0");
    for (let i = 1; i < n; i++) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    const act = await page.$$eval("#styles [role=tab]", (e) => e.map((x) => x.getAttribute("aria-selected")));
    ok(act[n - 1] === "true" && act.filter((x) => x === "true").length === 1, `${trade}/${look}: arrow keys did not reach the last variation (${act})`);
    const vis = await page.$$eval("#styles [role=tabpanel]", (e) => e.map((x) => !x.hidden));
    ok(vis[n - 1] && vis.filter(Boolean).length === 1, `${trade}/${look}: only the picked variation's panel should show (${vis})`);
    ok(errs.length === 0, `${trade}/${look}: page errors ${errs.join("; ")}`);
  });
}

// ---- 2. Contrast of the reviews beat (Cinematic)
for (const trade of ["pressure", "roofing", "fencing"]) {
  const html = await maker(1280, async (p) => { await pick(p, trade, "cinematic"); return srcdoc(p); });
  await site(html, 1280, async (page) => {
    const c = await page.evaluate(() => {
      const bgOf = (el) => { for (; el; el = el.parentElement) { const b = getComputedStyle(el).backgroundColor; if (b && b !== "rgba(0, 0, 0, 0)") return b; } return "rgb(255,255,255)"; };
      const out = {};
      for (const [k, sel] of [["em", "#reviews h2 em"], ["tag", "#reviews .rvw-tag"], ["by", "#reviews .rvw-by"], ["kicker", "#styles .kicker"]]) { const e = document.querySelector(sel); out[k] = e ? [getComputedStyle(e).color, bgOf(e)] : null; }
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

// ---- 4. "Ask about this": goes to the form and picks the job
for (const look of ["editorial", "cinematic"]) {
  const html = await maker(1280, async (p) => { await pick(p, "roofing", look); return srcdoc(p); });
  await site(html, 375, async (page) => {
    await page.click("#styles [role=tab] >> nth=1"); await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector("#styles [role=tabpanel]:not([hidden]) a[data-job]").click()); await page.waitForTimeout(900);
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
}


// ---- C. Credibility profile: type once, plugged in everywhere, in every look
const CRED = { "#cred-founded": "2008", "#cred-google-url": "https://g.page/ridge", "#cred-bbb-rating": "A+", "#cred-bbb-url": "https://bbb.org/ridge", "#cred-yelp-rating": "4.5", "#cred-yelp-count": "38", "#cred-yelp-url": "https://yelp.com/biz/ridge", "#cred-angi-rating": "4.9", "#cred-angi-count": "22", "#cred-fb-rating": "4.7", "#cred-other-name": "Nextdoor", "#cred-other-rating": "4.6", "#cred-license": "R-12345", "#cred-coverage": "$2M", "#cred-warranty": "10 year", "#cred-jobs": "1200", "#cred-award-1": "Best of Tulsa 2024", "#cred-cert-1": "GAF Master Elite" };
for (const look of ["cinematic", "editorial", "classic"]) {
  const doc = await maker(1280, async (p) => {
    await pick(p, "roofing", look);
    await p.fill("#phone", "9185550142"); await p.fill("#rating", "4.8"); await p.fill("#reviews", "112"); await p.check("#insured");
    for (const [sel, v] of Object.entries(CRED)) { if (sel === "#cred-bbb-rating") await p.selectOption(sel, v); else await p.fill(sel, v); }
    for (const sel of ["#cred-bbb-acc", "#cred-bonded", "#cred-family", "#cred-veteran"]) await p.check(sel);
    await p.waitForTimeout(500);
    return srcdoc(p);
  });
  const text = doc.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const need of ["BBB A+", "Accredited", "Yelp 4.5", "Angi 4.9", "Facebook 4.7", "Nextdoor 4.6", "Licensed", "R-12345", "Bonded", "10 year", "1,200+ jobs", "Family owned", "Veteran owned", "Best of Tulsa 2024", "GAF Master Elite", "Since 2008"]) ok(text.includes(need), `${look}: "${need}" is not on the site`);
  ok(/href="https:\/\/yelp\.com\/biz\/ridge"/.test(doc) && /href="https:\/\/bbb\.org\/ridge"/.test(doc), `${look}: the typed profile links are not on the site`);
  const years = new Date().getFullYear() - 2008;
  ok(text.includes(`${years} years`), `${look}: years in business is not worked out from the founded year (${years})`);
  const top = (doc.match(/class="(?:story-trust|ed-trust3|hero-trust)">([^<]*)</) || [])[1] || "";
  ok(top && top.split(" · ").length === 3 && /Google/.test(top) && /Licensed/.test(top), `${look}: the hero line is not the three strongest facts ("${top}")`);
  const ld = (doc.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  let j = null; try { j = JSON.parse(ld.replace(/\\u003c/g, "<")); } catch (_) { /* below */ }
  ok(j && j.aggregateRating && j.aggregateRating.ratingValue === 4.8 && j.aggregateRating.reviewCount === 112 && j.sameAs.length >= 3 && j.foundingDate === "2008", `${look}: schema.org data is missing or wrong`);
  ok(new RegExp("Licensed #R-12345").test(text) && text.includes("Insured $2M") , `${look}: the contact or footer line is missing the license and insurance`);
}
{ // nothing typed: nothing shown, no schema, no invented numbers
  for (const look of ["cinematic", "editorial", "classic"]) {
    const h = generateSite({ company: "Ridge Co", trade: "roofing", ...(look === "classic" ? {} : { cinematic: true, look, cine: { look } }) });
    ok(!/class="[^"]*\b(?:ed-)?proof\b|story-trust"|ed-trust3"|hero-trust"|ld\+json|cred-line"/.test(h.replace(/<style[\s\S]*?<\/style>/g, "")), `${look}: an empty profile still shows credibility pieces`);
  }
  const bad = generateSite({ company: "T", trade: "roofing", cred: { bbb: { rating: "Z" }, yelp: { rating: "9" }, googleUrl: "javascript:alert(1)", jobs: "-3", founded: "1500" } });
  ok(!/BBB|Yelp|javascript:|\+ jobs|Since 1500/.test(bad.replace(/<style[\s\S]*?<\/style>/g, "")), "profile: invalid values must be ignored");
  const noCount = generateSite({ company: "T", trade: "roofing", rating: "4.8", cred: { googleUrl: "https://g.page/x" } });
  ok(!/aggregateRating/.test(noCount), "schema: a rating without a review count must not become aggregateRating");
}
{ // saved in this browser, reused next time
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const a = await ctx.newPage(); await a.route("**/*", (q) => (/^(file|data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await a.goto(MAKER, { waitUntil: "load" });
  await a.fill("#company", "Ridge Roofing"); await a.fill("#city", "Tulsa, OK"); await a.fill("#cred-license", "R-12345"); await a.fill("#cred-yelp-rating", "4.5"); await a.waitForTimeout(300);
  const b = await ctx.newPage(); await b.route("**/*", (q) => (/^(file|data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await b.goto(MAKER, { waitUntil: "load" });
  ok(await b.locator("#cred-reuse").isVisible(), "profile: no 'Reuse last business' button on the next visit");
  await b.click("#cred-reuse"); await b.waitForTimeout(400);
  ok((await b.inputValue("#company")) === "Ridge Roofing" && (await b.inputValue("#cred-license")) === "R-12345" && (await b.inputValue("#cred-yelp-rating")) === "4.5", "profile: Reuse last business did not fill the fields");
  await b.click("#cred-forget"); await b.waitForTimeout(200);
  const c = await ctx.newPage(); await c.goto(MAKER, { waitUntil: "load" });
  ok(!(await c.locator("#cred-reuse").isVisible()), "profile: Forget saved business did not forget");
  await ctx.close();
}

await browser.close();
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log("PASS: polish checks (everything-we-do snap and keys, contrast, work cards, ask-about-this, phone, estimator, placeholders, charset, minor items)");
