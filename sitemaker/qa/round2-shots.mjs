// Phone and desktop screenshots of the three looks with the full picture library and a full credibility profile.
//   node sitemaker/qa/round2-shots.mjs [--src=<sitemaker dir>] [--out=<dir>] [--looks=cinematic,editorial,classic]
//        [--trades=roofing,fencing,pressure] [--variants=all|first] [--widths=375,390,1280] [--webkit]
// Library pictures are served from https://lib.test/<trade>/<slot>.webp by a Playwright route (no server needed).
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const src = arg("src", join(here, ".."));
const out = arg("out", join(here, "round2-out"));
const looks = arg("looks", "cinematic,editorial,classic").split(",");
const trades = arg("trades", "roofing,fencing,pressure").split(",");
const widths = arg("widths", "375,1280").split(",").map(Number);
const allVariants = arg("variants", "first") === "all";
mkdirSync(out, { recursive: true });
const { generateSite, useCine } = await import(pathToFileURL(join(src, "src/generate.js")));
const kitMod = await import(pathToFileURL(join(src, "src/cine-kit.js")));
const lookMod = await import(pathToFileURL(join(src, "src/cine-look.js")));
try { useCine({ CINE_KIT: kitMod.CINE_KIT, cineLook: lookMod.cineLook, placeholderArt: lookMod.placeholderArt }); } catch (_) {}
const lib = join(src, "library");
const files = (dir) => readdirSync(dir).flatMap((f) => statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]);
const images = (trade) => Object.fromEntries(files(join(lib, trade)).filter((f) => /\.webp$/.test(f)).map((f) => [relative(join(lib, trade), f).replace(/\.webp$/, ""), `https://lib.test/${trade}/${relative(join(lib, trade), f)}`]));
const NAMES = { roofing: "Ridgeline Roofing", fencing: "Cedar & Iron Fence Co", pressure: "Bright Side Pressure Washing" };
const PRICES = {
  roofing: { "Medium home": { "Architectural shingle": { low: "4.50", high: "7" }, "Standing seam metal": { low: "9", high: "14" }, "Slate look": { low: "11", high: "16" } } },
  fencing: { "Medium yard": { "Cedar privacy": { low: "28", high: "42" }, "White vinyl": { low: "32", high: "48" }, "Black aluminum": { low: "38", high: "55" } } },
  pressure: { "Medium (driveway)": { Driveway: { low: "0.25", high: "0.45" }, "House washing": { low: "0.30", high: "0.50" }, "Deck or patio": { low: "0.40", high: "0.60" } } },
};
const form = (look, trade, variant) => ({
  company: NAMES[trade] || "Sample Co", trade, city: "Tulsa, OK", phone: "(918) 555-0142", look, cinematic: look === "cinematic", year: 2026,
  emergency: false, freeEstimates: true, insured: true, clean: true,
  rating: "4.9", reviews: "127", areas: "Broken Arrow, Jenks, Bixby, Owasso, Sand Springs",
  cred: { founded: "2011", googleUrl: "https://g.page/r/example", bbb: { rating: "A+", accredited: true }, license: "ROC 334512", bonded: true, coverage: "$1M", warranty: "10-year workmanship warranty", jobs: "1200", family: true, certs: trade === "roofing" ? ["GAF Master Elite"] : [] },
  cine: { variant, images: images(trade), prices: PRICES[trade] },
});
const require = createRequire(import.meta.url);
const pw = require("playwright");
const engine = process.argv.includes("--webkit") ? pw.webkit : pw.chromium;
const browser = await engine.launch();
const shots = [];
for (const look of looks) for (const trade of trades) {
  const vs = (kitMod.CINE_KIT[trade].variants || [{ key: "" }]).map((v) => v.key);
  for (const variant of allVariants ? vs : vs.slice(0, 1)) {
    const html = generateSite(form(look, trade, variant));
    const file = join(out, `${look}-${trade}-${variant || "default"}.html`);
    writeFileSync(file, html);
    for (const w of widths) {
      const ctx = await browser.newContext({ viewport: { width: w, height: w < 600 ? (w === 390 ? 844 : 812) : 860 }, deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600 && engine === pw.chromium, hasTouch: w < 600 });
      await ctx.route("https://lib.test/**", (r) => { const p = join(lib, decodeURIComponent(new URL(r.request().url()).pathname.slice(1))); return existsSync(p) ? r.fulfill({ path: p, contentType: "image/webp" }) : r.fulfill({ status: 404 }); });
      const page = await ctx.newPage();
      const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
      await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
      await page.waitForTimeout(500);
      const tag = `${look}-${trade}-${variant || "default"}-${w}`;
      const snap = async (name) => { const f = `${tag}-${name}.jpg`; await page.screenshot({ path: join(out, f), type: "jpeg", quality: 70 }); shots.push(f); };
      await snap("0top");
      for (const [name, sel] of [["1proof", "[class*=badge], [class*=proof], .facts, .ed-trust, .trust"], ["2pick", "#styles"], ["4reviews", "#reviews"], ["5contact", "#contact"]]) {
        const ok = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; scrollTo(0, e.getBoundingClientRect().top + scrollY - (/proof|badge|facts|trust/.test(s) ? 300 : 70)); return true; }, sel);
        if (!ok) continue; await page.waitForTimeout(700); await snap(name);
        if (name === "2pick") { const did = await page.evaluate(() => { const b = [...document.querySelectorAll("#styles button")].find((x) => /compare/i.test(x.textContent) && x.offsetParent); if (b) b.click(); return !!b; }); if (did) { await page.waitForTimeout(600); await snap("3compare"); } }
      }
      if (errs.length) console.log("PAGE ERRORS", tag, errs);
      await ctx.close();
    }
  }
}
await browser.close();
writeFileSync(join(out, "index.html"), `<!doctype html><meta charset="utf-8"><title>round 2 shots</title><style>body{font:14px system-ui;background:#222;color:#eee}img{max-width:420px;max-height:900px;margin:4px;vertical-align:top}</style>${shots.map((f) => `<figure style="display:inline-block"><img src="${f}"><figcaption>${f}</figcaption></figure>`).join("")}`);
console.log(`${shots.length} shots in ${out}`);
