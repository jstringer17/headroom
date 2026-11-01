// Test helpers: a D1-shaped wrapper over node:sqlite (real SQL), signed Stripe events, fake deps.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { hmacHex } from '../../src/billing/stripe.js';

const FALLBACK_SCHEMA = `
CREATE TABLE sites(id TEXT PRIMARY KEY, slug TEXT, domain TEXT, status TEXT, form_json TEXT, owner_name TEXT, owner_email TEXT, owner_sms TEXT, notify_email TEXT, notify_sms TEXT, place_id TEXT, plan TEXT, stripe_customer TEXT, stripe_sub TEXT, paid_through TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE leads(id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT, name TEXT, phone TEXT, email TEXT, service TEXT, message TEXT, page TEXT, created_at TEXT, emailed INT, texted INT);
CREATE TABLE reviews(id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT, source TEXT, author TEXT, stars INT, text TEXT, posted_at TEXT, fetched_at TEXT, show INT);
CREATE TABLE logins(token_hash TEXT, site_id TEXT, email TEXT, expires_at TEXT, used INT);
CREATE TABLE addons(site_id TEXT, kind TEXT, status TEXT, stripe_item TEXT);
CREATE TABLE events(id TEXT PRIMARY KEY, site_id TEXT, kind TEXT, data TEXT, at TEXT);`;

export function makeDb() {
  const schemaFile = new URL('../../schema.sql', import.meta.url);
  const sql = new DatabaseSync(':memory:');
  sql.exec(fs.existsSync(schemaFile) ? fs.readFileSync(schemaFile, 'utf8') : FALLBACK_SCHEMA);
  const stmt = (text, args = []) => ({
    bind: (...a) => stmt(text, a),
    first: async () => sql.prepare(text).get(...args) ?? null,
    all: async () => ({ results: sql.prepare(text).all(...args) }),
    run: async () => { const r = sql.prepare(text).run(...args); return { meta: { changes: Number(r.changes) } }; },
  });
  return { prepare: (t) => stmt(t), raw: sql };
}

export const SECRET = 'whsec_test_secret';
export const DAY = 86400000;
export const NOW = Date.parse('2026-11-01T12:00:00Z');

export async function signed(event, { secret = SECRET, t = Math.floor(NOW / 1000) } = {}) {
  const body = JSON.stringify(event);
  const sig = await hmacHex(secret, `${t}.${body}`);
  return new Request('https://desk.example.com/api/stripe', { method: 'POST', body, headers: { 'stripe-signature': `t=${t},v1=${sig}` } });
}

export function fixture(name) { return JSON.parse(fs.readFileSync(new URL(`./stripe-${name}.json`, import.meta.url), 'utf8')); }

export function makeEnv(extra = {}) {
  const calls = { emails: [], published: [], fetches: [] };
  const env = {
    DB: makeDb(), AGENCY_DOMAIN: 'example.com', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_PRICE_MONTHLY: 'price_month', STRIPE_PRICE_SETUP: 'price_setup', STRIPE_PRICE_SMS: 'price_sms',
    MONTHLY_CENTS: '9900', ADDON_CENTS_SMS: '1500',
    __deps: {
      now: () => NOW,
      sendEmail: async (_e, m) => { calls.emails.push(m); return { ok: true }; },
      publishSite: async (_e, id) => { calls.published.push(id); },
      fetch: async (url, init) => {
        calls.fetches.push({ url, init });
        const url_ = url.includes('billing_portal') ? 'https://billing.stripe.test/portal_1' : 'https://checkout.stripe.test/cs_1';
        return new Response(JSON.stringify({ url: url_ }), { status: 200 });
      },
    },
    ...extra,
  };
  return { env, calls };
}

export async function addSite(env, o = {}) {
  const row = { id: 'site-a', slug: 'site-a', domain: 'a.example.net', status: 'draft', form_json: '{"trade":"roofing"}', owner_name: 'Ann Owner', owner_email: 'ann@example.net',
    plan: null, stripe_customer: null, stripe_sub: null, paid_through: null, created_at: new Date(NOW - 100 * DAY).toISOString(), updated_at: new Date(NOW).toISOString(), ...o };
  const keys = Object.keys(row);
  await env.DB.prepare(`INSERT INTO sites (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).bind(...keys.map((k) => row[k])).run();
  return row;
}
export const getSiteRow = (env, id = 'site-a') => env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
export const countEvents = async (env, id) => (await env.DB.prepare('SELECT COUNT(*) AS n FROM events WHERE id = ?').bind(id).first()).n;
