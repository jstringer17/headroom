// Owner login: one-time email links and a signed session cookie. No passwords.
// Uses only Web Crypto (Workers and Node 20+ both have it).
export const COOKIE = "__Host-admin";
export const LINK_MINUTES = 15;
export const SESSION_DAYS = 30;
export const LINKS_PER_HOUR = 5;

const enc = new TextEncoder();
const b64url = (buf) => {
  let s = "";
  new Uint8Array(buf).forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s) => {
  const t = atob(String(s).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(s).length + 3) % 4));
  return Uint8Array.from(t, (c) => c.charCodeAt(0));
};

export function newToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return b64url(b);
}

export async function sha256Hex(s) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(String(s)));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// "<payload>.<signature>", payload = { s: siteId, e: email, x: expires ms }.
export async function signSession(secret, siteId, email, now = Date.now()) {
  const body = b64url(enc.encode(JSON.stringify({ s: String(siteId), e: email, x: now + SESSION_DAYS * 864e5 })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function readSession(secret, value, now = Date.now()) {
  if (!secret || !value || typeof value !== "string") return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (!p || typeof p.x !== "number" || p.x < now) return null;
    return { siteId: String(p.s), email: String(p.e || "") };
  } catch (_) {
    return null;
  }
}

export function cookieOf(request, name = COOKIE) {
  const h = request.headers.get("cookie") || "";
  for (const part of h.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1);
  }
  return "";
}

export const sessionCookie = (value) => `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
