// Screenshots of every admin screen at 375px and 1280px, with a no-sideways-scroll check.
// Run: node hosting/src/admin/dev/shots.mjs   (local only: mock D1/R2, stubbed Places replies, no network calls)
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { adminApp } from "../index.js";
import { useDeps } from "../deps.js";
import { signSession } from "../session.js";
import { makeEnv, addSite } from "./mock-env.js";
import { refreshReviews } from "../../reviews/index.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const OUT = root + "hosting/test-shots/admin/";
mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(execSync("npm root -g").toString().trim() + "/playwright"); }

// No real calls: every fetch gets a saved Places fixture.
const fx = (n) => readFileSync(root + `hosting/test/fixtures/places-${n}.json`, "utf8");
globalThis.fetch = async (url) => new Response(String(url).includes("searchText") ? fx("search") : fx("details"), { status: 200 });

const { env, deps } = makeEnv({ GOOGLE_PLACES_API_KEY: "local-fixture-only" });
useDeps(deps);
const pic = (f) => "data:image/webp;base64," + readFileSync(root + "sitemaker/library/roofing/" + f).toString("base64");
await addSite(env, {
  id: "site-a", domain: "localhost", owner_email: "owner@summit.test", place_id: "ChIJtestPlace0001abcdEFGH",
  form: { company: "Summit Roofing", trade: "roofing", city: "Fresno and Clovis", phone: "(559) 555-0100", years: "14", cinematic: true, look: "cinematic", insured: true,
    services: ["Roof repair", "Roof replacement", "Storm damage", "Gutters"],
    cine: { unit: "per sq ft", images: { old: pic("old.webp"), new: pic("new.webp") }, prices: { "Medium home": { "Architectural shingle": { low: "9000", high: "14000" }, "Repair only": { low: "400", high: "1500" } } } } },
});
await refreshReviews(env);
env.DB.sql.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, show) VALUES ('site-a','manual','Maria G., Fresno',5,'They came the day after the storm, tarped the roof and had it fixed within the week.','2026-10-20T00:00:00Z',1)").run();
const cookie = "__Host-admin=" + (await signSession(env.SESSION_KEY, "site-a", "owner@summit.test"));

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const url = `http://localhost:${server.address().port}${req.url}`;
  const r = await adminApp(new Request(url, { method: req.method, headers: req.headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks) }), env, {});
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await playwright.chromium.launch();
const results = [];
for (const width of [375, 1280]) {
  const anon = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, deviceScaleFactor: 1 });
  const auth = await browser.newContext({ viewport: { width, height: width === 375 ? 812 : 900 }, deviceScaleFactor: 1, extraHTTPHeaders: { cookie } });
  const shot = async (page, name, full = true) => {
    await page.waitForLoadState("networkidle").catch(() => {});
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    const file = `${name}-${width}.png`;
    await page.screenshot({ path: OUT + file, fullPage: full });
    results.push({ file, scrollWidth: m.sw, clientWidth: m.cw, sideways: m.sw > m.cw });
  };
  const a = await anon.newPage();
  await a.goto(base + "/admin"); await shot(a, "01-login");
  await a.fill("#email", "owner@summit.test"); await a.click("button"); await a.waitForURL("**/admin/login"); await shot(a, "02-check-email");
  await a.goto(base + "/admin/login?t=" + "x".repeat(43)); await shot(a, "03-tap-to-log-in");
  await a.click("main button"); await a.waitForLoadState(); await shot(a, "04-link-expired");
  const p = await auth.newPage();
  await p.goto(base + "/admin"); await shot(p, "05-editor");
  await p.goto(base + "/admin?done=published"); await shot(p, "06-editor-published", false);
  await p.goto(base + "/admin/google?q=Summit%20Roofing%20Fresno"); await shot(p, "07-google-listing");
  await p.goto(base + "/admin/ask"); await shot(p, "08-ask-for-review");
  await p.goto(base + "/admin/preview"); await shot(p, "09-preview", false);
  await anon.close(); await auth.close();
}
await browser.close();
server.close();
writeFileSync(OUT + "scroll-check.json", JSON.stringify(results, null, 2) + "\n");
console.table(results);
if (results.some((r) => r.sideways)) process.exitCode = 1;
