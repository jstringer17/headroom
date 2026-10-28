// Picture library tests: lazy files, the ingest script, the publish plan.
//   node sitemaker/test-library.mjs
// Lazy: build the page WITHOUT embedded pictures, serve sitemaker/ over http, drive the real maker and check
// that the pictures are fetched when a trade is picked and are inlined into Preview and Download.
import { createRequire } from "node:module";
import { execSync, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, existsSync, readdirSync, utimesSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(join(execSync("npm root -g").toString().trim(), "playwright")); }
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const node = (args, o = {}) => spawnSync("node", args, { encoding: "utf8", cwd: join(here, ".."), ...o });

// ---- 1. a lazy build carries the index, not the pictures
const b = node([join(here, "build.mjs"), "--lazy", "--out", "maker-lazy.html"]);
ok(b.status === 0, "lazy build failed: " + b.stderr);
const lazyFile = join(here, "maker-lazy.html"), lazy = readFileSync(lazyFile, "utf8");
ok(lazy.includes("const PICTURE_INDEX = {") && lazy.includes('"library/fencing/stakes.webp"'), "lazy build: the library index is missing");
ok(!lazy.includes("data:image/webp;base64,"), "lazy build: pictures are embedded");
ok(statSync(lazyFile).size < 800 * 1024, `lazy build: page is ${Math.round(statSync(lazyFile).size / 1024)} KB, expected under 800 KB`);
const emb = node([join(here, "build.mjs"), "--embed", "--out", "test-out/maker-embed.html"]);
ok(emb.status === 0 && readFileSync(join(here, "test-out", "maker-embed.html"), "utf8").includes("data:image/webp;base64,"), "embed build: pictures are not embedded");

