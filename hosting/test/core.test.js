// host-core tests (node --test): router by host, publishSite safety, /api/lead (store, email, spam), SEO files, media, notify.
import { describe, it, beforeEach, afterEach, mock } from "node:test";
import { expect } from "./expect.js";
import { mockEnv, mockFetch } from "./mock-env.js";
import { createApp } from "../src/router.js";
import { saveSite, getSite, setStatus, clearHostCache, getSiteByHost } from "../src/db.js";
import { publishSite, pageKey, checkHtml, liveForm } from "../src/render.js";
import { THANKS, RATE_MAX } from "../src/leads.js";
import { sendEmail, sendSms } from "../src/notify.js";
import { robotsTxt } from "../src/seo.js";

const FORM_A = { company: "Acme Roofing", trade: "roofing", city: "Austin, TX", phone: "512-555-1234", look: "editorial" };
const FORM_B = { company: "Best Fence Co", trade: "fencing", city: "Round Rock", phone: "(512) 555-9876", cinematic: true };

let env, app, fetchMock, realFetch;
const ctx = { waitUntil() {}, passThroughOnException() {} };
const get = (url, init) => app.fetch(new Request(url, init), env, ctx);
const postLead = (host, body, headers = {}) => get(`https://${host}/api/lead`, {
  method: "POST",
  headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.7", ...headers },
  body: JSON.stringify(body),
});
const goodLead = (siteId, extra = {}) => ({ siteId, name: "Pat Lee", phone: "512 555 0000", email: "pat@example.com", service: "Roof repair", message: "Leak over the kitchen.", website: "", token: "good-token", page: "/", ...extra });

async function makeSite(form, domain, extra = {}) {
  const id = await saveSite(env, { form, domain, status: "live", owner_email: `owner@${domain}`, ...extra });
  const r = await publishSite(env, id);
  expect(r.problems || []).toEqual([]);
  return id;
}

beforeEach(() => {
  env = mockEnv({ RESEND_API_KEY: "re_test", TURNSTILE_SECRET: "ts_secret" });
  fetchMock = mockFetch();
  realFetch = globalThis.fetch;
  globalThis.fetch = fetchMock;
  clearHostCache();
  app = createApp({
    adminApp: async () => new Response("admin mock"),
    stripeWebhook: async () => new Response("stripe mock"),
    deskApp: async () => new Response("desk mock"),
  });
});
afterEach(() => { globalThis.fetch = realFetch; });

describe("db", () => {
  it("saves, reads and finds a site by host (www and port ignored)", async () => {
    const id = await saveSite(env, { form: FORM_A, domain: "WWW.Acme-Roof.com", status: "draft" });
    const s = await getSite(env, id);
    expect(s.domain).toBe("acme-roof.com");
    expect(s.form.company).toBe("Acme Roofing");
    expect((await getSiteByHost(env, "www.acme-roof.com:443")).id).toBe(id);
    await setStatus(env, id, "live");
    expect((await getSite(env, id)).status).toBe("live");
    await expect(setStatus(env, id, "bogus")).rejects.toThrow();
  });
});

describe("two sites on two hosts", () => {
  it("each host gets only its own page; paused shows not active; unknown host 404", async () => {
    const a = await makeSite(FORM_A, "acme.test");
    const b = await makeSite(FORM_B, "bestfence.test");
    const ra = await get("https://acme.test/");
    const ta = await ra.text();
    expect(ra.status).toBe(200);
    expect(ra.headers.get("content-type")).toContain("text/html");
    expect(ta).toContain("Acme Roofing");
    expect(ta).not.toContain("Best Fence Co");
    const tb = await (await get("https://www.bestfence.test/")).text();
    expect(tb).toContain("Best Fence Co");
    expect(tb).not.toContain("Acme Roofing");

    await setStatus(env, b, "paused");
    const rp = await get("https://bestfence.test/");
    const tp = await rp.text();
    expect(rp.status).toBe(503);
    expect(tp).toContain("This site is not active");
    expect(tp).not.toContain("Best Fence");
    await setStatus(env, b, "off");
    expect((await get("https://bestfence.test/")).status).toBe(503);

    const ru = await get("https://nobody.test/");
    expect(ru.status).toBe(404);
    expect(await ru.text()).not.toContain("Acme");
    expect(a).not.toBe(b);
  });

  it("routes admin, stripe and desk to their modules", async () => {
    await makeSite(FORM_A, "acme.test");
    expect(await (await get("https://acme.test/admin")).text()).toBe("admin mock");
    expect(await (await get("https://acme.test/admin/edit")).text()).toBe("admin mock");
    expect(await (await get("https://acme.test/api/stripe", { method: "POST", body: "{}" })).text()).toBe("stripe mock");
    expect(await (await get("https://desk.agency.test/")).text()).toBe("desk mock");
    expect((await get("https://nobody.test/admin")).status).toBe(404);
  });

  it("serves robots.txt, sitemap.xml, privacy, and 404 for other paths", async () => {
    await makeSite(FORM_A, "acme.test");
    const robots = await (await get("https://acme.test/robots.txt")).text();
    expect(robots).toContain("Sitemap: https://acme.test/sitemap.xml");
    expect(robots).toContain("Disallow: /admin");
    const sm = await (await get("https://acme.test/sitemap.xml")).text();
    expect(sm).toContain("<loc>https://acme.test/</loc>");
    expect(await (await get("https://acme.test/privacy")).text()).toContain("Acme Roofing");
    expect((await get("https://acme.test/wp-login.php")).status).toBe(404);
    expect(robotsTxt({ status: "paused", domain: "x.test" })).toContain("Disallow: /");
  });
});

