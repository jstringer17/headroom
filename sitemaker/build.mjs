// Builds sitemaker/maker.html (the Sample Site Maker page) from the same
// source the tests use: src/trades.js, src/themes.js, src/generate.js and
// the page shell in src/maker-ui.html + src/maker-ui.js.
//   node sitemaker/build.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), "utf8");
// Turn the ES modules into plain script: drop import lines and `export`.
const plain = (src) => src.replace(/^import .*$/gm, "").replace(/^export /gm, "");

const generator = ["src/trades.js", "src/themes.js", "src/cine-kit.js", "src/cine-look.js", "src/cinematic.js", "src/generate.js"].map((p) => plain(read(p))).join("\n");
// Keep "</script" sequences from closing the inline script early.
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const out = read("src/maker-ui.html")
  .replace("/*__GENERATOR__*/", () => safe(generator))
  .replace("/*__UI__*/", () => safe(read("src/maker-ui.js")));
writeFileSync(join(here, "maker.html"), out);
console.log(`maker.html written (${(out.length / 1024).toFixed(1)} KB)`);
