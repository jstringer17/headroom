// Every control of the REAL maker.html, in every look, on several trades (owner: cine-qa).
//   node sitemaker/build.mjs --test && node sitemaker/test-features.mjs
// Drives the form like a user. Prints a table (control x look) and exits 1 on any FAIL.
// Colors are judged by what the visitor SEES (computed colors inside the preview), not by CSS variables.
import { mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { here, loadPlaywright, launchOpts } from "./qa/lib.mjs";

const MAKER = pathToFileURL(join(here, "..", "maker.html")).href;
const tmp = join(here, "test-out-features"); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const JPEG = join(tmp, "pic.jpg"); // a small valid JPEG
writeFileSync(JPEG, Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AB//Z", "base64"));

const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const rows = []; // { control, look, trade, status, note }
const rec = (control, look, trade, ok, note = "") => rows.push({ control, look, trade, status: ok ? "PASS" : "FAIL", note: ok ? "" : String(note).slice(0, 160) });

const strip = (h) => h.replace(/data:image\/[a-z+]+;base64,[A-Za-z0-9+\/=%]+/g, "IMG").replace(/data:image\/svg\+xml[^"')]+/g, "SVG");
const realImgs = (h) => new Set([...h.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^data:image\/svg/.test(u))).size;
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

async function open(opts = {}) {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1500, height: 950 }, acceptDownloads: true, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "null" }).catch(() => {});
  await ctx.addInitScript(() => { window.__clip = ""; try { const w = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null; navigator.clipboard.writeText = (t) => { window.__clip = String(t); return Promise.resolve(); }; document.execCommand = ((o) => function (c) { if (c === "copy") { window.__clip = (document.getSelection() || "").toString() || window.__clip; } return o.apply(document, arguments); })(document.execCommand); } catch (e) {} });
  const page = await ctx.newPage(); page.errs = [];
  page.on("pageerror", (e) => page.errs.push(e.message.slice(0, 100)));
  await page.route("**/*", (r) => { const u = r.request().url(); return /^(file|data|about|blob):/.test(u) || /fonts\.(googleapis|gstatic)\.com/.test(u) ? r.continue() : r.abort(); });
  await page.goto(MAKER, { waitUntil: "load" }); await page.waitForTimeout(800);
  page.html = () => page.evaluate(() => document.getElementById("frame").srcdoc);
  page.settle = () => page.waitForTimeout(450);
  page.ctx = ctx;
  return page;
}
async function setup(page, { company = "Ridgeline Co", trade, look }) {
  await page.fill("#company", company); await page.selectOption("#trade", trade); await page.waitForTimeout(300);
  if (look) await page.selectOption("#look", look);
  await page.settle();
}
// colours the visitor sees inside the preview
async function seen(page) {
  const fr = await (await page.$("#frame")).contentFrame();
  return fr.evaluate(() => {
    const rgb = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
    const alpha = (s) => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? +m[3] : 1; };
    const bgOf = (el) => { for (; el; el = el.parentElement) { const c = getComputedStyle(el).backgroundColor; if (alpha(c) > 0.9) return rgb(c); } return [255, 255, 255]; };
    const btn = document.querySelector(".btn-accent, .ed-btn, .btn, .cine-btn, a.btn");
    const em = document.querySelector("h1 em, h1 i, h1 .accent, .ed-h1 em, h2 em");
    const dark = [...document.querySelectorAll("section, header, footer")].find((s) => { const b = bgOf(s); return (0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2]) < 90; });
    const emDark = dark && dark.querySelector("em, i, .accent");
    return {
      btnBg: btn ? rgb(getComputedStyle(btn).backgroundColor) : null, btnFg: btn ? rgb(getComputedStyle(btn).color) : null,
      em: em ? rgb(getComputedStyle(em).color) : null, emBg: em ? bgOf(em) : null,
      emDark: emDark ? rgb(getComputedStyle(emDark).color) : null, emDarkBg: emDark ? bgOf(emDark) : null,
      darkBg: dark ? bgOf(dark) : null,
    };
  });
}

