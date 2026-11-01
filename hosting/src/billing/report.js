// Monthly lead report e-mail: an add-on, OFF unless var MONTHLY_REPORT=1. Runs from the daily sweep on the 1st (UTC).
import { getDeps } from './deps.js';

export async function monthlyLeadReport(env, { force = false } = {}) {
  if (env.MONTHLY_REPORT !== '1') return { skipped: 'off' };
  const d = getDeps(env);
  const now = new Date(d.now());
  if (now.getUTCDate() !== 1 && !force) return { skipped: 'not the 1st' };
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const label = start.toISOString().slice(0, 7);
  const { results = [] } = await env.DB.prepare("SELECT s.* FROM sites s JOIN addons a ON a.site_id = s.id AND a.kind = 'report' AND a.status = 'active' WHERE s.status = 'live' AND s.owner_email IS NOT NULL").all();
  const sent = [];
  for (const s of results) {
    const claim = await env.DB.prepare('INSERT OR IGNORE INTO events (id, site_id, kind, data, at) VALUES (?, ?, ?, ?, ?)')
      .bind(`report:${s.id}:${label}`, s.id, 'billing.report', '{}', now.toISOString()).run();
    if ((claim?.meta?.changes ?? 0) === 0) continue; // already sent this month
    const { results: leads = [] } = await env.DB.prepare('SELECT service FROM leads WHERE site_id = ? AND created_at >= ? AND created_at < ?').bind(s.id, start.toISOString(), end.toISOString()).all();
    const by = {};
    for (const l of leads) by[l.service || 'Other'] = (by[l.service || 'Other'] || 0) + 1;
    const lines = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k}: ${v}`).join('\n');
    const text = `Hi ${s.owner_name || 'there'},\n\nYour website sent you ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'} in ${label}.${lines ? `\n\nBy service:\n${lines}` : ''}\n\nThanks for being a customer.`;
    await d.sendEmail(env, { to: s.owner_email, subject: `Your website leads for ${label}`, text, html: `<p>${text.replace(/\n/g, '<br>')}</p>` });
    sent.push(s.id);
  }
  return { sent };
}
