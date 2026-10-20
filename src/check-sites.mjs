// Step 2: visit every lead's website and note what's wrong with it.
// Usage: node src/check-sites.mjs        (only leads not checked yet)
//        node src/check-sites.mjs --all  (re-check everyone)
import { loadLeads, saveLeads, launchBrowser } from './store.mjs';

const recheck = process.argv.includes('--all');
const SOCIAL = /(facebook\.com|fb\.me|instagram\.com|yelp\.com|linktr\.ee|nextdoor\.com|business\.site|sites\.google\.com|angi\.com|homeadvisor\.com|thumbtack\.com|bbb\.org|houzz\.com)/i;
const BUILDERS = [['wix', /wix\.com|_wixCIDX|wixstatic/i], ['godaddy', /godaddy|img1\.wsimg\.com/i], ['squarespace', /squarespace/i], ['weebly', /weebly/i], ['wordpress', /wp-content/i], ['duda', /dudaone|multiscreensite/i]];

// Some sites block simple requests (403) or a deep link is dead (404).
// Before calling a site broken, load the home page in a real browser tab.
async function fetchHtml(context, url) {
  const ua = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36' };
  let firstStatus = 0;
  for (const u of [...new Set([url, new URL(url).origin + '/'])]) {
    try {
      const res = await context.request.get(u, { timeout: 20000, maxRedirects: 8, headers: ua });
      firstStatus ||= res.status();
      if (res.status() < 400) return { status: res.status(), finalUrl: res.url(), html: await res.text() };
    } catch {}
  }
  const page = await context.newPage();
  try {
    for (const u of [url, new URL(url).origin + '/']) {
      const res = await page.goto(u, { timeout: 25000, waitUntil: 'domcontentloaded' }).catch(() => null);
      const html = res ? await page.content() : '';
      if (res && res.status() < 400 && html.length > 1500) return { status: res.status(), finalUrl: page.url(), html, viaBrowser: true };
      if (u.endsWith('/') && new URL(url).pathname === '/') break;
    }
    // 401/403/429/503 usually means bot protection, not a dead site.
    return { status: firstStatus, blocked: [401, 403, 429, 503].includes(firstStatus), error: 'Did not load in a browser either' };
  } finally { await page.close(); }
}

async function checkSite(context, url) {
  const site = { checkedAt: new Date().toISOString(), url };
  if (SOCIAL.test(url)) return { ...site, socialOnly: true };
  const start = Date.now();
  try {
    const got = await fetchHtml(context, url);
    site.ms = Date.now() - start;
    site.status = got.status;
    if (!got.html) return got.blocked ? { ...site, blockedCheck: true } : { ...site, broken: true, error: got.error };
    site.finalUrl = got.finalUrl;
    const html = got.html.slice(0, 600000);
    const year = new Date().getFullYear();
    const years = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => +m[1]).filter((y) => y > 1995 && y <= year);
    Object.assign(site, {
      https: site.finalUrl.startsWith('https:'),
      mobileFriendly: /<meta[^>]+name=["']?viewport/i.test(html),
      telLink: /href=["']tel:/i.test(html),
      hasForm: /<form[\s>]/i.test(html) || /calendly|typeform|jotform|hubspot|leadconnector|housecallpro|jobber/i.test(html),
      mailtoOnly: /href=["']mailto:/i.test(html) && !/<form[\s>]/i.test(html),
      copyrightYear: years.length ? Math.max(...years) : null,
      parked: /domain (is )?for sale|parked free|this domain|buy this domain|godaddy\.com\/park/i.test(html) && html.length < 40000,
      builder: BUILDERS.find(([, re]) => re.test(html))?.[0] || null,
      title: html.match(/<title[^>]*>([^<]{0,120})/i)?.[1]?.trim() || null,
    });
    if (site.parked) site.broken = true;
    return site;
  } catch (e) {
    return { ...site, broken: true, error: e.message.split('\n')[0].slice(0, 120) };
  }
}

const leads = loadLeads();
const todo = Object.values(leads).filter((l) => l.website && (recheck || !l.site));
console.log(`Checking ${todo.length} websites...`);
const { browser, context } = await launchBrowser();
let done = 0;
const workers = Array.from({ length: 4 }, async () => {
  while (todo.length) {
    const lead = todo.shift();
    lead.site = await checkSite(context, lead.website);
    done++;
    const s = lead.site;
    console.log(`  ${lead.name}: ${s.socialOnly ? 'social page only' : s.blockedCheck ? 'could not check (bot protection)' : s.broken ? 'BROKEN' : [s.mobileFriendly ? '' : 'not mobile', s.https ? '' : 'no https', s.telLink ? '' : 'no tap-to-call', s.hasForm ? '' : 'no form'].filter(Boolean).join(', ') || 'ok'}`);
    if (done % 20 === 0) saveLeads(leads);
  }
});
await Promise.all(workers);
saveLeads(leads);
await browser.close();
console.log(`Done. Checked ${done}.`);
