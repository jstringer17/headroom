// Billing: Stripe Checkout + webhook + portal + grace sweep. See org/handoffs/billing-desk.md.
import { verifyStripeSignature, stripeApi } from './stripe.js';
import { getDeps, DAY, graceDays, ADDON_KINDS, getSite, siteByCustomer, siteBySub, patchSite, claimEvent, releaseEvent } from './deps.js';
import { monthlyLeadReport } from './report.js';

const iso = (ms) => new Date(ms).toISOString();
const base = (env) => `https://desk.${env.AGENCY_DOMAIN}`;

// ---- links -------------------------------------------------------------------------------
export async function checkoutLink(env, siteId, { addon } = {}) {
  const d = getDeps(env);
  const site = await getSite(env, siteId);
  if (!site) throw new Error('unknown site');
  const items = [];
  if (addon) {
    const price = env[ADDON_KINDS[addon]];
    if (!price) throw new Error(`no price set for add-on "${addon}"`);
    items.push({ price, quantity: 1 });
  } else {
    if (!env.STRIPE_PRICE_MONTHLY) throw new Error('STRIPE_PRICE_MONTHLY is not set');
    items.push({ price: env.STRIPE_PRICE_MONTHLY, quantity: 1 });
    if (env.STRIPE_PRICE_SETUP) items.push({ price: env.STRIPE_PRICE_SETUP, quantity: 1 });
  }
  const meta = { siteId, ...(addon ? { addon } : {}) };
  const session = await stripeApi(env, d.fetch, 'POST', '/checkout/sessions', {
    mode: 'subscription',
    line_items: items,
    client_reference_id: siteId,
    metadata: meta,
    subscription_data: { metadata: meta },
    ...(site.stripe_customer ? { customer: site.stripe_customer } : site.owner_email ? { customer_email: site.owner_email } : {}),
    success_url: `https://${site.domain || `desk.${env.AGENCY_DOMAIN}`}/?paid=1`,
    cancel_url: `https://${site.domain || `desk.${env.AGENCY_DOMAIN}`}/`,
  });
  return session.url;
}

export async function portalLink(env, siteId) {
  const d = getDeps(env);
  const site = await getSite(env, siteId);
  if (!site?.stripe_customer) throw new Error('site has no Stripe customer yet');
  const s = await stripeApi(env, d.fetch, 'POST', '/billing_portal/sessions', {
    customer: site.stripe_customer,
    return_url: site.domain ? `https://${site.domain}/` : base(env),
  });
  return s.url;
}

// ---- webhook -----------------------------------------------------------------------------
async function resolveSite(env, type, obj) {
  const meta = obj.metadata || obj.subscription_details?.metadata || obj.parent?.subscription_details?.metadata || {};
  if (type === 'checkout.session.completed') return getSite(env, obj.client_reference_id || meta.siteId);
  return (meta.siteId && (await getSite(env, meta.siteId)))
    || (await siteByCustomer(env, obj.customer)) || (await siteBySub(env, subIdOf(type, obj)));
}

export async function stripeWebhook(request, env) {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
  const d = getDeps(env);
  const payload = await request.text();
  const ok = await verifyStripeSignature(payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET, Math.floor(d.now() / 1000));
  if (!ok) return new Response('bad signature', { status: 400 });
  let event;
  try { event = JSON.parse(payload); } catch { return new Response('bad json', { status: 400 }); }
  const obj = event?.data?.object;
  if (!event?.id || !event.type || !obj) return new Response('bad event', { status: 400 });

  const site = await resolveSite(env, event.type, obj);
  if (!site) return json({ ignored: 'no matching site' }); // 200 so Stripe stops retrying
  if (!(await claimEvent(env, event.id, site.id, `stripe.${event.type}`, { object: obj.id }, d.now()))) return json({ duplicate: true });
  try {
    await handle(env, d, event.type, obj, site);
  } catch (err) {
    await releaseEvent(env, event.id); // let Stripe retry
    return new Response(`error: ${err.message}`, { status: 500 });
  }
  return json({ ok: true });
}
const json = (b) => new Response(JSON.stringify(b), { headers: { 'content-type': 'application/json' } });

