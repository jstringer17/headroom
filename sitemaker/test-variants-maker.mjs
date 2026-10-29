// Variation tests: each trade with more than one variation (fixtures stand in until the real kit has them).
//   node sitemaker/test-variants-maker.mjs
// Real maker, lazy build over http. For each variation of roofing, fencing and pressure: pick it, then check that the
// site changes (headline, library pictures) and that only that variation's pictures were fetched. Also ingest and publish plan.
import { createRequire } from "node:module";
import { execSync, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, existsSync, readdirSync, copyFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { CINE_KIT } from "./src/cine-kit.js";
import { ownSlotIds, kitSlotIds, kitVariant, variantCards } from "./src/variants.js";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const node = (args, o = {}) => spawnSync("node", args, { encoding: "utf8", cwd: join(here, ".."), ...o });
const patch = join(here, "test-fixtures-variants.js");
new Function("CINE_KIT", readFileSync(patch, "utf8"))(CINE_KIT); // same patch the page build gets
const TRADES = ["roofing", "fencing", "pressure"];
ok(TRADES.every((t) => (CINE_KIT[t].variants || []).length >= 2), "kit: roofing, fencing and pressure need at least two variations");

const root = join(here, "test-out", "var");
rmSync(root, { recursive: true, force: true });
const jpegSrc = join(here, "library", "fencing", "stakes.webp");
const sampleWebp = existsSync(jpegSrc) ? jpegSrc : null;
ok(!!sampleWebp, "need library/fencing/stakes.webp as a fixture picture");
const slotsOf = {}; // "trade|variant" -> own slot ids
for (const t of TRADES) for (const v of CINE_KIT[t].variants) {
  const ids = ownSlotIds(CINE_KIT[t], v.key);
  slotsOf[t + "|" + v.key] = ids;
  for (const id of ids) {
    const rel = id.includes("/") ? id : id; // variant slots carry their folder in the id
    const dest = join(root, "library", t, rel + ".webp");
    mkdirSync(dirname(dest), { recursive: true });
    const real = join(here, "library", t, id + ".webp");
    copyFileSync(existsSync(real) ? real : sampleWebp, dest); // the real picture when the library has it, so sizes are honest
  }
}
const b = node([join(here, "build.mjs"), "--lazy", "--library", join(root, "library"), "--kit-patch", patch, "--out", "test-out/var/maker.html"]);
ok(b.status === 0, "variants build failed: " + b.stderr);

const MIME = { ".html": "text/html", ".webp": "image/webp" };
let requests = [];
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  requests.push(path);
  const file = join(root, path === "/" ? "maker.html" : path);
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await pw.chromium.launch();
const strip = (s) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'");
for (const t of TRADES) {
  const vs = CINE_KIT[t].variants;
  const heads = new Set();
  for (const v of vs) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = []; page.on("pageerror", (e) => errs.push(e.message));
    await page.goto(`${base}/maker.html`, { waitUntil: "load" });
    await page.fill("#company", "Variant Test Co");
    await page.selectOption("#trade", t);
    await page.waitForTimeout(200);
    ok(await page.isVisible("#variant"), `${t}: the Variation dropdown is not shown`);
    ok((await page.$$eval("#variant option", (o) => o.map((x) => x.value))).join() === vs.map((x) => x.key).join(), `${t}: Variation options are not the kit's`);
    ok((await page.$eval("#variant", (e) => e.value)) === vs[0].key, `${t}: the default is not the first variation`);
    requests = [];
    if (v !== vs[0]) await page.selectOption("#variant", v.key);
    const own = slotsOf[t + "|" + v.key];
    await page.waitForFunction((n) => document.querySelectorAll("#cine-slots .slot .lib-tag:not([hidden])").length >= n, own.length, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    const lib = requests.filter((r) => r.startsWith(`/library/${t}/`));
    // picking the trade already fetched shrunk copies of every offered variation's before and after (for "Everything we do"); picking one re-fetches its own set at full size
    const cardIds = new Set(variantCards(CINE_KIT[t]).flatMap((c) => [c.before, c.after]));
    const want = own.map((id) => `/library/${t}/${id}.webp`).sort();
    const loaded = (v === vs[0] ? lib : lib).sort();
    // lazy loading for this variation: only its own files (a default repeat is served from memory, so allow zero re-fetches)
    for (const r of lib) ok(want.includes(r), `${t}/${v.key}: fetched ${r}, which is not this variation's picture`);
    if (v !== vs[0]) ok(loaded.length === want.length, `${t}/${v.key}: expected ${want.length} library requests, got ${loaded.length}`);
    const labels = await page.$$eval("#cine-slots .slot", (e) => e.length);
    ok(labels === kitSlotIds(kitVariant(CINE_KIT[t], v.key)).length, `${t}/${v.key}: form lists ${labels} picture spots, expected ${kitSlotIds(kitVariant(CINE_KIT[t], v.key)).length}`);
    const doc = await page.$eval("#frame", (f) => f.srcdoc);
    const text = strip(doc);
    const kv = kitVariant(CINE_KIT[t], v.key);
    const head = kv.story[0].headline;
    ok(text.includes(head.replace(/\.$/, "")), `${t}/${v.key}: the site does not show the story headline "${head}"`);
    heads.add(head);
    ok((doc.match(/data:image\/webp;base64,/g) || []).length >= 1, `${t}/${v.key}: the site has no library pictures`);
    for (const o of vs) if (o !== v && o !== vs[0]) ok(!text.includes(kitVariant(CINE_KIT[t], o.key).story[0].headline), `${t}/${v.key}: shows the headline of ${o.key}`);
    // Download inlines this variation's pictures only
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
    const html = readFileSync(await dl.path(), "utf8");
    ok(strip(html).includes(head.replace(/\.$/, "")) && !/library\/[a-z]+\//.test(html), `${t}/${v.key}: the download is not self-contained`);
    ok(errs.length === 0, `${t}/${v.key}: page errors: ${errs.join("; ")}`);
    await page.close();
  }
  ok(heads.size === vs.length, `${t}: variations do not give different story headlines`);
}
// Per-variation state: library off for one variation, upload for another, hero override keeps working
{
  const t = "roofing", vs = CINE_KIT[t].variants, v1 = vs[1].key;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/maker.html`, { waitUntil: "load" });
  await page.fill("#company", "Variant Test Co");
  await page.selectOption("#trade", t);
  await page.selectOption("#variant", v1);
  await page.waitForTimeout(600);
  const before = (await page.$eval("#frame", (f) => f.srcdoc.match(/data:image\/webp/g) || [])).length;
  ok(before >= 1, "variant state: no library pictures before switching the checkbox off");
  await page.uncheck("#use-library");
  await page.waitForTimeout(300);
  ok(((await page.$eval("#frame", (f) => f.srcdoc.match(/data:image\/webp/g) || [])).length) < before, "variant state: unchecking the library did not remove this variation's pictures");
  await page.selectOption("#variant", vs[0].key);
  await page.waitForTimeout(400);
  ok(await page.isChecked("#use-library"), "variant state: library checkbox is not back on for another variation");
  await page.close();
}
// "Everything we do": every offered variation on the finished site, in all three looks; unticking one hides it
for (const t of TRADES) for (const look of ["cinematic", "editorial", "classic"]) {
  const vs = CINE_KIT[t].variants, cards = variantCards(CINE_KIT[t]);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/maker.html`, { waitUntil: "load" });
  await page.fill("#company", "Variant Test Co");
  await page.selectOption("#trade", t);
  await page.selectOption("#look", look);
  await page.waitForFunction((n) => document.querySelectorAll("#offer-box input:checked").length === n, vs.length, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  ok(await page.isVisible("#offer-wrap") && (await page.$$eval("#offer-box input", (e) => e.length)) === vs.length && (await page.$$eval("#offer-box input:checked", (e) => e.length)) === vs.length, `${t}/${look}: Services we offer is not shown with every variation ticked`);
  const count = (h) => look === "cinematic" ? (h.match(/class="all-item"/g) || []).length : look === "editorial" ? (h.match(/data-ed="all-card"/g) || []).length : (h.match(/class="all-thumb"/g) || []).length;
  let doc = await page.$eval("#frame", (f) => f.srcdoc);
  ok(doc.includes('id="all"') && count(doc) === vs.length, `${t}/${look}: Everything we do should list all ${vs.length} variations, found ${count(doc)}`);
  for (const c of cards) ok(doc.includes(c.label.replace(/&/g, "&amp;")) || doc.includes(c.label), `${t}/${look}: "${c.label}" is missing from Everything we do`);
  const imgs = (doc.match(/data:image\/webp;base64,/g) || []).length;
  ok(imgs >= vs.length, `${t}/${look}: only ${imgs} library pictures in the site, expected one per variation or more`);
  // untick the second variation
  await page.uncheck(`#offer-box input[data-offer="${vs[1].key}"]`);
  await page.waitForTimeout(500);
  doc = await page.$eval("#frame", (f) => f.srcdoc);
  ok(count(doc) === vs.length - 1 && !doc.includes(`aria-label="${vs[1].label}`) && !new RegExp(`>${vs[1].label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`).test(doc), `${t}/${look}: unticking ${vs[1].key} did not remove it (${count(doc)} left)`);
  // Download is one file and inlines the pictures
  const dl = page.waitForEvent("download"); await page.click("#download"); const file = await dl;
  const text = readFileSync(await file.path(), "utf8");
  const mb = text.length / 1048576;
  ok(!/src="library\//.test(text) && text.includes('id="all"') && mb < 6, `${t}/${look}: download is ${mb.toFixed(2)} MB or still points at library files`);
  ok(errs.length === 0, `${t}/${look}: page errors ${errs.join("; ")}`);
  await page.close();
}
// a viewer at 375: no sideways scroll in any look, and the pinned crossfade changes the picture shown as the page scrolls
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${base}/maker.html`, { waitUntil: "load" });
  await page.fill("#company", "Variant Test Co"); await page.selectOption("#trade", "roofing"); await page.waitForTimeout(1500);
  const html = await page.$eval("#frame", (f) => f.srcdoc);
  const p2 = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const e2 = []; p2.on("pageerror", (e) => e2.push(e.message)); p2.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|fonts/.test(m.text())) e2.push(m.text()); });
  await p2.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await p2.setContent(html, { waitUntil: "load" });
  await p2.waitForTimeout(400);
  const sw = await p2.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(sw.sw <= sw.cw, `cinematic@375: sideways scroll ${sw.sw}>${sw.cw}`);
  ok(await p2.evaluate(() => document.getElementById("all").classList.contains("all-motion")), "cinematic: the pinned Everything we do did not switch on");
  const seen = new Set();
  const top = await p2.evaluate(() => document.getElementById("all").getBoundingClientRect().top + scrollY);
  const tall = await p2.evaluate(() => document.querySelector("#all .all-stage").offsetHeight);
  for (let i = 0; i <= 5; i++) {
    await p2.evaluate((y) => scrollTo(0, y), top + 200 + (tall - 812) * (i / 5) * 0.98);
    await p2.waitForTimeout(250);
    seen.add(await p2.evaluate(() => { let b = -1, bo = 0; document.querySelectorAll("#all .all-item").forEach((it, k) => { const o = parseFloat(it.style.opacity); if (o > bo) { bo = o; b = k; } }); return b; }));
  }
  ok(seen.size >= 4, `cinematic: scrolling Everything we do shows only ${seen.size} different variations: ${[...seen].join(",")}`);
  // Compare button opens the slider
  await p2.evaluate(() => scrollTo(0, document.getElementById("all").getBoundingClientRect().top + scrollY + 200)); await p2.waitForTimeout(300);
  await p2.click("#all .all-item:first-child .all-cmp"); await p2.waitForTimeout(500);
  ok((await p2.$eval("#all .all-item:first-child [role=slider]", (e) => e.getAttribute("aria-valuenow"))) === "50", "cinematic: Compare did not move the slider to 50");
  ok(e2.length === 0 && errs.length === 0, `cinematic@375: errors ${[...e2, ...errs].join("; ")}`);
  // reduced motion: a plain list, no pin
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
  const p3 = await ctx.newPage(); await p3.route("**/*", (q) => (/^(data|about|blob):/.test(q.request().url()) ? q.continue() : q.abort()));
  await p3.setContent(html, { waitUntil: "load" }); await p3.waitForTimeout(300);
  ok(!(await p3.evaluate(() => document.getElementById("all").classList.contains("all-motion"))), "reduced motion: Everything we do is still pinned");
  const sw3 = await p3.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(sw3.sw <= sw3.cw, "reduced motion@375: sideways scroll");
  await ctx.close(); await p3.close(); await p2.close(); await page.close();
}
await browser.close();
server.close();

// ---- ingest: by name with the variation in the name, and by order with --variant
{
  const tmp = join(here, "test-out", "ingest-var-test");
  rmSync(tmp, { recursive: true, force: true });
  const inbox = join(tmp, "inbox"), lib = join(tmp, "library");
  mkdirSync(inbox, { recursive: true });
  const crc = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return (b) => { let c = ~0; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return ~c >>> 0; }; })();
  const chunk = (ty, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const png = (w, h, rgb) => { const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }).flatMap(() => rgb))]); const raw = Buffer.concat(Array.from({ length: h }, () => row)); const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };
  const env = { ...process.env, SITEMAKER_KIT_PATCH: patch };
  const run = (args) => node([join(here, "ingest.mjs"), ...args], { env });
  const alt = CINE_KIT.roofing.variants[1].key, ids = ownSlotIds(CINE_KIT.roofing, alt);
  writeFileSync(join(inbox, `roofing-${alt}-${ids[0].split("/").pop()}.png`), png(320, 180, [10, 200, 30]));
  writeFileSync(join(inbox, `roofing-old.png`), png(320, 180, [200, 10, 30]));
  const r1 = run([inbox, "--library", lib]);
  ok(r1.status === 0, `ingest variant by name: exit ${r1.status}: ${r1.stderr}`);
  ok(existsSync(join(lib, "roofing", ids[0] + ".webp")), "ingest variant: <trade>-<variant>-<slot> did not land in library/<trade>/<variant>/<slot>.webp");
  ok(existsSync(join(lib, "roofing", "old.webp")), "ingest variant: a default-variation picture did not keep the bare path");
  ok(new RegExp(`roofing[ /]+${alt}\\s+1/${ids.length}`).test(r1.stdout), "ingest variant: summary has no found/missing row for the variation: " + r1.stdout.split("\n").filter((l) => /roofing/.test(l)).join(" | "));
  // by order for one variation
  const inbox2 = join(tmp, "inbox2"); mkdirSync(inbox2, { recursive: true });
  ids.forEach((_, i) => writeFileSync(join(inbox2, `shot-${String(i + 1).padStart(2, "0")}.png`), png(320, 180, [i * 30, 90, 200])));
  const r2 = run(["--trade", "roofing", "--variant", alt, "--by-order", inbox2, "--sort", "name", "--library", join(tmp, "lib2"), "--sheet", join(tmp, "s.jpg"), "--yes"]);
  ok(r2.status === 0 && ids.every((id) => existsSync(join(tmp, "lib2", "roofing", id + ".webp"))), `ingest --by-order --variant: not all ${ids.length} slots written: ${r2.stdout}${r2.stderr}`);
  // publish plan lists variant files
  const pp = node([join(here, "publish-plan.mjs"), "--json", "--library", lib]);
  ok(pp.status === 0 && pp.stdout.includes(`library/roofing/${ids[0]}.webp`), "publish plan: variation files are not listed");
}
if (fails.length) { console.error("FAIL: variants\n - " + fails.join("\n - ")); process.exit(1); }
console.log("PASS: variants tests (dropdown, per-variation pictures and headlines, lazy loading, ingest, publish plan)");