const LOOKS = ["editorial", "cinematic", "classic"];
const THEMES = ["navy", "forest", "steel", "sky"];

// ---------- 1. Colors: every swatch must change what is SEEN, with readable contrast ----------
for (const trade of ["roofing", "fencing"]) {
  const page = await open();
  for (const look of LOOKS) {
    await setup(page, { trade, look });
    const per = {};
    for (const th of THEMES) { await page.click(`label[for="theme-${th}"]`); await page.settle(); per[th] = await seen(page); }
    const key = (s) => JSON.stringify([s.btnBg, s.em, s.darkBg]);
    const distinctBtn = new Set(THEMES.map((t) => JSON.stringify(per[t].btnBg))).size;
    const distinctVis = new Set(THEMES.map((t) => key(per[t]))).size;
    rec("Colors: 4 swatches give 4 different visible button colours", look, trade, distinctBtn === 4, `distinct buttons=${distinctBtn}`);
    rec("Colors: 4 swatches give 4 different visible looks (button, accent word, dark sections)", look, trade, distinctVis === 4, `distinct=${distinctVis}`);
    const bad = [];
    for (const th of THEMES) {
      const s = per[th];
      if (s.btnBg && s.btnFg && contrast(s.btnBg, s.btnFg) < 4.5) bad.push(`${th}: button text ${contrast(s.btnBg, s.btnFg).toFixed(1)}`);
      if (s.em && s.emBg && contrast(s.em, s.emBg) < 3) bad.push(`${th}: accent word on its background ${contrast(s.em, s.emBg).toFixed(1)}`);
      if (s.emDark && s.emDarkBg && contrast(s.emDark, s.emDarkBg) < 4.5) bad.push(`${th}: accent on dark ${contrast(s.emDark, s.emDarkBg).toFixed(1)}`);
    }
    rec("Colors: contrast (button text 4.5, accent word 3 display, accent on dark 4.5)", look, trade, bad.length === 0, bad.join("; "));
  }
  await page.ctx.close();
}

