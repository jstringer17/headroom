// Optional: fill in exact Google review counts with the official Places API.
// Maps hides review counts from signed-out visitors, so the scraper can't read them.
// Needs GOOGLE_PLACES_API_KEY in the environment. Google gives a monthly free credit.
import { loadLeads, saveLeads, sleep } from './store.mjs';

const key = process.env.GOOGLE_PLACES_API_KEY;
if (!key) { console.log('No GOOGLE_PLACES_API_KEY set. Skipping review counts.'); process.exit(0); }

const leads = loadLeads();
const todo = Object.values(leads).filter((l) => !Number.isFinite(l.reviewCount));
console.log(`Looking up review counts for ${todo.length} leads...`);
for (const l of todo) {
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.displayName,places.userRatingCount,places.rating,places.nationalPhoneNumber' },
      body: JSON.stringify({ textQuery: `${l.name} ${l.address || l.city}`, pageSize: 1 }),
    });
    const place = (await res.json()).places?.[0];
    if (place) { l.reviewCount = place.userRatingCount ?? 0; l.rating = place.rating ?? l.rating; }
    console.log(`  ${l.name}: ${l.reviewCount ?? '?'} reviews`);
  } catch (e) { console.log(`  ${l.name}: lookup failed (${e.message})`); }
  await sleep(150);
}
saveLeads(leads);
