// publishSite(env, siteId): stored form + live block + shown reviews -> generateSite -> checks -> R2.
// A render that fails a check NEVER replaces the last good live file (one bad generator change must not break every site).
import { generateSite } from "../../sitemaker/src/generate.js";
import { getSite, shownReviews, logEvent } from "./db.js";
import { sitemapXml } from "./seo.js";

export const MAX_BYTES = 6 * 1024 * 1024;
export const pageKey = (id) => `sites/${id}/index.html`;
export const sitemapKey = (id) => `sites/${id}/sitemap.xml`;

// Words that must never be on a live page (also checked after decoding data: URIs).
export const BANNED = ["Sample review", "Sample picture", "This is a sample site", "Sample site", "Sample project", "Phone number here"];

// The form the generator sees for a live site.
export function liveForm(site, reviews, env) {
  const form = JSON.parse(JSON.stringify(site.form || {}));
  const hosting = form.hosting && typeof form.hosting === "object" ? form.hosting : {};
  delete form.hosting;
  delete form.live;
  // Reviews: only what the owner chose to show (max 3 on the page). Google ones carry Google credit.
  const shown = (reviews || []).filter((r) => r && r.text).slice(0, 3);
  form.reviewList = shown.map((r) => ({
    name: String(r.author || "").slice(0, 40),
    town: r.source === "google" ? "on Google" : "",
    text: r.text,
    stars: r.stars,
  }));
  if (!form.reviewList.length) delete form.reviewList;
  if (site.place_id && shown.some((r) => r.source === "google")) {
    form.reviewLink = `https://search.google.com/local/reviews?placeid=${encodeURIComponent(site.place_id)}`;
  }
  form.live = {
    siteId: site.id,
    leadUrl: "/api/lead",
    turnstileKey: (env && env.TURNSTILE_SITE_KEY) || "",
    analyticsToken: hosting.analyticsToken || "",
    canonical: site.domain ? `https://${site.domain}/` : "",
    privacyUrl: "/privacy",
    google: hosting.google || null, // { rating, count } from the Places API only (owner-admin writes it)
  };
  return form;
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
    html = render(liveForm(site, await shownReviews(env, site.id), env));
    problems = checkHtml(html);
  } catch (e) {
    problems = [`render failed: ${e && e.message}`];
  }
  if (problems.length) {
    await logEvent(env, site.id, "publish_blocked", { problems });
    return { ok: false, problems };
  }
  await env.BUCKET.put(pageKey(site.id), html, { httpMetadata: { contentType: "text/html; charset=utf-8" } });
  await env.BUCKET.put(sitemapKey(site.id), sitemapXml(site), { httpMetadata: { contentType: "application/xml; charset=utf-8" } });
  const bytes = new TextEncoder().encode(html).length;
  await logEvent(env, site.id, "published", { bytes });
  return { ok: true, bytes };
}
