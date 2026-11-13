// Email (Gmail SMTP or Resend) and SMS (Twilio). No key = nothing is sent, the message is logged, and { ok:false, skipped:true } comes back.
// Gmail: used when secrets GMAIL_USER + GMAIL_APP_PASSWORD are set (free, ~500 recipients/day). Implicit TLS to smtp.gmail.com:465
// via Cloudflare connect(). Daily count in D1 table email_sends; at GMAIL_DAILY_CAP it logs instead and the desk shows a warning.

export async function sendEmail(env, { to, subject, text, html, replyTo }) {
  const list = (Array.isArray(to) ? to : [to]).map((x) => String(x || "").trim()).filter(Boolean);
  if (!list.length) return { ok: false, error: "no recipient" };
  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) return sendGmail(env, { to: list, subject, text, html, replyTo });
  if (!env.RESEND_API_KEY) {
    console.log("[email not sent: no RESEND_API_KEY]", JSON.stringify({ to: list, subject }));
    return { ok: false, skipped: true };
  }
  const body = {
    from: env.FROM_EMAIL || `Leads <leads@${env.AGENCY_DOMAIN || "example.com"}>`,
    to: list,
    subject: String(subject || "").slice(0, 200),
    text: text || undefined,
    html: html || undefined,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j.id } : { ok: false, error: j.message || `resend ${r.status}` };
  } catch (e) {
    return { ok: false, error: String(e && e.message) };
  }
}

