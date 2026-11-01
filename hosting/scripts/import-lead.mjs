#!/usr/bin/env node
// Lead Desk lead (status "Won") -> new site row, prefilled. DRY RUN unless --apply.
//   node hosting/scripts/import-lead.mjs [--file data/leads.json] [--id <leadId>] [--apply [--remote]]
// --apply runs `wrangler d1 execute DB` (local database unless --remote). Nothing is written without --apply.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const file = opt('--file') || new URL('../../data/leads.json', import.meta.url).pathname;
const only = opt('--id');
const apply = args.includes('--apply');

const TRADE_BY_NICHE = [[/roof/i, 'roofing'], [/hvac|heating|air cond/i, 'hvac'], [/plumb/i, 'plumbing'], [/electric/i, 'electrical'], [/fenc/i, 'fencing'],
  [/pressure|power wash/i, 'pressure'], [/landscap|lawn/i, 'landscaping'], [/tree/i, 'tree'], [/garage/i, 'garage'], [/paint/i, 'painting'], [/concrete/i, 'concrete']];
const tradeOf = (niche) => (TRADE_BY_NICHE.find(([re]) => re.test(niche || '')) || [0, 'roofing'])[1];
const slugify = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'site';

export function siteRowFromLead(lead, now = new Date().toISOString()) {
  const trade = tradeOf(lead.niche);
  const city = lead.town || lead.searchCity?.split(',')[0] || '';
  const form = { company: lead.name, trade, city, phone: lead.phone || '', ...(lead.rating ? { rating: lead.rating } : {}), ...(lead.reviewCount ? { reviews: lead.reviewCount } : {}) };
  const slug = slugify(`${lead.name}-${city}`);
  return { id: slug, slug, domain: null, status: 'draft', form_json: JSON.stringify(form), owner_name: lead.name, owner_email: lead.email || null, owner_sms: lead.phone || null,
    notify_email: lead.email || null, notify_sms: null, place_id: lead.id || null, plan: null, stripe_customer: null, stripe_sub: null, paid_through: null, created_at: now, updated_at: now };
}

const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
export const insertSql = (row) => `INSERT INTO sites (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(q).join(', ')});`;

if (import.meta.url === `file://${process.argv[1]}`) {
  let leads;
  try { leads = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(1); }
  const won = Object.values(leads).filter((l) => (only ? l.id === only : l.status === 'Won'));
  if (!won.length) { console.log(only ? `No lead with id ${only}.` : 'No leads marked Won.'); process.exit(0); }
  for (const lead of won) {
    const row = siteRowFromLead(lead);
    console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${lead.name} -> site "${row.id}"`);
    console.log(JSON.stringify({ ...row, form_json: JSON.parse(row.form_json) }, null, 2));
    if (!apply) continue;
    const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'DB', remoteFlag(), '--command', insertSql(row)].filter(Boolean), { stdio: 'inherit', cwd: new URL('..', import.meta.url).pathname });
    if (r.status !== 0) { console.error('wrangler failed; nothing else was written.'); process.exit(1); }
  }
  if (!apply) console.log('\nNothing written. Add --apply to create the row(s).');
}
function remoteFlag() { return args.includes('--remote') ? '--remote' : '--local'; }
