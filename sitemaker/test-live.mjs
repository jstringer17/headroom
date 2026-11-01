// Live mode (a sold, hosted site): every trade x every look with form.live set.
//   node sitemaker/test-live.mjs
// Checks: no sample text or labelled placeholder art, valid schema.org JSON-LD, canonical + Open Graph,
// form posts JSON to live.leadUrl and shows the thank-you line, Turnstile + honeypot present, privacy link,
// analytics beacon only with a token, no sideways scroll at 375. Also: without form.live nothing changes.
import { loadPlaywright, launchOpts } from "./qa/lib.mjs";
import { TRADE_ORDER } from "./src/trades.js";
import { generateSite } from "./src/generate.js";

const LOOKS = { classic: {}, cinematic: { cinematic: true }, editorial: { look: "editorial" } };
const BANNED = /sample|fictional|higgsfield|phone number here|make in/i;
const HOST = "https://live.test/";
const live = (extra = {}) => ({ siteId: "site123", leadUrl: "/api/lead", turnstileKey: "0x4AAAAAAA", canonical: HOST, ...extra });
const formFor = (trade, look, extra = {}) => ({ company: "Acme & Sons", trade, city: "Austin, TX", phone: "512-555-1234", ...LOOKS[look], live: live(), ...extra });
const decoded = (html) => html.replace(/%([0-9A-Fa-f]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
const visibleish = (html) => decoded(html).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/class="[^"]*"/g, "");

let pass = 0, fail = 0;
const bad = [];
function check(ok, what) { if (ok) pass++; else { fail++; bad.push(what); } }

// 1. Static checks on the HTML (all 57).
for (const trade of TRADE_ORDER) for (const look of Object.keys(LOOKS)) {
  const id = `${trade}/${look}`;
  const html = generateSite(formFor(trade, look));
  const m = visibleish(html).match(BANNED);
  check(!m, `${id}: sample text "${m && visibleish(html).slice(Math.max(0, m.index - 40), m.index + 40)}"`);
  check(!/This is a sample site/.test(html), `${id}: sample form handler still in the script`);
  const ldm = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  let ld = null;
  try { ld = ldm && JSON.parse(ldm[1]); } catch { ld = null; }
  check(ld && ld["@context"] === "https://schema.org" && ld["@type"] === "HomeAndConstructionBusiness" && ld.name === "Acme & Sons" && ld.telephone === "+15125551234" && ld.address && ld.address.addressLocality === "Austin, TX" && ld.url === HOST, `${id}: JSON-LD ${ldm ? ldm[1].slice(0, 120) : "missing"}`);
  check(ld && !ld.aggregateRating, `${id}: aggregateRating without Google data`);
  check(html.includes(`<link rel="canonical" href="${HOST}">`) && html.includes('property="og:title"') && html.includes('property="og:url"'), `${id}: canonical / Open Graph`);
  check(/<form id="ask"[^>]*action="\/api\/lead" method="post"/.test(html), `${id}: form action`);
  check(html.includes('class="cf-turnstile" data-sitekey="0x4AAAAAAA"') && html.includes("challenges.cloudflare.com/turnstile/v0/api.js"), `${id}: Turnstile`);
  check(html.includes('name="website"') && html.includes('name="email"'), `${id}: honeypot + email field`);
  check(html.includes('<a href="/privacy">Privacy</a>'), `${id}: privacy link`);
  check(!html.includes("cloudflareinsights"), `${id}: beacon without token`);
  check(new TextEncoder().encode(html).length < 6 * 1024 * 1024, `${id}: size`);
}

// 2. Rating, reviews, analytics, and owner text escaping in live mode.
{
  const html = generateSite(formFor("roofing", "editorial", { rating: 4.9, reviews: 400 }));
  check(!html.includes("From 400 Google"), "typed rating must not show in live mode");
  const g = generateSite(formFor("roofing", "cinematic", { live: live({ google: { rating: 4.6, count: 38 }, analyticsToken: "tok123" }), reviewList: [{ name: "Dana", town: "on Google", text: "Great roof job.", stars: 5 }] }));
  const ld = JSON.parse(g.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  check(ld.aggregateRating && ld.aggregateRating.ratingValue === 4.6 && ld.aggregateRating.reviewCount === 38, "aggregateRating from Google data");
  check(g.includes("From 38 Google reviews") && g.includes("Great roof job.") && g.includes("Dana, on Google"), "real reviews + Google rating shown");
  check(g.includes('data-cf-beacon=\'{"token":"tok123"}\''), "beacon with token");
  const x = generateSite(formFor("fencing", "classic", { company: "</script><script>alert(1)</script>" }));
  const ldx = x.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  check(!ldx.includes("</script") && JSON.parse(ldx).name.includes("alert(1)"), "JSON-LD escapes owner text");
  const evil = generateSite(formFor("fencing", "classic", { live: { leadUrl: "javascript:alert(1)", canonical: "http://x\" onload=\"y" } }));
  check(evil.includes('action="/api/lead"') && !evil.includes("javascript:") && !evil.includes('rel="canonical"'), "bad live values are dropped");
}

// 3. Without form.live: sample site exactly as before (spot check the sample bits are still there).
for (const look of Object.keys(LOOKS)) {
  const html = generateSite({ company: "Acme", trade: "roofing", city: "Austin", phone: "5125551234", ...LOOKS[look] });
  check(html.includes("This is a sample site") && !html.includes("ld+json") && !html.includes("/api/lead") && !html.includes("cf-turnstile"), `sample ${look}: unchanged`);
}

// 4. In a browser at 375: no sideways scroll, form posts to leadUrl, thank-you line.
const pw = await loadPlaywright();
const browser = await pw.chromium.launch(launchOpts());
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
let html = "", posted = null;
await page.route("**/*", async (route) => {
  const u = route.request().url();
  if (u === HOST) return route.fulfill({ status: 200, contentType: "text/html", body: html });
  if (u === `${HOST}api/lead`) {
    posted = { method: route.request().method(), type: route.request().headers()["content-type"], body: route.request().postData() };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  }
  if (u.startsWith("data:")) return route.continue();
  return route.abort(); // fonts, Turnstile, analytics: not needed offline
});
for (const trade of TRADE_ORDER) for (const look of Object.keys(LOOKS)) {
  const id = `${trade}/${look}@375`;
  html = generateSite(formFor(trade, look));
  posted = null;
  await page.goto(HOST, { waitUntil: "load" });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 10)); } });
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, txt: document.body.innerText }));
  check(r.sw <= r.cw + 1, `${id}: sideways scroll ${r.sw} > ${r.cw}`);
  check(!BANNED.test(r.txt), `${id}: visible sample text "${(r.txt.match(BANNED) || [])[0]}"`);
  await page.fill("#f-name", "Pat Lee");
  await page.fill("#f-phone", "512 555 0000");
  await page.fill("#f-msg", "Leak over the kitchen.");
  await page.evaluate(() => document.getElementById("ask").requestSubmit());
  await page.waitForFunction(() => /Thanks, we got it/.test(document.getElementById("f-note").textContent), null, { timeout: 4000 }).catch(() => {});
  const note = await page.textContent("#f-note");
  let body = null;
  try { body = posted && JSON.parse(posted.body); } catch { body = null; }
  check(posted && posted.method === "POST" && /application\/json/.test(posted.type || "") && body && body.siteId === "site123" && body.name === "Pat Lee" && body.phone === "512 555 0000" && body.message === "Leak over the kitchen." && "website" in body && "token" in body, `${id}: form post ${posted ? posted.body : "none"}`);
  check(note.includes("Thanks, we got it. We will call you soon."), `${id}: thank-you note "${note}"`);
}
// An error answer shows a message and keeps the visitor's text.
{
  html = generateSite(formFor("roofing", "editorial"));
  await page.unroute("**/*");
  await page.route("**/*", (route) => {
    const u = route.request().url();
    if (u === HOST) return route.fulfill({ status: 200, contentType: "text/html", body: html });
    if (u === `${HOST}api/lead`) return route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Too many messages. Please call us instead." }) });
    return u.startsWith("data:") ? route.continue() : route.abort();
  });
  await page.goto(HOST, { waitUntil: "load" });
  await page.fill("#f-name", "Pat");
  await page.fill("#f-phone", "5125550000");
  await page.evaluate(() => document.getElementById("ask").requestSubmit());
  await page.waitForFunction(() => /Too many/.test(document.getElementById("f-note").textContent), null, { timeout: 4000 }).catch(() => {});
  check((await page.textContent("#f-note")).includes("Too many messages") && (await page.inputValue("#f-name")) === "Pat", "error answer shown, text kept");
  await page.fill("#f-name", "");
  await page.evaluate(() => document.getElementById("ask").requestSubmit());
  check((await page.textContent("#f-note")).includes("Please add your name"), "empty name is caught before sending");
}
await browser.close();

for (const b of bad.slice(0, 25)) console.log("FAIL", b);
console.log(fail ? `FAIL: live mode (${pass} pass, ${fail} fail)` : `PASS: live mode (${pass} checks, ${TRADE_ORDER.length} trades x ${Object.keys(LOOKS).length} looks)`);
process.exit(fail ? 1 : 0);
