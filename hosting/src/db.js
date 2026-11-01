// Shared D1 helpers (host-core owns this file; owner-admin and billing-desk import it).
// env.DB is the D1 binding. Times are ISO text (new Date().toISOString()), see schema.sql.
export const iso = (ms = Date.now()) => new Date(ms).toISOString();

export const STATUSES = ["draft", "live", "paused", "off"];

const SITE_COLS = ["slug", "domain", "status", "form_json", "owner_name", "owner_email", "owner_sms", "notify_email", "notify_sms", "place_id", "plan", "stripe_customer", "stripe_sub", "paid_through"];

// "WWW.Acme.com:443" -> "acme.com"
export function cleanHost(host) {
  return String(host || "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "").replace(/^www\./, "");
}

export function newId() {
  const b = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(b, (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");
}

function withForm(row) {
  if (!row) return null;
  let form = {};
  try { form = JSON.parse(row.form_json || "{}") || {}; } catch { form = {}; }
  return { ...row, form };
}

// Host -> site cache, per isolate. Short TTL so a status change shows up fast everywhere.
const hostCache = new Map();
const HOST_TTL = 30_000;
export function clearHostCache() { hostCache.clear(); }

export async function getSite(env, id) {
  if (!id) return null;
  return withForm(await env.DB.prepare("SELECT * FROM sites WHERE id = ?").bind(String(id)).first());
}

export async function getSiteByHost(env, host) {
  const h = cleanHost(host);
  if (!h) return null;
  const hit = hostCache.get(h);
  if (hit && hit.until > Date.now()) return hit.site;
  const site = withForm(await env.DB.prepare("SELECT * FROM sites WHERE domain = ?").bind(h).first());
  hostCache.set(h, { site, until: Date.now() + HOST_TTL });
  return site;
}

// Insert or update. site = { id?, form?, ...columns }. Returns the id.
export async function saveSite(env, site) {
  const now = iso();
  const s = { ...site };
  if (s.form !== undefined) s.form_json = JSON.stringify(s.form || {});
  if (s.domain !== undefined) s.domain = s.domain ? cleanHost(s.domain) : null;
  if (s.status !== undefined && !STATUSES.includes(s.status)) throw new Error(`bad status: ${s.status}`);
  const cols = SITE_COLS.filter((c) => s[c] !== undefined);
  const existing = s.id ? await env.DB.prepare("SELECT id FROM sites WHERE id = ?").bind(String(s.id)).first() : null;
  let id = s.id ? String(s.id) : newId();
  if (existing) {
    if (cols.length) {
      await env.DB.prepare(`UPDATE sites SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
        .bind(...cols.map((c) => s[c]), now, id).run();
    }
  } else {
    await env.DB.prepare(`INSERT INTO sites (id, ${cols.join(", ")}${cols.length ? ", " : ""}created_at, updated_at) VALUES (?, ${cols.map(() => "?").join(", ")}${cols.length ? ", " : ""}?, ?)`)
      .bind(id, ...cols.map((c) => s[c]), now, now).run();
  }
  clearHostCache();
  return id;
}

export async function setStatus(env, id, status) {
  if (!STATUSES.includes(status)) throw new Error(`bad status: ${status}`);
  const r = await env.DB.prepare("UPDATE sites SET status = ?, updated_at = ? WHERE id = ?").bind(status, iso(), String(id)).run();
  clearHostCache();
  await logEvent(env, id, "status", { status });
  return (r.meta && r.meta.changes) > 0;
}

export async function addLead(env, lead) {
  const r = await env.DB.prepare("INSERT INTO leads (site_id, name, phone, email, service, message, page, created_at, emailed, texted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)")
    .bind(lead.site_id, lead.name || "", lead.phone || "", lead.email || "", lead.service || "", lead.message || "", lead.page || "", lead.created_at || iso()).run();
  return r.meta && r.meta.last_row_id;
}

export async function markLead(env, id, { emailed, texted }) {
  if (emailed) await env.DB.prepare("UPDATE leads SET emailed = 1 WHERE id = ?").bind(id).run();
  if (texted) await env.DB.prepare("UPDATE leads SET texted = 1 WHERE id = ?").bind(id).run();
}

export async function logEvent(env, siteId, kind, data) {
  try {
    await env.DB.prepare("INSERT INTO events (id, site_id, kind, data, at) VALUES (?, ?, ?, ?, ?)")
      .bind(`ev_${crypto.randomUUID()}`, siteId == null ? null : String(siteId), kind, data == null ? null : JSON.stringify(data), iso()).run();
  } catch (e) {
    console.log("logEvent failed", kind, e && e.message);
  }
}
