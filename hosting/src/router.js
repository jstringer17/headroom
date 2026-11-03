// The router, built from handler modules so it can be tested before the other workstreams land.
// index.js wires in the real modules: admin (owner-admin), reviews (owner-admin), billing + desk (billing-desk).
import { getSiteByHost, cleanHost, logEvent } from "./db.js";
import { pageKey, sitemapKey, publishSite } from "./render.js";
import { handleLead, sweepHits } from "./leads.js";
import { robotsTxt, sitemapXml } from "./seo.js";
import { serveMedia, serveLibrary } from "./media.js";
import { notActivePage, notFoundPage, privacyPage } from "./notactive.js";
import { demoApp, demoHost } from "./demo.js";

const PAGE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=10",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

const missing = (name) => () => new Response(`${name} is not set up yet`, { status: 503 });

// Ops: POST /api/ops/publish {siteId} with "authorization: Bearer <OPS_KEY>". Off when OPS_KEY is not set.
async function ops(request, env) {
  if (!env.OPS_KEY || request.method !== "POST") return new Response("Not found", { status: 404 });
  const auth = request.headers.get("authorization") || "";
  const a = new TextEncoder().encode(auth), b = new TextEncoder().encode(`Bearer ${env.OPS_KEY}`);
  let same = a.length === b.length;
  for (let i = 0; i < b.length; i++) same = same && a[i] === b[i];
  if (!same) return new Response("Not allowed", { status: 403 });
  const body = await request.json().catch(() => ({}));
  const r = await publishSite(env, String(body.siteId || ""));
  return new Response(JSON.stringify(r), { status: r.ok ? 200 : 422, headers: { "content-type": "application/json" } });
}

export function createApp(mods = {}) {
  const adminApp = mods.adminApp || missing("admin");
  const stripeWebhook = mods.stripeWebhook || missing("billing");
  const deskApp = mods.deskApp || missing("desk");
  const refreshReviews = mods.refreshReviews || null;
  const billingSweep = mods.billingSweep || null;

  async function fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = cleanHost(url.hostname);
    const path = url.pathname;
    const agency = cleanHost(env.AGENCY_DOMAIN || "");

    // Stripe and ops first, on any attached host. Stripe's webhook URL is https://hooks.<agency>/api/stripe (not the desk host: Access would block Stripe).
    if (path === "/api/stripe") return stripeWebhook(request, env, ctx);
    if (path === "/api/ops/publish") return ops(request, env);
    if (agency && host === `desk.${agency}`) return deskApp(request, env, ctx);
    // Owner preview (sample links for sales demos) lives only on the demo host.
    const dh = demoHost(env);
    if (dh && host === dh) return demoApp(request, env, ctx);

    const site = await getSiteByHost(env, host);
    if (!site) return notFoundPage(false);

    if (path === "/admin" || path.startsWith("/admin/")) return adminApp(request, env, ctx);
    if (path === "/api/lead") return handleLead(request, env, site);
    if (path === "/robots.txt") return new Response(robotsTxt(site), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });

    if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    if (site.status !== "live") return notActivePage();

    if (path === "/" || path === "/index.html") {
      const obj = await env.R2.get(pageKey(site.id));
      if (!obj) return notActivePage();
      const h = new Headers(PAGE_HEADERS);
      if (obj.httpEtag) h.set("etag", obj.httpEtag);
      return new Response(request.method === "HEAD" ? null : obj.body, { headers: h });
    }
    if (path === "/sitemap.xml") {
      const obj = await env.R2.get(sitemapKey(site.id));
      return new Response(obj ? obj.body : sitemapXml(site), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
    }
    if (path === "/privacy") return privacyPage(site);
    if (path.startsWith("/media/")) return serveMedia(request, env, site);
    if (path.startsWith("/library/")) return serveLibrary(request, env);
    return notFoundPage(true);
  }

  async function scheduled(event, env, ctx) {
    const jobs = [
      ["reviews", refreshReviews],
      ["billing", billingSweep],
      ["hits", sweepHits],
    ].filter(([, fn]) => fn);
    for (const [name, fn] of jobs) {
      try {
        await fn(env);
      } catch (e) {
        await logEvent(env, null, "cron_failed", { job: name, error: String(e && e.message) });
      }
    }
  }

  return { fetch, scheduled };
}
