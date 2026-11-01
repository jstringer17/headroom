// Local end to end for the hosted backend (org/plan.md "Done-criteria Hosted backend" item 2). No account, key or network.
//   node hosting/scripts/e2e-local.mjs
// Uses the real modules (router, render, leads, billing, desk, admin, reviews) on a local D1 (SQLite) + R2 (Map) with captured email.
// A step whose module has not landed yet prints SKIPPED (never counted as passed). Exit 1 on any FAIL.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mockEnv, mockFetch } from "../test/mock-env.js";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src");
const has = (p) => existsSync(join(src, p));
const load = async (p) => (has(p) ? import(pathToFileURL(join(src, p)).href) : null);

const results = [];
const step = async (name, fn, skipWhy) => {
  if (skipWhy) { results.push(["SKIPPED", name, skipWhy]); return; }
  try {
    const note = await fn();
    results.push(["PASS", name, note || ""]);
  } catch (e) {
    results.push(["FAIL", name, String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e)]);
  }
};
const must = (ok, msg) => { if (!ok) throw new Error(msg); };

const { createApp } = await import(pathToFileURL(join(src, "router.js")).href);
const { saveSite, getSite, clearHostCache } = await import(pathToFileURL(join(src, "db.js")).href);
const { publishSite } = await import(pathToFileURL(join(src, "render.js")).href);
const billing = await load("billing/index.js");
const desk = await load("desk/index.js");
const admin = await load("admin/index.js");
const reviews = await load("reviews/index.js");
const allLanded = billing && desk && admin && reviews;
// With every module in place, test the real Worker entry (index.js); otherwise the router with what exists.
const app = allLanded ? (await import(pathToFileURL(join(src, "index.js")).href)).default
  : createApp({ ...(billing || {}), ...(desk || {}), ...(admin || {}), ...(reviews || {}) });

const SECRET = "whsec_e2e";
const env = mockEnv({ RESEND_API_KEY: "re_test", TURNSTILE_SECRET: "ts_secret", STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_SECRET_KEY: "sk_test_e2e", STRIPE_PRICE_MONTHLY: "price_m", MONTHLY_CENTS: "9900", GRACE_DAYS: "14" });
const fx = mockFetch();
globalThis.fetch = fx;
const ctx = { waitUntil() {}, passThroughOnException() {} };
const req = (url, init) => app.fetch(new Request(url, init), env, ctx);
const DOMAIN = "acme-e2e.test";
let siteId;

async function stripeEvent(event) {
  const { hmacHex } = await import(pathToFileURL(join(src, "billing", "stripe.js")).href);
  const body = JSON.stringify(event);
  const t = Math.floor(Date.now() / 1000);
  return req(`https://desk.${env.AGENCY_DOMAIN}/api/stripe`, { method: "POST", body, headers: { "stripe-signature": `t=${t},v1=${await hmacHex(SECRET, `${t}.${body}`)}` } });
}

await step("create site (draft, not visible yet)", async () => {
  siteId = await saveSite(env, { form: { company: "Acme E2E Roofing", trade: "roofing", city: "Austin, TX", phone: "512-555-1234", look: "editorial" }, domain: DOMAIN, status: "draft", owner_email: "owner@acme-e2e.test", place_id: "ChIJe2e" });
  const r = await req(`https://${DOMAIN}/`);
  must(r.status === 503, `draft should not show, got ${r.status}`);
  return siteId;
});

await step("Stripe test checkout paid (webhook) -> site live and published", async () => {
  const r = await stripeEvent({ id: "evt_e2e_paid", type: "checkout.session.completed", data: { object: { id: "cs_e2e", object: "checkout.session", client_reference_id: siteId, customer: "cus_e2e", subscription: "sub_e2e", metadata: { siteId } } } });
  must(r.status === 200, `webhook status ${r.status}: ${await r.text()}`);
  clearHostCache();
  const s = await getSite(env, siteId);
  must(s.status === "live" && s.stripe_customer === "cus_e2e", `site ${s.status} ${s.stripe_customer}`);
}, billing ? null : "billing-desk not landed");

if (!billing) { // keep going without billing so the rest is still checked
  await saveSite(env, { id: siteId, status: "live" });
}

await step("site live at its domain (no sample bits)", async () => {
  if (!billing) must((await publishSite(env, siteId)).ok, "publish failed");
  const r = await req(`https://www.${DOMAIN}/`);
  const t = await r.text();
  must(r.status === 200 && t.includes("Acme E2E Roofing"), `status ${r.status}`);
  must(!/Sample (site|review|picture|project)|This is a sample site/.test(t), "sample text on live page");
  must(t.includes('action="/api/lead"') && t.includes("application/ld+json"), "form / JSON-LD missing");
});