describe("publishSite", () => {
  it("writes a live page with no sample bits, SEO tags and a real form", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const html = await (await env.BUCKET.get(pageKey(id))).text();
    expect(checkHtml(html)).toEqual([]);
    expect(html).toContain('<link rel="canonical" href="https://acme.test/">');
    expect(html).toContain('property="og:title"');
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    expect(ld["@type"]).toBe("HomeAndConstructionBusiness");
    expect(ld.telephone).toBe("+15125551234");
    expect(ld.aggregateRating).toBeUndefined(); // no Google data yet
    expect(html).toContain('action="/api/lead"');
    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain('href="/privacy"');
  });

  it("shows only reviews the owner chose, Google rating only from Google data", async () => {
    const id = await saveSite(env, { form: { ...FORM_A, rating: 4.9, reviews: 999, hosting: { google: { rating: 4.7, count: 52 } } }, domain: "acme.test", status: "live", place_id: "ChIJ123" });
    await env.DB.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, show) VALUES (?, 'google', 'Dana', 5, 'Fixed our roof fast.', 1, 1), (?, 'manual', 'Sam', 4, 'Hidden one.', 2, 0)").bind(id, id).run();
    expect((await publishSite(env, id)).ok).toBe(true);
    const html = await (await env.BUCKET.get(pageKey(id))).text();
    expect(html).toContain("Fixed our roof fast.");
    expect(html).toContain("Dana, on Google");
    expect(html).not.toContain("Hidden one.");
    expect(html).not.toContain("From 999");
    expect(html).toContain("From 52 Google reviews");
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    expect(ld.aggregateRating).toMatchObject({ ratingValue: 4.7, reviewCount: 52 });
    expect(html).toContain("search.google.com/local/reviews?placeid=ChIJ123");
  });

  it("a bad render keeps the old live file and logs an event", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const before = await (await env.BUCKET.get(pageKey(id))).text();
    const r1 = await publishSite(env, id, { render: () => before.replace("</body>", "<p>Sample review</p></body>") });
    expect(r1.ok).toBe(false);
    expect(r1.problems.join()).toContain("Sample review");
    const r2 = await publishSite(env, id, { render: () => { throw new Error("boom"); } });
    expect(r2.ok).toBe(false);
    const r3 = await publishSite(env, id, { render: () => before + "x".repeat(6 * 1024 * 1024) });
    expect(r3.problems.join()).toContain("too big");
    expect(await (await env.BUCKET.get(pageKey(id))).text()).toBe(before);
    const ev = await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE site_id = ? AND kind = 'publish_blocked'").bind(id).first();
    expect(ev.n).toBe(3);
    expect((await get("https://acme.test/")).status).toBe(200);
  });

  it("refuses a site with no phone (placeholder text) and catches encoded placeholder art labels", async () => {
    const id = await saveSite(env, { form: { company: "No Phone", trade: "roofing", city: "Austin", look: "editorial" }, domain: "nophone.test", status: "live" });
    const r = await publishSite(env, id);
    expect(r.ok).toBe(false);
    expect(r.problems.join()).toContain("no phone number");
    expect(checkHtml('<!doctype html><form id="ask" action="/api/lead"><img src="data:image/svg+xml,Sample%20picture"></form>').join()).toContain("Sample picture");
  });

  it("liveForm never trusts a stored live block", () => {
    const f = liveForm({ id: "s1", domain: "a.test", form: { ...FORM_A, live: { leadUrl: "https://evil.test/" } } }, [], env);
    expect(f.live.leadUrl).toBe("/api/lead");
    expect(f.live.canonical).toBe("https://a.test/");
  });
});