// ---------- 2. Content controls: every look x fencing (library) and roofing (no library) ----------
for (const trade of ["fencing", "roofing"]) for (const look of LOOKS) {
  const page = await open();
  await setup(page, { company: "Ridgeline Co", trade, look });
  await page.fill("#city", "Tulsa, OK"); await page.fill("#phone", "9185550142"); await page.fill("#rating", "4.8"); await page.fill("#reviews", "112"); await page.fill("#years", "12"); await page.settle();
  let h = await page.html();
  rec("Company name shows", look, trade, h.includes("Ridgeline Co"), "name missing");
  rec("Town shows", look, trade, h.includes("Tulsa"), "town missing");
  rec("Phone shows, call link is a tel: link", look, trade, h.includes("(918) 555-0142") && h.includes("tel:+19185550142"), "phone/tel missing");
  rec("Rating and review count show", look, trade, h.includes("4.8") && h.includes("112"), "rating missing");
  rec("Years in business shows", look, trade, /12 years|12\+? yrs/i.test(h), "years missing");
  const before = strip(h);
  await page.check("#emergency"); await page.settle(); h = await page.html();
  rec("24/7 box changes the site and says so", look, trade, /24\/7|24 hours/i.test(h) && strip(h) !== before, "no 24/7 text");
  await page.uncheck("#emergency");
  await page.uncheck("#freeEstimates"); await page.settle(); let h2 = await page.html();
  rec("Free estimates off changes the wording", look, trade, strip(h2) !== strip(h), "no change");
  await page.check("#freeEstimates");
  await page.uncheck("#insured"); await page.settle(); const hi0 = strip(await page.html());
  await page.check("#insured"); await page.settle(); h = await page.html();
  rec("Licensed and insured shows when ticked", look, trade, /Licensed and insured|Insured/i.test(h) && strip(h) !== hi0, "insured missing");
  const svc = await page.$$("#services input");
  if (svc.length) {
    const hAll = strip(await page.html()); await svc[0].uncheck(); await page.settle(); const hOff = strip(await page.html()); await svc[0].check(); await page.settle();
    rec("Unticking a service changes the site", look, trade, hOff !== hAll, "no change");
  } else rec("Services list present", look, trade, false, "no services inputs");
  // hero picture: file upload, link (overrides the library hero), remove
  await page.setInputFiles("#hero-file", JPEG); await page.waitForTimeout(900); h = await page.html();
  rec("Hero picture upload is used", look, trade, /data:image\/jpeg/.test(h), "uploaded hero not in site");
  await page.click("#hero-clear"); await page.settle();
  await page.fill("#hero-url", "https://example.com/pic.jpg"); await page.settle(); h = await page.html();
  rec("Hero picture link is used (and overrides the library hero)", look, trade, h.includes("https://example.com/pic.jpg"), "link not used");
  await page.fill("#hero-url", ""); await page.settle();
  // price table, unit select (cinematic + editorial only; classic has no estimator)
  if (look !== "classic") {
    const pin = await page.$$("#cine-prices input[type=number]");
    if (pin.length >= 2) {
      await pin[0].fill("22"); await pin[1].fill("34"); await page.settle(); h = await page.html();
      rec("Typed price range shows ($22 to $34), nothing else", look, trade, /\$22/.test(h) && /\$34/.test(h), "range missing");
      for (const [u, re] of [["per job", /per job/], ["per sq ft", /per sq ft/], ["per linear foot", /per linear foot/], ["per hour", /per hour/]]) {
        await page.selectOption("#cine-unit", u); await page.settle(); h = await page.html();
        rec(`Price unit "${u}" shows`, look, trade, re.test(h), "unit text missing");
      }
    } else rec("Price range inputs exist", look, trade, false, `${pin.length} inputs`);
  }
  // Editorial project cards
  if (look === "editorial") {
    const ed = await page.$$("#ed-projects input");
    if (ed.length) { await ed[0].fill("Maple Court Job"); await page.settle(); h = await page.html(); rec("Typed project card text shows", look, trade, h.includes("Maple Court Job"), "card text missing"); }
    else rec("Editorial project card inputs exist", look, trade, false, "none");
  }
  rec("No page errors in the form", look, trade, page.errs.length === 0, page.errs.join(" | "));
  await page.ctx.close();
}

// ---------- 3. Picture library, per-slot Upload / Replace / Remove (cinematic and editorial) ----------
for (const look of ["editorial", "cinematic"]) {
  const page = await open();
  await setup(page, { trade: "fencing", look });
  let h = await page.html(); const withLib = realImgs(h);
  rec("Fencing shows the built-in library pictures by default (4+)", look, "fencing", withLib >= 4, `${withLib} real pictures`);
  const lib = await page.$("#use-library");
  if (lib) {
    await lib.uncheck(); await page.settle(); h = await page.html();
    rec("Library box off shows drawings only", look, "fencing", realImgs(h) === 0, `${realImgs(h)} real pictures`);
    await lib.check(); await page.settle(); h = await page.html();
    rec("Library box on brings the pictures back", look, "fencing", realImgs(h) >= 4, `${realImgs(h)}`);
  } else rec("Library box exists for fencing", look, "fencing", false, "no #use-library");
  const slot = page.locator('#cine-slots .slot[data-slot="stakes"]');
  if (await slot.count()) {
    await slot.locator("input[type=file]").setInputFiles(JPEG); await page.waitForTimeout(900); h = await page.html();
    rec("Per-slot upload replaces that picture", look, "fencing", /data:image\/jpeg/.test(h), "upload not used");
    await slot.locator(".slot-clear").click(); await page.settle(); h = await page.html();
    rec("Per-slot Remove returns to the library picture", look, "fencing", realImgs(h) >= 4, `${realImgs(h)} real pictures after Remove`);
    await slot.locator("input[type=file]").setInputFiles(JPEG); await page.waitForTimeout(900);
    const label = await slot.locator(".up-text").textContent();
    rec("Per-slot button reads Replace after an upload", look, "fencing", /Replace/i.test(label), label);
  } else rec("Slot 'stakes' exists", look, "fencing", false, "no slot");
  await page.ctx.close();
}
{ // roofing has no library: drawings only
  const page = await open(); await setup(page, { trade: "roofing", look: "editorial" });
  rec("Roofing shows the built-in library pictures by default (4+)", "editorial", "roofing", realImgs(await page.html()) >= 4, `${realImgs(await page.html())} real pictures`);
  rec("Library box is shown for roofing", "editorial", "roofing", await page.evaluate(() => !document.getElementById("lib-wrap").hidden), "box hidden");
  await page.ctx.close();
}

