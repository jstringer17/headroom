// Step 3: give every lead a 0-100 score. Higher = call first.
import { loadLeads, saveLeads } from './store.mjs';

export function scoreLead(l) {
  const reasons = [];
  let website = 0;
  const s = l.site || {};
  const year = new Date().getFullYear();

  if (!l.phone) return { score: 0, reasons: ['No phone number'], websiteState: l.website ? 'has' : 'none' };

  let websiteState = 'ok';
  if (!l.website) { website = 45; websiteState = 'none'; reasons.push('No website'); }
  else if (s.socialOnly) { website = 40; websiteState = 'social'; reasons.push('Only a Facebook/Yelp-type page'); }
  else if (s.broken) { website = 40; websiteState = 'broken'; reasons.push('Website is broken or parked'); }
  else if (s.blockedCheck) { websiteState = 'unknown'; reasons.push('Site blocks our checker; look manually'); }
  else if (l.site) {
    if (!s.mobileFriendly) { website += 15; reasons.push('Not mobile-friendly'); }
    if (!s.https) { website += 10; reasons.push('No https (shows "Not secure")'); }
    if (!s.telLink) { website += 8; reasons.push('No tap-to-call button'); }
    if (!s.hasForm) { website += 8; reasons.push(s.mailtoOnly ? 'Contact is email-only' : 'No quote form'); }
    if (s.copyrightYear && s.copyrightYear <= year - 3) { website += 7; reasons.push(`Last updated ~${s.copyrightYear}`); }
    if (s.ms > 6000) { website += 5; reasons.push('Slow to load'); }
    if (['wix', 'godaddy', 'weebly'].includes(s.builder)) { website += 3; reasons.push(`Built on ${s.builder}`); }
    website = Math.min(website, 40);
    websiteState = website >= 15 ? 'weak' : 'ok';
  } else websiteState = 'unchecked';

  let business = 0;
  if (Number.isFinite(l.reviewCount)) {
    const n = l.reviewCount;
    if (n >= 5 && n <= 25) { business += 25; reasons.push(`${n} reviews (sweet spot)`); }
    else if (n > 25 && n <= 60) { business += 15; reasons.push(`${n} reviews`); }
    else if (n > 0 && n < 5) { business += 8; reasons.push(`Only ${n} reviews (new?)`); }
    else if (n > 150) { business -= 10; reasons.push(`${n} reviews (may already have an agency)`); }
  } else if (l.rating) {
    business += 10; reasons.push('Has Google reviews');
  } else {
    business += 3; reasons.push('No reviews yet');
  }
  if (l.rating >= 4.3) { business += 10; reasons.push(`${l.rating}★ rating`); }
  else if (l.rating && l.rating < 3.5) { business -= 5; reasons.push(`Low rating ${l.rating}★`); }

  const score = Math.max(0, Math.min(100, Math.round((website / 45) * 60 + business * (40 / 35))));
  return { score, reasons, websiteState };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const leads = loadLeads();
  for (const l of Object.values(leads)) Object.assign(l, scoreLead(l));
  saveLeads(leads);
  const top = Object.values(leads).sort((a, b) => b.score - a.score).slice(0, 10);
  console.log('Top 10 to call:');
  for (const l of top) console.log(`  ${String(l.score).padStart(3)}  ${l.name} (${l.town || l.searchCity}) - ${l.reasons.join('; ')}`);
}