describe("/api/lead", () => {
  it("stores a good lead, emails the owner once (tap-to-call, reply-to visitor) and thanks the visitor", async () => {
    const id = await makeSite(FORM_A, "acme.test", { notify_email: "boss@acme.test" });
    const r = await postLead("acme.test", goodLead(id), { origin: "https://acme.test" });
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j).toEqual({ ok: true, message: THANKS });
    expect(THANKS).toBe("Thanks, we got it. We will call you soon.");
    const row = await env.DB.prepare("SELECT * FROM leads WHERE site_id = ?").bind(id).first();
    expect(row).toMatchObject({ name: "Pat Lee", phone: "512 555 0000", email: "pat@example.com", service: "Roof repair", message: "Leak over the kitchen.", emailed: 1, texted: 0 });
    expect(fetchMock.calls.email).toHaveLength(1);
    const m = fetchMock.calls.email[0];
    expect(m.to).toEqual(["boss@acme.test"]);
    expect(m.reply_to).toBe("pat@example.com");
    expect(m.text).toContain("Pat Lee");
    expect(m.text).toContain("512 555 0000");
    expect(m.text).toContain("Leak over the kitchen.");
    expect(m.html).toContain('href="tel:+15125550000"');
    expect(fetchMock.calls.turnstile[0]).toMatchObject({ secret: "ts_secret", response: "good-token", remoteip: "203.0.113.7" });
  });

  it("texts the owner when notify_sms is set", async () => {
    const id = await makeSite(FORM_A, "acme.test", { notify_sms: "+15125550101" });
    env.TWILIO_SID = "AC1"; env.TWILIO_TOKEN = "tok"; env.TWILIO_FROM = "+15125550100";
    expect((await postLead("acme.test", goodLead(id))).status).toBe(200);
    expect(fetchMock.calls.sms).toHaveLength(1);
    expect(fetchMock.calls.sms[0]).toMatchObject({ To: "+15125550101", From: "+15125550100" });
    expect(fetchMock.calls.sms[0].Body).toContain("Pat Lee");
    expect((await env.DB.prepare("SELECT texted FROM leads").first()).texted).toBe(1);
  });

  it("refuses spam and sends no email: honeypot, bad Turnstile, 6th in 10 minutes", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const hp = await postLead("acme.test", goodLead(id, { website: "http://spam.test" }));
    expect(hp.status).toBe(400);
    const bad = await postLead("acme.test", goodLead(id, { token: "bad-token" }), { "cf-connecting-ip": "198.51.100.1" });
    expect(bad.status).toBe(403);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first()).n).toBe(0);
    expect(fetchMock.calls.email).toHaveLength(0);

    for (let i = 0; i < RATE_MAX; i++) {
      const r = await postLead("acme.test", goodLead(id), { "cf-connecting-ip": "192.0.2.9" });
      expect(r.status).toBe(200);
    }
    const sixth = await postLead("acme.test", goodLead(id), { "cf-connecting-ip": "192.0.2.9" });
    expect(sixth.status).toBe(429);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first()).n).toBe(RATE_MAX);
    expect(fetchMock.calls.email).toHaveLength(RATE_MAX);
    // another visitor is still fine
    expect((await postLead("acme.test", goodLead(id), { "cf-connecting-ip": "192.0.2.10" })).status).toBe(200);
  });

  it("checks lengths, required fields, site match, origin, method and site status", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const other = await makeSite(FORM_B, "bestfence.test");
    expect((await postLead("acme.test", goodLead(id, { message: "x".repeat(2001) }))).status).toBe(400);
    expect((await postLead("acme.test", goodLead(id, { name: "" }))).status).toBe(400);
    expect((await postLead("acme.test", goodLead(id, { phone: "", email: "" }))).status).toBe(400);
    expect((await postLead("acme.test", goodLead(id, { email: "not-an-email" }))).status).toBe(400);
    expect((await postLead("acme.test", goodLead(other))).status).toBe(400);
    expect((await postLead("acme.test", goodLead(id), { origin: "https://evil.test" })).status).toBe(403);
    expect((await get("https://acme.test/api/lead")).status).toBe(405);
    const big = await get("https://acme.test/api/lead", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(goodLead(id, { message: "y".repeat(20000) })) });
    expect(big.status).toBe(413);
    await setStatus(env, id, "paused");
    expect((await postLead("acme.test", goodLead(id))).status).toBe(404);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first()).n).toBe(0);
  });

  it("works as a plain form post without JavaScript", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const body = new URLSearchParams({ name: "Kim", phone: "5125550199", job: "Roof repair", message: "Hi", website: "", "cf-turnstile-response": "good-token" });
    const r = await get("https://acme.test/api/lead", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    expect(r.status).toBe(200);
    expect(await r.text()).toContain(THANKS);
    expect((await env.DB.prepare("SELECT service FROM leads").first()).service).toBe("Roof repair");
  });

  it("does not open the form without a Turnstile secret (unless DEV=1)", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    delete env.TURNSTILE_SECRET;
    expect((await postLead("acme.test", goodLead(id))).status).toBe(403);
    env.DEV = "1";
    expect((await postLead("acme.test", goodLead(id))).status).toBe(200);
  });

  it("escapes visitor text in the owner email", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    await postLead("acme.test", goodLead(id, { name: "<b>x</b>", message: "<script>alert(1)</script>" }));
    expect(fetchMock.calls.email[0].html).not.toContain("<script>");
    expect(fetchMock.calls.email[0].html).toContain("&lt;script&gt;");
  });
});

