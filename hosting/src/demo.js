// Owner preview: a temporary sample-site link the agency sends to a business owner (sales demo).
//   POST /api/demo            maker -> { link, expiresAt, qrSvg }   (header X-Agency-Key; CORS only from MAKER_ORIGINS)
//   GET  /d/<token>           the site, rendered like a live site + a slim agency banner, noindex
//   POST /d/<token>/lead      the form: goes to the AGENCY (tagged demo), never to the business owner
//   GET  /d/<token>/m/<file>  pictures the maker uploaded (R2 demo/<token>/<file>)
//   GET  /d/<token>/privacy   privacy page
// Served only on the demo host: env.DEMO_HOST, or demo.<AGENCY_DOMAIN>. The desk lists, extends, revokes and exports links.
import { generateSite, esc } from "../../sitemaker/src/generate.js";
import { iso, logEvent } from "./db.js";
import { LIBRARY_INDEX } from "./library-index.js";
import { checkHtml, tuneLibraryImgs } from "./render.js";
import { handleLead } from "./leads.js";
import { serveLibrary } from "./media.js";
import { qrSvg } from "./admin/qr.js";

export const DAY = 24 * 3600e3;
export const DEMO_DAYS = 14;
export const EXTEND_DAYS = 7;
export const MAX_DEMO_BODY = 12 * 1024 * 1024; // the maker sends uploaded pictures inline (each <= ~300 KB)
export const MAX_PICTURES = 40;
export const MAX_FORM_JSON = 256 * 1024;      // the form after pictures are pulled out
export const DEMO_RATE_MAX = 30;              // POST /api/demo per IP per hour (bad keys count too)
const DEMO_RATE_WINDOW = 3600e3;
const TOKEN_RE = /^[0-9a-f]{32}$/;
const PIC_TYPES = { jpeg: "jpg", png: "png", webp: "webp" };
const MEDIA_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const demoHost = (env) => String(env.DEMO_HOST || (env.AGENCY_DOMAIN ? `demo.${env.AGENCY_DOMAIN}` : "")).trim().toLowerCase();
export const demoKey = (token) => `demo/${token}/index.html`;
const mediaKey = (token, file) => `demo/${token}/${file}`;
const hex = (u8) => Array.from(u8, (b) => b.toString(16).padStart(2, "0")).join("");
export const newToken = () => hex(crypto.getRandomValues(new Uint8Array(16))); // 128 bits

