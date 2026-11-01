// Stripe helpers: REST calls with fetch, webhook signature check with Web Crypto. No SDK.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

// header: "t=1700000000,v1=abc...,v1=def..."  Valid when any v1 matches and |now - t| <= tolerance.
export async function verifyStripeSignature(payload, header, secret, nowSec = Math.floor(Date.now() / 1000), tolerance = 300) {
  if (!header || !secret) return false;
  let t = null; const sigs = [];
  for (const part of String(header).split(',')) {
    const i = part.indexOf('=');
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === 't') t = v; else if (k === 'v1') sigs.push(v);
  }
  const ts = Number(t);
  if (!Number.isFinite(ts) || !sigs.length || Math.abs(nowSec - ts) > tolerance) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => safeEqual(s, expected));
}

// Stripe wants form encoding with brackets: line_items[0][price]=...
export function encodeForm(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === 'object' ? encodeForm(x, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`)));
    else if (typeof v === 'object') encodeForm(v, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
  }
  return out;
}

export async function stripeApi(env, fetchFn, method, path, params = {}) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  const body = encodeForm(params).join('&');
  const res = await fetchFn(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Stripe ${path}: ${json?.error?.message || res.status}`);
  return json;
}