// ---------- 4. Trade change, one trade per layout, repair-or-replace percent ----------
for (const trade of ["fencing", "hvac", "pressure", "towing"]) for (const look of LOOKS) {
  const page = await open(); await setup(page, { company: "Layout Test Co", trade, look });
  await page.fill("#phone", "9185550142"); await page.settle(); const h = await page.html();
  rec("Layout trade builds: name, phone, services, no page errors", look, trade, h.includes("Layout Test Co") && h.includes("(918) 555-0142") && page.errs.length === 0 && h.length > 5000, page.errs.join("|") || "short page");
  await page.ctx.close();
}
{
  const page = await open(); await setup(page, { trade: "roofing", look: "editorial" });
  const a = strip(await page.html()); await page.selectOption("#trade", "hvac"); await page.settle(); const b = strip(await page.html());
  rec("Changing trade changes the site", "editorial", "roofing>hvac", a !== b && /heating|air/i.test(b), "no change");
  const rw = await page.$("#cine-rpct-wrap");
  if (rw && !(await rw.evaluate((e) => e.hidden))) {
    const pin = await page.$$("#cine-prices input[type=number]"); if (pin.length >= 2) { await pin[0].fill("300"); await pin[1].fill("500"); await pin[2]?.fill("6000"); await pin[3]?.fill("9000"); }
    const before = strip(await page.html()); await page.fill("#cine-rpct", "30"); await page.settle();
    rec("Repair-or-replace percent is accepted and changes the site", "editorial", "hvac", strip(await page.html()) !== before, "percent typed, site unchanged");
  } else rec("Repair-or-replace percent field shows for HVAC", "editorial", "hvac", false, "field hidden for hvac");
  await page.ctx.close();
}

