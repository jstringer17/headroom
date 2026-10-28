// One command for every Sample Site Maker check (run before every push):  node sitemaker/test-all.mjs
// build -> classic (test.mjs) -> engine (test-engine.mjs) -> cinematic/editorial (test-cine.mjs) -> every control (test-features.mjs)
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const steps = [["build", "build.mjs"], ["classic", "test.mjs"], ["engine", "test-engine.mjs"], ["looks (test-cine)", "test-cine.mjs"], ["every control (test-features)", "test-features.mjs"]];
let bad = 0;
for (const [name, file] of steps) {
  const r = spawnSync("node", [join(here, file)], { encoding: "utf8", cwd: join(here, "..") });
  const out = (r.stdout || "") + (r.stderr || "");
  const tail = out.trim().split("\n").filter((l) => /pass|PASS|FAIL|written|Criterion|fail/i.test(l)).slice(-6).join("\n   ");
  console.log(`${r.status === 0 ? "OK  " : "FAIL"} ${name}\n   ${tail}`);
  if (r.status !== 0) bad++;
}
console.log(bad ? `\n${bad} step(s) failed` : "\nall steps passed");
process.exit(bad ? 1 : 0);