describe("media", () => {
  it("serves only this site's jpeg/png/webp files", async () => {
    const id = await makeSite(FORM_A, "acme.test");
    const other = await makeSite(FORM_B, "bestfence.test");
    await env.BUCKET.put(`media/${id}/roof.jpg`, new Uint8Array([255, 216, 255]), { httpMetadata: { contentType: "image/jpeg" } });
    await env.BUCKET.put(`media/${other}/secret.jpg`, new Uint8Array([1]), { httpMetadata: { contentType: "image/jpeg" } });
    await env.BUCKET.put(`media/${id}/x.svg`, "<svg/>", { httpMetadata: { contentType: "image/svg+xml" } });
    const r = await get("https://acme.test/media/roof.jpg");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/jpeg");
    expect((await get("https://acme.test/media/secret.jpg")).status).toBe(404);
    expect((await get(`https://acme.test/media/..%2F${other}%2Fsecret.jpg`)).status).toBe(404);
    expect((await get("https://acme.test/media/x.svg")).status).toBe(404);
  });
});

describe("notify", () => {
  it("logs only and sends nothing without keys", async () => {
    const quiet = mock.method(console, "log", () => {});
    const e = await sendEmail({}, { to: "a@b.test", subject: "x", text: "y" });
    const s = await sendSms({}, { to: "+15125550000", text: "y" });
    expect(e).toMatchObject({ ok: false, skipped: true });
    expect(s).toMatchObject({ ok: false, skipped: true });
    expect(fetchMock.calls.email).toHaveLength(0);
    quiet.mock.restore();
  });
});

describe("ops publish and cron", () => {
  it("ops publish needs the key; cron runs every job and logs failures", async () => {
    const id = await saveSite(env, { form: FORM_A, domain: "acme.test", status: "live" });
    expect((await get("https://x.test/api/ops/publish", { method: "POST", body: JSON.stringify({ siteId: id }) })).status).toBe(404);
    env.OPS_KEY = "k".repeat(32);
    expect((await get("https://x.test/api/ops/publish", { method: "POST", headers: { authorization: "Bearer nope" }, body: JSON.stringify({ siteId: id }) })).status).toBe(403);
    const ok = await get("https://x.test/api/ops/publish", { method: "POST", headers: { authorization: `Bearer ${env.OPS_KEY}` }, body: JSON.stringify({ siteId: id }) });
    expect(ok.status).toBe(200);
    expect((await get("https://acme.test/")).status).toBe(200);

    const ran = [];
    const app2 = createApp({ refreshReviews: async () => { ran.push("reviews"); throw new Error("places down"); }, billingSweep: async () => { ran.push("billing"); } });
    await env.DB.prepare("INSERT INTO hits (key, at) VALUES ('old', 1)").run();
    await app2.scheduled({}, env, ctx);
    expect(ran).toEqual(["reviews", "billing"]);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM hits").first()).n).toBe(0);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE kind = 'cron_failed'").first()).n).toBe(1);
  });
});
