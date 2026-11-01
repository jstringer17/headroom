// Owner admin tests. Run: node --test hosting/test/   (host-core's db/render/notify are mocked
// with the contract's names in hosting/src/admin/dev/mock-env.js until they land).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { adminApp, MAX_UPLOAD } from "../src/admin/index.js";
import { useDeps } from "../src/admin/deps.js";
import { sha256Hex, signSession } from "../src/admin/session.js";
import { applyEdits } from "../src/admin/form.js";
import { qrMatrix } from "../src/admin/qr.js";
import { makeEnv, addSite } from "../src/admin/dev/mock-env.js";

let env;
const FORM_A = { company: "Summit Roofing", trade: "roofing", city: "Fresno", phone: "559-555-0100", cinematic: true, look: "cinematic", services: ["Roof repair", "Gutters"] };
const FORM_B = { company: "Blue Fence Co", trade: "fencing", city: "Clovis", phone: "559-555-0200", cinematic: true, look: "cinematic" };

beforeEach(async () => {
  const m = makeEnv();
  env = m.env;
  useDeps(m.deps);
  await addSite(env, { id: "site-a", slug: "summit", domain: "summitroofing.test", owner_email: "owner@summit.test", form: FORM_A });
  await addSite(env, { id: "site-b", slug: "bluefence", domain: "bluefence.test", owner_email: "owner@bluefence.test", form: FORM_B });
});

function req(host, path, { method = "GET", body, cookie, headers = {}, form } = {}) {
  const h = { origin: `https://${host}`, ...headers };
  if (cookie) h.cookie = cookie;
  if (path.startsWith("/admin/api/")) h["x-admin"] = h["x-admin"] ?? "1";
  let b = body;
  if (form) { b = new URLSearchParams(form).toString(); h["content-type"] = "application/x-www-form-urlencoded"; }
  else if (body && typeof body === "object" && !(body instanceof Uint8Array)) { b = JSON.stringify(body); h["content-type"] = "application/json"; }
  if (method === "GET") delete h.origin;
  return new Request(`https://${host}${path}`, { method, headers: h, body: b });
}
const call = (host, path, opts) => adminApp(req(host, path, opts), env, {});
const tokenFrom = (msg) => /[?&]t=([A-Za-z0-9_-]+)/.exec(msg.text)[1];

async function login(host, email) {
  await call(host, "/admin/login", { method: "POST", form: { email } });
  const t = tokenFrom(env.outbox.at(-1));
  const r = await call(host, "/admin/login/confirm", { method: "POST", form: { t } });
  assert.equal(r.status, 303);
  return r.headers.get("set-cookie").split(";")[0];
}
const sql = (q, ...a) => env.DB.sql.prepare(q).all(...a);
const publishedHtml = async (id) => { const o = await env.R2.get(`sites/${id}/index.html`); return o ? o.text() : ""; };
const JPEG = () => { const b = new Uint8Array(2048); b.set([0xff, 0xd8, 0xff, 0xe0]); return b; };

// ---------- login ----------
test("login: link is emailed only to the site's owner email, stored hashed, cookie is HttpOnly Secure Lax 30 days", async () => {
  const wrong = await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: "someone@else.test" } });
  assert.equal(wrong.status, 200);
  assert.equal(env.outbox.length, 0, "no email for an unknown address");
  const sameWords = await wrong.text();
  const right = await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: " Owner@Summit.test " } });
  assert.equal(await right.text(), sameWords, "same reply either way (no hint which email is on file)");
  assert.equal(env.outbox.length, 1);
  assert.equal(env.outbox[0].to, "owner@summit.test");
  const t = tokenFrom(env.outbox[0]);
  assert.match(env.outbox[0].text, /^.*https:\/\/summitroofing\.test\/admin\/login\?t=/m);
  const rows = sql("SELECT * FROM logins");
  assert.equal(rows.length, 1);
  assert.notEqual(rows[0].token_hash, t);
  assert.equal(rows[0].token_hash, await sha256Hex(t));
  const mins = (Date.parse(rows[0].expires_at) - Date.now()) / 60e3;
  assert.ok(mins > 14 && mins <= 15, `expires in 15 min (${mins})`);
  // GET on the link only shows a button (mail scanners do not use it up).
  const page = await call("summitroofing.test", `/admin/login?t=${t}`);
  assert.match(await page.text(), /name="t" value="/);
  assert.equal(sql("SELECT used FROM logins")[0].used, 0);
  const r = await call("summitroofing.test", "/admin/login/confirm", { method: "POST", form: { t } });
  assert.equal(r.status, 303);
  const c = r.headers.get("set-cookie");
  assert.match(c, /^__Host-admin=[^;]+; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000$/);
});