// ---- 2. drive the real maker over http (relative files work there)
const MIME = { ".html": "text/html", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".js": "text/javascript" };
const requests = [];
const server = createServer((req, res) => {
  const path = decodeURIComponent(req.url.split("?")[0]);
  requests.push(path);
  const file = join(here, path === "/" ? "maker-lazy.html" : path);
  if (!file.startsWith(here) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await pw.chromium.launch();
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${base}/maker-lazy.html`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  ok(!requests.some((r) => r.startsWith("/library/")), "lazy: library files were requested before a trade with a library was picked");
  await page.fill("#company", "Cedar Post Fencing");
  await page.selectOption("#trade", "fencing");
  await page.waitForFunction(() => document.querySelectorAll("#cine-slots .lib-tag:not([hidden])").length >= 4, null, { timeout: 15000 }).catch(() => {});
  const got = requests.filter((r) => r.startsWith("/library/fencing/"));
  ok(got.length === 4, `lazy: expected 4 library requests for fencing, got ${got.length}`);
  ok((await page.$$eval("#cine-slots .slot .lib-tag:not([hidden])", (e) => e.length)) === 4, "lazy: the four spots do not show 'Library picture' after loading");
  ok(((await page.textContent("#lib-status")) || "").trim() === "", "lazy: status message still shown after loading");
  await page.waitForTimeout(400);
  const doc = await page.$eval("#frame", (f) => f.srcdoc);
  for (const id of ["stakes", "posts", "rails", "done"]) {
    const head = readFileSync(join(here, "library", "fencing", `${id}.webp`)).toString("base64").slice(0, 120);
    ok(doc.includes(head), `lazy: ${id} picture is not inlined in the preview`);
  }
  ok(doc.includes('data-look="editorial"'), "lazy: default look is not Editorial");
  const dl = page.waitForEvent("download");
  await page.click("#download");
  const file = await dl;
  const size = statSync(await file.path()).size;
  ok(size > 1.0e6 && size < 6e6, `lazy: download is ${Math.round(size / 1024)} KB, expected 1 to 6 MB`);
  const text = readFileSync(await file.path(), "utf8");
  ok(!/src="library\//.test(text) && /data:image\/webp;base64,/.test(text), "lazy: the download does not carry its pictures inside the one file");
  // checkbox, remove and upload still behave
  await page.uncheck("#use-library"); await page.waitForTimeout(500);
  ok(!(await page.$eval("#frame", (f) => f.srcdoc)).includes("data:image/webp"), "lazy: unticking the box still shows library pictures");
  await page.check("#use-library"); await page.waitForTimeout(500);
  // a trade without library files fetches nothing
  const before = requests.length;
  await page.selectOption("#trade", "roofing"); await page.waitForTimeout(700);
  ok(requests.length === before, "lazy: picking roofing requested files");
  ok(!(await page.isVisible("#lib-wrap")), "lazy: library box shown for roofing");
  ok(errs.length === 0, "lazy: page error " + errs[0]);
  await page.close();
  // opened from a file the fetch cannot work: drawings and a calm message, no crash
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const e2 = []; p2.on("pageerror", (e) => e2.push(e.message));
  await p2.goto("file://" + lazyFile, { waitUntil: "load" });
  await p2.fill("#company", "X"); await p2.selectOption("#trade", "fencing"); await p2.waitForTimeout(1500);
  ok(/could not be loaded/i.test((await p2.textContent("#lib-status")) || ""), "file:// lazy page: no calm message when the pictures cannot load");
  ok((await p2.$eval("#frame", (f) => f.srcdoc)).includes("image/svg+xml"), "file:// lazy page: drawings not used as the fallback");
  ok(e2.length === 0, "file:// lazy page: page error " + e2[0]);
  await p2.close();
}
await browser.close();
server.close();

// ---- 3. the ingest script
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function png(w, h, [r, g, b]) {
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { row[1 + x * 3] = r; row[2 + x * 3] = g; row[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
{
  const tmp = join(here, "test-out", "ingest-test");
  rmSync(tmp, { recursive: true, force: true });
  const inbox = join(tmp, "inbox"), lib = join(tmp, "library");
  mkdirSync(inbox, { recursive: true });
  writeFileSync(join(inbox, "roofing-old.png"), png(320, 180, [120, 80, 60]));
  writeFileSync(join(inbox, "fencing-stakes.png"), png(320, 180, [60, 120, 80]));
  writeFileSync(join(inbox, "fencing-posts.png"), png(300, 300, [60, 80, 120])); // not 16:9
  writeFileSync(join(inbox, "bogus-thing.png"), png(320, 180, [0, 0, 0])); // unknown trade
  writeFileSync(join(inbox, "roofing-nonsense.png"), png(320, 180, [0, 0, 0])); // unknown slot
  writeFileSync(join(inbox, "notes.txt"), "hi");
  const run = (extra = []) => node([join(here, "ingest.mjs"), inbox, "--library", lib, ...extra]);
  const r1 = run();
  ok(r1.status === 2, `ingest: expected exit 2 for rejected names, got ${r1.status}`);
  const all1 = r1.stdout + r1.stderr;
  ok(/unknown trade "bogus"/.test(all1) && /Trades: roofing/.test(all1), "ingest: unknown trade is not rejected with the list of trades");
  ok(/unknown slot "nonsense" for roofing/.test(all1) && /Slots: old/.test(all1), "ingest: unknown slot is not rejected with the list of slots");
  ok(/notes\.txt: not a jpg, png or webp/.test(all1), "ingest: a non-picture file is not rejected");
  ok(/fencing-posts\.png: 300x300 is not 16:9/.test(all1), "ingest: a non-16:9 picture is not flagged");
  ok(existsSync(join(lib, "roofing", "old.webp")) && existsSync(join(lib, "fencing", "stakes.webp")), "ingest: good pictures were not written as webp");
  ok(!existsSync(join(lib, "bogus")) && !existsSync(join(lib, "roofing", "nonsense.webp")), "ingest: rejected names were written anyway");
  ok(/roofing\s+1\/9/.test(all1) && /fencing\s+3\/9/.test(all1) === false && /fencing\s+2\/9/.test(all1), "ingest: summary table does not show slots found and missing");
  const first = statSync(join(lib, "fencing", "stakes.webp")).mtimeMs;
  await new Promise((r) => setTimeout(r, 60));
  const r2 = run();
  ok(/left alone/.test(r2.stdout) && /already in the library/.test(r2.stdout), "ingest: existing pictures are not reported as left alone");
  ok(statSync(join(lib, "fencing", "stakes.webp")).mtimeMs === first, "ingest: a picture was overwritten without --force");
  const r3 = run(["--force"]);
  ok(/written/.test(r3.stdout) && statSync(join(lib, "fencing", "stakes.webp")).mtimeMs > first, "ingest: --force did not replace the picture");
  const r4 = node([join(here, "ingest.mjs"), inbox, "--library", join(tmp, "dry"), "--dry-run"]);
  ok(!existsSync(join(tmp, "dry")), "ingest: --dry-run wrote files");
  rmSync(tmp, { recursive: true, force: true });
}


// ---- 3b. ingest by order (downloads that kept their default names)
{
  const tmp = join(here, "test-out", "ingest-order-test");
  rmSync(tmp, { recursive: true, force: true });
  const inbox = join(tmp, "inbox"), lib = join(tmp, "library"), sheet = join(tmp, "sheet.jpg");
  mkdirSync(inbox, { recursive: true });
  // 10 downloads: names run "download (1)" to "download (10)" but the modification times run the other way
  const base = Date.now() / 1000 - 3600;
  for (let i = 1; i <= 10; i++) {
    const f = join(inbox, `download (${i}).png`);
    writeFileSync(f, png(320, 180, [i * 20, 90, 255 - i * 20]));
    utimesSync(f, base + (11 - i) * 60, base + (11 - i) * 60);
  }
  const run = (extra = []) => node([join(here, "ingest.mjs"), "--trade", "roofing", "--by-order", inbox, "--library", lib, "--sheet", sheet, ...extra]);
  // 10 files for 9 required slots: refused, but the table is still printed, nothing written
  let r = run();
  ok(r.status === 3 && /Refused: 10 pictures for 9 slots/.test(r.stderr), `by-order: expected refusal for 10 files / 9 slots, got ${r.status}`);
  ok(/pos\s+file\s+KB\s+pixels\s+slot/.test(r.stdout) && /download \(10\)\.png/.test(r.stdout), "by-order: table (position, file, size, pixels, slot) is not printed");
  ok(!existsSync(join(lib, "roofing")), "by-order: files were written on a refusal");
  // skip position 4 -> 9 files; without --yes it is a dry run
  r = run(["--skip", "4"]);
  ok(r.status === 0 && /Dry run only/.test(r.stdout) && !existsSync(join(lib, "roofing")), "by-order: dry run wrote files or did not say so");
  // mtime order: the oldest file is "download (10)" and gets the first slot, "old"
  ok(/download \(10\)\.png\s+\d+\s+320x180\s+old\b/.test(r.stdout), "by-order: the oldest file does not get the first slot");
  ok(/\(skipped\)/.test(r.stdout.split("\n").find((l) => /^4\s/.test(l)) || ""), "by-order: --skip 4 is not shown as skipped at position 4");
  ok(existsSync(sheet) && statSync(sheet).size > 1000, "by-order: no contact sheet written");
  // sort by name changes the assignment
  r = run(["--skip", "4", "--sort", "name"]);
  ok(/download \(1\)\.png\s+\d+\s+320x180\s+old\b/.test(r.stdout), "by-order: --sort name does not give the first slot to the first name");
  // write
  r = run(["--skip", "4", "--yes"]);
  const slotsOfRoofing = ["old", "deck", "wrap", "new", "shingle", "metal", "slate", "before", "after"];
  ok(r.status === 0 && slotsOfRoofing.every((s) => existsSync(join(lib, "roofing", `${s}.webp`))), "by-order: --yes did not write all 9 required slots as webp");
  ok(/9 written, 0 left alone/.test(r.stdout), "by-order: summary does not count 9 written");
  // never overwrite without --force
  const m0 = statSync(join(lib, "roofing", "old.webp")).mtimeMs;
  await new Promise((rr) => setTimeout(rr, 60));
  r = run(["--skip", "4", "--yes"]);
  ok(/left alone: roofing\/old/.test(r.stdout) && statSync(join(lib, "roofing", "old.webp")).mtimeMs === m0, "by-order: overwrote a picture without --force");
  r = run(["--skip", "4", "--yes", "--force"]);
  ok(/9 written, 0 left alone/.test(r.stdout) && statSync(join(lib, "roofing", "old.webp")).mtimeMs > m0, "by-order: --force did not replace pictures");
  // fewer files than slots: refused unless --allow-fewer, then the first slots are filled
  const lib2 = join(tmp, "library2");
  const few = (extra = []) => node([join(here, "ingest.mjs"), "--trade", "roofing", "--by-order", inbox, "--library", lib2, "--sheet", sheet, "--skip", "4,5,6,7,8", ...extra]);
  r = few(["--yes"]);
  ok(r.status === 3 && /Refused: 5 pictures for 9 slots; missing: metal, slate, before, after/.test(r.stderr) && !existsSync(lib2), "by-order: fewer files were not refused with the missing slots listed");
  r = few(["--yes", "--allow-fewer"]);
  ok(r.status === 0 && existsSync(join(lib2, "roofing", "old.webp")) && existsSync(join(lib2, "roofing", "deck.webp")) && existsSync(join(lib2, "roofing", "shingle.webp")) && !existsSync(join(lib2, "roofing", "metal.webp")), "by-order: --allow-fewer did not fill only the first slots");
  // unknown trade, bad skip
  r = node([join(here, "ingest.mjs"), "--trade", "nope", "--by-order", inbox]);
  ok(r.status === 2 && /Trades: roofing/.test(r.stderr), "by-order: unknown trade not rejected with the list");
  r = run(["--skip", "99"]);
  ok(r.status === 2 && /past the last picture/.test(r.stderr), "by-order: a --skip past the end is not rejected");
  // optional slots only with --with-optional (roofing has 3 extra service pictures): 12 files fit
  rmSync(inbox, { recursive: true, force: true }); mkdirSync(inbox, { recursive: true });
  for (let i = 1; i <= 12; i++) { const f = join(inbox, `img-${String(i).padStart(2, "0")}.png`); writeFileSync(f, png(320, 180, [i * 15, 60, 60])); utimesSync(f, base + i * 60, base + i * 60); }
  r = run();
  ok(r.status === 3 && /12 pictures for 9 slots/.test(r.stderr), "by-order: 12 files without --with-optional should be refused");
  r = run(["--with-optional"]);
  ok(r.status === 0 && /svc-gutters/.test(r.stdout), "by-order: --with-optional does not assign the optional slots");
  rmSync(tmp, { recursive: true, force: true });
}

// ---- 4. the publish plan lists every library file
{
  const r = node([join(here, "publish-plan.mjs"), "--json"]);
  let plan = null; try { plan = JSON.parse(r.stdout); } catch (_) { /* below */ }
  ok(plan && plan.pictures >= 4 && Object.keys(plan.files).length === plan.pictures, "publish plan: not valid or the files map does not list every picture");
  ok(plan && Object.entries(plan.files).every(([pub, src]) => /^library\/[a-z0-9]+\/[a-z0-9-]+\.(webp|jpe?g|png)$/.test(pub) && existsSync(join(here, "..", src))), "publish plan: a published path is wrong or its source is missing");
  const libFiles = readdirSync(join(here, "library")).filter((d) => statSync(join(here, "library", d)).isDirectory()).reduce((n, d) => n + readdirSync(join(here, "library", d)).filter((f) => /\.(webp|jpe?g|png)$/.test(f)).length, 0);
  ok(plan && plan.pictures === libFiles, "publish plan: picture count differs from the library folder");
}

rmSync(lazyFile, { force: true });
if (fails.length) { console.log("FAIL"); fails.forEach((f) => console.log(" - " + f)); process.exit(1); }
console.log("PASS: picture library tests (lazy files, ingest, publish plan)");
