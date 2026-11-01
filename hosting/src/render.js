// publishSite(env, siteId): stored form + live block + shown reviews -> generateSite -> checks -> R2.
// A render that fails a check NEVER replaces the last good live file (one bad generator change must not break every site).
import { generateSite, esc } from "../../sitemaker/src/generate.js";
import { getSite, logEvent } from "./db.js";
import { siteReviews, googleCreditHtml } from "./reviews/index.js";
import { sitemapXml } from "./seo.js";

export const MAX_BYTES = 6 * 1024 * 1024;
export const pageKey = (id) => `sites/${id}/index.html`;
export const sitemapKey = (id) => `sites/${id}/sitemap.xml`;

// Words that must never be on a live page (also checked after decoding data: URIs).
export const BANNED = ["Sample review", "Sample picture", "This is a sample site", "Sample site", "Sample project", "Phone number here"];

// The form the generator sees for a live site. sr = siteReviews(env, id) from owner-admin's reviews module:
// { google: {rating,count,url}|null, reviewList: [{name,town,text,stars,source}] } (shown + fresh only; Google first).
export function liveForm(site, sr, env) {
  const form = JSON.parse(JSON.stringify(site.form || {}));
  const hosting = form.hosting && typeof form.hosting === "object" ? form.hosting : {};
  delete form.hosting;
  delete form.live;
  delete form.reviewList; // reviews come only from the reviews table (new-site.mjs imports maker-typed ones as manual)
  delete form.rating; delete form.reviews; // a typed rating is never shown on a live site
  const list = ((sr && sr.reviewList) || []).filter((r) => r && r.text).slice(0, 3);
  if (list.length) form.reviewList = list.map((r) => ({ name: String(r.name || "").slice(0, 40), town: r.source === "google" ? "on Google" : "", text: r.text, stars: r.stars }));
  const google = sr && sr.google;
  if (google && google.url) form.reviewLink = google.url;
  form.live = {
    siteId: site.id,
    leadUrl: "/api/lead",
    turnstileKey: (env && env.TURNSTILE_SITE_KEY) || "",
    analyticsToken: hosting.analyticsToken || "",
    canonical: site.domain ? `https://${site.domain}/` : "",
    privacyUrl: "/privacy",
    google: google && google.rating ? { rating: google.rating, count: google.count } : null, // Places API data only
  };
  return form;
}

// Google's attribution ("Reviews from Google", linked) goes right above the review cards when any Google review shows.
function addGoogleCredit(html, sr) {
  if (!sr || !sr.google || !((sr.reviewList || []).some((r) => r.source === "google"))) return html;
  return html.replace(/<ul class="((?:ed-)?)rvw-list"/, (m, p) => `${googleCreditHtml(sr.google, esc).replace('class="g-credit"', `class="g-credit ${p}rvw-credit" style="margin:0 0 16px;font-size:15px;opacity:.85"`)}${m}`);
}

// Render without writing (owner-admin's Preview uses this). form = the draft form to show instead of the stored one.
export async function renderForm(env, siteId, form, { render = generateSite } = {}) {
  const site = await getSite(env, siteId);
  if (!site) throw new Error("no such site");
  const sr = await siteReviews(env, site.id);
  return addGoogleCredit(render(liveForm(form ? { ...site, form } : site, sr, env)), sr);
}

const decoded = (html) => html.replace(/%([0-9A-Fa-f]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));

// Returns a list of problems; empty = safe to publish.
export function checkHtml(html) {
  const bad = [];
  if (typeof html !== "string" || !html.startsWith("<!doctype html>")) bad.push("not an html page");
  const bytes = new TextEncoder().encode(html || "").length;
  if (bytes >= MAX_BYTES) bad.push(`too big: ${bytes} bytes`);
  const text = decoded(html || "");
  for (const w of BANNED) if (text.includes(w)) bad.push(`has "${w}"`);
  if (!/<form id="ask"[^>]*action="\/api\/lead"/.test(html || "")) bad.push("form does not send to /api/lead");
  if (!/href="tel:\+?\d{7,}/.test(html || "")) bad.push("no phone number to call");
  return bad;
}

export async function publishSite(env, siteId, { render = generateSite } = {}) {
  const site = await getSite(env, siteId);
  if (!site) return { ok: false, problems: ["no such site"] };
  let html = "", problems;
  try {
    const sr = await siteReviews(env, site.id);
    html = addGoogleCredit(render(liveForm(site, sr, env)), sr);
    problems = checkHtml(html);
  } catch (e) {
    problems = [`render failed: ${e && e.message}`];
  }
  if (problems.length) {
    await logEvent(env, site.id, "publish_blocked", { problems });
    return { ok: false, problems };
  }
  await env.R2.put(pageKey(site.id), html, { httpMetadata: { contentType: "text/html; charset=utf-8" } });
  await env.R2.put(sitemapKey(site.id), sitemapXml(site), { httpMetadata: { contentType: "application/xml; charset=utf-8" } });
  const bytes = new TextEncoder().encode(html).length;
  await logEvent(env, site.id, "published", { bytes });
  return { ok: true, bytes };
}
