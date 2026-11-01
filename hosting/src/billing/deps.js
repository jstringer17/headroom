import { clearHostCache, logEvent } from '../db.js';

// Everything outside this folder goes through here, so tests can swap it (env.__deps) and
// the folder works before host-core lands. Real modules are loaded lazily.
export function getDeps(env) {
  const o = env.__deps || {};
  return {
    now: o.now || (() => Date.now()),
    fetch: o.fetch || ((...a) => fetch(...a)),
    sendEmail: o.sendEmail || (async (e, m) => (await import('../notify.js')).sendEmail(e, m)),
    publishSite: o.publishSite || (async (e, id) => (await import('../render.js')).publishSite(e, id)),
  };
}

export const DAY = 86400000;
export const graceDays = (env) => { const n = Number(env.GRACE_DAYS); return Number.isFinite(n) && env.GRACE_DAYS !== '' && env.GRACE_DAYS != null ? n : 14; };
export const ADDON_KINDS = { sms: 'STRIPE_PRICE_SMS', seo: 'STRIPE_PRICE_SEO', ads: 'STRIPE_PRICE_ADS', report: 'STRIPE_PRICE_REPORT' };

// Small D1 helpers (plain SQL on the shared contract's tables).
export const getSite = (env, id) => env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
export const siteByCustomer = (env, c) => (c ? env.DB.prepare('SELECT * FROM sites WHERE stripe_customer = ?').bind(c).first() : null);
export const siteBySub = (env, s) => (s ? env.DB.prepare('SELECT * FROM sites WHERE stripe_sub = ?').bind(s).first() : null);
export async function patchSite(env, id, fields, now) {
  const keys = Object.keys(fields);
  await env.DB.prepare(`UPDATE sites SET ${keys.map((k) => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ?`)
    .bind(...keys.map((k) => fields[k]), new Date(now).toISOString(), id).run();
  clearHostCache(); // the router caches host -> site (incl. status) for 30 s; a status change must show at once
  if ('status' in fields) await logEvent(env, id, 'status', { status: fields.status, by: 'billing' });
}
// First writer wins: returns false when this event id was already stored.
export async function claimEvent(env, id, siteId, kind, data, now) {
  const r = await env.DB.prepare('INSERT OR IGNORE INTO events (id, site_id, kind, data, at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, siteId, kind, JSON.stringify(data ?? {}), new Date(now).toISOString()).run();
  return (r?.meta?.changes ?? 0) > 0;
}
export const releaseEvent = (env, id) => env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
