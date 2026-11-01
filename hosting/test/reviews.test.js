// Google reviews tests. Run: node --test hosting/test/
// Places replies come from hand-made fixtures in the documented Places API (New) shape; fetch is stubbed.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { refreshReviews, findPlace, siteReviews, ratingJsonLd, googleCreditHtml, DETAILS_MASK, REFRESH_DAYS } from "../src/reviews/index.js";
import { esc } from "../../sitemaker/src/generate.js";
import { makeEnv, addSite, mockPublishSite } from "../src/admin/dev/mock-env.js";

const DETAILS = JSON.parse(readFileSync(new URL("./fixtures/places-details.json", import.meta.url), "utf8"));
const SEARCH = JSON.parse(readFileSync(new URL("./fixtures/places-search.json", import.meta.url), "utf8"));
const PID = "ChIJtestPlace0001abcdEFGH";
const DAY = 864e5;
const T0 = Date.parse("2026-11-01T06:00:00Z");

let env, calls, reply;
const realFetch = globalThis.fetch;
beforeEach(async () => {
  env = makeEnv({ GOOGLE_PLACES_API_KEY: "test-key" }).env;
  calls = [];
  reply = () => new Response(JSON.stringify(DETAILS), { status: 200, headers: { "content-type": "application/json" } });
  globalThis.fetch = async (url, init = {}) => { calls.push({ url: String(url), init }); return reply(url, init); };
  await addSite(env, { id: "site-a", domain: "summitroofing.test", owner_email: "o@a.test", place_id: PID, form: { company: "Summit Roofing", trade: "roofing", city: "Fresno", phone: "5595550100" } });
});
afterEach(() => { globalThis.fetch = realFetch; });
const rows = () => env.DB.sql.prepare("SELECT * FROM reviews WHERE site_id = 'site-a' ORDER BY posted_at DESC").all();

