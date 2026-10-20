// Step 1: search Google Maps for every niche x city and save each business.
// Usage: node src/scrape.mjs                      (everything in config.mjs)
//        node src/scrape.mjs "roofer" "Tucson, AZ" (one search)
import { NICHES, CITIES, MAX_PER_SEARCH, PAUSE_BETWEEN_PLACES, PAUSE_BETWEEN_SEARCHES, SKIP_NAMES } from './config.mjs';
import { loadLeads, saveLeads, pause, launchBrowser } from './store.mjs';

const [argNiche, argCity] = process.argv.slice(2);
const niches = argNiche ? [argNiche] : NICHES;
const cities = argCity ? [argCity] : CITIES;

const placeId = (url) => url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/)?.[1] ?? url.split('?')[0];

async function collectPlaceUrls(page, query) {
  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=en`, { waitUntil: 'domcontentloaded' });
  if (/sorry|unusual traffic/i.test(page.url() + (await page.title()))) throw new Error('Google is asking for a captcha. Wait an hour and try again.');
  try {
    await page.waitForSelector('a.hfpxzc', { timeout: 20000 });
  } catch {
    // A search with one match opens the place page directly.
    return page.url().includes('/maps/place/') ? [page.url()] : [];
  }
  let last = 0;
  for (let i = 0; i < 40; i++) {
    const count = await page.$$eval('a.hfpxzc', (a) => a.length);
    if (count >= MAX_PER_SEARCH) break;
    const end = await page.$('span.HlvSq'); // "You've reached the end of the list."
    if (end || (i > 3 && count === last)) break;
    last = count;
    await page.$eval('div[role="feed"]', (f) => f.scrollBy(0, 4000)).catch(() => {});
    await page.waitForTimeout(1500);
  }
  const urls = await page.$$eval('a.hfpxzc', (a) => a.map((x) => x.href));
  return urls.slice(0, MAX_PER_SEARCH);
}

async function readPlace(page, url) {
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'hl=en', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 20000 });
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const item = (pre) => document.querySelector(`[data-item-id^="${pre}"]`);
    const label = (el) => el?.getAttribute('aria-label')?.replace(/^[^:]+:\s*/, '').trim() || null;
    const ratingText = document.querySelector('div.F7nice')?.innerText || '';
    const reviewLabel = [...document.querySelectorAll('div.F7nice [aria-label], div.F7nice span')]
      .map((e) => e.getAttribute('aria-label') || e.innerText).find((t) => /\d/.test(t) && /review|\(/i.test(t)) || '';
    const reviewCount = reviewLabel ? Number((reviewLabel.match(/[\d,]+/) || ['0'])[0].replace(/,/g, '')) : null; // hidden in Maps' signed-out view
    const phoneEl = item('phone:tel:');
    return {
      name: document.querySelector('h1')?.innerText.trim(),
      category: document.querySelector('button.DkEaL')?.innerText.trim() || null,
      rating: parseFloat(ratingText) || null,
      reviewCount,
      address: label(item('address')),
      phone: phoneEl ? phoneEl.getAttribute('data-item-id').replace('phone:tel:', '') : null,
      website: item('authority')?.getAttribute('href') || null,
      permanentlyClosed: /permanently closed/i.test(document.body.innerText.slice(0, 3000)),
    };
  });
}

const leads = loadLeads();
const { browser, context } = await launchBrowser();
const page = await context.newPage();
let added = 0;

try {
  for (const city of cities) {
    for (const niche of niches) {
      const query = `${niche} in ${city}`;
      const urls = await collectPlaceUrls(page, query);
      console.log(`${query}: ${urls.length} results`);
      for (const url of urls) {
        const id = placeId(url);
        if (leads[id]) { leads[id].searches = [...new Set([...(leads[id].searches || []), query])]; continue; }
        try {
          const p = await readPlace(page, url);
          if (!p.name || p.permanentlyClosed) continue;
          if (SKIP_NAMES.some((s) => p.name.toLowerCase().includes(s))) continue;
          const [, town, state] = p.address?.match(/,\s*([^,]+),\s*([A-Z]{2})\s*\d{5}/) || [];
          leads[id] = { id, ...p, niche, town: town || null, state: state || null, searchCity: city, mapsUrl: url.split('?')[0], searches: [query], status: 'New', notes: '', foundAt: new Date().toISOString() };
          added++;
          console.log(`  + ${p.name} | ${p.rating ?? 'no'}★ | ${p.website ? 'has site' : 'NO SITE'}`);
          if (added % 10 === 0) saveLeads(leads);
        } catch (e) {
          console.log(`  ! skipped one place: ${e.message.split('\n')[0]}`);
        }
        await pause(PAUSE_BETWEEN_PLACES);
      }
      saveLeads(leads);
      await pause(PAUSE_BETWEEN_SEARCHES);
    }
  }
} finally {
  saveLeads(leads);
  await browser.close();
  console.log(`Done. ${added} new leads, ${Object.keys(leads).length} total.`);
}
