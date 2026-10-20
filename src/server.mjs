// The dashboard: http://localhost:3000
// Shows every lead, lets you filter, update status/notes, and start new searches.
import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { loadLeads, saveLeads } from './store.mjs';
import { scoreLead } from './score.mjs';

const PORT = process.env.PORT || 3000;
const PAGE = new URL('../public/index.html', import.meta.url);
const STATUSES = ['New', 'Called', 'No answer', 'Talking', 'Demo booked', 'Demo done', 'Won', 'Lost', 'Do not call'];

let job = null; // one search at a time
const log = [];
const say = (line) => { log.push(line); if (log.length > 400) log.shift(); };

function runSearch(niche, city) {
  if (job) return false;
  log.length = 0;
  say(`Searching "${niche}" in ${city}...`);
  const steps = [['src/scrape.mjs', niche, city], ['src/check-sites.mjs'], ['src/score.mjs']];
  const next = () => {
    const step = steps.shift();
    if (!step) { say('Done. Refresh the list.'); job = null; return; }
    job = spawn(process.execPath, step, { cwd: new URL('..', import.meta.url).pathname });
    for (const s of [job.stdout, job.stderr]) s.on('data', (d) => String(d).split('\n').filter(Boolean).forEach(say));
    job.on('close', (code) => (code === 0 ? next() : (say(`Stopped (exit ${code}).`), (job = null))));
  };
  next();
  return true;
}

const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(PAGE).pipe(res);
  }
  if (req.method === 'GET' && url.pathname === '/api/leads') {
    const leads = Object.values(loadLeads()).map((l) => ({ ...l, ...scoreLead(l) }));
    return json(res, 200, { leads, statuses: STATUSES });
  }
  const m = url.pathname.match(/^\/api\/leads\/(.+)$/);
  if (req.method === 'PATCH' && m) {
    const leads = loadLeads();
    const lead = leads[decodeURIComponent(m[1])];
    if (!lead) return json(res, 404, { error: 'not found' });
    const body = await readBody(req);
    for (const k of ['status', 'notes', 'followUp']) if (k in body) lead[k] = String(body[k]).slice(0, 4000);
    if (body.status && body.status !== 'New') lead.lastContact = new Date().toISOString();
    saveLeads(leads);
    return json(res, 200, lead);
  }
  if (req.method === 'POST' && url.pathname === '/api/search') {
    const { niche, city } = await readBody(req);
    if (!niche || !city) return json(res, 400, { error: 'niche and city are required' });
    return json(res, runSearch(String(niche).slice(0, 80), String(city).slice(0, 80)) ? 200 : 409, { running: true });
  }
  if (req.method === 'GET' && url.pathname === '/api/search') return json(res, 200, { running: !!job, log });
  json(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`Dashboard: http://localhost:${PORT}`));
