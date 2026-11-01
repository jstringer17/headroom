// SEO basics for every hosted site: sitemap.xml and robots.txt.
const xmlEsc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

export function siteUrl(site) {
  return site && site.domain ? `https://${site.domain}/` : "";
}

export function sitemapXml(site, at = Date.now()) {
  const url = siteUrl(site);
  const lastmod = new Date(at).toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${url ? `  <url><loc>${xmlEsc(url)}</loc><lastmod>${lastmod}</lastmod></url>\n` : ""}</urlset>
`;
}

// Live sites: crawl the page, not the admin or the API. Anything else: do not index.
export function robotsTxt(site) {
  if (!site || site.status !== "live") return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${site.domain ? `Sitemap: https://${site.domain}/sitemap.xml\n` : ""}`;
}
