// POST /api/lead: the live site's form. Checks (size, honeypot, lengths, rate limit, Turnstile), stores, tells the owner.
import { addLead, markLead, logEvent, iso } from "./db.js";
import { sendEmail, sendSms } from "./notify.js";

export const THANKS = "Thanks, we got it. We will call you soon.";
export const RATE_MAX = 5;            // per visitor IP ...
export const RATE_WINDOW = 10 * 60e3; // ... per 10 minutes
const MAX_BODY = 16 * 1024;
const LIMITS = { name: 80, phone: 40, email: 120, service: 80, message: 2000, page: 200 };

const json = (status, obj) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const oneLine = (s) => String(s ?? "").replace(/[\r\n\t]+/g, " ").trim();

async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function readBody(request) {
  const len = parseInt(request.headers.get("content-length") || "0", 10);
  if (len > MAX_BODY) return { tooBig: true };
  const raw = await request.text();
  if (raw.length > MAX_BODY) return { tooBig: true };
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try { const j = JSON.parse(raw); return { data: j && typeof j === "object" ? j : {}, isJson: true }; } catch { return { data: null, isJson: true }; }
  }
  // A plain form post (visitor has no JavaScript).
  const p = new URLSearchParams(raw);
  const data = {};
  for (const [k, v] of p) data[k] = v;
  if (data.job && !data.service) data.service = data.job;
  if (data["cf-turnstile-response"] && !data.token) data.token = data["cf-turnstile-response"];
  return { data, isJson: false };
}

export async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return env.DEV === "1"; // never open in production without the secret
  if (!token || String(token).length > 2048) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token), ...(ip ? { remoteip: ip } : {}) }),
    });
    const j = await r.json().catch(() => ({}));
    return j.success === true;
  } catch {
    return false;
  }
}

// Counts this attempt and says whether the visitor is over the limit.
async function overLimit(env, ip, now) {
  const key = await sha256(`${env.SESSION_KEY || "headroom"}|${ip || "none"}`);
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM hits WHERE key = ? AND at > ?").bind(key, now - RATE_WINDOW).first();
  await env.DB.prepare("INSERT INTO hits (key, at) VALUES (?, ?)").bind(key, now).run();
  return ((row && row.n) || 0) >= RATE_MAX;
}

export async function sweepHits(env, now = Date.now()) {
  await env.DB.prepare("DELETE FROM hits WHERE at < ?").bind(now - 24 * 3600e3).run();
}

function telLink(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  const ten = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  return ten.length === 10 ? `+1${ten}` : d ? `+${d}` : "";
}

export function leadEmail(site, lead) {
  const company = (site.form && site.form.company) || site.domain || "your site";
  const tel = telLink(lead.phone);
  const rows = [["Name", lead.name], ["Phone", lead.phone], ["Email", lead.email], ["Job", lead.service], ["Message", lead.message]].filter(([, v]) => v);
  const text = `New request from your website (${company}).\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${tel ? `Call them: tel:${tel}\n` : ""}${lead.email ? "Reply to this email to answer them.\n" : ""}`;
  const html = `<div style="font:16px/1.5 system-ui,sans-serif;color:#222"><p>New request from your website (${esc(company)}).</p>
<table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${k === "Phone" && tel ? `<a href="tel:${esc(tel)}">${esc(v)}</a>` : esc(v)}</td></tr>`).join("")}</table>
${tel ? `<p><a href="tel:${esc(tel)}" style="display:inline-block;background:#1d4f9c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Call ${esc(lead.name || "them")}</a></p>` : ""}
${lead.email ? "<p>Reply to this email to answer them.</p>" : ""}</div>`;
  return { subject: oneLine(`New request: ${lead.name}${lead.service ? `, ${lead.service}` : ""}`).slice(0, 150), text, html };
}

function answer(isJson, status, ok, error) {
  if (isJson) return json(status, ok ? { ok: true, message: THANKS } : { ok: false, error });
  const msg = ok ? THANKS : error;
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${ok ? "Thanks" : "Not sent"}</title></head><body style="font:18px/1.5 system-ui,sans-serif;padding:24px;max-width:34rem;margin:auto"><p>${esc(msg)}</p><p><a href="/">Back to the site</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[A-Za-z]{2,}$/;

export async function handleLead(request, env, site) {
  if (request.method !== "POST") return json(405, { ok: false, error: "Use POST." });
  if (!site || site.status !== "live") return json(404, { ok: false, error: "This site is not active." });
  // Only this site's own pages may post here.
  const origin = request.headers.get("origin");
  if (origin && origin !== "null") {
    let oh = "";
    try { oh = new URL(origin).hostname.toLowerCase().replace(/^www\./, ""); } catch { /* bad origin */ }
    if (oh !== site.domain) return json(403, { ok: false, error: "Not allowed." });
  }
  const { data, isJson, tooBig } = await readBody(request);
  if (tooBig) return answer(isJson !== false, 413, false, "That message is too long.");
  if (!data) return answer(true, 400, false, "Could not read the form.");
  const ip = request.headers.get("cf-connecting-ip") || "";
  const now = Date.now();

  if (data.siteId && String(data.siteId) !== site.id) return answer(isJson, 400, false, "Could not send.");
  // Honeypot: people never see this box, robots fill it in.
  if (String(data.website || "").trim()) {
    await logEvent(env, site.id, "lead_spam", { why: "honeypot" });
    return answer(isJson, 400, false, "Could not send.");
  }
  const lead = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = String(data[k] ?? "").trim();
    if (v.length > max) return answer(isJson, 400, false, `The ${k === "service" ? "job" : k} is too long.`);
    lead[k] = k === "message" ? v : oneLine(v);
  }
  if (!lead.name) return answer(isJson, 400, false, "Please add your name.");
  if (!lead.phone && !lead.email) return answer(isJson, 400, false, "Please add a phone number.");
  if (lead.phone && !/^[0-9+().\-\s xext]{7,40}$/i.test(lead.phone)) return answer(isJson, 400, false, "Please check the phone number.");
  if (lead.email && !EMAIL_RE.test(lead.email)) return answer(isJson, 400, false, "Please check the email.");

  if (await overLimit(env, ip, now)) {
    await logEvent(env, site.id, "lead_spam", { why: "rate" });
    return answer(isJson, 429, false, "Too many messages. Please call us instead.");
  }
  if (!(await verifyTurnstile(env, data.token, ip))) {
    await logEvent(env, site.id, "lead_spam", { why: "turnstile" });
    return answer(isJson, 403, false, "Please try again, the spam check did not pass.");
  }

  const id = await addLead(env, { site_id: site.id, ...lead, created_at: iso(now) });
  const to = site.notify_email || site.owner_email;
  const mail = leadEmail(site, lead);
  const e = to ? await sendEmail(env, { to, ...mail, replyTo: lead.email || undefined }) : { ok: false, error: "no owner email" };
  let s = { ok: false };
  if (site.notify_sms) {
    s = await sendSms(env, { to: site.notify_sms, text: oneLine(`New lead: ${lead.name} ${lead.phone}${lead.service ? `, ${lead.service}` : ""}`).slice(0, 300) });
  }
  await markLead(env, id, { emailed: e.ok, texted: s.ok });
  if (!e.ok) await logEvent(env, site.id, "lead_email_failed", { lead: id, error: e.error || (e.skipped ? "no key" : "") });
  await logEvent(env, site.id, "lead", { lead: id, emailed: !!e.ok, texted: !!s.ok });
  return answer(isJson, 200, true);
}