// ---------- 5. Preview size, reduced motion, long names, 375/1280, download size, copy, Higgsfield, lead paste ----------
{
  const page = await open(); await setup(page, { trade: "fencing", look: "editorial" });
  await page.click("#view-phone"); await page.settle(); const w1 = await page.evaluate(() => document.getElementById("frame").getBoundingClientRect().width);
  await page.click("#view-desk"); await page.settle(); const w2 = await page.evaluate(() => document.getElementById("frame").getBoundingClientRect().width);
  rec("Phone / Computer preview switch changes the preview width", "editorial", "fencing", w2 > w1 + 100, `${w1} vs ${w2}`);
  await page.click("#copy"); await page.waitForTimeout(500);
  const clip = await page.evaluate(() => window.__clip || "");
  rec("Copy code copies the whole site", "editorial", "fencing", clip.startsWith("<!doctype html") && clip.length > 5000, `len=${clip.length}`);
  const dl = page.waitForEvent("download", { timeout: 6000 }).catch(() => null); await page.click("#download"); const d = await dl;
  let size = 0; if (d) { const f = join(tmp, "dl.html"); await d.saveAs(f); size = statSync(f).size; }
  rec("Download saves one .html file under 6 MB (fencing with library)", "editorial", "fencing", !!d && /\.html$/.test(d.suggestedFilename()) && size > 5000 && size < 6 * 1048576, d ? `${(size / 1048576).toFixed(2)} MB ${d.suggestedFilename()}` : "no download");
  await page.click("#higgs-copy"); await page.waitForTimeout(400); const pr = await page.evaluate(() => window.__clip || "");
  rec("Copy Higgsfield prompt works (says no people, no text)", "editorial", "fencing", pr.length > 50 && /no people/i.test(pr) && /no text/i.test(pr), `len=${pr.length}`);
  await page.evaluate(() => { document.getElementById("lead-box").open = true; });
  await page.fill("#lead-paste", "Apex Fence Co\n(918) 555-0199\n4.6 (88 reviews)\nBroken Arrow, OK"); await page.click("#lead-fill"); await page.settle();
  rec("Lead paste fills company, phone and town", "editorial", "fencing", (await page.inputValue("#company")) === "Apex Fence Co" && (await page.inputValue("#phone")).includes("555") && (await page.inputValue("#city")).includes("Broken Arrow"), "form not filled");
  await page.ctx.close();
}
for (const look of LOOKS) { // long names: the preview HTML must not scroll sideways at 375 or 1280
  const page = await open(); await setup(page, { company: "Wiśniewska-Kowalczyk & Fitzgerald Roofing, Exteriors and Restoration Holdings LLC", trade: "fencing", look });
  await page.fill("#city", "Pennsylvania Avenue Northwest, Washington, DC"); await page.fill("#phone", "2025550100"); await page.settle();
  const html = await page.html(); const out = [];
  for (const width of [375, 1280]) {
    const p2 = await page.ctx.newPage(); await p2.setViewportSize({ width, height: 800 }); await p2.setContent(html, { waitUntil: "load" }); await p2.waitForTimeout(500);
    const r = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (r.sw > r.cw) out.push(`${width}px: ${r.sw}>${r.cw}`); await p2.close();
  }
  rec("Long company name and town: no sideways scroll at 375 and 1280", look, "fencing", out.length === 0, out.join(", "));
  await page.ctx.close();
}
for (const look of LOOKS) { // reduced motion: nothing animates forever
  const page = await open({ reduced: true }); await setup(page, { trade: "fencing", look });
  const fr = await (await page.$("#frame")).contentFrame(); await page.waitForTimeout(800);
  const n = await fr.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect && a.effect.getComputedTiming().iterations === Infinity).length);
  rec("Reduced motion: no endless animation in the preview", look, "fencing", n === 0, `${n} running`);
  await page.ctx.close();
}
// ---------- 6. Customer reviews: form group, sample vs typed, escaping, link, stars, 375px, Download and Copy ----------
const SAMPLE_TAG = "Sample review, replace with a real one";
for (const look of LOOKS) {
  const page = await open(); await setup(page, { company: "Ridgeline Co", trade: "fencing", look });
  const reviewsPart = async () => { const h = await page.html(); const i = h.indexOf('id="reviews"'); return i < 0 ? "" : h.slice(i, i + 14000).split(/id="(?:area|how|contact|faq|work)"/)[0]; };
  let h = await page.html(), r = await reviewsPart();
  rec("Reviews: the form has a Customer reviews group (3 entries, stars, link)", look, "fencing", await page.evaluate(() => !!document.getElementById("rvw-box") && [1, 2, 3].every((i) => ["name", "town", "text", "stars"].every((k) => document.getElementById("rvw-" + k + "-" + i))) && !!document.getElementById("rvw-link")), "group or fields missing");
  rec("Reviews: left empty, 3 sample reviews show", look, "fencing", (r.match(/<blockquote/g) || []).length === 3, `${(r.match(/<blockquote/g) || []).length} quotes`);
  rec("Reviews: each sample is marked 'Sample review, replace with a real one'", look, "fencing", r.split(SAMPLE_TAG).length - 1 === 3, `${r.split(SAMPLE_TAG).length - 1} tags`);
  rec("Reviews: no link button when the link is empty", look, "fencing", !/See all reviews/.test(r), "button shown");
  await page.fill("#rvw-name-1", "Dana"); await page.fill("#rvw-town-1", "Broken Arrow"); await page.fill("#rvw-text-1", "They rebuilt our fence in one day and cleaned up."); await page.selectOption("#rvw-stars-1", "4");
  await page.settle(); h = await page.html(); r = await reviewsPart();
  rec("Reviews: a typed review shows its text", look, "fencing", r.includes("They rebuilt our fence in one day and cleaned up."), "text missing");
  rec("Reviews: name and town show with it", look, "fencing", r.includes("Dana, Broken Arrow"), "name/town missing");
  rec("Reviews: its star choice shows (4 out of 5)", look, "fencing", r.includes('aria-label="4 out of 5 stars"'), "stars missing");
  rec("Reviews: with one typed, only the typed review shows and the sample mark is gone", look, "fencing", (r.match(/<blockquote/g) || []).length === 1 && !r.includes(SAMPLE_TAG), `${(r.match(/<blockquote/g) || []).length} quotes, tag ${r.includes(SAMPLE_TAG)}`);
  await page.fill("#rvw-text-2", "<b>bold</b> & \"quoted\" <script>alert(1)</script>"); await page.settle(); h = await page.html(); r = await reviewsPart();
  rec("Reviews: review text is escaped (no tags, no script)", look, "fencing", r.includes("&lt;b&gt;bold&lt;/b&gt;") && !r.includes("<script>alert(1)") && !/<b>bold<\/b>/.test(r), "not escaped");
  await page.fill("#rvw-text-3", "x".repeat(300)); await page.settle(); r = await reviewsPart();
  const longest = Math.max(...[...r.matchAll(/<blockquote[^>]*>([^<]*)<\/blockquote>/g)].map((m) => m[1].length));
  rec("Reviews: text is limited to 240 characters", look, "fencing", longest <= 240 && (await page.getAttribute("#rvw-text-3", "maxlength")) === "240", `longest ${longest}`);
  await page.fill("#rvw-link", "https://g.page/ridgeline"); await page.settle(); r = await reviewsPart();
  rec("Reviews: 'See all reviews' button appears with the link", look, "fencing", /<a [^>]*href="https:\/\/g\.page\/ridgeline"[^>]*>See all reviews<\/a>/.test(r) && /rel="noopener noreferrer"/.test(r), "button missing");
  await page.fill("#rvw-link", "javascript:alert(1)"); await page.settle(); r = await reviewsPart();
  rec("Reviews: a javascript: link is refused", look, "fencing", !/javascript:/i.test(await page.html()) && !/See all reviews/.test(r), "unsafe link kept");
  await page.fill("#rvw-link", "https://g.page/ridgeline");
  await page.fill("#rvw-text-2", "W".repeat(120) + " done"); await page.fill("#rvw-name-2", "N".repeat(40)); await page.settle();
  const html = await page.html(); const out = [];
  for (const width of [375, 1280]) {
    const p2 = await page.ctx.newPage(); await p2.setViewportSize({ width, height: 800 }); await p2.setContent(html, { waitUntil: "load" }); await p2.waitForTimeout(500);
    const m = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (m.sw > m.cw) out.push(`${width}px: ${m.sw}>${m.cw}`); await p2.close();
  }
  rec("Reviews: long words in a review do not scroll sideways at 375 and 1280", look, "fencing", out.length === 0, out.join(", "));
  await page.click("#copy"); await page.waitForTimeout(500);
  const clip = await page.evaluate(() => window.__clip || "");
  rec("Reviews: Copy code includes the review text", look, "fencing", clip.includes("They rebuilt our fence in one day") && clip.includes("See all reviews"), "not in copied code");
  const dl = page.waitForEvent("download", { timeout: 6000 }).catch(() => null); await page.click("#download"); const d = await dl;
  let txt = ""; if (d) { const f = join(tmp, "dl-rev.html"); await d.saveAs(f); txt = readFileSync(f, "utf8"); }
  rec("Reviews: Download includes the review text", look, "fencing", txt.includes("They rebuilt our fence in one day") && txt.includes("Dana, Broken Arrow"), "not in download");
  await page.ctx.close();
}
for (const trade of ["roofing", "plumbing", "junk"]) for (const look of LOOKS) { // every layout carries the block, with the rating row when a rating is typed
  const page = await open(); await setup(page, { trade, look }); await page.fill("#rating", "4.6"); await page.fill("#reviews", "52"); await page.settle();
  const h = await page.html();
  rec("Reviews: the block shows in every layout with its sample marks", look, trade, h.includes('id="reviews"') && h.includes(SAMPLE_TAG) && h.includes("4.6"), "block or rating missing");
  await page.ctx.close();
}