// Only the main plan subscription may change the site's status or paid_through.
// Stripe moved the invoice's subscription id to parent.subscription_details (API 2025-03-31.basil): read both places.
const subIdOf = (type, obj) => (type.startsWith('customer.subscription.') ? obj.id : (obj.subscription || obj.parent?.subscription_details?.subscription || null));
const addonOf = (obj) => obj.metadata?.addon || obj.subscription_details?.metadata?.addon || obj.parent?.subscription_details?.metadata?.addon || null;
// 'main' | 'addon' | 'unknown' (no main subscription on file and no add-on mark: change nothing).
function classify(site, type, obj) {
  if (addonOf(obj)) return 'addon';
  if (!site.stripe_sub) return 'unknown';
  return subIdOf(type, obj) === site.stripe_sub ? 'main' : 'addon';
}
const canceledId = (sub) => `canceled:${sub}`;
const wasCanceled = async (env, sub) => !!sub && !!(await env.DB.prepare('SELECT 1 AS x FROM events WHERE id = ?').bind(canceledId(sub)).first());
const markCanceled = (env, site, sub, now) => (sub ? claimEvent(env, canceledId(sub), site.id, 'billing.sub_canceled', { sub }, now) : null);
const setAddon = (env, siteId, sub, status) => env.DB.prepare('UPDATE addons SET status = ? WHERE site_id = ? AND stripe_item = ?').bind(status, siteId, sub).run();

async function goLive(env, d, site, fields = {}) {
  const wasLive = site.status === 'live';
  await patchSite(env, site.id, { status: 'live', ...fields }, d.now());
  if (!wasLive) await d.publishSite(env, site.id);
}
const goOff = (env, d, site) => (site.status === 'off' ? null : patchSite(env, site.id, { status: 'off' }, d.now()));

