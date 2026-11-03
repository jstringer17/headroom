// Owner preview (demo.js): create, view count, expiry, revoke, noindex, lead goes to the agency, bad key 401, CORS, limits, desk.
import { describe, it, beforeEach, afterEach } from "node:test";
import { expect } from "./expect.js";
import { mockEnv, mockFetch } from "./mock-env.js";
import { createApp } from "../src/router.js";
import { clearHostCache } from "../src/db.js";
import { demoApp, sameSecret, DEMO_RATE_MAX, DAY, listDemos, extendDemo, revokeDemo, demoFormForNewSite, getDemo } from "../src/demo.js";

const KEY = "agency-key-0123456789";
const MAKER = "https://maker.agency.test";
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const FORM = {
  company: "Ridge <Line> Roofing", trade: "fencing", city: "Tulsa, OK", phone: "918-555-0142", look: "cinematic", cinematic: true,
  rating: "4.9", reviews: "120", cred: { founded: "2008" },
  reviewList: [{ name: "Dana", town: "Tulsa", text: "Great work.", stars: 5 }],
  logo: PNG,
  cine: { look: "cinematic", variant: "", images: { done: PNG }, libSlots: ["before", "after", "not-a-slot"] },
};

let env, app, fetchMock, realFetch;
const ctx = { waitUntil() {}, passThroughOnException() {} };
const call = (url, init) => app.fetch(new Request(url, init), env, ctx);
const create = (form = FORM, { key = KEY, origin = MAKER, ip = "203.0.113.9" } = {}) => call("https://demo.agency.test/api/demo", {
  method: "POST",
  headers: { "content-type": "application/json", "x-agency-key": key, "cf-connecting-ip": ip, ...(origin ? { origin } : {}) },
  body: JSON.stringify({ form }),
});
const tokenOf = (link) => link.split("/d/")[1];

beforeEach(() => {
  env = mockEnv({ AGENCY_KEY: KEY, MAKER_ORIGINS: `${MAKER}, null`, AGENCY_PHONE: "(512) 555-0199", AGENCY_NAME: "Headroom Web", AGENCY_EMAIL: "sales@agency.test", RESEND_API_KEY: "re_test", TURNSTILE_SECRET: "ts" });
  fetchMock = mockFetch();
  realFetch = globalThis.fetch;
  globalThis.fetch = fetchMock;
  clearHostCache();
  app = createApp({ adminApp: async () => new Response("admin"), stripeWebhook: async () => new Response("stripe"), deskApp: async () => new Response("desk") });
});
afterEach(() => { globalThis.fetch = realFetch; });