const json = (status, obj, extra = {}) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...extra } });
const NOINDEX = { "x-robots-tag": "noindex, nofollow, noarchive" };
const pageHeaders = (status = 200) => ({ status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-frame-options": "SAMEORIGIN", ...NOINDEX } });

// Constant-time compare (length leaks only).
export function sameSecret(a, b) {
  const x = new TextEncoder().encode(String(a || "")), y = new TextEncoder().encode(String(b || ""));
  let diff = x.length ^ y.length;
  for (let i = 0; i < y.length; i++) diff |= (x[i % (x.length || 1)] || 0) ^ y[i];
  return diff === 0 && y.length > 0;
}

const origins = (env) => String(env.MAKER_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
function cors(request, env) {
  const o = request.headers.get("origin");
  if (!o) return { ok: true, headers: {} }; // not a browser page (curl, scripts): the key alone decides
  if (!origins(env).includes(o)) return { ok: false, headers: {} };
  return { ok: true, headers: { "access-control-allow-origin": o, vary: "origin" } };
}

async function sha256(s) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
}
async function overLimit(env, ip, now) {
  const key = await sha256(`demo|${env.SESSION_KEY || "headroom"}|${ip || "none"}`);
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM hits WHERE key = ? AND at > ?").bind(key, now - DEMO_RATE_WINDOW).first();
  await env.DB.prepare("INSERT INTO hits (key, at) VALUES (?, ?)").bind(key, now).run();
  return ((row && row.n) || 0) >= DEMO_RATE_MAX;
}

// Pull every uploaded picture (data:image/jpeg|png|webp) out of the form into R2; any other data: URI is dropped.
// Library pictures arrive as names in form.cine.libSlots (checked against the library index), never as data.
export async function pullPictures(env, form, token, host) {
  let n = 0;
  const files = [];
  async function walk(v, path) {
    if (typeof v === "string") {
      if (!v.startsWith("data:")) return v;
      const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(v);
      if (!m || ++n > MAX_PICTURES) return "";
      const ext = PIC_TYPES[m[1]];
      const file = `p${n}.${ext}`;
      const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      files.push([file, bin, MEDIA_TYPES[ext]]);
      return `https://${host}/d/${token}/m/${file}`;
    }
    if (Array.isArray(v)) { const out = []; for (let i = 0; i < v.length; i++) out.push(await walk(v[i], `${path}.${i}`)); return out; }
    if (v && typeof v === "object") { const out = {}; for (const k of Object.keys(v)) out[k] = await walk(v[k], `${path}.${k}`); return out; }
    return v;
  }
  const clean = await walk(form, "");
  for (const [file, bin, type] of files) await env.R2.put(mediaKey(token, file), bin, { httpMetadata: { contentType: type } });
  return clean;
}

// The form the generator sees for a demo: live mode (real form, no sample bits), library pictures allowed,
// typed rating never shown and never in schema.org, lead form posts to /d/<token>/lead.
export function demoForm(form, token, host, env) {
  const f = JSON.parse(JSON.stringify(form || {}));
  delete f.hosting; delete f.live; delete f.library; delete f.clean;
  delete f.rating; delete f.reviews;
  if (Array.isArray(f.reviewList)) f.reviewList = f.reviewList.filter((r) => r && r.text).slice(0, 3);
  f.cine = f.cine && typeof f.cine === "object" ? f.cine : {};
  const idx = LIBRARY_INDEX[f.trade] || {};
  const lib = {};
  for (const slot of [].concat(f.cine.libSlots || [])) if (typeof slot === "string" && idx[slot]) lib[slot] = `https://${host}/library/${idx[slot]}`;
  delete f.cine.libSlots;
  const own = f.cine.images && typeof f.cine.images === "object" ? f.cine.images : {};
  f.cine.images = { ...lib, ...own }; // the owner's pictures win
  f.live = {
    siteId: token,
    leadUrl: `/d/${token}/lead`,
    turnstileKey: (env && env.TURNSTILE_SITE_KEY) || "",
    analyticsToken: "",
    canonical: "",
    privacyUrl: `/d/${token}/privacy`,
    google: null,
  };
  return f;
}

export function bannerHtml(company, env) {
  const agency = esc(env.AGENCY_NAME || env.AGENCY_DOMAIN || "our team");
  const phone = String(env.AGENCY_PHONE || "").trim();
  const d = phone.replace(/\D/g, "");
  const tel = d.length === 10 ? `+1${d}` : d.length === 11 && d[0] === "1" ? `+${d}` : d ? `+${d}` : "";
  const call = phone ? ` Like it? Call/text <a href="tel:${esc(tel)}" style="color:inherit;font-weight:700">${esc(phone)}</a>` : " Like it? Ask us about it.";
  return `<div id="demo-banner" role="note" style="position:relative;z-index:2147483000;background:#111;color:#fff;font:600 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:8px 16px;text-align:center">Sample website made for ${esc(company || "you")} by ${agency}.${call}</div>`;
}

// Strip any schema.org rating (belt and braces: live mode already leaves it out without Google data).
const noRatingLd = (html) => html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
  try {
    const o = JSON.parse(body);
    if (!o || typeof o !== "object" || !("aggregateRating" in o || "review" in o)) return m;
    delete o.aggregateRating; delete o.review;
    return `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}</script>`;
  } catch { return m; }
});

export function renderDemo(form, token, host, env, { render = generateSite } = {}) {
  let html = tuneLibraryImgs(noRatingLd(render(demoForm(form, token, host, env))));
  html = html.replace(/<head>/i, '<head>\n<meta name="robots" content="noindex, nofollow">');
  html = html.replace(/<body\b[^>]*>/i, (b) => `${b}\n${bannerHtml(form && form.company, env)}`);
  return html;
}