async function handle(env, d, type, obj, site) {
  const now = d.now();
  switch (type) {
    case 'checkout.session.completed': {
      const addon = obj.metadata?.addon;
      if (addon) { // add-on bought: record it, leave the site's status alone
        await env.DB.prepare('DELETE FROM addons WHERE site_id = ? AND kind = ?').bind(site.id, addon).run();
        await env.DB.prepare('INSERT INTO addons (site_id, kind, status, stripe_item) VALUES (?, ?, ?, ?)')
          .bind(site.id, addon, 'active', obj.subscription || '').run();
        return;
      }
      if (await wasCanceled(env, obj.subscription)) return; // checkout event arrived after that subscription was canceled
      await goLive(env, d, site, { stripe_customer: obj.customer, stripe_sub: obj.subscription, plan: 'monthly', paid_through: iso(now + 31 * DAY) });
      return;
    }
    case 'invoice.paid': {
      const kind = classify(site, type, obj), sub = subIdOf(type, obj);
      if (kind === 'addon') return setAddon(env, site.id, sub, 'active');
      if (kind === 'unknown') return claimEvent(env, `unknown:${obj.id}`, site.id, 'billing.unknown_sub', { type, sub }, now);
      const end = (obj.lines?.data || []).map((l) => l.period?.end).filter(Boolean).sort().pop();
      const through = end ? iso(end * 1000) : iso(now + 31 * DAY);
      const fields = { paid_through: through };
      if (site.status === 'off' && !(await wasCanceled(env, sub))) await goLive(env, d, site, fields); // paid after being switched off (not after a cancel)
      else await patchSite(env, site.id, fields, now);
      return;
    }
    case 'invoice.payment_failed': { // still live: the grace period runs from paid_through
      const kind = classify(site, type, obj), sub = subIdOf(type, obj);
      if (kind === 'unknown') return claimEvent(env, `unknown:${obj.id}`, site.id, 'billing.unknown_sub', { type, sub }, now);
      if (kind === 'addon') { // an add-on card problem never threatens the website
        await setAddon(env, site.id, sub, 'past_due');
        let l = ''; try { l = await portalLink(env, site.id); } catch { /* no link */ }
        if (site.owner_email) await d.sendEmail(env, { to: site.owner_email, subject: 'An add-on payment did not go through', text: `Hi ${site.owner_name || 'there'},\n\nWe could not take the payment for one of your add-ons. Your website is not affected.${l ? `\n\nUpdate your card here: ${l}` : ''}`, html: '' });
        return;
      }
      let link = '';
      try { link = await portalLink(env, site.id); } catch { /* send the email without a link */ }
      if (site.owner_email) {
        const days = graceDays(env);
        const text = `Hi ${site.owner_name || 'there'},\n\nWe could not take your monthly payment for your website. Your site stays online for now, but it will be switched off if the payment is not fixed within ${days} days.\n\n${link ? `Update your card here: ${link}\n\n` : 'Reply to this email and we will help you update your card.\n\n'}Thank you.`;
        await d.sendEmail(env, { to: site.owner_email, subject: 'Your website payment did not go through', text, html: `<p>${text.replace(/\n\n/g, '</p><p>').replace(link || '\u0000', link ? `<a href="${link}">${link}</a>` : '')}</p>` });
      }
      return;
    }
    case 'customer.subscription.updated': {
      const s = obj.status;
      const kind = classify(site, type, obj);
      if (kind === 'addon') return setAddon(env, site.id, obj.id, s === 'active' ? 'active' : s === 'past_due' ? 'past_due' : 'canceled');
      if (kind === 'unknown') return claimEvent(env, `unknown:${obj.id}:${s}`, site.id, 'billing.unknown_sub', { type, sub: obj.id }, now);
      if (s === 'canceled') await markCanceled(env, site, obj.id, now);
      const lapsed = Date.parse(site.paid_through || 0) + graceDays(env) * DAY < now;
      if (s === 'canceled' || s === 'unpaid' || s === 'incomplete_expired') return goOff(env, d, site);
      if (s === 'past_due') return lapsed ? goOff(env, d, site) : null;
      if (s === 'active' && site.status === 'off' && !(await wasCanceled(env, obj.id))) await goLive(env, d, site);
      return;
    }
    case 'customer.subscription.deleted': {
      const kind = classify(site, type, obj);
      if (kind === 'addon') return setAddon(env, site.id, obj.id, 'canceled');
      if (kind === 'unknown') return claimEvent(env, `unknown:${obj.id}:deleted`, site.id, 'billing.unknown_sub', { type, sub: obj.id }, now);
      await markCanceled(env, site, obj.id, now);
      return goOff(env, d, site);
    }
  }
}

// ---- daily backup sweep ------------------------------------------------------------------
export async function billingSweep(env) {
  const d = getDeps(env);
  const now = d.now();
  const grace = graceDays(env) * DAY;
  const { results = [] } = await env.DB.prepare("SELECT * FROM sites WHERE status = 'live' AND stripe_sub IS NOT NULL AND stripe_sub != '' AND paid_through IS NOT NULL").all();
  const turnedOff = [];
  for (const site of results) {
    if (Date.parse(site.paid_through) + grace >= now) continue;
    await patchSite(env, site.id, { status: 'off' }, now);
    await claimEvent(env, `sweep:${site.id}:${iso(now).slice(0, 10)}`, site.id, 'billing.sweep_off', { paid_through: site.paid_through }, now);
    if (site.owner_email) {
      await d.sendEmail(env, { to: site.owner_email, subject: 'Your website has been switched off', text: `Hi ${site.owner_name || 'there'},\n\nYour website was switched off because we have not received payment. Fix your card and it comes back on right away. Reply to this email if you need help.`, html: '' }).catch(() => {});
    }
    turnedOff.push(site.id);
  }
  const report = await monthlyLeadReport(env);
  return { turnedOff, report };
}