test("Places fixture -> 5 Google reviews stored as sent, rating/count kept, one call with a tight field mask", async () => {
  const out = await refreshReviews(env, { now: T0 });
  assert.equal(out.calls, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://places.googleapis.com/v1/places/${PID}`);
  assert.equal(calls[0].init.headers["X-Goog-FieldMask"], "rating,userRatingCount,reviews");
  assert.equal(DETAILS_MASK, "rating,userRatingCount,reviews");
  assert.equal(calls[0].init.headers["X-Goog-Api-Key"], "test-key");
  const r = rows();
  assert.equal(r.length, 5, "max 5 kept");
  assert.ok(r.every((x) => x.source === "google" && x.show === 1 && x.fetched_at === new Date(T0).toISOString()));
  assert.equal(r[0].author, "Dana R.");
  assert.equal(r[0].text, DETAILS.reviews[0].text.text, "Google text stored unchanged");
  assert.equal(r[1].text.length, DETAILS.reviews[1].text.text.length, "long Google text not cut");
  assert.ok(!r.some((x) => x.author === "Extra E."));
  const sr = await siteReviews(env, "site-a", { now: T0 });
  assert.equal(sr.google.rating, 4.8);
  assert.equal(sr.google.count, 127);
  assert.deepEqual(ratingJsonLd(sr.google), { "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 127, bestRating: 5 });
});

test("published page: Google credit and link shown, rating in JSON-LD, Google text escaped", async () => {
  await refreshReviews(env, { now: Date.now() });
  await mockPublishSite(env, "site-a");
  const html = await (await env.R2.get("sites/site-a/index.html")).text();
  assert.match(html, /Reviews from <a href="https:\/\/www\.google\.com\/maps\/place\/\?q=place_id:ChIJtestPlace0001abcdEFGH"[^>]*>Google<\/a>/);
  assert.match(html, /4\.8 out of 5 from 127 reviews/);
  assert.match(html, /Dana R\., on Google/);
  assert.match(html, /same day &amp; cleaned up after\. &lt;b&gt;Great&lt;\/b&gt; crew!/);
  assert.doesNotMatch(html, /<b>Great<\/b>/);
  const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)[1]);
  assert.equal(ld.aggregateRating.ratingValue, 4.8);
  assert.equal(ld.aggregateRating.reviewCount, 127);
});

test("API error keeps the old reviews and rating", async () => {
  await refreshReviews(env, { now: T0 });
  reply = () => new Response("{\"error\":{\"code\":500}}", { status: 500 });
  const out = await refreshReviews(env, { now: T0 + 8 * DAY });
  assert.equal(out.calls, 1);
  assert.match(out.results[0].error, /500/);
  assert.equal(rows().length, 5);
  const sr = await siteReviews(env, "site-a", { now: T0 + 8 * DAY });
  assert.equal(sr.google.rating, 4.8);
  assert.equal(sr.googleReviews.length, 5);
  reply = () => { throw new TypeError("network down"); };
  await refreshReviews(env, { now: T0 + 16 * DAY });
  assert.equal(rows().length, 5);
});

test("no API key -> no call made, manual reviews only", async () => {
  delete env.GOOGLE_PLACES_API_KEY;
  env.DB.sql.prepare("INSERT INTO reviews (site_id, source, author, stars, text, posted_at, show) VALUES ('site-a','manual','Maria G.',5,'Great job','2026-10-01T00:00:00Z',1)").run();
  const out = await refreshReviews(env, { now: T0 });
  assert.equal(out.calls, 0);
  assert.equal(calls.length, 0);
  assert.deepEqual(await findPlace(env, "Summit Roofing", "Fresno"), []);
  assert.equal(calls.length, 0);
  const sr = await siteReviews(env, "site-a", { now: T0 });
  assert.equal(sr.google, null);
  assert.equal(ratingJsonLd(sr.google), null);
  assert.equal(googleCreditHtml(sr.google, esc), "");
  assert.deepEqual(sr.reviewList.map((r) => r.text), ["Great job"]);
});

test("one-week budget: refreshReviews skips sites fetched under 7 days ago", async () => {
  assert.equal(REFRESH_DAYS, 7);
  assert.equal((await refreshReviews(env, { now: T0 })).calls, 1);
  for (const d of [1, 3, 6, 6.9]) {
    const out = await refreshReviews(env, { now: T0 + d * DAY });
    assert.equal(out.calls, 0, `day ${d}: no call`);
    assert.equal(out.results[0].why, "fetched this week");
  }
  assert.equal(calls.length, 1);
  assert.equal((await refreshReviews(env, { now: T0 + 7.01 * DAY })).calls, 1);
  assert.equal(calls.length, 2);
  // A daily cron for 28 days makes at most 4 calls.
  for (let d = 8; d <= 35; d++) await refreshReviews(env, { now: T0 + d * DAY });
  assert.ok(calls.length <= 2 + 4, `calls in 5 weeks: ${calls.length}`);
});

test("only live sites with a linked listing are fetched", async () => {
  await addSite(env, { id: "site-p", domain: "p.test", status: "paused", place_id: "ChIJtestPlace0002ijklMNOP", form: {} });
  await addSite(env, { id: "site-n", domain: "n.test", status: "live", place_id: null, form: {} });
  const out = await refreshReviews(env, { now: T0 });
  assert.equal(out.sites, 2);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.endsWith(PID));
});

test("Google rows not refreshed for 30 days are dropped; owner's show/hide choice survives a refresh", async () => {
  await refreshReviews(env, { now: T0 });
  env.DB.sql.prepare("UPDATE reviews SET show = 0 WHERE author = 'Jo B.'").run();
  await refreshReviews(env, { now: T0 + 8 * DAY });
  assert.equal(rows().find((r) => r.author === "Jo B.").show, 0, "hidden stays hidden");
  const sr = await siteReviews(env, "site-a", { now: T0 + 8 * DAY });
  assert.equal(sr.googleReviews.length, 4);
  reply = () => new Response("{}", { status: 503 });
  await refreshReviews(env, { now: T0 + 16 * DAY });
  await refreshReviews(env, { now: T0 + 24 * DAY });
  await refreshReviews(env, { now: T0 + 39 * DAY });
  assert.equal(rows().length, 0, "dropped after 30 days without a good refresh");
  const late = await siteReviews(env, "site-a", { now: T0 + 39 * DAY });
  assert.equal(late.google, null, "old rating not shown");
});

test("findPlace: name + city search returns a pick list with place ids", async () => {
  reply = () => new Response(JSON.stringify(SEARCH), { status: 200 });
  const list = await findPlace(env, "Summit Roofing", "Fresno");
  assert.equal(calls[0].url, "https://places.googleapis.com/v1/places:searchText");
  assert.equal(calls[0].init.headers["X-Goog-FieldMask"], "places.id,places.displayName,places.formattedAddress");
  assert.equal(JSON.parse(calls[0].init.body).textQuery, "Summit Roofing Fresno");
  assert.deepEqual(list[0], { placeId: PID, name: "Summit Roofing", address: "120 Main St, Fresno, CA 93721, USA" });
  assert.equal(list.length, 2);
});
