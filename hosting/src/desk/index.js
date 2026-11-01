// CEO Customer Desk at desk.<AGENCY_DOMAIN>. Every request must carry a valid Cloudflare Access JWT.
import { verifyAccess } from './access.js';
import { loadCustomers } from './data.js';
import { PAGE } from './page.js';
import { checkoutLink, portalLink } from '../billing/index.js';
import { getDeps, getSite, patchSite, claimEvent, graceDays, DAY, ADDON_KINDS } from '../billing/deps.js';

const respond = (body, status = 200, type = 'application/json') =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY' } });
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function deskApp(request, env) {
  const email = await verifyAccess(request, env);
  if (!email) return respond('Forbidden', 403, 'text/plain');
  const d = getDeps(env);
  const url = new URL(request.url);
  const p = url.pathname;

  if (request.method === 'GET' && p === '/') return respond(PAGE, 200, 'text/html; charset=utf-8');
  if (request.method === 'GET' && p === '/api/customers') return respond(await loadCustomers(env, d.now()));

  const m = p.match(/^\/api\/sites\/([^/]+)\/(checkout|portal|pause|resume|login-link|addon)(?:\/([a-z]+))?$/);
  if (!m) return respond({ error: 'not found' }, 404);
  const [, id, action, arg] = m;
  // Cookie-based Access login would let another website post here; a custom header cannot be sent cross-site.
  if (request.method === 'POST' && request.headers.get('x-desk') !== '1') return respond({ error: 'missing x-desk header' }, 403);
  const site = await getSite(env, decodeURIComponent(id));
  if (!site) return respond({ error: 'unknown site' }, 404);

  try {
    if (request.method === 'GET' && action === 'checkout') return respond({ url: await checkoutLink(env, site.id) });
    if (request.method === 'GET' && action === 'portal') return respond({ url: await portalLink(env, site.id) });
    if (request.method === 'GET' && action === 'addon' && ADDON_KINDS[arg]) return respond({ url: await checkoutLink(env, site.id, { addon: arg }) });
    if (request.method !== 'POST') return respond({ error: 'method not allowed' }, 405);

    if (action === 'pause') {
      if (site.status !== 'live') return respond({ error: `site is ${site.status}, not live` }, 409);
      await patchSite(env, site.id, { status: 'paused' }, d.now());
      await claimEvent(env, crypto.randomUUID(), site.id, 'desk.pause', { by: email }, d.now());
      return respond({ ok: true, status: 'paused' });
    }
    if (action === 'resume') {
      if (site.status !== 'paused') return respond({ error: `site is ${site.status}, not paused` }, 409);
      if (site.stripe_sub && site.paid_through && Date.parse(site.paid_through) + graceDays(env) * DAY < d.now()) return respond({ error: 'payment is past grace; collect payment first' }, 409);
      await patchSite(env, site.id, { status: 'live' }, d.now());
      await claimEvent(env, crypto.randomUUID(), site.id, 'desk.resume', { by: email }, d.now());
      return respond({ ok: true, status: 'live' });
    }
    if (action === 'login-link') { // one-time owner login link (15 min), same table owner-admin reads
      if (!site.owner_email || !site.domain) return respond({ error: 'site needs owner_email and domain' }, 409);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const hash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
      await env.DB.prepare('INSERT INTO logins (token_hash, site_id, email, expires_at, used) VALUES (?, ?, ?, ?, 0)')
        .bind(hash, site.id, site.owner_email, new Date(d.now() + 15 * 60e3).toISOString()).run();
      const link = `https://${site.domain}/admin/login?t=${token}`;
      await d.sendEmail(env, { to: site.owner_email, subject: 'Your website login link', text: `Tap to sign in (works once, for 15 minutes):\n${link}`, html: `<p>Tap to sign in (works once, for 15 minutes):</p><p><a href="${link}">Sign in</a></p>` });
      await claimEvent(env, crypto.randomUUID(), site.id, 'desk.login_link', { by: email }, d.now());
      return respond({ ok: true, sentTo: site.owner_email });
    }
  } catch (err) {
    return respond({ error: err.message }, 502);
  }
  return respond({ error: 'not found' }, 404);
}