const friendly = (title, body, status) => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:18px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f4f0;color:#222}main{max-width:34rem;padding:24px}h1{font-size:28px;margin:0 0 8px}a{color:#1d4f9c}</style>
</head><body><main>${body}</main></body></html>`, pageHeaders(status));

function expiredPage(env) {
  const phone = String(env.AGENCY_PHONE || "").trim();
  return friendly("Sample expired", `<h1>This sample has expired</h1><p>Ask for a new one${phone ? `: call or text ${esc(phone)}` : ""}.</p>`, 410);
}

export async function getDemo(env, token) {
  if (!TOKEN_RE.test(String(token || ""))) return null;
  return env.DB.prepare("SELECT * FROM demo_links WHERE token = ?").bind(token).first();
}
const isOpen = (row, now) => row && !row.revoked && Date.parse(row.expires_at) > now;

// POST /api/demo
async function createDemo(request, env, now) {
  const c = cors(request, env);
  if (!c.ok) return json(403, { ok: false, error: "This page may not create sample links." });
  const ip = request.headers.get("cf-connecting-ip") || "";
  if (await overLimit(env, ip, now)) return json(429, { ok: false, error: "Too many sample links. Wait an hour." }, c.headers);
  if (!env.AGENCY_KEY || !sameSecret(request.headers.get("x-agency-key"), env.AGENCY_KEY)) {
    await logEvent(env, null, "demo_bad_key", {});
    return json(401, { ok: false, error: "Wrong agency key." }, c.headers);
  }
  const len = parseInt(request.headers.get("content-length") || "0", 10);
  if (len > MAX_DEMO_BODY) return json(413, { ok: false, error: "Too big. Use smaller pictures." }, c.headers);
  const raw = await request.text();
  if (raw.length > MAX_DEMO_BODY) return json(413, { ok: false, error: "Too big. Use smaller pictures." }, c.headers);
  let body;
  try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: "Could not read the form." }, c.headers); }
  const form0 = body && typeof body === "object" && body.form && typeof body.form === "object" && !Array.isArray(body.form) ? body.form : null;
  if (!form0) return json(400, { ok: false, error: "No form sent." }, c.headers);
  const company = String(form0.company || "").trim().slice(0, 120);
  if (!company) return json(400, { ok: false, error: "Type the company name first." }, c.headers);
  if (!/\d{7,}/.test(String(form0.phone || "").replace(/\D/g, ""))) return json(400, { ok: false, error: "Type the company phone first." }, c.headers);

  const host = demoHost(env) || new URL(request.url).hostname;
  const token = newToken();
  const form = await pullPictures(env, form0, token, host);
  const formJson = JSON.stringify(form);
  if (formJson.length > MAX_FORM_JSON) return json(413, { ok: false, error: "The form is too big." }, c.headers);
  let html, problems;
  try {
    html = renderDemo(form, token, host, env);
    problems = checkHtml(html).filter((p) => !/form does not send/.test(p));
    if (!html.includes(`action="/d/${token}/lead"`)) problems.push("form does not send to the demo lead url");
  } catch (e) { problems = [`render failed: ${e && e.message}`]; }
  if (problems.length) {
    await logEvent(env, null, "demo_blocked", { problems });
    return json(422, { ok: false, error: `Could not make the sample: ${problems.join("; ")}` }, c.headers);
  }
  await env.R2.put(demoKey(token), html, { httpMetadata: { contentType: "text/html; charset=utf-8" } });
  const expires = iso(now + DEMO_DAYS * DAY);
  await env.DB.prepare("INSERT INTO demo_links (token, company, trade, form_json, created_at, expires_at, views, revoked) VALUES (?, ?, ?, ?, ?, ?, 0, 0)")
    .bind(token, company, String(form0.trade || "").slice(0, 40), formJson, iso(now), expires).run();
  await logEvent(env, null, "demo_created", { token: token.slice(0, 6), company });
  const link = `https://${host}/d/${token}`;
  return json(200, { ok: true, link, expiresAt: expires, qrSvg: qrSvg(link, { px: 200, label: `QR code for the sample site of ${company}` }) }, c.headers);
}