test("login: a used link is refused", async () => {
  await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: "owner@summit.test" } });
  const t = tokenFrom(env.outbox[0]);
  assert.equal((await call("summitroofing.test", "/admin/login/confirm", { method: "POST", form: { t } })).status, 303);
  const again = await call("summitroofing.test", "/admin/login/confirm", { method: "POST", form: { t } });
  assert.equal(again.status, 400);
  assert.equal(again.headers.get("set-cookie"), null);
  assert.match(await again.text(), /does not work any more/);
});

test("login: an expired link is refused", async () => {
  await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: "owner@summit.test" } });
  const t = tokenFrom(env.outbox[0]);
  env.DB.sql.prepare("UPDATE logins SET expires_at = ?").run(new Date(Date.now() - 1000).toISOString());
  const r = await call("summitroofing.test", "/admin/login/confirm", { method: "POST", form: { t } });
  assert.equal(r.status, 400);
  assert.equal(r.headers.get("set-cookie"), null);
});

test("login: site A's link does not log in on site B; made-up token refused", async () => {
  await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: "owner@summit.test" } });
  const t = tokenFrom(env.outbox[0]);
  assert.equal((await call("bluefence.test", "/admin/login/confirm", { method: "POST", form: { t } })).status, 400);
  assert.equal((await call("summitroofing.test", "/admin/login/confirm", { method: "POST", form: { t: "x".repeat(43) } })).status, 400);
});

test("login: at most 5 links an hour per site", async () => {
  for (let i = 0; i < 7; i++) await call("summitroofing.test", "/admin/login", { method: "POST", form: { email: "owner@summit.test" } });
  assert.equal(env.outbox.length, 5);
  assert.equal(sql("SELECT COUNT(*) AS n FROM logins")[0].n, 5);
});

// ---------- owner A vs site B: every route ----------
test("owner of site A cannot read, preview, upload to, edit or publish site B (each route)", async () => {
  const cookieA = await login("summitroofing.test", "owner@summit.test");
  // A's own session works on A.
  assert.equal((await call("summitroofing.test", "/admin/api/draft", { cookie: cookieA })).status, 200);
  const B = "bluefence.test";
  const routes = [
    ["GET", "/admin/api/draft"],
    ["PUT", "/admin/api/draft", { phone: "000" }],
    ["POST", "/admin/api/upload?slot=stakes", JPEG()],
    ["POST", "/admin/api/publish", {}],
    ["POST", "/admin/api/undo", {}],
    ["POST", "/admin/api/reviews", { author: "X", text: "Y", stars: 5, real: true }],
    ["POST", "/admin/api/reviews/1", { show: false }],
    ["DELETE", "/admin/api/reviews/1"],
  ];
  for (const [method, path, body] of routes) {
    const headers = body instanceof Uint8Array ? { "content-type": "image/jpeg" } : {};
    const r = await call(B, path, { method, body, cookie: cookieA, headers });
    assert.equal(r.status, 401, `${method} ${path} must be refused`);
  }
  for (const path of ["/admin/preview", "/admin/ask", "/admin/google", "/admin/google?q=x"]) {
    const r = await call(B, path, { cookie: cookieA });
    assert.equal(r.status, 303, `GET ${path} must send to login`);
    assert.equal(r.headers.get("location"), "/admin");
  }
  const editor = await call(B, "/admin", { cookie: cookieA });
  const text = await editor.text();
  assert.match(text, /Send me a link/, "B shows the login page");
  assert.doesNotMatch(text, /559-555-0200/, "no B data on it");
  const linkB = await call(B, "/admin/google", { method: "POST", form: { place_id: "ChIJtestPlace0001abcdEFGH" }, cookie: cookieA });
  assert.equal(linkB.status, 303);
  // Nothing of B changed.
  const b = sql("SELECT form_json, place_id FROM sites WHERE id = 'site-b'")[0];
  assert.deepEqual(JSON.parse(b.form_json), FORM_B);
  assert.equal(b.place_id, null);
  assert.equal(env.published.length, 0);
  assert.equal([...env.R2.map.keys()].filter((k) => k.includes("site-b")).length, 0);
  assert.equal(sql("SELECT COUNT(*) AS n FROM reviews")[0].n, 0);
});