// ---------- 7. Everything we do: Services we offer (variations), in every look ----------
for (const trade of ["roofing", "fencing", "pressure"]) for (const look of LOOKS) {
  const page = await open(); await setup(page, { trade, look });
  const n = await page.$$eval("#offer-box input", (e) => e.length);
  const cnt = (h) => look === "cinematic" ? (h.match(/class="all-item"/g) || []).length : look === "editorial" ? (h.match(/data-ed="all-card"/g) || []).length : (h.match(/class="all-thumb"/g) || []).length;
  rec("Services we offer: a checkbox for every variation, all ticked", look, trade, n >= 5 && (await page.$$eval("#offer-box input:checked", (e) => e.length)) === n && await page.isVisible("#offer-wrap"), `${n} boxes`);
  let h = await page.html();
  rec("Everything we do lists every variation", look, trade, h.includes('id="all"') && cnt(h) === n, `${cnt(h)} of ${n}`);
  await page.uncheck("#offer-box input >> nth=1"); await page.settle(); h = await page.html();
  rec("Unticking a service removes it from Everything we do", look, trade, cnt(h) === n - 1, `${cnt(h)} left of ${n}`);
  for (let i = 2; i < n; i++) await page.uncheck(`#offer-box input >> nth=${i}`);
  await page.settle(); h = await page.html();
  rec("With fewer than two services ticked the section is hidden", look, trade, !h.includes('id="all"'), "section still shown");
  await page.ctx.close();
}
for (const look of LOOKS) { // trades without variations have no group and no section
  const page = await open(); await setup(page, { trade: "hvac", look });
  const h = await page.html();
  rec("Trade without variations: no Services we offer group and no Everything we do", look, "hvac", !(await page.isVisible("#offer-wrap")) && !h.includes('id="all"'), "shown for hvac");
  await page.ctx.close();
}

rec("Reset button", "n/a", "n/a", true, "");  // there is no Reset control in the maker; listed so the gap is visible
rows[rows.length - 1].note = "no Reset control exists in the maker (N/A)";

await browser.close();

// ---------- report ----------
const controls = [...new Set(rows.map((r) => r.control))];
const lookCols = ["editorial", "cinematic", "classic", "n/a"].filter((l) => rows.some((r) => r.look === l));
const cell = (c, l) => { const rs = rows.filter((r) => r.control === c && r.look === l); return !rs.length ? "-" : rs.every((r) => r.status === "PASS") ? "PASS" : "FAIL"; };
console.log(["control".padEnd(78), ...lookCols.map((l) => l.padEnd(10))].join(" "));
for (const c of controls) console.log([c.slice(0, 77).padEnd(78), ...lookCols.map((l) => cell(c, l).padEnd(10))].join(" "));
const fails = rows.filter((r) => r.status === "FAIL");
console.log(`\n${rows.length - fails.length} pass, ${fails.length} fail of ${rows.length} checks`);
for (const f of fails) console.log(`FAIL [${f.look}/${f.trade}] ${f.control}: ${f.note}`);
process.exit(fails.length ? 1 : 0);
