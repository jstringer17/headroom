// Local stand-ins for tests and the screenshot server (never deployed, not imported by index.js).
// D1 on node:sqlite with the Shared contract tables (hosting/schema.sql is used instead once it exists),
// R2 in memory, and host-core's real render.publishSite (sendEmail still captured in an outbox).
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { publishSite } from "../../render.js";

const SCHEMA_FILE = fileURLToPath(new URL("../../../schema.sql", import.meta.url));
export const CONTRACT_SCHEMA = `
CREATE TABLE sites (id TEXT PRIMARY KEY, slug TEXT, domain TEXT UNIQUE, status TEXT DEFAULT 'draft', form_json TEXT, owner_name TEXT, owner_email TEXT, owner_sms TEXT, notify_email TEXT, notify_sms TEXT, place_id TEXT, plan TEXT, stripe_customer TEXT, stripe_sub TEXT, paid_through TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE leads (id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT, name TEXT, phone TEXT, email TEXT, service TEXT, message TEXT, page TEXT, created_at TEXT, emailed INTEGER, texted INTEGER);
CREATE TABLE reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT, source TEXT, author TEXT, stars INTEGER, text TEXT, posted_at TEXT, fetched_at TEXT, show INTEGER DEFAULT 1);
CREATE TABLE logins (token_hash TEXT PRIMARY KEY, site_id TEXT, email TEXT, expires_at TEXT, used INTEGER DEFAULT 0);
CREATE TABLE addons (site_id TEXT, kind TEXT, status TEXT, stripe_item TEXT);
CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, site_id TEXT, kind TEXT, data TEXT, at TEXT);`;

const val = (v) => (typeof v === "boolean" ? (v ? 1 : 0) : v === undefined ? null : v);

export function makeD1() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(existsSync(SCHEMA_FILE) ? readFileSync(SCHEMA_FILE, "utf8") : CONTRACT_SCHEMA);
  const stmt = (q, args = []) => ({
    bind: (...a) => stmt(q, a),
    first: async (col) => { const r = sql.prepare(q).get(...args.map(val)); return r ? (col ? r[col] : { ...r }) : null; },
    all: async () => ({ results: sql.prepare(q).all(...args.map(val)).map((r) => ({ ...r })) }),
    run: async () => { const r = sql.prepare(q).run(...args.map(val)); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
  });
  return {
    sql,
    prepare: (q) => stmt(q),
    batch: async (list) => { sql.exec("BEGIN"); try { const out = []; for (const s of list) out.push(await s.run()); sql.exec("COMMIT"); return out; } catch (e) { sql.exec("ROLLBACK"); throw e; } },
  };
}

export function makeR2() {
  const m = new Map();
  return {
    map: m,
    put: async (key, value, opts = {}) => { m.set(key, { body: typeof value === "string" ? value : new Uint8Array(value), httpMetadata: opts.httpMetadata || {} }); },
    get: async (key) => {
      const o = m.get(key);
      if (!o) return null;
      return { httpMetadata: o.httpMetadata, text: async () => (typeof o.body === "string" ? o.body : new TextDecoder().decode(o.body)), arrayBuffer: async () => (typeof o.body === "string" ? new TextEncoder().encode(o.body) : o.body).buffer, size: o.body.length };
    },
    delete: async (key) => { m.delete(key); },
    list: async ({ prefix = "" } = {}) => ({ objects: [...m.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }),
  };
}

export function makeEnv(extra = {}) {
  const env = { DB: makeD1(), R2: makeR2(), SESSION_KEY: "test-session-key-0123456789", AGENCY_DOMAIN: "agency.test", FROM_EMAIL: "hello@agency.test", outbox: [], published: [], ...extra };
  const deps = {
    render: { publishSite: async (e, id) => { const r = await publishSite(e, id); e.published.push(id); return r; } },
    notify: { sendEmail: async (e, msg) => { e.outbox.push(msg); return { ok: true }; } },
  };
  return { env, deps };
}

export async function addSite(env, s) {
  const row = { status: "live", plan: "basic", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), place_id: null, ...s, form_json: JSON.stringify(s.form || {}) };
  delete row.form;
  const cols = Object.keys(row);
  await env.DB.prepare(`INSERT INTO sites (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).bind(...cols.map((c) => row[c])).run();
  return row;
}