await step("visitor sends the form -> lead row + one email to the owner", async () => {
  const before = fx.calls.email.length;
  const r = await req(`https://${DOMAIN}/api/lead`, { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "192.0.2.50", origin: `https://${DOMAIN}` }, body: JSON.stringify({ siteId, name: "Vic Visitor", phone: "512 555 7777", email: "vic@example.com", service: "Roof repair", message: "Shingles blew off.", website: "", token: "good-token" }) });
  must(r.status === 200, `lead status ${r.status}`);
  const row = await env.DB.prepare("SELECT * FROM leads WHERE site_id = ?").bind(siteId).first();
  must(row && row.name === "Vic Visitor" && row.emailed === 1, "lead row");
  const sent = fx.calls.email.slice(before).filter((m) => m.to.includes("owner@acme-e2e.test"));
  must(sent.length === 1 && sent[0].text.includes("Shingles blew off."), `emails to owner: ${sent.length}`);
});

await step("owner logs in by emailed link, changes the phone at 375px, publishes -> new phone live", async () => {
  throw new Error("wire this step to owner-admin's login + save API once it lands");
}, admin ? null : "owner-admin not landed");

await step("Google reviews (fixture) shown on the live page with Google credit", async () => {
  throw new Error("wire this step to refreshReviews with the Places fixture once it lands");
}, reviews ? null : "owner-admin (reviews) not landed");

await step("host-core part of reviews: a shown Google review renders with credit, hidden one does not", async () => {
  await env.DB.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, fetched_at, show) VALUES (?, 'google', 'Gail', 5, 'Roof done in a day.', ?, ?, 1), (?, 'manual', 'Hank', 3, 'Hidden review.', ?, ?, 0)")
    .bind(siteId, new Date().toISOString(), new Date().toISOString(), siteId, new Date().toISOString(), new Date().toISOString()).run();
  must((await publishSite(env, siteId)).ok, "publish failed");
  const t = await (await req(`https://${DOMAIN}/`)).text();
  must(t.includes("Roof done in a day.") && t.includes("Gail, on Google") && !t.includes("Hidden review."), "review render");
});

await step("final failed payment (subscription ends) -> visitor sees 'not active'", async () => {
  const r = await stripeEvent({ id: "evt_e2e_deleted", type: "customer.subscription.deleted", data: { object: { id: "sub_e2e", object: "subscription", customer: "cus_e2e", status: "canceled", metadata: { siteId } } } });
  must(r.status === 200, `webhook status ${r.status}`);
  clearHostCache();
  const p = await req(`https://${DOMAIN}/`);
  const t = await p.text();
  must(p.status === 503 && /not active/i.test(t) && !t.includes("Acme E2E"), `status ${p.status}`);
}, billing ? null : "billing-desk not landed");

await step("CEO desk lists the site with the right status", async () => {
  const keys = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = { ...(await crypto.subtle.exportKey("jwk", keys.publicKey)), kid: "k1" };
  Object.assign(env, { CF_ACCESS_TEAM: "team", CF_ACCESS_AUD: "AUD1", DESK_EMAILS: "ceo@agency.test", __deps: { ...(env.__deps || {}), fetchCerts: async () => [jwk] } });
  const b64u = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
  const h = b64u({ alg: "RS256", kid: "k1" }), p = b64u({ email: "ceo@agency.test", aud: ["AUD1"], iss: "https://team.cloudflareaccess.com", exp: Math.floor(Date.now() / 1000) + 600 });
  const sig = Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keys.privateKey, new TextEncoder().encode(`${h}.${p}`))).toString("base64url");
  const jwt = { "cf-access-jwt-assertion": `${h}.${p}.${sig}` };
  must((await req(`https://desk.${env.AGENCY_DOMAIN}/`, { headers: jwt })).status === 200, "desk page");
  const r = await req(`https://desk.${env.AGENCY_DOMAIN}/api/customers`, { headers: jwt });
  const data = await r.json();
  const row = JSON.stringify(data).includes(siteId) && [].concat(data.customers || data.sites || data).find((c) => c && (c.id === siteId || c.siteId === siteId));
  must(r.status === 200 && row && row.status === "off", `desk row: ${JSON.stringify(row || data).slice(0, 300)}`);
  const r2 = await req(`https://desk.${env.AGENCY_DOMAIN}/`);
  must(r2.status === 401 || r2.status === 403, `desk without Access should be refused, got ${r2.status}`);
}, desk ? null : "billing-desk (desk) not landed");

for (const [s, n, note] of results) console.log(`${s.padEnd(7)} ${n}${note ? `  (${note})` : ""}`);
const fails = results.filter((r) => r[0] === "FAIL").length, skips = results.filter((r) => r[0] === "SKIPPED").length;
console.log(`\n${fails ? "FAIL" : skips ? "INCOMPLETE" : "PASS"}: ${results.length - fails - skips} pass, ${fails} fail, ${skips} skipped${allLanded ? " (real index.js)" : " (router with landed modules; index.js needs all four)"}`);
process.exit(fails ? 1 : 0);
