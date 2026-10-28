// Builds sitemaker/maker.html (the Sample Site Maker page) from the same
// source the tests use: src/trades.js, src/themes.js, src/generate.js and
// the page shell in src/maker-ui.html + src/maker-ui.js.
//   node sitemaker/build.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), "utf8");
// Turn the ES modules into plain script: drop import lines and `export`.
const plain = (src) => src.replace(/^import .*$/gm, "").replace(/^export /gm, "");

const argv0 = process.argv.slice(2);
const opt = (n) => (argv0.includes(n) ? argv0[argv0.indexOf(n) + 1] : "");
// Test hooks: --library <dir named library> (a library folder elsewhere), --kit-patch <file.js> (JS run right after the kit is defined).
const kitPatch = opt("--kit-patch") ? readFileSync(opt("--kit-patch"), "utf8") : "";
const generator = ["src/trades.js", "src/themes.js", "src/cine-kit.js", "src/cine-look.js", "src/variants.js", "src/cinematic.js", "src/editorial.js", "src/generate.js"].map((p) => plain(read(p)) + (p === "src/cine-kit.js" ? "\n" + kitPatch + "\n" : "")).join("\n");
// Picture library: library/<trade>/<slotId>.(webp|jpg|png) (see library/README.md).
// maker.html always carries the INDEX (names and sizes). The pictures themselves are either
//   - embedded as data URIs (small libraries, and tests that open the page from a file), or
//   - left as separate files published next to the page and fetched when a trade is picked.
// Default: embed while the whole library is <= EMBED_MAX; --lazy never embeds; --embed always does.
//   node sitemaker/build.mjs [--lazy | --embed] [--out maker-lazy.html]
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const outName = args.includes("--out") ? args[args.indexOf("--out") + 1] : "maker.html";
const EMBED_MAX = 6 * 1024 * 1024; // raw bytes; base64 adds a third, the artifact limit is 16 MB
const MIME = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
const libDir = opt("--library") || join(here, "library");
const index = {}; // trade -> slot -> { file, bytes }. A variant's slot is "<variant>/<slot>".
let totalBytes = 0, fileCount = 0;
const addPicture = (trade, slot, file) => {
  const bytes = statSync(join(libDir, file)).size;
  (index[trade] = index[trade] || {})[slot] = { file: `library/${file}`, bytes };
  totalBytes += bytes; fileCount++;
};
if (existsSync(libDir)) {
  for (const trade of readdirSync(libDir).sort()) {
    const dir = join(libDir, trade);
    if (!statSync(dir).isDirectory()) continue;
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        // library/<trade>/<variant>/<slot>.webp
        for (const f of readdirSync(full).sort()) {
          const m = /^([a-z0-9-]+)\.(webp|jpe?g|png)$/i.exec(f);
          if (m) addPicture(trade, `${entry}/${m[1]}`, `${trade}/${entry}/${f}`);
        }
      } else {
        const m = /^([a-z0-9-]+)\.(webp|jpe?g|png)$/i.exec(entry);
        if (m) addPicture(trade, m[1], `${trade}/${entry}`);
      }
    }
  }
}
const embed = flag("--embed") || (!flag("--lazy") && totalBytes <= EMBED_MAX);
const library = {};
if (embed) {
  for (const trade of Object.keys(index)) for (const slot of Object.keys(index[trade])) {
    const file = index[trade][slot].file; // library/<...>
    const ext = file.split(".").pop().toLowerCase();
    (library[trade] = library[trade] || {})[slot] = `data:${MIME[ext]};base64,` + readFileSync(join(libDir, "..", file)).toString("base64");
  }
}
const libraryJs = `\nconst PICTURE_INDEX = ${JSON.stringify(index)};\nconst PICTURE_LIBRARY = ${JSON.stringify(library)};\n`;
// Keep "</script" sequences from closing the inline script early.
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const out = read("src/maker-ui.html")
  .replace("/*__GENERATOR__*/", () => safe(generator + libraryJs))
  .replace("/*__UI__*/", () => safe(read("src/maker-ui.js")));
writeFileSync(join(here, outName), out);
console.log(`${outName} written (${(out.length / 1024).toFixed(1)} KB); library: ${fileCount} pictures, ${(totalBytes / 1048576).toFixed(2)} MB, ${embed ? "embedded" : "NOT embedded: publish library/ files next to the page (node sitemaker/publish-plan.mjs)"}`);
