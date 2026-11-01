// Google reviews for live sites, with the owner's own reviews as the fallback.
//   refreshReviews(env)            daily cron: each live site with a place_id, at most one Places call a week
//   findPlace(env, name, city)     search Google for the listing -> [{ placeId, name, address }]
//   siteReviews(env, siteId)       what the site shows: rows marked show=1, plus Google rating/count
//   googleCreditHtml / ratingJsonLd / googleReviewsHtml   pieces render.js puts on the page
// Rules: Google text is stored and shown as Google sent it (never edited or cut); at most 5 Google
// rows per site; Google rows not refreshed in 30 days are dropped; on no key or an API error the last
// good data stays (and with none, only the owner's reviews show). Rating and count come only from Google.
// Places API (New) with a field mask so each call bills only what we use.
export const PLACES_BASE = "https://places.googleapis.com/v1";
export const DETAILS_MASK = "rating,userRatingCount,reviews";
export const SEARCH_MASK = "places.id,places.displayName,places.formattedAddress";
export const REFRESH_DAYS = 7;
export const STALE_DAYS = 30;
export const GOOGLE_MAX = 5;
export const EVENT = "google_reviews";

const DAY = 864e5;
const iso = (ms) => new Date(ms).toISOString();

export const reviewLink = (placeId) => `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
export const listingLink = (placeId) => `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;

export async function findPlace(env, name, city) {
  const key = env.GOOGLE_PLACES_API_KEY;
  const q = [name, city].map((s) => String(s || "").trim()).filter(Boolean).join(" ").slice(0, 200);
  if (!key || !q) return [];
  const r = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": SEARCH_MASK },
    body: JSON.stringify({ textQuery: q, pageSize: 5 }),
  });
  if (!r.ok) throw new Error(`Places search failed (${r.status})`);
  const j = await r.json();
  return (j.places || []).slice(0, 5).map((p) => ({
    placeId: String(p.id || ""),
    name: String((p.displayName && p.displayName.text) || ""),
    address: String(p.formattedAddress || ""),
  })).filter((p) => /^[A-Za-z0-9_-]{10,300}$/.test(p.placeId));
}

async function placeDetails(key, placeId) {
  const r = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": DETAILS_MASK },
  });
  if (!r.ok) throw new Error(`Places details failed (${r.status})`);
  return r.json();
}

async function lastEvent(env, siteId, okOnly) {
  const sql = `SELECT data, at FROM events WHERE site_id = ? AND kind = ?${okOnly ? " AND json_extract(data, '$.ok') = 1" : ""} ORDER BY at DESC LIMIT 1`;
  const row = await env.DB.prepare(sql).bind(siteId, EVENT).first();
  if (!row) return null;
  try { return { ...JSON.parse(row.data), at: row.at }; } catch (_) { return null; }
}

async function log(env, siteId, data, now) {
  await env.DB.prepare("INSERT INTO events (site_id, kind, data, at) VALUES (?, ?, ?, ?)").bind(siteId, EVENT, JSON.stringify(data), iso(now)).run();
}

async function dropStale(env, siteId, now) {
  await env.DB.prepare("DELETE FROM reviews WHERE site_id = ? AND source = 'google' AND (fetched_at IS NULL OR fetched_at < ?)").bind(siteId, iso(now - STALE_DAYS * DAY)).run();
}

// Replace a site's Google rows with a fresh reply, keeping the owner's on/off choice per review.
async function storeGoogle(env, siteId, reply, now) {
  const old = ((await env.DB.prepare("SELECT author, posted_at, show FROM reviews WHERE site_id = ? AND source = 'google'").bind(siteId).all()).results) || [];
  const shown = new Map(old.map((r) => [`${r.author}|${r.posted_at}`, r.show]));
  const rows = (reply.reviews || []).slice(0, GOOGLE_MAX).map((g) => {
    const author = String((g.authorAttribution && g.authorAttribution.displayName) || "A Google user");
    const text = String((g.text && g.text.text) || (g.originalText && g.originalText.text) || "");
    const stars = Math.max(1, Math.min(5, Math.round(Number(g.rating) || 5)));
    const posted = String(g.publishTime || "");
    const prev = shown.get(`${author}|${posted}`);
    return { author, text, stars, posted, show: prev === undefined ? 1 : Number(prev) ? 1 : 0 };
  }).filter((r) => r.text);
  const stmts = [env.DB.prepare("DELETE FROM reviews WHERE site_id = ? AND source = 'google'").bind(siteId)];
  for (const r of rows) {
    stmts.push(env.DB.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, fetched_at, show) VALUES (?, 'google', ?, ?, ?, ?, ?, ?)")
      .bind(siteId, r.author, r.stars, r.text, r.posted, iso(now), r.show));
  }
  await env.DB.batch(stmts);
  return rows.length;
}