test("a forged, tampered or old-owner session is refused", async () => {
  const forged = await signSession("not-the-key", "site-b", "owner@bluefence.test");
  assert.equal((await call("bluefence.test", "/admin/api/draft", { cookie: `__Host-admin=${forged}` })).status, 401);
  const cookieA = await login("summitroofing.test", "owner@summit.test");
  const [body, sig] = cookieA.split("=")[1].split(".");
  const swapped = Buffer.from(JSON.stringify({ s: "site-b", e: "owner@summit.test", x: Date.now() + 1e9 })).toString("base64url");
  assert.equal((await call("bluefence.test", "/admin/api/draft", { cookie: `__Host-admin=${swapped}.${sig}` })).status, 401);
  assert.ok(body);
  env.DB.sql.prepare("UPDATE sites SET owner_email = 'new@summit.test' WHERE id = 'site-a'").run();
  assert.equal((await call("summitroofing.test", "/admin/api/draft", { cookie: cookieA })).status, 401, "changing the owner email ends old sessions");
});

test("writes from another site's page, or API calls without the admin header, are refused", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  const evil = await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie, headers: { origin: "https://evil.test" } });
  assert.equal(evil.status, 403);
  const noHeader = await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie, headers: { "x-admin": "0" } });
  assert.equal(noHeader.status, 403);
  assert.equal(env.published.length, 0);
});

// ---------- edit, preview, publish ----------
test("phone change + publish: the published page has the new phone and tel: link; HTML typed in a text field shows as text", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  const r = await call("summitroofing.test", "/admin/api/draft", { method: "PUT", cookie, body: { phone: "(559) 555-0199", company: 'Summit <script>alert(1)</script> & "Sons"', city: "<img src=x onerror=alert(1)>" } });
  assert.equal(r.status, 200);
  // Draft only: the live page is not touched yet.
  assert.equal(env.published.length, 0);
  const pv = await call("summitroofing.test", "/admin/preview", { cookie });
  const pvHtml = await pv.text();
  assert.match(pvHtml, /\(559\) 555-0199/);
  assert.match(pvHtml, /Visitors do not see this until you tap Publish/);
  const pub = await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie });
  assert.equal(pub.status, 200);
  assert.deepEqual(env.published, ["site-a"]);
  const live = await publishedHtml("site-a");
  assert.match(live, /\(559\) 555-0199/);
  assert.match(live, /href="tel:\+15595550199"/);
  assert.doesNotMatch(live, /555-0100/);
  assert.doesNotMatch(live, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(live, /<img src=x onerror/);
  assert.match(live, /Summit &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;Sons&quot;/);
  assert.match(live, /&lt;img src=x onerror=alert\(1\)&gt;/);
  // The editor shows the typed HTML as text too.
  const editor = await (await call("summitroofing.test", "/admin", { cookie })).text();
  assert.doesNotMatch(editor, /<script>alert\(1\)/);
  assert.match(editor, /value="Summit &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;Sons&quot;"/);
});

