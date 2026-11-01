import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripeWebhook, billingSweep, checkoutLink, portalLink } from '../src/billing/index.js';
import { monthlyLeadReport } from '../src/billing/report.js';
import { verifyStripeSignature, encodeForm } from '../src/billing/stripe.js';
import { makeEnv, addSite, signed, fixture, getSiteRow, countEvents, DAY, NOW } from './fixtures/stripe-helpers.js';

const send = async (env, event, opts) => stripeWebhook(await signed(event, opts), env);
const live = (env, o) => addSite(env, { status: 'live', stripe_customer: 'cus_A', stripe_sub: 'sub_A', plan: 'monthly', ...o });

test('paid: checkout completed -> site live, customer saved, published', async () => {
  const { env, calls } = makeEnv(); await addSite(env);
  const res = await send(env, fixture('checkout-completed'));
  assert.equal(res.status, 200);
  const s = await getSiteRow(env);
  assert.equal(s.status, 'live'); assert.equal(s.stripe_customer, 'cus_A'); assert.equal(s.stripe_sub, 'sub_A'); assert.equal(s.plan, 'monthly');
  assert.ok(Date.parse(s.paid_through) > NOW);
  assert.deepEqual(calls.published, ['site-a']);
});

test('invoice.paid sets paid_through from the invoice period', async () => {
  const { env } = makeEnv(); await live(env, { paid_through: new Date(NOW).toISOString() });
  await send(env, fixture('invoice-paid'));
  assert.equal((await getSiteRow(env)).paid_through, new Date(1792592000 * 1000).toISOString());
});

test('payment_failed: owner emailed with portal link, site still live (in grace)', async () => {
  const { env, calls } = makeEnv(); await live(env, { paid_through: new Date(NOW - 2 * DAY).toISOString() });
  const res = await send(env, fixture('invoice-payment-failed'));
  assert.equal(res.status, 200);
  assert.equal((await getSiteRow(env)).status, 'live');
  assert.equal(calls.emails.length, 1);
  assert.equal(calls.emails[0].to, 'ann@example.net');
  assert.match(calls.emails[0].text, /billing\.stripe\.test\/portal_1/);
  assert.match(calls.emails[0].text, /14 days/);
});

test('deleted subscription -> off, and a visitor sees the not-active page', async (t) => {
  const { env } = makeEnv(); await live(env);
  await send(env, fixture('subscription-deleted'));
  assert.equal((await getSiteRow(env)).status, 'off');
  const router = new URL('../src/index.js', import.meta.url);
  if (!fs.existsSync(router)) return t.diagnostic('host-core router not landed: visitor check covered by e2e-local.mjs');
  const worker = (await import(router.href)).default;
  const page = await worker.fetch(new Request('https://site-a.example.net/'), env, { waitUntil() {} });
  assert.match(await page.text(), /not active/i);
});

test('past_due: still live inside grace, off beyond grace', async () => {
  const a = makeEnv(); await live(a.env, { paid_through: new Date(NOW - 5 * DAY).toISOString() });
  await send(a.env, fixture('subscription-updated-pastdue'));
  assert.equal((await getSiteRow(a.env)).status, 'live');
  const b = makeEnv(); await live(b.env, { paid_through: new Date(NOW - 20 * DAY).toISOString() });
  await send(b.env, fixture('subscription-updated-pastdue'));
  assert.equal((await getSiteRow(b.env)).status, 'off');
});

test('bad signature -> 400 and nothing changes', async () => {
  const { env, calls } = makeEnv(); await addSite(env);
  const wrong = await send(env, fixture('checkout-completed'), { secret: 'whsec_other' });
  assert.equal(wrong.status, 400);
  const stale = await send(env, fixture('checkout-completed'), { t: Math.floor(NOW / 1000) - 600 });
  assert.equal(stale.status, 400);
  const missing = await stripeWebhook(new Request('https://x/api/stripe', { method: 'POST', body: '{}' }), env);
  assert.equal(missing.status, 400);
  assert.equal((await getSiteRow(env)).status, 'draft');
  assert.equal(calls.published.length, 0);
  assert.equal(await countEvents(env, 'evt_checkout_1'), 0);
});

test('same event twice -> handled once', async () => {
  const { env, calls } = makeEnv(); await live(env, { paid_through: new Date(NOW - 2 * DAY).toISOString() });
  const r1 = await send(env, fixture('invoice-payment-failed'));
  const r2 = await send(env, fixture('invoice-payment-failed'));
  assert.equal(r1.status, 200); assert.equal(r2.status, 200);
  assert.equal((await r2.json()).duplicate, true);
  assert.equal(calls.emails.length, 1);
  assert.equal(await countEvents(env, 'evt_failed_1'), 1);
});