export async function sendSms(env, { to, text }) {
  const num = String(to || "").trim();
  if (!num) return { ok: false, error: "no recipient" };
  if (!env.TWILIO_SID || !env.TWILIO_TOKEN || !env.TWILIO_FROM) {
    console.log("[sms not sent: no Twilio keys]", JSON.stringify({ to: num }));
    return { ok: false, skipped: true };
  }
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_SID)}/Messages.json`, {
      method: "POST",
      headers: { authorization: `Basic ${btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`)}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: num, From: env.TWILIO_FROM, Body: String(text || "").slice(0, 600) }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j.sid } : { ok: false, error: j.message || `twilio ${r.status}` };
  } catch (e) {
    return { ok: false, error: String(e && e.message) };
  }
}

// ---------- Gmail SMTP ----------

export const GMAIL_DAILY_CAP = 450;          // Gmail allows ~500 recipients a day; stop short of it
export const GMAIL_TIMEOUT_MS = 15000;       // whole send, both attempts together
const GMAIL_HOST = "smtp.gmail.com", GMAIL_PORT = 465;
const ADDR_RE = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]+$/;

const noCrLf = (v) => String(v == null ? "" : v).replace(/[\r\n]+/g, " ");
const addr = (v) => { const a = noCrLf(v).trim(); return ADDR_RE.test(a) ? a : ""; };
export const utcDay = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);

async function sendGmail(env, { to, subject, text, html, replyTo }) {
  const user = addr(env.GMAIL_USER);
  const rcpts = to.map(addr).filter(Boolean);
  if (!user) return { ok: false, error: "GMAIL_USER is not a valid address" };
  if (!rcpts.length) return { ok: false, error: "no valid recipient" };
  const day = utcDay();
  const sent = await countToday(env, day);
  if (sent + rcpts.length > GMAIL_DAILY_CAP) {
    console.log("[email not sent: Gmail daily cap]", JSON.stringify({ to: rcpts, subject: noCrLf(subject).slice(0, 200), sentToday: sent }));
    await bump(env, day, "capped", 1);
    return { ok: false, skipped: true, error: "gmail daily cap" };
  }
  const message = buildMessage({ from: user, to: rcpts, subject, text, html, replyTo });
  const connect = env.__connect || (await import("cloudflare:sockets")).connect;
  const budget = Number(env.__smtpTimeoutMs) || GMAIL_TIMEOUT_MS;
  const deadline = Date.now() + budget;
  let last;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const left = deadline - Date.now();
    if (left <= 0) break;
    try {
      await smtpSend(connect, { user, pass: env.GMAIL_APP_PASSWORD, helo: heloName(env), rcpts, message, timeoutMs: left });
      await bump(env, day, "sent", rcpts.length);
      return { ok: true, id: message.id };
    } catch (e) {
      last = e;
      if (e && e.permanent) break;               // 5xx (bad password, refused recipient): retrying will not help
    }
  }
  const error = `gmail: ${String((last && last.message) || "timeout").slice(0, 200)}`;
  console.log("[email failed]", JSON.stringify({ to: rcpts, error }));   // never the password or the AUTH lines
  return { ok: false, error };
}

function heloName(env) {
  const d = String(env.AGENCY_DOMAIN || "").toLowerCase();
  return /^[a-z0-9.-]{1,253}$/.test(d) ? d : "localhost";
}

// D1 counter. Any DB problem (table missing, D1 down) counts as 0 and never blocks the send.
async function countToday(env, day) {
  try {
    const n = await env.DB.prepare("SELECT sent FROM email_sends WHERE day = ?").bind(day).first("sent");
    return Number(n) || 0;
  } catch { return 0; }
}
async function bump(env, day, col, by) {
  try {
    await env.DB.prepare(`INSERT INTO email_sends (day, ${col}) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET ${col} = ${col} + excluded.${col}`).bind(day, by).run();
  } catch { /* counting is best effort */ }
}

// For the desk: today's Gmail use and a warning once the cap is hit. null when Gmail is not in use.
export async function emailStatus(env, now = Date.now()) {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;
  let row = null;
  try { row = await env.DB.prepare("SELECT sent, capped FROM email_sends WHERE day = ?").bind(utcDay(now)).first(); } catch { /* table missing */ }
  const sent = Number(row && row.sent) || 0, capped = Number(row && row.capped) || 0;
  const warning = sent < GMAIL_DAILY_CAP && !capped ? ""
    : `Gmail daily limit reached (${sent}/${GMAIL_DAILY_CAP} today). ${capped ? `${capped} email(s) were not sent, only logged.` : "Further emails today will only be logged."} Leads are still saved. Sending resumes at 00:00 UTC.`;
  return { provider: "gmail", sentToday: sent, cap: GMAIL_DAILY_CAP, cappedToday: capped, warning };
}

// ---------- message (RFC 5322 + MIME) ----------

const enc = new TextEncoder();
function b64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const b64str = (s) => b64(enc.encode(s));
const wrap76 = (s) => s.replace(/.{1,76}/g, "$&\r\n");
const crlf = (s) => String(s || "").replace(/\r\n|\r|\n/g, "\r\n");
const randHex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// RFC 2047: ASCII passes through; otherwise UTF-8 B encoded-words of at most 75 chars, folded.
export function encodeHeaderWord(value) {
  const v = noCrLf(value);
  if (/^[\x20-\x7e]*$/.test(v)) return v;
  const words = [];
  let cur = "";
  for (const ch of v) {
    if (enc.encode(cur + ch).length > 45) { words.push(cur); cur = ""; }
    cur += ch;
  }
  if (cur) words.push(cur);
  return words.map((w) => `=?UTF-8?B?${b64str(w)}?=`).join("\r\n ");
}

// SMTP transparency (RFC 5321 4.5.2): a line starting with "." gets one more.
export const dotStuff = (s) => s.replace(/(^|\r\n)\./g, "$1..");

export function buildMessage({ from, to, subject, text, html, replyTo, now = Date.now() }) {
  const plain = text ? String(text) : String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<[^>]*>/g, "").trim();
  const rich = html ? String(html) : `<!doctype html><html><body><p>${escHtml(plain).replace(/\r?\n/g, "<br>")}</p></body></html>`;
  const domain = from.split("@")[1];
  const id = `<${randHex(16)}@${domain}>`;
  const boundary = `=_sunday_${randHex(12)}`;
  const rt = addr(replyTo);
  const headers = [
    `From: "Sunday Agency" <${from}>`,
    `To: ${to.map(noCrLf).join(", ")}`,
    ...(rt ? [`Reply-To: ${rt}`] : []),
    `Subject: ${encodeHeaderWord(String(subject || "").slice(0, 200))}`,
    `Date: ${new Date(now).toUTCString().replace(/GMT$/, "+0000")}`,
    `Message-ID: ${id}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const part = (type, body) => [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", wrap76(b64str(crlf(body)))].join("\r\n");
  const data = `${headers.join("\r\n")}\r\n\r\n${part("text/plain", plain)}${part("text/html", rich)}--${boundary}--\r\n`;
  return { id, data };
}

// ---------- SMTP conversation ----------

class SmtpError extends Error {
  constructor(msg, code) { super(msg); this.code = code; this.permanent = code >= 500; }
}

// Reads whole SMTP replies: "250-a\r\n250-b\r\n250 c\r\n" is one reply.
function replyReader(readable) {
  const reader = readable.getReader();
  const dec = new TextDecoder();
  let buf = "";
  return {
    async next() {
      const lines = [];
      for (;;) {
        const i = buf.indexOf("\n");
        if (i < 0) {
          const { value, done } = await reader.read();
          if (done) throw new SmtpError("connection closed by server");
          buf += dec.decode(value, { stream: true });
          continue;
        }
        const line = buf.slice(0, i).replace(/\r$/, "");
        buf = buf.slice(i + 1);
        const m = /^(\d{3})([ -]?)(.*)$/.exec(line);
        if (!m) throw new SmtpError(`bad reply: ${line.slice(0, 80)}`);
        lines.push(m[3]);
        if (m[2] !== "-") return { code: Number(m[1]), text: lines.join(" | ") };
      }
    },
    release() { try { reader.releaseLock(); } catch { /* closed */ } },
  };
}

async function smtpSend(connect, { user, pass, helo, rcpts, message, timeoutMs }) {
  const socket = connect({ hostname: GMAIL_HOST, port: GMAIL_PORT }, { secureTransport: "on", allowHalfOpen: false });
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new SmtpError("timeout")), timeoutMs); });
  const run = async () => {
    if (socket.opened) await socket.opened;
    const writer = socket.writable.getWriter();
    const replies = replyReader(socket.readable);
    const send = (line) => writer.write(enc.encode(`${line}\r\n`));
    const expect = async (ok, step) => {
      const r = await replies.next();
      if (!ok.includes(r.code)) throw new SmtpError(`${step} ${r.code} ${r.text.slice(0, 120)}`, r.code);
      return r;
    };
    try {
      await expect([220], "greeting");
      await send(`EHLO ${helo}`); await expect([250], "EHLO");
      await send("AUTH LOGIN"); await expect([334], "AUTH");
      await send(b64str(user)); await expect([334], "AUTH user");
      await send(b64str(String(pass).replace(/\s+/g, ""))); await expect([235], "AUTH password");
      await send(`MAIL FROM:<${user}>`); await expect([250], "MAIL FROM");
      for (const r of rcpts) { await send(`RCPT TO:<${r}>`); await expect([250, 251], "RCPT TO"); }
      await send("DATA"); await expect([354], "DATA");
      await writer.write(enc.encode(`${dotStuff(message.data)}.\r\n`));
      await expect([250], "message");
      // Message accepted: say QUIT but never wait on its reply, so a silent server cannot turn a delivered mail into a "timeout".
      send("QUIT").catch(() => { /* already delivered */ });
    } finally {
      replies.release();
      try { writer.releaseLock(); } catch { /* closed */ }
    }
  };
  try {
    await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
    try { await socket.close(); } catch { /* already closed */ }
  }
}
