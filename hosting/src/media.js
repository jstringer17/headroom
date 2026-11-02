// Photos for a site: GET /media/<file> or /media/<siteId>/<file> -> R2 media/<siteId>/<file>. Only jpeg, png and webp.
const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
export const mediaKey = (siteId, file) => `media/${siteId}/${file}`;

export async function serveMedia(request, env, site) {
  const url = new URL(request.url);
  let file = "";
  try { file = decodeURIComponent(url.pathname.slice("/media/".length)); } catch { return new Response("Not found", { status: 404 }); }
  // The owner admin writes /media/<siteId>/<file>; only this site's own id is stripped, so other sites stay out of reach.
  if (file.startsWith(`${site.id}/`)) file = file.slice(site.id.length + 1);
  const ext = (file.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,200}$/.test(file) || file.includes("..") || file.includes("//") || !ext || !TYPES[ext.toLowerCase()]) {
    return new Response("Not found", { status: 404 });
  }
  const obj = await env.R2.get(mediaKey(site.id, file));
  if (!obj) return new Response("Not found", { status: 404 });
  const type = (obj.httpMetadata && obj.httpMetadata.contentType) || TYPES[ext.toLowerCase()];
  if (!Object.values(TYPES).includes(type)) return new Response("Not found", { status: 404 });
  const h = new Headers({ "content-type": type, "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff" });
  if (obj.httpEtag) h.set("etag", obj.httpEtag);
  if (request.method === "HEAD") return new Response(null, { headers: h });
  return new Response(obj.body, { headers: h });
}

// Built-in library pictures for demo sites: GET /library/<trade>/[<variant>/]<slot>.<ext> -> R2 library/<same path>.
export async function serveLibrary(request, env) {
  const url = new URL(request.url);
  let file = "";
  try { file = decodeURIComponent(url.pathname.slice("/library/".length)); } catch { return new Response("Not found", { status: 404 }); }
  const ext = (file.match(/\.([a-z0-9]+)$/i) || [])[1];
  if (!/^[a-z0-9-]+\/([a-z0-9-]+\/)?[a-z0-9-]+\.(webp|jpe?g|png)$/i.test(file) || !ext || !TYPES[ext.toLowerCase()]) return new Response("Not found", { status: 404 });
  const obj = await env.R2.get(`library/${file}`);
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers({ "content-type": TYPES[ext.toLowerCase()], "cache-control": "public, max-age=2592000", "x-content-type-options": "nosniff" });
  if (obj.httpEtag) h.set("etag", obj.httpEtag);
  if (request.method === "HEAD") return new Response(null, { headers: h });
  return new Response(obj.body, { headers: h });
}
