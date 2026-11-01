// A local stand-in for the Worker env: D1 (real SQLite via node:sqlite, loaded with schema.sql) and R2 (a Map).
// Shared by every hosting test suite and scripts/e2e-local.mjs:
//   import { mockEnv } from "../test/mock-env.js";  const env = mockEnv({ RESEND_API_KEY: "test" });
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = readFileSync(join(here, "..", "schema.sql"), "utf8");

// node:sqlite prints an "experimental" warning once; keep test output clean.
const emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w && w.message ? w.message : w).includes("SQLite") ? undefined : emit.call(process, w, ...a));
const { DatabaseSync } = await import("node:sqlite");

const clean = (v) => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v);
const plain = (row) => (row ? { ...row } : row);

class Stmt {
  constructor(db, sql, args = []) { this.db = db; this.sql = sql; this.args = args; }
  bind(...args) { return new Stmt(this.db, this.sql, args.map(clean)); }
  async first(col) {
    const row = plain(this.db.prepare(this.sql).get(...this.args));
    if (!row) return null;
    return col ? row[col] : row;
  }
  async all() { return { results: this.db.prepare(this.sql).all(...this.args).map(plain), success: true, meta: {} }; }
  async raw() { return this.db.prepare(this.sql).all(...this.args).map((r) => Object.values(r)); }
  async run() {
    const r = this.db.prepare(this.sql).run(...this.args);
    return { success: true, results: [], meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

export function mockD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(SCHEMA);
  return {
    _db: db,
    prepare: (sql) => new Stmt(db, sql),
    batch: async (stmts) => { const out = []; for (const s of stmts) out.push(await s.run()); return out; },
    exec: async (sql) => { db.exec(sql); return { count: 1 }; },
  };
}

export function mockR2() {
  const store = new Map();
  const toText = async (v) => (typeof v === "string" ? v : v instanceof ArrayBuffer || ArrayBuffer.isView(v) ? new TextDecoder().decode(v) : await new Response(v).text());
  return {
    _store: store,
    async put(key, value, opts = {}) {
      const isBin = value instanceof ArrayBuffer || ArrayBuffer.isView(value);
      const data = isBin ? new Uint8Array(value instanceof ArrayBuffer ? value : value.buffer) : await toText(value);
      const etag = `"${store.size}-${Date.now()}"`;
      store.set(key, { data, httpMetadata: opts.httpMetadata || {}, customMetadata: opts.customMetadata || {}, httpEtag: etag, uploaded: new Date() });
      return { key, httpEtag: etag };
    },
    async get(key) {
      const o = store.get(key);
      if (!o) return null;
      return {
        key, httpMetadata: o.httpMetadata, customMetadata: o.customMetadata, httpEtag: o.httpEtag, uploaded: o.uploaded,
        get body() { return new Response(o.data).body; },
        text: async () => (typeof o.data === "string" ? o.data : new TextDecoder().decode(o.data)),
        arrayBuffer: async () => (typeof o.data === "string" ? new TextEncoder().encode(o.data).buffer : o.data.buffer),
      };
    },
    async head(key) { const o = store.get(key); return o ? { key, httpMetadata: o.httpMetadata, httpEtag: o.httpEtag } : null; },
    async delete(keys) { for (const k of [].concat(keys)) store.delete(k); },
    async list({ prefix = "" } = {}) { return { objects: [...store.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })), truncated: false }; },
  };
}

export function mockEnv(extra = {}) {
  return {
    DB: mockD1(),
    R2: mockR2(),
    AGENCY_DOMAIN: "agency.test",
    FROM_EMAIL: "Leads <leads@agency.test>",
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    SESSION_KEY: "test-session-key",
    ...extra,
  };
}

// A fetch stand-in that records outgoing calls (Resend, Twilio, Turnstile) and answers like the real APIs.
// opts.turnstile = true|false decides the spam check answer.
export function mockFetch(opts = {}) {
  const calls = { email: [], sms: [], turnstile: [], other: [] };
  const fn = async (input, init = {}) => {
    const url = String(input && input.url ? input.url : input);
    const body = init.body;
    const ok = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { "content-type": "application/json" } });
    if (url.startsWith("https://api.resend.com/emails")) { calls.email.push(JSON.parse(body)); return ok({ id: `em_${calls.email.length}` }); }
    if (url.startsWith("https://api.twilio.com/")) { calls.sms.push(Object.fromEntries(new URLSearchParams(String(body)))); return ok({ sid: `SM${calls.sms.length}` }); }
    if (url.startsWith("https://challenges.cloudflare.com/turnstile/v0/siteverify")) {
      const p = Object.fromEntries(new URLSearchParams(String(body)));
      calls.turnstile.push(p);
      const pass = typeof opts.turnstile === "function" ? opts.turnstile(p) : opts.turnstile !== false && p.response === "good-token";
      return ok({ success: !!pass });
    }
    calls.other.push(url);
    return new Response("not mocked", { status: 599 });
  };
  fn.calls = calls;
  return fn;
}