describe("owner preview: create", () => {
  it("makes a link with a 128-bit token, 14-day expiry, QR, CORS for the maker", async () => {
    const r = await create();
    expect(r.status).toBe(200);
    expect(r.headers.get("access-control-allow-origin")).toBe(MAKER);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(/^https:\/\/demo\.agency\.test\/d\/[0-9a-f]{32}$/.test(j.link)).toBe(true);
    expect(Math.round((Date.parse(j.expiresAt) - Date.now()) / DAY)).toBe(14);
    expect(j.qrSvg.startsWith("<svg")).toBe(true);
    const row = await getDemo(env, tokenOf(j.link));
    expect(row.company).toBe("Ridge <Line> Roofing");
    expect(row.views).toBe(0);
    expect(row.form_json.includes("data:image")).toBe(false); // uploaded pictures moved to R2
    expect(env.R2._store.has(`demo/${row.token}/index.html`)).toBe(true);
  });

  it("bad or missing agency key -> 401, nothing stored", async () => {
    expect((await create(FORM, { key: "wrong" })).status).toBe(401);
    expect((await create(FORM, { key: "" })).status).toBe(401);
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM demo_links").first();
    expect(n.n).toBe(0);
    expect(sameSecret("abc", "abc")).toBe(true);
    expect(sameSecret("abd", "abc")).toBe(false);
    expect(sameSecret("", "")).toBe(false);
  });

  it("no AGENCY_KEY set -> always 401 (fails closed)", async () => {
    delete env.AGENCY_KEY;
    expect((await create()).status).toBe(401);
  });

  it("CORS: other origins refused; preflight answered only for the maker", async () => {
    expect((await create(FORM, { origin: "https://evil.test" })).status).toBe(403);
    const pre = await call("https://demo.agency.test/api/demo", { method: "OPTIONS", headers: { origin: MAKER, "access-control-request-headers": "x-agency-key" } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-headers").includes("x-agency-key")).toBe(true);
    const bad = await call("https://demo.agency.test/api/demo", { method: "OPTIONS", headers: { origin: "https://evil.test" } });
    expect(bad.status).toBe(403);
  });

  it("rate limit and body size limit", async () => {
    for (let i = 0; i < DEMO_RATE_MAX; i++) await create(FORM, { key: "wrong" });
    expect((await create()).status).toBe(429);
    const big = await call("https://demo.agency.test/api/demo", { method: "POST", headers: { "x-agency-key": KEY, "content-length": String(13 * 1024 * 1024), "cf-connecting-ip": "198.51.100.1" }, body: "{}" });
    expect(big.status).toBe(413);
  });

  it("needs company and phone", async () => {
    expect((await create({ ...FORM, company: "" })).status).toBe(400);
    expect((await create({ ...FORM, phone: "" })).status).toBe(400);
  });

  it("not on other hosts: /api/demo on a customer domain is not the demo app", async () => {
    const r = await call("https://unknown.example/api/demo", { method: "POST", headers: { "x-agency-key": KEY }, body: "{}" });
    expect(r.status).toBe(404);
  });
});

describe("owner preview: the sample page", () => {
  async function made() { const j = await (await create()).json(); return j.link; }

  it("renders like a live site with banner, noindex meta + header, no schema.org rating, escaped company", async () => {
    const link = await made();
    const r = await call(link);
    expect(r.status).toBe(200);
    expect(r.headers.get("x-robots-tag").includes("noindex")).toBe(true);
    const html = await r.text();
    expect(html.includes('<meta name="robots" content="noindex, nofollow">')).toBe(true);
    expect(html.includes("Sample website made for Ridge &lt;Line&gt; Roofing by Headroom Web.")).toBe(true);
    expect(html.includes('href="tel:+15125550199"')).toBe(true);
    expect(html.includes("Ridge <Line>")).toBe(false);
    expect(html.includes("aggregateRating")).toBe(false);
    expect(html.includes("AggregateRating")).toBe(false);
    expect(/<form id="ask"[^>]*action="\/d\/[0-9a-f]{32}\/lead"/.test(html)).toBe(true);
    expect(html.includes("https://demo.agency.test/library/fencing/before.webp")).toBe(true); // library allowed (demo)
    expect(html.includes("not-a-slot")).toBe(false);
    expect(/https:\/\/demo\.agency\.test\/d\/[0-9a-f]{32}\/m\/p\d\.png/.test(html)).toBe(true); // uploaded picture
    expect(html.includes("data:image/png")).toBe(false);
  });

  it("counts views (GET only) and records last view", async () => {
    const link = await made();
    await call(link); await call(link); await call(link, { method: "HEAD" });
    const row = await getDemo(env, tokenOf(link));
    expect(row.views).toBe(2);
    expect(!!row.last_view).toBe(true);
  });

  it("uploaded picture is served; robots.txt disallows all", async () => {
    const link = await made();
    const html = await (await call(link)).text();
    const pic = html.match(/https:\/\/demo\.agency\.test\/d\/[0-9a-f]{32}\/m\/p\d\.png/)[0];
    const r = await call(pic);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("image/png");
    expect(await (await call("https://demo.agency.test/robots.txt")).text()).toBe("User-agent: *\nDisallow: /\n");
  });

  it("expired -> friendly page; extend brings it back", async () => {
    const link = await made();
    const t = tokenOf(link);
    const later = Date.now() + 15 * DAY;
    const r = await demoApp(new Request(link), env, ctx, { now: later });
    expect(r.status).toBe(410);
    const exp = await extendDemo(env, t, later);
    expect(Math.round((Date.parse(exp) - later) / DAY)).toBe(7);
    expect((await demoApp(new Request(link), env, ctx, { now: later })).status).toBe(200);
  });

  it("expired page text", async () => {
    const link = await made();
    const html = await (await demoApp(new Request(link), env, ctx, { now: Date.now() + 20 * DAY })).text();
    expect(html.includes("This sample has expired")).toBe(true);
    expect(html.includes("Ask for a new one")).toBe(true);
    expect(html.includes("noindex")).toBe(true);
  });

  it("revoke stops the link", async () => {
    const link = await made();
    expect(await revokeDemo(env, tokenOf(link))).toBe(true);
    expect((await call(link)).status).toBe(410);
    await extendDemo(env, tokenOf(link));
    expect((await call(link)).status).toBe(410); // extend does not undo a revoke
  });

  it("link-preview bots do not count as views", async () => {
    const link = await made();
    await call(link, { headers: { "user-agent": "Slackbot-LinkExpanding 1.0" } });
    expect((await getDemo(env, tokenOf(link))).views).toBe(0);
  });

  it("no agency email -> refuses to make links (leads would go nowhere)", async () => {
    delete env.AGENCY_EMAIL;
    expect((await create()).status).toBe(503);
  });

  it("unknown or malformed token -> 404", async () => {
    expect((await call("https://demo.agency.test/d/0123456789abcdef0123456789abcdef")).status).toBe(404);
    expect((await call("https://demo.agency.test/d/../../etc")).status).toBe(404);
  });
});

describe("owner preview: leads", () => {
  it("the form sends the lead to the AGENCY tagged demo, never to the owner", async () => {
    const link = (await (await create()).json()).link;
    const t = tokenOf(link);
    const r = await call(`${link}/lead`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://demo.agency.test", "cf-connecting-ip": "192.0.2.4" },
      body: JSON.stringify({ siteId: t, name: "Pat", phone: "512 555 0000", service: "Repair", message: "Hi", website: "", token: "good-token" }),
    });
    expect(r.status).toBe(200);
    expect(fetchMock.calls.email.length).toBe(1);
    const mail = fetchMock.calls.email[0];
    expect(mail.to).toEqual(["sales@agency.test"]);
    expect(mail.subject.startsWith("[demo]")).toBe(true);
    const ev = await env.DB.prepare("SELECT * FROM events WHERE kind = 'demo_lead'").first();
    expect(JSON.parse(ev.data).tag).toBe("demo");
    const leads = await env.DB.prepare("SELECT COUNT(*) AS n FROM leads").first();
    expect(leads.n).toBe(0);
  });

  it("a lead from another origin is refused", async () => {
    const link = (await (await create()).json()).link;
    const r = await call(`${link}/lead`, { method: "POST", headers: { "content-type": "application/json", origin: "https://evil.test" }, body: "{}" });
    expect(r.status).toBe(403);
  });
});

describe("owner preview: desk helpers", () => {
  it("lists links; form for a real site has pictures inline and no library slots", async () => {
    const link = (await (await create()).json()).link;
    const list = await listDemos(env);
    expect(list.length).toBe(1);
    expect(list[0].link).toBe(link);
    expect(list[0].company).toBe("Ridge <Line> Roofing");
    const f = await demoFormForNewSite(env, tokenOf(link));
    expect(f.form.logo.startsWith("data:image/png;base64,")).toBe(true);
    expect(f.form.cine.images.done.startsWith("data:image/png;base64,")).toBe(true);
    expect(f.form.cine.libSlots).toBe(undefined);
  });
});