// One site: true when a Places call was made.
export async function refreshSite(env, site, now = Date.now()) {
  await dropStale(env, site.id, now);
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key || !site.place_id) return { site: site.id, called: false, why: !key ? "no key" : "no listing" };
  const last = await lastEvent(env, site.id, false);
  if (last && Date.parse(last.at) > now - REFRESH_DAYS * DAY) return { site: site.id, called: false, why: "fetched this week" };
  try {
    const reply = await placeDetails(key, site.place_id);
    const n = await storeGoogle(env, site.id, reply, now);
    const rating = Number(reply.rating), count = Number(reply.userRatingCount);
    await log(env, site.id, { ok: 1, placeId: site.place_id, rating: rating >= 1 && rating <= 5 ? rating : null, count: count > 0 ? Math.round(count) : null, stored: n }, now);
    return { site: site.id, called: true, stored: n };
  } catch (e) {
    await log(env, site.id, { ok: 0, placeId: site.place_id, error: String((e && e.message) || e).slice(0, 200) }, now);
    return { site: site.id, called: true, error: String((e && e.message) || e) };
  }
}

export async function refreshReviews(env, { now = Date.now() } = {}) {
  const sites = ((await env.DB.prepare("SELECT id, place_id FROM sites WHERE status = 'live'").all()).results) || [];
  const out = [];
  for (const s of sites) out.push(await refreshSite(env, s, now));
  return { sites: out.length, calls: out.filter((r) => r.called).length, results: out };
}

// What a site shows. google = { rating, count, placeId, url, fetchedAt } from the last good fetch
// in the last 30 days, else null.
export async function siteReviews(env, siteId, { now = Date.now() } = {}) {
  const rows = ((await env.DB.prepare("SELECT * FROM reviews WHERE site_id = ? ORDER BY posted_at DESC").bind(siteId).all()).results) || [];
  const fresh = (r) => r.source !== "google" || (r.fetched_at && Date.parse(r.fetched_at) >= now - STALE_DAYS * DAY);
  const shown = rows.filter((r) => Number(r.show) && fresh(r));
  const googleRows = shown.filter((r) => r.source === "google").slice(0, GOOGLE_MAX);
  const manualRows = shown.filter((r) => r.source === "manual");
  const ev = await lastEvent(env, siteId, true);
  const google = ev && Date.parse(ev.at) >= now - STALE_DAYS * DAY && ev.placeId
    ? { rating: ev.rating ?? null, count: ev.count ?? null, placeId: ev.placeId, url: listingLink(ev.placeId), fetchedAt: ev.at }
    : null;
  const card = (r) => ({ name: r.author || "", town: r.source === "google" ? "Google review" : "", text: r.text, stars: Number(r.stars) || 5, source: r.source });
  return {
    google,
    googleReviews: google ? googleRows.map(card) : [],
    manualReviews: manualRows.map(card),
    reviewList: [...(google ? googleRows : []), ...manualRows].map(card),
  };
}

// schema.org piece for LocalBusiness: only when Google gave both numbers.
export function ratingJsonLd(google) {
  if (!google || !(google.rating >= 1) || !(google.count > 0)) return null;
  return { "@type": "AggregateRating", ratingValue: google.rating, reviewCount: google.count, bestRating: 5 };
}

export function googleCreditHtml(google, esc) {
  if (!google) return "";
  const nums = google.rating && google.count ? ` &middot; ${esc(google.rating)} out of 5 from ${esc(google.count)} reviews` : "";
  return `<p class="g-credit">Reviews from <a href="${esc(google.url)}" target="_blank" rel="noopener noreferrer">Google</a>${nums}</p>`;
}

// Google review cards with their credit, text exactly as Google sent it (escaped, not cut).
export function googleReviewsHtml(sr, esc) {
  if (!sr || !sr.google || !sr.googleReviews.length) return "";
  const star = (n) => "★".repeat(n) + "☆".repeat(5 - n);
  return `<div class="g-reviews">${googleCreditHtml(sr.google, esc)}<ul>${sr.googleReviews.map((r) => `<li><p class="g-stars" aria-label="${r.stars} out of 5 stars">${star(r.stars)}</p><blockquote>${esc(r.text)}</blockquote><p class="g-by">${esc(r.name)}, on Google</p></li>`).join("")}</ul></div>`;
}
