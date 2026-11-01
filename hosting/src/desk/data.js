// Builds the Customer Desk rows and totals from D1. Pure reads.
import { graceDays, ADDON_KINDS, DAY } from '../billing/deps.js';

const FRESH_REVIEWS_DAYS = 14;
const UPSELL_DAYS = 60, UPSELL_LEADS = 5;
const cents = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

async function rows(env, sql, ...bind) { const r = await env.DB.prepare(sql).bind(...bind).all(); return r.results || []; }
const by = (list, key = 'site_id') => Object.fromEntries(list.map((r) => [r[key], r]));

export async function loadCustomers(env, now = Date.now()) {
  const d = new Date(now);
  const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
  const [sites, leads, revs, pubs, pay, started, addons] = await Promise.all([
    rows(env, 'SELECT * FROM sites ORDER BY created_at DESC'),
    rows(env, 'SELECT site_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS month, MAX(created_at) AS last FROM leads GROUP BY site_id', monthStart),
    rows(env, "SELECT site_id, COUNT(*) AS n, MAX(fetched_at) AS fetched FROM reviews WHERE source = 'google' GROUP BY site_id"),
    rows(env, "SELECT site_id, MAX(at) AS at FROM events WHERE kind = 'published' GROUP BY site_id"),
    rows(env, "SELECT site_id, kind, MAX(at) AS at FROM events WHERE kind IN ('stripe.invoice.payment_failed','stripe.invoice.paid') GROUP BY site_id, kind"),
    rows(env, "SELECT site_id, MIN(at) AS at FROM events WHERE kind = 'stripe.checkout.session.completed' GROUP BY site_id"),
    rows(env, "SELECT site_id, kind FROM addons WHERE status = 'active'"),
  ]);
  const L = by(leads), R = by(revs), P = by(pubs), S = by(started);
  const failedAt = {}, paidAt = {};
  for (const e of pay) (e.kind.endsWith('failed') ? failedAt : paidAt)[e.site_id] = e.at;
  const A = {};
  for (const a of addons) (A[a.site_id] ||= []).push(a.kind);
  const grace = graceDays(env) * DAY;

  const customers = sites.map((s) => {
    const l = L[s.id] || {}, r = R[s.id];
    const paying = s.status === 'live' && !!s.stripe_sub;
    const addonKinds = A[s.id] || [];
    const mrr = paying ? cents(env.MONTHLY_CENTS) + addonKinds.reduce((t, k) => t + cents(env[`ADDON_CENTS_${k.toUpperCase()}`]), 0) : 0;
    const liveSince = Date.parse(S[s.id]?.at || s.created_at) || now;
    const failed = !!failedAt[s.id] && (!paidAt[s.id] || failedAt[s.id] > paidAt[s.id]);
    const overdue = s.paid_through && Date.parse(s.paid_through) + grace < now;
    return {
      id: s.id, name: s.owner_name || s.slug || s.id, slug: s.slug, trade: s.trade || tradeFromForm(s.form_json), domain: s.domain || '',
      status: s.status, plan: s.plan || '', paidThrough: s.paid_through || '', mrrCents: mrr, addons: addonKinds,
      leadsMonth: l.month || 0, leadsTotal: l.total || 0, lastLead: l.last || '',
      reviews: !r ? 'none' : (now - Date.parse(r.fetched) > FRESH_REVIEWS_DAYS * DAY ? 'stale' : 'ok'), reviewCount: r?.n || 0,
      lastPublish: P[s.id]?.at || '', failedPayment: failed || (s.status === 'live' && !!overdue),
      hasCustomer: !!s.stripe_customer,
      readyForUpsell: s.status === 'live' && now - liveSince >= UPSELL_DAYS * DAY && (l.total || 0) >= UPSELL_LEADS,
      ownerEmail: s.owner_email || '',
    };
  });
  return {
    now: new Date(now).toISOString(),
    totals: {
      live: customers.filter((c) => c.status === 'live').length,
      mrrCents: customers.reduce((t, c) => t + c.mrrCents, 0),
      failedPayments: customers.filter((c) => c.failedPayment).length,
      leadsMonth: customers.reduce((t, c) => t + c.leadsMonth, 0),
      readyForUpsell: customers.filter((c) => c.readyForUpsell).length,
    },
    customers,
    addonKinds: Object.keys(ADDON_KINDS),
  };
}

function tradeFromForm(json) { try { const f = JSON.parse(json); return f.trade || f.tradeKey || f.niche || ''; } catch { return ''; } }
