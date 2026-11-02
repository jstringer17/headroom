// Phone story frames for every variation: node sitemaker/qa/story-frames.mjs <out> [trade ...] [--w=375] [--look=cinematic]
import { readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), out = args[0];
const w = +((args.find((a) => a.startsWith("--w=")) || "--w=375").slice(4));
const look = (args.find((a) => a.startsWith("--look=")) || "--look=cinematic").slice(7);
const trades = args.slice(1).filter((a) => !a.startsWith("--"));
mkdirSync(out, { recursive: true });
const { generateSite } = await import(pathToFileURL(join(here, "../src/generate.js")));
const { CINE_KIT } = await import(pathToFileURL(join(here, "../src/cine-kit.js")));
const lib = join(here, "../library");
const files = (d) => readdirSync(d).flatMap((f) => statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]);
const imgs = (t) => Object.fromEntries(files(join(lib, t)).filter((f) => f.endsWith(".webp")).map((f) => [relative(join(lib, t), f).replace(/\.webp$/, ""), `https://lib.test/${t}/${relative(join(lib, t), f)}`]));
const pw = createRequire(import.meta.url)("playwright");
const b = await pw.chromium.launch();
for (const t of trades.length ? trades : ["roofing", "fencing", "pressure"]) for (const v of CINE_KIT[t].variants.map((x) => x.key)) {
  const f = join(out, `${t}-${v}.html`);
  writeFileSync(f, generateSite({ company: "Ridgeline Roofing", trade: t, city: "Tulsa, OK", phone: "9185550142", look, cinematic: look === "cinematic", rating: 4.9, reviews: 127, cine: { variant: v, images: imgs(t) } }));
  const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.route("https://lib.test/**", (r) => { const p = join(lib, decodeURIComponent(new URL(r.request().url()).pathname.slice(1))); return existsSync(p) ? r.fulfill({ path: p, contentType: "image/webp" }) : r.fulfill({ status: 404 }); });
  const p = await ctx.newPage(); await p.goto(pathToFileURL(f).href); await p.waitForTimeout(400);
  const n = await p.evaluate(() => document.querySelectorAll("#story .step").length);
  for (let i = 0; i < n; i++) {
    await p.evaluate(([i, n]) => { const s = document.getElementById("story"); if (!s) return; const pin = s.querySelector(".pin"); const top = s.getBoundingClientRect().top + scrollY; scrollTo(0, top + (s.offsetHeight - pin.offsetHeight) * (n > 1 ? i / (n - 1) : 0)); }, [i, n]);
    await p.waitForTimeout(350);
    await p.screenshot({ path: join(out, `${t}-${v}-${i}.jpg`), type: "jpeg", quality: 60 });
  }
  await ctx.close();
}
await b.close();