test('handler failure releases the event so Stripe can retry', async () => {
  const { env, calls } = makeEnv(); await addSite(env);
  env.__deps.publishSite = async () => { throw new Error('r2 down'); };
  assert.equal((await send(env, fixture('checkout-completed'))).status, 500);
  assert.equal(await countEvents(env, 'evt_checkout_1'), 0);
  env.__deps.publishSite = async (_e, id) => calls.published.push(id);
  assert.equal((await send(env, fixture('checkout-completed'))).status, 200);
});

test('paying again after being switched off turns the site back on', async () => {
  const { env, calls } = makeEnv(); await live(env, { status: 'off', paid_through: new Date(NOW - 30 * DAY).toISOString() });
  await send(env, fixture('invoice-paid'));
  assert.equal((await getSiteRow(env)).status, 'live');
  assert.deepEqual(calls.published, ['site-a']);
});

test('add-on checkout records the add-on and leaves site status alone', async () => {
  const { env } = makeEnv(); await live(env);
  const ev = { id: 'evt_addon', type: 'checkout.session.completed', data: { object: { id: 'cs_2', client_reference_id: 'site-a', customer: 'cus_A', subscription: 'sub_SMS', metadata: { siteId: 'site-a', addon: 'sms' } } } };
  await send(env, ev);
  const a = await env.DB.prepare('SELECT * FROM addons WHERE site_id = ?').bind('site-a').first();
  assert.equal(a.kind, 'sms'); assert.equal(a.status, 'active');
  assert.equal((await getSiteRow(env)).stripe_sub, 'sub_A');
});

test('billingSweep: 15 days past paid_through (grace 14) -> off; 13 days -> live', async () => {
  const { env, calls } = makeEnv({ GRACE_DAYS: '14' });
  await live(env, { id: 'late', slug: 'late', domain: 'late.example.net', paid_through: new Date(NOW - 15 * DAY).toISOString() });
  await live(env, { id: 'ok', slug: 'ok', domain: 'ok.example.net', stripe_sub: 'sub_B', paid_through: new Date(NOW - 13 * DAY).toISOString() });
  const r = await billingSweep(env);
  assert.deepEqual(r.turnedOff, ['late']);
  assert.equal((await getSiteRow(env, 'late')).status, 'off');
  assert.equal((await getSiteRow(env, 'ok')).status, 'live');
  assert.equal(calls.emails.length, 1);
});

test('GRACE_DAYS defaults to 14 and can be changed', async () => {
  const a = makeEnv(); await live(a.env, { paid_through: new Date(NOW - 10 * DAY).toISOString() });
  assert.deepEqual((await billingSweep(a.env)).turnedOff, []);
  const b = makeEnv({ GRACE_DAYS: '7' }); await live(b.env, { paid_through: new Date(NOW - 10 * DAY).toISOString() });
  assert.deepEqual((await billingSweep(b.env)).turnedOff, ['site-a']);
});

test('checkout and portal links call Stripe with the right fields', async () => {
  const { env, calls } = makeEnv(); await live(env);
  assert.equal(await checkoutLink(env, 'site-a'), 'https://checkout.stripe.test/cs_1');
  const body = decodeURIComponent(calls.fetches[0].init.body);
  assert.match(body, /mode=subscription/); assert.match(body, /line_items\[0\]\[price\]=price_month/); assert.match(body, /line_items\[1\]\[price\]=price_setup/);
  assert.match(body, /metadata\[siteId\]=site-a/);
  assert.equal(calls.fetches[0].init.headers.authorization, 'Bearer sk_test_x');
  assert.equal(await portalLink(env, 'site-a'), 'https://billing.stripe.test/portal_1');
  await assert.rejects(checkoutLink(env, 'site-a', { addon: 'seo' }), /no price/);
});

test('signature check basics + form encoding', async () => {
  assert.equal(await verifyStripeSignature('x', 't=1,v1=00', 'k', 1), false);
  assert.deepEqual(encodeForm({ a: [{ b: 1 }], c: { d: 'x y' } }), ['a%5B0%5D%5Bb%5D=1', 'c%5Bd%5D=x%20y']);
});

