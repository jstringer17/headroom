// Second lock behind Cloudflare Access: verify the Cf-Access-Jwt-Assertion header ourselves.
// Needs vars CF_ACCESS_TEAM (e.g. "myagency"), CF_ACCESS_AUD (app audience tag), DESK_EMAILS (comma list: CEO + partner).
// Anything missing or wrong -> not allowed (fails closed).
const b64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const parse = (s) => JSON.parse(new TextDecoder().decode(b64(s)));
let certCache = { at: 0, keys: null };

async function loadKeys(env, o) {
  if (o.fetchCerts) return o.fetchCerts(env);
  if (certCache.keys && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const res = await fetch(`https://${env.CF_ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs');
  certCache = { at: Date.now(), keys: (await res.json()).keys };
  return certCache.keys;
}

// Returns the verified email, or null.
export async function verifyAccess(request, env) {
  try {
    const o = env.__deps || {};
    const allowed = String(env.DESK_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!allowed.length || !env.CF_ACCESS_AUD || !env.CF_ACCESS_TEAM) return null;
    const jwt = request.headers.get('cf-access-jwt-assertion');
    const [h, p, s] = String(jwt || '').split('.');
    if (!h || !p || !s) return null;
    const head = parse(h), body = parse(p);
    if (head.alg !== 'RS256') return null;
    const jwk = (await loadKeys(env, o)).find((k) => k.kid === head.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const good = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64(s), new TextEncoder().encode(`${h}.${p}`));
    if (!good) return null;
    const now = (o.now ? o.now() : Date.now()) / 1000;
    if (!(body.exp > now) || (body.nbf && body.nbf > now + 60)) return null;
    if (![].concat(body.aud || []).includes(env.CF_ACCESS_AUD)) return null;
    if (body.iss !== `https://${env.CF_ACCESS_TEAM}.cloudflareaccess.com`) return null;
    const email = String(body.email || '').toLowerCase();
    return allowed.includes(email) ? email : null;
  } catch { return null; }
}
