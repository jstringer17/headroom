// Every button and link in every look: tap target, contrast at rest, no ghost buttons; mobile action bar; form fields.
//   node sitemaker/test-buttons.mjs        (CEO round 2, item D)
import { loadPlaywright, launchOpts } from "./qa/lib.mjs";
import { generateSite } from "./src/generate.js";

const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
const CRED = { rating: "4.8", reviews: "112", insured: true, years: "9", cred: { founded: "2008", googleUrl: "https://g.page/x", bbb: { rating: "A+", accredited: true, url: "https://bbb.org/x" }, yelp: { rating: "4.5", count: "38", url: "https://yelp.com/x" }, license: "R-1", bonded: true } };
const base = (look, trade) => ({ company: "Ridge Line Roofing", trade, city: "Tulsa, OK", phone: "9185550142", ...CRED, reviewLink: "https://g.page/x", reviewList: [{ name: "Dana", town: "Tulsa", text: "Great work.", stars: 5 }], ...(look === "classic" ? {} : { cinematic: true, look, cine: { look, prices: trade === "hvac" ? { "Small home": { "New system": { low: "5000", high: "7000" } } } : {} } }) });

const probe = () => {
  const alphaOf = (c) => { const m = c.match(/[\d.]+/g) || []; return c.startsWith("color(") ? (m.length > 3 ? +m[3] : 1) : m.length > 3 ? +m[3] : 1; };
  const rgbaOf = (c) => { const m = (c.match(/[\d.]+/g) || []).map(Number); if (c.startsWith("color(")) return [m[0] * 255, m[1] * 255, m[2] * 255, m.length > 3 ? m[3] : 1]; return [m[0], m[1], m[2], m.length > 3 ? m[3] : 1]; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); return a ? [0, 1, 2].map((i) => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a) : [0, 0, 0, 0]; };
  const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const cr = (a, b) => { const x = lum(...a), y = lum(...b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const sel = "button, a.btn, a.ed-btn, .btn-line, .ask-link, .top-call, .ed-call, .tab, .ed-chip, [role=tab], .mbar a, .ed-mbar a, .plat-list a, .ed-plat-list a, .proof a, .ed-proof a, .facts a, .all-ask, .ed-tel, [role=slider], input[type=range], .opt span, .ed-opt span, label.opt";
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || cs.visibility === "hidden" || cs.display === "none" || el.closest("[hidden]") || el.closest("dialog:not([open])") || el.closest("[inert]")) continue;
    if (el.matches("input[type=radio], input[type=checkbox]")) continue;
    const name = (el.className && typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName) + ":" + (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24);
    const rec = { name, w: Math.round(r.width), h: Math.round(r.height) };
    // layers: the element, then its ancestors up to an opaque one
    let bg = [0, 0, 0, 0], photo = false;
    for (let e = el; e; e = e.parentElement) {
      const c = rgbaOf(getComputedStyle(e).backgroundColor);
      bg = over(bg, c);
      if (getComputedStyle(e).backgroundImage !== "none") photo = true;
      if (bg[3] >= 0.99) break;
    }
    if (bg[3] < 0.99) bg = over(bg, [255, 255, 255, 1]);
    const fg = rgbaOf(cs.color), fgc = over(fg, bg);
    rec.contrast = +cr(fgc, bg).toFixed(2);
    const bord = (e) => { const c = getComputedStyle(e); return parseFloat(c.borderTopWidth) > 0 && rgbaOf(c.borderTopColor)[3] > 0.4; };
    const own = rgbaOf(cs.backgroundColor)[3], border = bord(el) || (el.parentElement && el.parentElement.tagName === "LI" && bord(el.parentElement));
    const shadow = cs.boxShadow !== "none" && /inset/.test(cs.boxShadow);
    rec.ghost = own < 0.3 && !border && !shadow && !el.matches("[role=slider], input[type=range], .opt span, .ed-opt span, .ed-tel, .ed-chip, .tab, .ed-row");
    rec.photo = photo; rec.alpha = +own.toFixed(2);
    out.push(rec);
  }
  return out;
};