test('monthly lead report: off by default, sends once per month when on', async () => {
  const first = Date.parse('2026-12-01T08:00:00Z');
  const { env, calls } = makeEnv(); await live(env);
  await env.DB.prepare("INSERT INTO addons VALUES ('site-a','report','active','sub_R')").run();
  await env.DB.prepare("INSERT INTO leads (site_id, service, created_at) VALUES ('site-a','Roof repair','2026-11-10T00:00:00Z'),('site-a','Roof repair','2026-11-11T00:00:00Z'),('site-a','Gutters','2026-11-12T00:00:00Z')").run();
  env.__deps.now = () => first;
  assert.deepEqual(await monthlyLeadReport(env), { skipped: 'off' });
  env.MONTHLY_REPORT = '1';
  assert.deepEqual((await monthlyLeadReport(env)).sent, ['site-a']);
  assert.match(calls.emails[0].text, /3 leads in 2026-11/); assert.match(calls.emails[0].text, /Roof repair: 2/);
  assert.deepEqual((await monthlyLeadReport(env)).sent, []);
});

// ---- add-on subscriptions must only touch the add-on, never the site ----------------------------
const addonEvent = (id, type, object) => ({ id, type, data: { object: { customer: 'cus_A', ...object } } });
async function withAddon(o = {}) {
  const x = makeEnv(); await live(x.env, o);
  await x.env.DB.prepare("INSERT INTO addons VALUES ('site-a','sms','active','sub_SMS')").run();
  return x;
}
const addonRow = (env) => env.DB.prepare("SELECT * FROM addons WHERE site_id = 'site-a' AND kind = 'sms'").first();

test('add-on invoice.paid does not turn a switched-off site on or change paid_through', async () => {
  const old = new Date(NOW - 30 * DAY).toISOString();
  const { env, calls } = await withAddon({ status: 'off', paid_through: old });
  const r = await send(env, addonEvent('evt_ap', 'invoice.paid', { id: 'in_9', subscription: 'sub_SMS', lines: { data: [{ period: { end: 1792592000 } }] } }));
  assert.equal(r.status, 200);
  const s = await getSiteRow(env);
  assert.equal(s.status, 'off'); assert.equal(s.paid_through, old);
  assert.deepEqual(calls.published, []);
});

