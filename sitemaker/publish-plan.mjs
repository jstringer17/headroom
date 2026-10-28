// List what to publish and the exact Artifact `files` mapping.
//   node sitemaker/publish-plan.mjs [--json]      (run from the repo root; paths are relative to it)
// Small library (<= 6 MB): maker.html already carries the pictures, no extra files are needed.
// Bigger library: build with --lazy and publish the library files next to the page. The maker then
// fetches a trade's pictures by relative URL (library/<trade>/<slot>.webp) when that trade is picked,
// and Download still inlines the chosen pictures, so the downloaded site stays one file.
// Limits: 255 files and 64 MB per publish, 511 files and 256 MB per artifact version.
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const libArg = process.argv.indexOf("--library");
const libDir = libArg > 0 ? process.argv[libArg + 1] : join(here, "library");
const EMBED_MAX = 6 * 1024 * 1024;
const lazyPageName = "maker-publish.html"; // the page to publish with the library files next to it
const files = {};
let bytes = 0, n = 0;
const walk = (dir, rel) => {
  for (const f of readdirSync(dir).sort()) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) { walk(full, `${rel}/${f}`); continue; }
    if (!/\.(webp|jpe?g|png)$/i.test(f)) continue;
    files[`library/${rel}/${f}`] = relative(root, full);
    bytes += statSync(full).size; n++;
  }
};
if (existsSync(libDir)) for (const trade of readdirSync(libDir).sort()) if (statSync(join(libDir, trade)).isDirectory()) walk(join(libDir, trade), trade);
// A lazy build never embeds, so the library files must always be published with it.
const lazy = true;
const small = bytes <= EMBED_MAX;
const page = relative(root, join(here, lazyPageName));
const plan = {
  build: "node sitemaker/build.mjs --lazy --out maker-publish.html",
  page,
  pictures: n,
  megabytes: +(bytes / 1048576).toFixed(2),
  files,
  embeddedBuildAlsoWorks: small, // sitemaker/maker.html (node sitemaker/build.mjs) embeds the pictures while the library is <= 6 MB
  note: "Publish the page (file_path) with this `files` map (published path -> source path). Relative paths: library/<trade>/<slot>.webp.",
  limitsOk: n + 1 <= 255 && bytes <= 64 * 1048576,
};
if (process.argv.includes("--json")) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }
console.log(`library: ${n} pictures, ${plan.megabytes} MB${small ? " (small enough to embed: sitemaker/maker.html also works without extra files)" : " (too big to embed: publish as files)"}`);
console.log(`1. ${plan.build}`);
console.log(`2. publish ${page} with files:`);
console.log(JSON.stringify(files, null, 2));
if (!plan.limitsOk) console.log(`WARNING: over the 255 files / 64 MB limit of one publish: split the files over several publishes to the same url.`);
mkdirSync(join(here, "test-out"), { recursive: true });
writeFileSync(join(here, "test-out", "publish-plan.json"), JSON.stringify(plan, null, 2) + "\n");
