import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { deskApp } from '../src/desk/index.js';
import { makeEnv, addSite, getSiteRow, DAY, NOW } from './fixtures/stripe-helpers.js';
import { siteRowFromLead, insertSql } from '../scripts/import-lead.mjs';

const b64u = (b) => Buffer.from(b).toString('base64url');
let keys, jwk;
before(async () => {
  keys = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  jwk = { ...(await crypto.subtle.exportKey('jwk', keys.publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
});
async function jwt(over = {}, signKey) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1' }));
  const p = b64u(JSON.stringify({ aud: ['AUD1'], email: 'ceo@example.com', iss: 'https://team.cloudflareaccess.com', exp: NOW / 1000 + 600, ...over }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signKey || keys.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}
const deskEnv = (now = NOW) => {
  const x = makeEnv({ CF_ACCESS_TEAM: 'team', CF_ACCESS_AUD: 'AUD1', DESK_EMAILS: 'ceo@example.com, Partner@example.com' }, now);
  x.env.__deps.fetchCerts = async () => [jwk];
  return x;
};
const req = async (path, { method = 'GET', token, headers = {} } = {}) =>
  new Request(`https://desk.example.com${path}`, { method, headers: { ...(token === undefined ? { 'cf-access-jwt-assertion': await jwt() } : token ? { 'cf-access-jwt-assertion': token } : {}), ...headers } });

async function fixtureRows(env) {
  const iso = (d) => new Date(NOW - d * DAY).toISOString();
  await addSite(env, { id: 'a', slug: 'a', domain: 'a.net', status: 'live', stripe_customer: 'c1', stripe_sub: 's1', plan: 'monthly', paid_through: iso(-20), created_at: iso(90) });
  await addSite(env, { id: 'b', slug: 'b', domain: 'b.net', status: 'live', stripe_customer: 'c2', stripe_sub: 's2', plan: 'monthly', paid_through: iso(-5), created_at: iso(20) });
  await addSite(env, { id: 'c', slug: 'c', domain: 'c.net', status: 'paused', stripe_customer: 'c3', stripe_sub: 's3', plan: 'monthly', paid_through: iso(-5), created_at: iso(70) });
  await addSite(env, { id: 'd', slug: 'd', domain: null, status: 'draft', created_at: iso(3) });
  const L = (site, d) => env.DB.prepare('INSERT INTO leads (site_id, name, created_at) VALUES (?, ?, ?)').bind(site, 'x', iso(d)).run();
  for (const d of [0.1, 0.15, 0.2, 0.3, 0.4, 40]) await L('a', d); // 5 this month (Nov 1) + 1 in Oct
  await L('b', 0.25); await L('b', 40);
  await env.DB.prepare("INSERT INTO addons VALUES ('a','sms','active','x')").run();
  await env.DB.prepare("INSERT INTO reviews (site_id, source, stars, fetched_at, show) VALUES ('a','google',5,?,1),('b','google',5,?,1)").bind(iso(2), iso(30)).run();
  const E = (id, site, kind, d) => env.DB.prepare('INSERT INTO events VALUES (?, ?, ?, ?, ?)').bind(id, site, kind, '{}', iso(d)).run();
  await E('e1', 'a', 'stripe.checkout.session.completed', 80); await E('e2', 'a', 'published', 4);
  await E('e3', 'b', 'stripe.invoice.payment_failed', 1);
}

test('request without a valid Access header -> 403 on every route', async () => {
  const { env } = deskEnv(); await fixtureRows(env);
  const other = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const cases = [
    ['no header', await req('/', { token: '' })],
    ['garbage', await req('/', { token: 'a.b.c' })],
    ['wrong signing key', await req('/', { token: await jwt({}, other.privateKey) })],
    ['expired', await req('/', { token: await jwt({ exp: NOW / 1000 - 5 }) })],
    ['wrong audience', await req('/', { token: await jwt({ aud: ['nope'] }) })],
    ['wrong issuer', await req('/', { token: await jwt({ iss: 'https://evil.cloudflareaccess.com' }) })],
    ['email not allowed', await req('/', { token: await jwt({ email: 'stranger@example.com' }) })],
    ['api', await req('/api/customers', { token: '' })],
    ['post', await req('/api/sites/a/pause', { method: 'POST', token: '', headers: { 'x-desk': '1' } })],
  ];
  for (const [name, r] of cases) assert.equal((await deskApp(r, env)).status, 403, name);
  assert.equal((await getSiteRow(env, 'a')).status, 'live');
  const missing = makeEnv(); // desk not configured -> closed
  assert.equal((await deskApp(await req('/'), missing.env)).status, 403);
});

test('valid CEO and partner emails get in (case-insensitive)', async () => {
  const { env } = deskEnv();
  assert.equal((await deskApp(await req('/'), env)).status, 200);
  assert.equal((await deskApp(await req('/', { token: await jwt({ email: 'partner@EXAMPLE.com' }) }), env)).status, 200);
});

test('totals match the fixture rows', async () => {
  const { env } = deskEnv(); await fixtureRows(env);
  const j = await (await deskApp(await req('/api/customers'), env)).json();
  assert.equal(j.customers.length, 4);
  assert.deepEqual(j.totals, { live: 2, mrrCents: 9900 + 1500 + 9900, failedPayments: 1, leadsMonth: 6, readyForUpsell: 1 });
  const a = j.customers.find((c) => c.id === 'a'), b = j.customers.find((c) => c.id === 'b');
  assert.equal(a.readyForUpsell, true); assert.equal(b.readyForUpsell, false);
  assert.equal(a.leadsMonth, 5); assert.equal(a.leadsTotal, 6);
  assert.equal(a.reviews, 'ok'); assert.equal(b.reviews, 'stale');
  assert.equal(b.failedPayment, true); assert.equal(a.failedPayment, false);
  assert.ok(a.lastPublish.startsWith('2026-10-28'));
});

test('pause / resume need the x-desk header, work, and refuse wrong states', async () => {
  const { env } = deskEnv(); await fixtureRows(env);
  assert.equal((await deskApp(await req('/api/sites/a/pause', { method: 'POST' }), env)).status, 403);
  assert.equal((await deskApp(await req('/api/sites/a/pause', { method: 'POST', headers: { 'x-desk': '1' } }), env)).status, 200);
  assert.equal((await getSiteRow(env, 'a')).status, 'paused');
  assert.equal((await deskApp(await req('/api/sites/a/pause', { method: 'POST', headers: { 'x-desk': '1' } }), env)).status, 409);
  assert.equal((await deskApp(await req('/api/sites/a/resume', { method: 'POST', headers: { 'x-desk': '1' } }), env)).status, 200);
  assert.equal((await getSiteRow(env, 'a')).status, 'live');
});

// Open the e-mailed link like the owner would, on the real router + admin: open -> confirm -> logged in -> link is single use.
async function followLink(env, link) {
  const host = new URL(link).host;
  const worker = (await import('../src/index.js')).default, ctx = { waitUntil() {} };
  const token = new URL(link).searchParams.get('t');
  const confirmReq = () => new Request(`https://${host}/admin/login/confirm`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: `https://${host}` }, body: `t=${token}` });
  assert.equal((await worker.fetch(new Request(link), env, ctx)).status, 200);
  const confirm = await worker.fetch(confirmReq(), env, ctx);
  assert.equal(confirm.status, 303);
  const cookie = confirm.headers.get('set-cookie').split(';')[0];
  const admin = await worker.fetch(new Request(`https://${host}/admin`, { headers: { cookie } }), env, ctx);
  assert.equal(admin.status, 200);
  assert.doesNotMatch(await admin.text(), /log in link|Send me a link/i);
  assert.equal((await worker.fetch(confirmReq(), env, ctx)).status, 400); // one use only
}

test('owner login link works on any date (clock shifted +/-40 days and a year)', async () => {
  const real = Date.parse('2026-06-15T09:30:00Z');
  for (const t of [real - 40 * DAY, real, real + 40 * DAY, real + 400 * DAY]) {
    const { env, calls } = deskEnv(t);
    await addSite(env, { id: 'a', slug: 'a', domain: 'a.net', status: 'live' });
    const tok = await jwt({ exp: t / 1000 + 600 });
    const r = await deskApp(await req('/api/sites/a/login-link', { method: 'POST', token: tok, headers: { 'x-desk': '1' } }), env);
    assert.equal(r.status, 200, new Date(t).toISOString());
    await followLink(env, calls.emails.at(-1).text.match(/https:\/\/\S+/)[0]);
    // an expired link (16 minutes later) is refused at every date
    const r2 = await deskApp(await req('/api/sites/a/login-link', { method: 'POST', token: tok, headers: { 'x-desk': '1' } }), env);
    const link2 = calls.emails.at(-1).text.match(/https:\/\/\S+/)[0];
    Date.now = () => t + 16 * 60e3;
    const worker = (await import('../src/index.js')).default;
    const late = await worker.fetch(new Request(`https://a.net/admin/login/confirm`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://a.net' }, body: `t=${new URL(link2).searchParams.get('t')}` }), env, { waitUntil() {} });
    assert.equal(late.status, 400, `expired link accepted at ${new Date(t).toISOString()}`);
    assert.equal(r2.status, 200);
  }
});

test('checkout/portal links and owner login link', async () => {
  const { env, calls } = deskEnv(); await fixtureRows(env);
  assert.match((await (await deskApp(await req('/api/sites/d/checkout'), env)).json()).url, /checkout\.stripe\.test/);
  assert.match((await (await deskApp(await req('/api/sites/a/portal'), env)).json()).url, /portal_1/);
  assert.equal((await deskApp(await req('/api/sites/d/portal'), env)).status, 502); // no Stripe customer yet
  const r = await deskApp(await req('/api/sites/a/login-link', { method: 'POST', headers: { 'x-desk': '1' } }), env);
  assert.equal(r.status, 200);
  const mail = calls.emails.at(-1);
  const link = mail.text.match(/https:\/\/\S+/)[0];
  assert.match(link, /^https:\/\/a\.net\/admin\/login\?t=[A-Za-z0-9_-]{20,}$/);
  assert.ok(!JSON.stringify(await r.clone().json()).includes(link)); // link only goes to the owner
  await followLink(env, link);
});

test('import-lead: dry run prints the row and writes nothing without --apply', () => {
  const file = new URL('./fixtures/sample-leads.json', import.meta.url).pathname;
  const run = spawnSync(process.execPath, ['scripts/import-lead.mjs', '--file', file], { encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.match(run.stdout, /DRY RUN/); assert.match(run.stdout, /"trade": "fencing"/); assert.match(run.stdout, /Nothing written/);
  assert.doesNotMatch(run.stdout, /Other Co/);
  const row = siteRowFromLead({ id: 'p', name: "A'B", niche: 'HVAC contractor', town: 'Mesa', phone: '1' });
  assert.equal(JSON.parse(row.form_json).trade, 'hvac');
  assert.match(insertSql(row), /'A''B'/);
});

test('screenshots at 375px and 1280px, no sideways scroll', async (t) => {
  let chromium;
  try { chromium = createRequire(import.meta.url)('playwright').chromium; } catch { return t.skip('playwright not available'); }
  const { env } = deskEnv(); await fixtureRows(env);
  const { PAGE } = await import('../src/desk/page.js');
  const data = await (await deskApp(await req('/api/customers'), env)).json();
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  fs.mkdirSync(new URL('./../test-shots/desk/', import.meta.url), { recursive: true });
  try {
    for (const [name, width, height] of [['375', 375, 800], ['1280', 1280, 800]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.route('https://desk.example.com/**', (r) => r.fulfill(r.request().url().endsWith('/api/customers') ? { json: data } : { contentType: 'text/html', body: PAGE }));
      await page.goto('https://desk.example.com/');
      await page.waitForSelector('#rows tr');
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(over <= 0, `${name}px has sideways scroll (${over}px)`);
      assert.equal(await page.locator('#rows tr').count(), 4);
      await page.screenshot({ path: new URL(`../test-shots/desk/desk-${name}.png`, import.meta.url).pathname, fullPage: true });
      await page.close();
    }
  } finally { await browser.close(); }
});

test('owner preview links on the desk: list, extend, revoke, form for a real site; POST needs x-desk', async () => {
  const { env } = deskEnv();
  const token = 'ab'.repeat(16);
  await env.DB.prepare("INSERT INTO demo_links (token, company, trade, form_json, created_at, expires_at, views, revoked) VALUES (?, 'Acme', 'roofing', '{\"company\":\"Acme\"}', ?, ?, 3, 0)")
    .bind(token, new Date(NOW).toISOString(), new Date(NOW + 2 * DAY).toISOString()).run();
  const list = await (await deskApp(await req('/api/demos'), env)).json();
  assert.equal(list.demos.length, 1);
  assert.equal(list.demos[0].company, 'Acme');
  assert.equal(list.demos[0].views, 3);
  assert.equal((await deskApp(await req(`/api/demos/${token}/extend`, { method: 'POST' }), env)).status, 403);
  const ext = await (await deskApp(await req(`/api/demos/${token}/extend`, { method: 'POST', headers: { 'x-desk': '1' } }), env)).json();
  assert.equal(ext.expiresAt, new Date(NOW + 9 * DAY).toISOString());
  const f = await (await deskApp(await req(`/api/demos/${token}/form`), env)).json();
  assert.equal(f.form.company, 'Acme');
  assert.equal((await deskApp(await req(`/api/demos/${token}/revoke`, { method: 'POST', headers: { 'x-desk': '1' } }), env)).status, 200);
  assert.equal((await env.DB.prepare('SELECT revoked FROM demo_links').first()).revoked, 1);
  assert.equal((await deskApp(await req('/api/demos', { token: '' }), env)).status, 403);
});