test('add-on payment_failed does not say the site will be switched off', async () => {
  const { env, calls } = await withAddon({ paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(env, addonEvent('evt_af', 'invoice.payment_failed', { id: 'in_10', subscription: 'sub_SMS' }));
  assert.equal((await getSiteRow(env)).status, 'live');
  assert.ok(calls.emails.every((m) => !/switched off/i.test(m.text)));
  assert.equal((await addonRow(env)).status, 'past_due');
});

test('add-on subscription canceled/deleted ends the add-on only', async () => {
  const a = await withAddon({ paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(a.env, addonEvent('evt_au', 'customer.subscription.updated', { id: 'sub_SMS', status: 'canceled' }));
  assert.equal((await getSiteRow(a.env)).status, 'live');
  assert.equal((await addonRow(a.env)).status, 'canceled');
  const b = await withAddon({ paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(b.env, addonEvent('evt_ad', 'customer.subscription.deleted', { id: 'sub_SMS', status: 'canceled' }));
  assert.equal((await getSiteRow(b.env)).status, 'live');
  assert.equal((await addonRow(b.env)).status, 'canceled');
});

test('main plan still works with an add-on present', async () => {
  const a = await withAddon({ status: 'off', paid_through: new Date(NOW - 30 * DAY).toISOString() });
  await send(a.env, fixture('invoice-paid'));
  assert.equal((await getSiteRow(a.env)).status, 'live');
});

test('unset prices: desk MRR does not break, checkout says what is missing', async () => {
  const { loadCustomers } = await import('../src/desk/data.js');
  const { env } = makeEnv({ MONTHLY_CENTS: undefined, ADDON_CENTS_SMS: undefined, STRIPE_PRICE_MONTHLY: undefined });
  await live(env);
  assert.equal((await loadCustomers(env, NOW)).totals.mrrCents, 0);
  await assert.rejects(checkoutLink(env, 'site-a'), /STRIPE_PRICE_MONTHLY is not set/);
});

test('a switched-off site stops being served within 5 seconds, even on an isolate that cached it', async () => {
  const { env } = makeEnv(); await live(env, { paid_through: new Date(NOW + 5 * DAY).toISOString() });
  const worker = (await import('../src/index.js')).default;
  await env.R2.put('sites/site-a/index.html', '<html>LIVE PAGE</html>');
  assert.match(await (await worker.fetch(new Request('https://site-a.example.net/'), env, { waitUntil() {} })).text(), /LIVE PAGE/); // fills this isolate's host cache
  await env.DB.prepare("UPDATE sites SET status = 'off' WHERE id = 'site-a'").run();         // another isolate switched it off
  const real = Date.now; Date.now = () => real() + 6000;
  try {
    const page = await worker.fetch(new Request('https://site-a.example.net/'), env, { waitUntil() {} });
    assert.match(await page.text(), /not active/i);
  } finally { Date.now = real; }
});

// ---- Stripe API >= 2025-03-31.basil: invoices carry the subscription under parent.subscription_details ----
const basilInvoice = (id, type, sub, over = {}) => ({ id, type, data: { object: { id: `in_${id}`, customer: 'cus_A', parent: { type: 'subscription_details', subscription_details: { subscription: sub, ...(over.meta ? { metadata: over.meta } : {}) } }, lines: { data: [{ period: { end: 1792592000 } }] } } } });

test('basil-shaped main invoice.paid extends paid_through and revives an off site', async () => {
  const { env } = await withAddon({ status: 'off', paid_through: new Date(NOW - 30 * DAY).toISOString() });
  await send(env, basilInvoice('b1', 'invoice.paid', 'sub_A'));
  const s = await getSiteRow(env);
  assert.equal(s.status, 'live'); assert.equal(s.paid_through, new Date(1792592000 * 1000).toISOString());
});

test('basil-shaped main payment_failed warns about switch-off; add-on one (metadata under subscription_details) does not', async () => {
  const a = await withAddon({ paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(a.env, basilInvoice('b2', 'invoice.payment_failed', 'sub_A'));
  assert.match(a.calls.emails.at(-1).text, /switched off/i);
  const b = await withAddon({ paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(b.env, basilInvoice('b3', 'invoice.payment_failed', 'sub_SMS', { meta: { addon: 'sms' } }));
  assert.ok(b.calls.emails.every((m) => !/switched off/i.test(m.text)));
  const c = await withAddon({ status: 'off', paid_through: new Date(NOW - 30 * DAY).toISOString() });
  await send(c.env, basilInvoice('b4', 'invoice.paid', 'sub_SMS'));
  assert.equal((await getSiteRow(c.env)).status, 'off'); // add-on by sub id alone
});

test('a late invoice.paid after the subscription was deleted does not switch the site back on', async () => {
  const { env, calls } = makeEnv(); await live(env, { paid_through: new Date(NOW + 5 * DAY).toISOString() });
  await send(env, fixture('subscription-deleted'));
  assert.equal((await getSiteRow(env)).status, 'off');
  await send(env, { ...fixture('invoice-paid'), id: 'evt_late_paid' });
  assert.equal((await getSiteRow(env)).status, 'off');
  assert.deepEqual(calls.published, []);
  // a brand new subscription (new sub id) still works
  await send(env, { id: 'evt_resub', type: 'checkout.session.completed', data: { object: { id: 'cs_9', client_reference_id: 'site-a', customer: 'cus_A', subscription: 'sub_NEW', metadata: { siteId: 'site-a' } } } });
  assert.equal((await getSiteRow(env)).status, 'live');
});

test('no main subscription on file: add-on invoice.paid never switches the site on; it is logged', async () => {
  const { env } = makeEnv(); await addSite(env, { status: 'off', stripe_customer: 'cus_A', paid_through: new Date(NOW - 30 * DAY).toISOString() });
  await send(env, basilInvoice('n3', 'invoice.paid', 'sub_SMS'));
  const s = await getSiteRow(env);
  assert.equal(s.status, 'off'); assert.equal(s.paid_through, new Date(NOW - 30 * DAY).toISOString());
  const ev = await env.DB.prepare("SELECT * FROM events WHERE kind = 'billing.unknown_sub'").first();
  assert.ok(ev);
});

test('Stripe calls pin the API version', async () => {
  const { env, calls } = makeEnv(); await live(env);
  await checkoutLink(env, 'site-a'); await portalLink(env, 'site-a');
  for (const f of calls.fetches) assert.equal(f.init.headers['stripe-version'], '2025-09-30.clover');
  env.STRIPE_API_VERSION = '2026-01-01.test'; await portalLink(env, 'site-a');
  assert.equal(calls.fetches.at(-1).init.headers['stripe-version'], '2026-01-01.test');
});