function preflight(request, env) {
  const c = cors(request, env);
  if (!c.ok || !request.headers.get("origin")) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { ...c.headers, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type, x-agency-key", "access-control-max-age": "600" } });
}

async function serveDemoMedia(request, env, token, file) {
  if (!/^p\d{1,3}\.(jpg|png|webp)$/.test(file)) return new Response("Not found", { status: 404 });
  const obj = await env.R2.get(mediaKey(token, file));
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers({ "content-type": MEDIA_TYPES[file.split(".").pop()], "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff", ...NOINDEX });
  return new Response(request.method === "HEAD" ? null : obj.body, { headers: h });
}

// The demo lead goes to the agency: a stand-in "site" whose notify address is the agency's, tagged demo.
export function agencyEmail(env) {
  return String(env.AGENCY_EMAIL || String(env.DESK_EMAILS || "").split(",")[0] || "").trim();
}

export async function demoApp(request, env, ctx, { now = Date.now() } = {}) {
  const url = new URL(request.url);
  const p = url.pathname;
  if (p === "/api/demo") {
    if (request.method === "OPTIONS") return preflight(request, env);
    if (request.method !== "POST") return json(405, { ok: false, error: "Use POST." });
    return createDemo(request, env, now);
  }
  if (p === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain; charset=utf-8", ...NOINDEX } });
  if (p.startsWith("/library/")) return serveLibrary(request, env);
  const m = p.match(/^\/d\/([^/]+)(?:\/(lead|privacy|m\/([^/]+)))?\/?$/);
  if (!m) return friendly("Not found", "<h1>Page not found</h1>", 404);
  const [, token, sub, file] = m;
  const row = await getDemo(env, token);
  if (!row) return friendly("Not found", "<h1>Page not found</h1><p>Check the link, or ask for a new one.</p>", 404);
  if (!isOpen(row, now)) return expiredPage(env);
  if (sub === "lead") {
    const site = { id: token, status: "live", domain: demoHost(env) || url.hostname, notify_email: agencyEmail(env), form: { company: row.company } };
    return handleLead(request, env, site, { demo: token });
  }
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  if (sub === "privacy") return friendly("Privacy", `<h1>Privacy</h1><p>This is a sample website. When you send its form, ${esc(env.AGENCY_NAME || "the team that made it")} gets your name, phone number, email (if you give it) and your message, so they can call you back. We do not sell your details.</p><p><a href="/d/${token}">Back to the sample</a></p>`, 200);
  if (file !== undefined) return serveDemoMedia(request, env, token, file);
  const obj = await env.R2.get(demoKey(token));
  if (!obj) return expiredPage(env);
  if (request.method === "HEAD") return new Response(null, pageHeaders(200));
  await env.DB.prepare("UPDATE demo_links SET views = views + 1, last_view = ? WHERE token = ?").bind(iso(now), token).run();
  return new Response(obj.body, pageHeaders(200));
}

// ---- Desk helpers ----
export async function listDemos(env) {
  const r = await env.DB.prepare("SELECT token, company, trade, created_at, expires_at, views, last_view, revoked FROM demo_links ORDER BY created_at DESC LIMIT 500").all();
  const host = demoHost(env);
  return (r.results || []).map((d) => ({ ...d, revoked: !!d.revoked, link: host ? `https://${host}/d/${d.token}` : `/d/${d.token}` }));
}

export async function extendDemo(env, token, now = Date.now()) {
  const row = await getDemo(env, token);
  if (!row) return null;
  const from = Math.max(now, Date.parse(row.expires_at) || now);
  const expires = iso(from + EXTEND_DAYS * DAY);
  await env.DB.prepare("UPDATE demo_links SET expires_at = ?, revoked = 0 WHERE token = ?").bind(expires, token).run();
  return expires;
}

export async function revokeDemo(env, token) {
  const r = await env.DB.prepare("UPDATE demo_links SET revoked = 1 WHERE token = ?").bind(String(token)).run();
  return (r.meta && r.meta.changes) > 0;
}

// "Turn into a real site": the form for hosting/scripts/new-site.mjs. Uploaded pictures go back inline (new-site.mjs
// moves them to media/<id>/); library pictures are dropped (library pictures are for samples only).
export async function demoFormForNewSite(env, token) {
  const row = await getDemo(env, token);
  if (!row) return null;
  let form = {};
  try { form = JSON.parse(row.form_json || "{}"); } catch { form = {}; }
  const prefix = `/d/${token}/m/`;
  async function walk(v) {
    if (typeof v === "string") {
      const i = v.indexOf(prefix);
      if (!/^https:\/\//.test(v) || i < 0) return v;
      const file = v.slice(i + prefix.length);
      if (!/^p\d{1,3}\.(jpg|png|webp)$/.test(file)) return "";
      const obj = await env.R2.get(mediaKey(token, file));
      if (!obj) return "";
      const bytes = new Uint8Array(await obj.arrayBuffer());
      let s = "";
      for (let k = 0; k < bytes.length; k += 0x8000) s += String.fromCharCode(...bytes.subarray(k, k + 0x8000));
      return `data:${MEDIA_TYPES[file.split(".").pop()]};base64,${btoa(s)}`;
    }
    if (Array.isArray(v)) { const out = []; for (const x of v) out.push(await walk(x)); return out; }
    if (v && typeof v === "object") { const out = {}; for (const k of Object.keys(v)) out[k] = await walk(v[k]); return out; }
    return v;
  }
  const out = await walk(form);
  if (out.cine && typeof out.cine === "object") delete out.cine.libSlots;
  return { company: row.company, form: out };
}