for (const look of ["cinematic", "editorial", "classic"]) for (const trade of ["roofing", "hvac"]) for (const width of [375, 1280]) {
  const html = generateSite(base(look, trade));
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 812 : 900 }, hasTouch: width < 700 });
  const page = await ctx.newPage();
  await page.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.setContent(html, { waitUntil: "load" });
  await page.addStyleTag({ content: ".rv,.ed-rv{opacity:1!important;transform:none!important}" });
  await page.waitForTimeout(300);
  // scroll through so sticky pieces show, and probe at several positions (the bar and header change)
  const seen = new Map();
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) {
    await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(80);
    for (const r of await page.evaluate(probe)) { const k = r.name + "|" + r.w; if (!seen.has(k)) seen.set(k, r); }
  }
  const tag = `${look}/${trade}@${width}`;
  for (const r of seen.values()) {
    if (width < 700 || !/^(tab|ed-chip|slider)/.test(r.name)) ok(r.h >= 48 && r.w >= 48, `${tag}: "${r.name}" is ${r.w}x${r.h}, needs 48x48`);
    if (!/range|slider|ed-cmp-r/i.test(r.name)) ok(r.contrast >= 4.5, `${tag}: "${r.name}" text contrast ${r.contrast} on its background (needs 4.5)`);
    ok(!r.ghost, `${tag}: "${r.name}" is a ghost button (no fill, no border)`);
  }
  // the phone action bar: Call, Text, Free estimate; hidden while a field has focus
  if (width < 700) {
    let shownAt = 0;
    for (let y = 0; y < H; y += 450) {
      await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(260);
      if (await page.evaluate(() => { const b = document.querySelector(".mbar, .ed-mbar"); const r = b.getBoundingClientRect(); return getComputedStyle(b).visibility !== "hidden" && r.top < innerHeight && innerHeight - r.bottom <= 1; })) shownAt++;
    }
    await page.waitForTimeout(100);
    const bar = await page.evaluate(() => { const b = document.querySelector(".mbar, .ed-mbar"); if (!b) return null; const r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { cls: document.documentElement.className, links: [...b.querySelectorAll("a")].map((a) => ({ t: a.textContent.trim(), h: a.getAttribute("href") })), shown: cs.visibility !== "hidden" && r.top < innerHeight, bottom: Math.round(innerHeight - r.bottom) }; });
    ok(bar && bar.links.length === 2 && bar.links.some((l) => /^tel:\+19185550142/.test(l.h)) && bar.links.some((l) => l.h === "#contact"), `${tag}: the phone action bar needs 2 half buttons, Call (tel:) and Free estimate (#contact) (round 4, Lifetime spec): ${JSON.stringify(bar && bar.links)}`);
    ok(shownAt >= 2, `${tag}: the action bar shows at the bottom on only ${shownAt} scroll positions`);
    const lastPad = await page.evaluate(() => { const f = document.querySelector("footer"); const cs = getComputedStyle(document.body); return parseFloat(cs.paddingBottom) + (f ? parseFloat(getComputedStyle(f.firstElementChild || f).paddingBottom) : 0); });
    ok(lastPad >= 60, `${tag}: nothing keeps the last content clear of the action bar (padding ${lastPad})`);
    await page.evaluate(() => document.getElementById("contact").scrollIntoView()); await page.waitForTimeout(400);
    await page.focus("#ask input[name=name]"); await page.waitForTimeout(400);
    const hidden = await page.evaluate(() => { const b = document.querySelector(".mbar, .ed-mbar"); return !b || getComputedStyle(b).visibility === "hidden" || b.getBoundingClientRect().top >= innerHeight; });
    ok(hidden, `${tag}: the action bar stays over the form while a field has focus (keyboard open)`);
    // form fields: big, autofill hints, one-tap submit
    const f = await page.evaluate(() => { const fl = [...document.querySelectorAll("#ask input:not([type=hidden]):not([tabindex='-1']), #ask select, #ask textarea")].filter((e) => e.getBoundingClientRect().width > 0); return { small: fl.filter((e) => e.getBoundingClientRect().height < 48).length, font: Math.min(...fl.map((e) => parseFloat(getComputedStyle(e).fontSize))), name: document.querySelector("#ask [name=name]").getAttribute("autocomplete"), tel: document.querySelector("#ask [name=phone]").getAttribute("autocomplete"), tinput: document.querySelector("#ask [name=phone]").getAttribute("inputmode"), submit: (() => { const b = document.querySelector("#ask [type=submit]").getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; })() }; });
    ok(f.small === 0 && f.font >= 16, `${tag}: form fields are too small (${f.small} under 48px high, smallest text ${f.font}px)`);
    ok(f.name === "name" && f.tel === "tel" && f.tinput === "tel", `${tag}: form fields lack autofill hints (${JSON.stringify(f)})`);
    ok(f.submit.h >= 52 && f.submit.w >= 200, `${tag}: the submit button is not a big one-tap button (${f.submit.w}x${f.submit.h})`);
  } else {
    const hdr = await page.evaluate(() => [...document.querySelectorAll("header a, header button")].filter((a) => a.getBoundingClientRect().width > 0 && /tel:/.test(a.getAttribute("href") || "")).length);
    ok(hdr >= 1, `${tag}: the header has no call link`);
  }
  await ctx.close();
}
// header call button is always visible on phones
for (const look of ["cinematic", "editorial", "classic"]) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true });
  const page = await ctx.newPage(); await page.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await page.setContent(generateSite(base(look, "roofing")), { waitUntil: "load" }); await page.waitForTimeout(300);
  for (const y of [0, 900, 2600]) {
    await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(150);
    const vis = await page.evaluate(() => [...document.querySelectorAll("header a[href^='tel:']")].some((a) => { const r = a.getBoundingClientRect(), c = getComputedStyle(a); return r.width >= 48 && r.height >= 48 && c.visibility !== "hidden" && c.display !== "none" && r.top >= 0 && r.bottom <= innerHeight; }));
    ok(vis, `${look}: the header call button is not visible and 48px at scroll ${y}`);
  }
  await ctx.close();
}
await browser.close();
if (fails.length) { console.log("FAIL"); const seen = new Set(); fails.forEach((f) => { const k = f.replace(/^\S+@\d+: /, ""); if (!seen.has(k)) { seen.add(k); console.log(" - " + f); } }); console.log(` (${fails.length} failures in total)`); process.exit(1); }
console.log("PASS: button checks (tap size, contrast, no ghost buttons, action bar, header call, form fields)");
