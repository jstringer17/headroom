// Storage for the owner admin. D1 tables are the ones in the Shared contract (org/plan.md):
// sites, logins, reviews, events. Bindings: env.DB (D1), env.R2 (R2 bucket).
// Times are ISO strings (new Date().toISOString()); ids of reviews/events are made by the database.
// R2 keys owned here: drafts/<siteId>.json (the owner's unpublished form), history/<siteId>/previous.json
// (the form before the last publish, for "Undo last publish"), media/<siteId>/<file> (photos).
const iso = (ms = Date.now()) => new Date(ms).toISOString();

export function hostOf(request) {
  return new URL(request.url).hostname.toLowerCase().replace(/^www\./, "");
}

export async function siteByHost(env, host) {
  return env.DB.prepare("SELECT * FROM sites WHERE lower(domain) = ? OR lower(domain) = ? LIMIT 1").bind(host, "www." + host).first();
}

export async function siteById(env, id) {
  return env.DB.prepare("SELECT * FROM sites WHERE id = ?").bind(id).first();
}

export function formOf(site) {
  try { return JSON.parse((site && site.form_json) || "{}") || {}; } catch (_) { return {}; }
}

export async function setPublishedForm(env, siteId, form) {
  await env.DB.prepare("UPDATE sites SET form_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(form), iso(), siteId).run();
}

export async function setPlaceId(env, siteId, placeId) {
  await env.DB.prepare("UPDATE sites SET place_id = ?, updated_at = ? WHERE id = ?").bind(placeId || null, iso(), siteId).run();
}

// ---- logins (one-time links) ----
export async function addLogin(env, { tokenHash, siteId, email, expiresMs }) {
  await env.DB.prepare("INSERT INTO logins (token_hash, site_id, email, expires_at, used) VALUES (?, ?, ?, ?, 0)").bind(tokenHash, siteId, email, iso(expiresMs)).run();
}

// Links made in the last hour: a link lives 15 minutes, so made-after(now-1h) == expires-after(now-45m).
export async function linksLastHour(env, siteId, linkMinutes, now = Date.now()) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM logins WHERE site_id = ? AND expires_at > ?").bind(siteId, iso(now - 3600e3 + linkMinutes * 60e3)).first();
  return Number((r && r.n) || 0);
}

export async function getLogin(env, tokenHash) {
  return env.DB.prepare("SELECT * FROM logins WHERE token_hash = ?").bind(tokenHash).first();
}

// Marks the link used; true only for the one call that flipped it (single use, even if two taps race).
export async function useLogin(env, tokenHash) {
  const r = await env.DB.prepare("UPDATE logins SET used = 1 WHERE token_hash = ? AND used = 0").bind(tokenHash).run();
  return Number((r && r.meta && r.meta.changes) || 0) === 1;
}

// ---- reviews ----
export async function listReviews(env, siteId) {
  const r = await env.DB.prepare("SELECT * FROM reviews WHERE site_id = ? ORDER BY source, posted_at DESC").bind(siteId).all();
  return (r && r.results) || [];
}

export async function addManualReview(env, siteId, { author, stars, text }) {
  await env.DB.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, fetched_at, show) VALUES (?, 'manual', ?, ?, ?, ?, NULL, 1)")
    .bind(siteId, author, stars, text, iso()).run();
}

export async function setReviewShow(env, siteId, id, show) {
  const r = await env.DB.prepare("UPDATE reviews SET show = ? WHERE id = ? AND site_id = ?").bind(show ? 1 : 0, id, siteId).run();
  return Number((r && r.meta && r.meta.changes) || 0) === 1;
}

export async function deleteManualReview(env, siteId, id) {
  const r = await env.DB.prepare("DELETE FROM reviews WHERE id = ? AND site_id = ? AND source = 'manual'").bind(id, siteId).run();
  return Number((r && r.meta && r.meta.changes) || 0) === 1;
}

export async function logEvent(env, siteId, kind, data) {
  await env.DB.prepare("INSERT INTO events (site_id, kind, data, at) VALUES (?, ?, ?, ?)").bind(siteId, kind, JSON.stringify(data || {}), iso()).run();
}

// ---- R2: drafts, history, media ----
const draftKey = (id) => `drafts/${id}.json`;
const prevKey = (id) => `history/${id}/previous.json`;

async function getJson(env, key) {
  const o = await env.R2.get(key);
  if (!o) return null;
  try { return JSON.parse(await o.text()); } catch (_) { return null; }
}
const putJson = (env, key, v) => env.R2.put(key, JSON.stringify(v), { httpMetadata: { contentType: "application/json" } });

export const getDraft = (env, id) => getJson(env, draftKey(id));
export const saveDraft = (env, id, form) => putJson(env, draftKey(id), form);
export const getPrevious = (env, id) => getJson(env, prevKey(id));
export const savePrevious = (env, id, form) => putJson(env, prevKey(id), form);
export const dropPrevious = (env, id) => env.R2.delete(prevKey(id));

export async function putMedia(env, siteId, name, bytes, contentType) {
  const key = `media/${siteId}/${name}`;
  await env.R2.put(key, bytes, { httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" } });
  return key;
}