test("price change + publish shows the range; undo last publish puts the old version back", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  await call("summitroofing.test", "/admin/api/draft", { method: "PUT", cookie, body: { cine: { unit: "per job", prices: { "Medium home": { "Architectural shingle": { low: "9,000", high: "$14000" } } } } } });
  await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie });
  const v1 = await publishedHtml("site-a");
  assert.match(v1, /\$9,000 to \$14,000/);
  await call("summitroofing.test", "/admin/api/draft", { method: "PUT", cookie, body: { phone: "559-555-0777" } });
  await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie });
  assert.match(await publishedHtml("site-a"), /555-0777/);
  const editor = await (await call("summitroofing.test", "/admin", { cookie })).text();
  assert.match(editor, /Undo last publish/);
  const u = await call("summitroofing.test", "/admin/api/undo", { method: "POST", body: {}, cookie });
  assert.equal(u.status, 200);
  const back = await publishedHtml("site-a");
  assert.doesNotMatch(back, /555-0777/);
  assert.match(back, /555-0100/);
  assert.match(back, /\$9,000 to \$14,000/);
  assert.equal((await call("summitroofing.test", "/admin/api/undo", { method: "POST", body: {}, cookie })).status, 409, "only one previous version is kept");
});

test("edits keep only allowed fields: trade, rating and typed reviews cannot be set by the owner", () => {
  const out = applyEdits(FORM_A, { trade: "hvac", rating: 5, reviews: 999, reviewList: [{ text: "fake" }], services: ["Roof repair", "Not a service"], theme: "forest", years: "12 years", live: { x: 1 } }, { siteId: "site-a" });
  assert.equal(out.trade, "roofing");
  assert.equal(out.rating, undefined);
  assert.equal(out.reviews, undefined);
  assert.equal(out.reviewList, undefined);
  assert.equal(out.live, undefined);
  assert.deepEqual(out.services, ["Roof repair"]);
  assert.equal(out.theme, "forest");
  assert.equal(out.themePicked, true);
  assert.equal(out.years, "12");
  const look = applyEdits(FORM_A, { look: "classic" }, { siteId: "site-a" });
  assert.equal(look.look, "cinematic", "look change is off unless ADMIN_LOOK=on");
});

// ---------- photos ----------
test("photo upload: JPEG to R2 media/<siteId>/ as an https URL; wrong type, too big, fake or unknown spot refused", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  const ok = await call("summitroofing.test", "/admin/api/upload?slot=old", { method: "POST", body: JPEG(), cookie, headers: { "content-type": "image/jpeg" } });
  assert.equal(ok.status, 200);
  const { url } = await ok.json();
  assert.match(url, /^https:\/\/summitroofing\.test\/media\/site-a\/old-[A-Za-z0-9_-]{16}\.jpg$/);
  const key = url.replace("https://summitroofing.test/", "");
  assert.ok(env.R2.map.has(key));
  assert.equal(env.R2.map.get(key).httpMetadata.contentType, "image/jpeg");
  const gif = await call("summitroofing.test", "/admin/api/upload?slot=old", { method: "POST", body: JPEG(), cookie, headers: { "content-type": "image/gif" } });
  assert.equal(gif.status, 415);
  const big = new Uint8Array(MAX_UPLOAD + 1); big.set([0xff, 0xd8, 0xff]);
  assert.equal((await call("summitroofing.test", "/admin/api/upload?slot=old", { method: "POST", body: big, cookie, headers: { "content-type": "image/jpeg" } })).status, 413);
  assert.equal((await call("summitroofing.test", "/admin/api/upload?slot=old", { method: "POST", body: new TextEncoder().encode("<svg onload=alert(1)>"), cookie, headers: { "content-type": "image/jpeg" } })).status, 415);
  assert.equal((await call("summitroofing.test", "/admin/api/upload?slot=nope", { method: "POST", body: JPEG(), cookie, headers: { "content-type": "image/jpeg" } })).status, 400);
  // Saving the URL into the draft works; another site's media URL or a random link does not.
  const d = await (await call("summitroofing.test", "/admin/api/draft", { method: "PUT", cookie, body: { cine: { images: { old: url, deck: "https://summitroofing.test/media/site-b/x-1.jpg", wrap: "https://evil.test/a.jpg" } } } })).json();
  assert.equal(d.draft.cine.images.old, url);
  assert.equal(d.draft.cine.images.deck, undefined);
  assert.equal(d.draft.cine.images.wrap, undefined);
});

