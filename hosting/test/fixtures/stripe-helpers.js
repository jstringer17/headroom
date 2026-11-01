// Test helpers: a D1-shaped wrapper over node:sqlite (real SQL), signed Stripe events, fake deps.
import fs from 'node:fs';
import { mockEnv } from '../mock-env.js';
import { hmacHex } from '../../src/billing/stripe.js';

export const SECRET = 'whsec_test_secret';
export const DAY = 86400000;
export const NOW = Date.parse('2026-11-01T12:00:00Z');

export async function signed(event, { secret = SECRET, t = Math.floor(NOW / 1000) } = {}) {
  const body = JSON.stringify(event);
  const sig = await hmacHex(secret, `${t}.${body}`);
  return new Request('https://desk.example.com/api/stripe', { method: 'POST', body, headers: { 'stripe-signature': `t=${t},v1=${sig}` } });
}

export function fixture(name) { return JSON.parse(fs.readFileSync(new URL(`./stripe-${name}.json`, import.meta.url), 'utf8')); }

// Real db.js / render.js / notify.js / router on a mock D1 + R2. Only Stripe's API and Resend's HTTP are stubbed.
export function makeEnv(extra = {}) {
  const emails = [], fetches = [];
  const env = mockEnv({
    RESEND_API_KEY: 're_test', STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_PRICE_MONTHLY: 'price_month', STRIPE_PRICE_SETUP: 'price_setup', STRIPE_PRICE_SMS: 'price_sms',
    MONTHLY_CENTS: '9900', ADDON_CENTS_SMS: '1500', AGENCY_DOMAIN: 'example.com',
    __deps: {
      now: () => NOW,
      fetch: async (url, init) => {
        fetches.push({ url, init });
        const out = url.includes('billing_portal') ? 'https://billing.stripe.test/portal_1' : 'https://checkout.stripe.test/cs_1';
        return new Response(JSON.stringify({ url: out }), { status: 200 });
      },
    },
    ...extra,
  });
  // notify.js uses the global fetch (Resend): capture those calls.
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).startsWith('https://api.resend.com/emails')) {
      const b = JSON.parse(init.body); emails.push({ ...b, to: [].concat(b.to)[0] });
      return new Response(JSON.stringify({ id: `em_${emails.length}` }), { status: 200 });
    }
    return new Response('not mocked', { status: 599 });
  };
  const calls = { emails, fetches, get published() { return [...env.R2._store.keys()].filter((k) => k.endsWith('/index.html')).map((k) => k.split('/')[1]); } };
  return { env, calls };
}

export async function addSite(env, o = {}) {
  const id = o.id || 'site-a';
  const row = { id, slug: id, domain: `${id}.example.net`, status: 'draft', form_json: JSON.stringify({ company: 'Ann Roofing', trade: 'roofing', city: 'Austin', phone: '5125550101' }), owner_name: 'Ann Owner', owner_email: 'ann@example.net',
    plan: null, stripe_customer: null, stripe_sub: null, paid_through: null, created_at: new Date(NOW - 100 * DAY).toISOString(), updated_at: new Date(NOW).toISOString(), ...o, id };
  const keys = Object.keys(row);
  await env.DB.prepare(`INSERT INTO sites (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).bind(...keys.map((k) => row[k])).run();
  return row;
}
export const getSiteRow = (env, id = 'site-a') => env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
export const countEvents = async (env, id) => (await env.DB.prepare('SELECT COUNT(*) AS n FROM events WHERE id = ?').bind(id).first()).n;
