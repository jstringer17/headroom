// "Share with the owner" button in the maker (owner preview, hosting/src/demo.js).
//   node sitemaker/test-share.mjs        (run after build.mjs --test; test-all does)
// Real maker page; the backend is the real hosting demo app on a local stand-in env (mock D1/R2), reached through page.route.
// Checks: first click asks for address + key (kept in localStorage, never in the page), the request carries X-Agency-Key and
// library pictures by name, the link + Copy + QR show, the link renders the sample, a wrong key asks again.
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { loadPlaywright, launchOpts } from "./qa/lib.mjs";
import { mockEnv } from "../hosting/test/mock-env.js";
import { demoApp } from "../hosting/src/demo.js";

const here = dirname(fileURLToPath(import.meta.url));
const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
const KEY = "test-agency-key-42";
const BACKEND = "https://demo.agency.test";
const env = mockEnv({ AGENCY_KEY: KEY, MAKER_ORIGINS: "null", AGENCY_PHONE: "512-555-0199", AGENCY_NAME: "Headroom Web", AGENCY_EMAIL: "sales@agency.test" });
const ctx = { waitUntil() {} };

const pageHtml = readFileSync(join(here, "maker.html"), "utf8");
ok(!pageHtml.includes(KEY), "the agency key must never be in the page source");

const pw = loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const seen = [];
await page.route(`${BACKEND}/**`, async (route) => {
  const req = route.request();
  const headers = req.headers();
  seen.push({ url: req.url(), method: req.method(), key: headers["x-agency-key"], body: req.postData() });
  const r = await demoApp(new Request(req.url(), { method: req.method(), headers, body: req.method() === "POST" ? req.postData() : undefined }), env, ctx);
  const h = {}; r.headers.forEach((v, k) => { h[k] = v; });
  await route.fulfill({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) });
});
await page.goto(pathToFileURL(join(here, "maker.html")).href);
await page.waitForSelector("#share-owner");

// Button sits next to Download.
const sib = await page.evaluate(() => { const b = document.getElementById("share-owner"); return b && b.parentElement.contains(document.getElementById("download")); });
ok(sib, "Share with the owner sits next to Download");

// Without a company name it asks for one.
await page.fill("#company", "");
await page.click("#share-owner");
ok((await page.textContent("#status")).includes("company name"), "no company name -> asks for it");

await page.fill("#company", "Ridge Line Fence");
await page.fill("#phone", "918-555-0142");
await page.selectOption("#trade", "fencing");
await page.waitForTimeout(300);
await page.click("#share-owner");
ok(await page.isVisible("#share-setup"), "first share asks for backend address and key");
ok(seen.length === 0, "nothing sent before the key is typed");
ok((await page.inputValue("#share-url")) === "https://headroom-sites.headroom-sites-agency.workers.dev", "backend address defaults to the hosted backend");
await page.fill("#share-url", "http://insecure.test");
await page.fill("#share-key", KEY);
await page.click("#share-save");
ok((await page.textContent("#share-status")).includes("https://"), "plain http address refused");
await page.fill("#share-url", BACKEND + "/");
await page.click("#share-save");
await page.waitForFunction(() => document.getElementById("share-link").value || /bad/.test(document.getElementById("share-status").className), null, { timeout: 15000 });

const posted = seen.find((s) => s.method === "POST");
ok(posted && posted.url === `${BACKEND}/api/demo`, "POST goes to <backend>/api/demo");
ok(posted && posted.key === KEY, "X-Agency-Key header carries the key");
const body = posted ? JSON.parse(posted.body) : {};
ok(body.form && body.form.company === "Ridge Line Fence" && body.form.trade === "fencing", "form sent (company, trade)");
const libSlots = (body.form && body.form.cine && body.form.cine.libSlots) || [];
ok(libSlots.length > 0, "library pictures sent by name (cine.libSlots)");
ok(!Object.values((body.form && body.form.cine && body.form.cine.images) || {}).length, "no library picture data sent as images");
ok(!/data:image\/(webp|jpeg)/.test(posted ? posted.body : ""), "library picture data never sent inline");

const link = await page.inputValue("#share-link");
ok(/^https:\/\/demo\.agency\.test\/d\/[0-9a-f]{32}$/.test(link), `link shown: ${link} / ${await page.textContent("#share-status")}`);
ok(await page.isVisible("#share-qr"), "QR code shown");
ok(/^data:image\/svg\+xml/.test(await page.getAttribute("#share-qr", "src") || ""), "QR is an image (svg data)");
ok((await page.textContent("#share-exp")).includes("Works until"), "expiry shown");
ok(await page.isVisible("#share-copy"), "Copy link button shown");
const stored = await page.evaluate(() => localStorage.getItem("sitemaker-share-v1"));
ok(stored && JSON.parse(stored).key === KEY, "key kept in localStorage");
ok(!(await page.content()).includes(KEY), "key not written into the page");

// The link renders the sample with the agency banner and library pictures by path.
if (link) {
  const r = await demoApp(new Request(link), env, ctx);
  const html = await r.text();
  ok(r.status === 200 && html.includes("Sample website made for Ridge Line Fence by Headroom Web."), "link renders the sample with the banner");
  ok(html.includes("https://demo.agency.test/library/fencing/"), "library pictures served by path on the demo host");
}

// Second share: no setup again.
seen.length = 0;
await page.click("#share-owner");
await page.waitForFunction(() => /Link ready|bad/.test(document.getElementById("share-status").textContent + document.getElementById("share-status").className), null, { timeout: 15000 });
ok(await page.isHidden("#share-setup"), "second share does not ask again");

// Wrong key -> asks again.
await page.evaluate(() => localStorage.setItem("sitemaker-share-v1", JSON.stringify({ url: "https://demo.agency.test", key: "wrong" })));
await page.click("#share-owner");
await page.waitForFunction(() => !document.getElementById("share-setup").hidden, null, { timeout: 15000 });
ok((await page.textContent("#share-status")).includes("Wrong agency key"), "wrong key -> asks for it again");

// Phone width: no sideways scroll with the share box open.
await page.setViewportSize({ width: 375, height: 800 });
const sideways = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
ok(!sideways, "no sideways scroll at 375px");

await browser.close();
if (fails.length) { console.log("FAIL test-share\n - " + fails.join("\n - ")); process.exit(1); }
console.log("PASS test-share: share button, key handling, request, link, QR, render (all checks)");