// ---------- reviews and ask ----------
test("owner adds a real customer review (tick needed); it shows after publish, escaped", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  assert.equal((await call("summitroofing.test", "/admin/api/reviews", { method: "POST", cookie, body: { author: "Maria G., Fresno", text: "Great", stars: 5 } })).status, 400);
  assert.equal((await call("summitroofing.test", "/admin/api/reviews", { method: "POST", cookie, body: { author: "Maria G., Fresno", text: "Great work <b>fast</b>", stars: 5, real: true } })).status, 200);
  const row = sql("SELECT * FROM reviews")[0];
  assert.equal(row.source, "manual");
  assert.equal(row.site_id, "site-a");
  await call("summitroofing.test", "/admin/api/publish", { method: "POST", body: {}, cookie });
  const live = await publishedHtml("site-a");
  assert.match(live, /Great work &lt;b&gt;fast&lt;\/b&gt;/);
  assert.equal((await call("summitroofing.test", `/admin/api/reviews/${row.id}`, { method: "POST", cookie, body: { show: false } })).status, 200);
  assert.equal(sql("SELECT show FROM reviews")[0].show, 0);
  assert.equal((await call("summitroofing.test", `/admin/api/reviews/${row.id}`, { method: "DELETE", cookie })).status, 200);
  assert.equal(sql("SELECT COUNT(*) AS n FROM reviews")[0].n, 0);
});

test("ask for a review: copyable text, the Google write-review link and a QR code drawn in code", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  const none = await (await call("summitroofing.test", "/admin/ask", { cookie })).text();
  assert.match(none, /Find your Google listing/);
  env.DB.sql.prepare("UPDATE sites SET place_id = 'ChIJtestPlace0001abcdEFGH' WHERE id = 'site-a'").run();
  const page = await (await call("summitroofing.test", "/admin/ask", { cookie })).text();
  assert.match(page, /https:\/\/search\.google\.com\/local\/writereview\?placeid=ChIJtestPlace0001abcdEFGH/);
  assert.match(page, /Copy message/);
  assert.match(page, /<svg[^>]+viewBox="0 0 45 45"/, "version 4 QR + quiet zone");
  const m = qrMatrix("https://search.google.com/local/writereview?placeid=ChIJtestPlace0001abcdEFGH");
  assert.equal(m.length, 37);
  assert.ok(m[0].slice(0, 7).every(Boolean) && m[6].slice(0, 7).every(Boolean), "finder pattern drawn");
});

test("admin pages load no outside scripts; the editor's inline script carries the CSP nonce", async () => {
  const cookie = await login("summitroofing.test", "owner@summit.test");
  const r = await call("summitroofing.test", "/admin", { cookie });
  const page = await r.text();
  const csp = r.headers.get("content-security-policy");
  const n = /'nonce-([^']+)'/.exec(csp)[1];
  assert.match(page, new RegExp(`<script nonce="${n.replace(/[+/=]/g, (c) => "\\" + c)}">`));
  assert.doesNotMatch(page, /<script[^>]+src=/);
  assert.equal((page.match(/<script/g) || []).length, 1);
  for (const label of ["Phone number", "Prices", "Services", "Photos", "Reviews", "Colors", "Preview", "Publish"]) assert.match(page, new RegExp(label));
});
