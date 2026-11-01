// Owner admin: <customer-domain>/admin. Mounted by hosting/src/index.js (host-core) as
// adminApp(request, env, ctx) for every /admin* path on a customer domain.
// Every route finds the site by the request's host and, past login, checks that the
// session's site id is that site (and that the email is still the site's owner_email).
import { generateSite, esc } from "../../../sitemaker/src/generate.js";
import { getDeps } from "./deps.js";
import * as S from "./session.js";
import * as db from "./store.js";
import { applyEdits, clean, editorModel, photoSlots } from "./form.js";
import * as P from "./pages.js";
import { qrSvg } from "./qr.js";
import { findPlace, refreshSite, reviewLink, siteReviews } from "../reviews/index.js";

export const MAX_UPLOAD = 2 * 1024 * 1024;
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MANUAL_MAX = 12;

function nonce() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b));
}

function html(body, { status = 200, nonce: n = "", headers = {} } = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      "Content-Security-Policy": `default-src 'none'; img-src 'self' https: data: blob:; style-src 'unsafe-inline'; script-src ${n ? `'nonce-${n}'` : "'none'"}; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
      ...headers,
    },
  });
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
const redirect = (to, headers = {}) => new Response(null, { status: 303, headers: { Location: to, "Cache-Control": "no-store", ...headers } });

// Writes must come from this site's own pages.
function sameOrigin(request, url) {
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return false;
  const sfs = request.headers.get("sec-fetch-site");
  if (sfs && sfs !== "same-origin" && sfs !== "none") return false;
  return true;
}

async function formBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    return Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
  }
  try { return await request.json(); } catch (_) { return {}; }
}

export async function adminApp(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();
  const site = await db.siteByHost(env, db.hostOf(request));
  if (!site) return html(P.messagePage({ title: "Not found", text: "There is no website here." }), { status: 404 });
  const company = db.formOf(site).company || "";
  if (!env.SESSION_KEY) return html(P.messagePage({ company, title: "Not set up yet", text: "Editing is not turned on for this website yet." }), { status: 503 });
  if (method !== "GET" && method !== "HEAD" && !sameOrigin(request, url)) return json({ error: "Not allowed" }, 403);

  // ---- log in ----
  if (path === "/admin/login" && method === "POST") return sendLink(request, env, site, url, company);
  if (path === "/admin/login" && method === "GET") {
    const t = url.searchParams.get("t") || "";
    return html(t ? P.confirmPage({ company, token: t }) : P.loginPage({ company }));
  }
  if (path === "/admin/login/confirm" && method === "POST") return confirmLink(request, env, site, company);
  if (path === "/admin/logout" && method === "POST") return redirect("/admin", { "Set-Cookie": S.clearCookie() });

  // ---- everything else needs this site's session ----
  const sess = await S.readSession(env.SESSION_KEY, S.cookieOf(request));
  const owner = String(site.owner_email || "").trim().toLowerCase();
  const ok = sess && sess.siteId === String(site.id) && owner && sess.email === owner;
  if (!ok) {
    if (path.startsWith("/admin/api/")) return json({ error: "Please log in again" }, 401);
    if (path === "/admin" && method === "GET") return html(P.loginPage({ company }));
    return redirect("/admin");
  }
  if (path.startsWith("/admin/api/") && request.headers.get("x-admin") !== "1") return json({ error: "Not allowed" }, 403);
  const id = site.id;
  const draftOf = async () => (await db.getDraft(env, id)) || clean(db.formOf(site));

  if (path === "/admin" && method === "GET") {
    const draft = await draftOf();
    const allowLook = env.ADMIN_LOOK === "on";
    const sr = await siteReviews(env, id);
    const n = nonce();
    const done = url.searchParams.get("done");
    const notice = { published: "Done. Your site is updated.", undone: "Done. Your site is back to how it was.", review: "Review added. It shows on your site after you tap Publish." }[done] || "";
    return html(P.editorPage({ m: editorModel(draft, { allowLook }), reviews: await db.listReviews(env, id), google: sr.google, placeId: site.place_id, hasPrevious: !!(await db.getPrevious(env, id)), nonce: n, notice }), { nonce: n });
  }
  if (path === "/admin/preview" && method === "GET") return preview(env, site, await draftOf());
  if (path === "/admin/ask" && method === "GET") {
    const link = site.place_id ? reviewLink(site.place_id) : "";
    const name = (await draftOf()).company || company || "us";
    const text = `Hi, thank you for choosing ${name}! If you are happy with the work, would you leave us a short review on Google? It helps a small business like ours a lot: ${link}`;
    const n = nonce();
    return html(P.askPage({ company, link, text, qr: link ? qrSvg(link, { label: "QR code for the Google review link" }) : "", nonce: n }), { nonce: n });
  }
  if (path === "/admin/google" && method === "GET") {
    const f = await draftOf();
    const q = url.searchParams.get("q");
    if (q === null) return html(P.googlePage({ company, query: [f.company, f.city].filter(Boolean).join(" "), results: null, placeId: site.place_id }));
    if (!env.GOOGLE_PLACES_API_KEY) return html(P.googlePage({ company, query: q, results: null, placeId: site.place_id, error: "Google search is not turned on yet. We will link your listing for you." }));
    try {
      return html(P.googlePage({ company, query: q, results: await findPlace(env, q, ""), placeId: site.place_id }));
    } catch (_) {
      return html(P.googlePage({ company, query: q, results: null, placeId: site.place_id, error: "Google did not answer. Try again in a few minutes." }));
    }
  }
  if (path === "/admin/google" && method === "POST") {
    const b = await formBody(request);
    const pid = String(b.place_id || "");
    if (!/^[A-Za-z0-9_-]{10,300}$/.test(pid)) return redirect("/admin/google");
    await db.setPlaceId(env, id, pid);
    await db.logEvent(env, id, "place_linked", { placeId: pid, by: "owner" });
    const job = refreshSite(env, { id, place_id: pid }).catch(() => {});
    if (ctx && ctx.waitUntil) ctx.waitUntil(job); else await job;
    return redirect("/admin/google");
  }

  // ---- JSON API used by the editor ----
  if (path === "/admin/api/draft" && method === "GET") return json({ draft: await draftOf() });
  if (path === "/admin/api/draft" && method === "PUT") {
    const draft = applyEdits(await draftOf(), await formBody(request), { siteId: id, allowLook: env.ADMIN_LOOK === "on", hosts: [site.domain, url.host] });
    await db.saveDraft(env, id, draft);
    return json({ ok: true, draft });
  }
  if (path === "/admin/api/upload" && method === "POST") return upload(request, env, site, url, await draftOf());
  if (path === "/admin/api/publish" && method === "POST") {
    const { render } = await getDeps();
    const before = db.formOf(site);
    const draft = clean(await draftOf());
    const oldPrev = await db.getPrevious(env, id);
    // publishSite renders from the stored form, so the form is written first and put back if the page is refused.
    await db.setPublishedForm(env, id, draft);
    let res = null;
    try { res = await render.publishSite(env, id); } catch (e) { res = null; }
    if (!res || !res.ok) {
      await db.setPublishedForm(env, id, before);
      if (res) return json({ error: plainProblem(res.problems) }, 422);
      return json({ error: "Could not publish. Nothing was changed. Try again." }, 500);
    }
    await db.savePrevious(env, id, before);
    await db.logEvent(env, id, "owner_publish", { email: owner });
    return json({ ok: true });
  }
  if (path === "/admin/api/undo" && method === "POST") {
    const prev = await db.getPrevious(env, id);
    if (!prev) return json({ error: "Nothing to undo" }, 409);
    const { render } = await getDeps();
    await db.setPublishedForm(env, id, prev);
    await db.saveDraft(env, id, clean(prev));
    await db.dropPrevious(env, id);
    await render.publishSite(env, id);
    await db.logEvent(env, id, "owner_undo", { email: owner });
    return json({ ok: true });
  }
  if (path === "/admin/api/reviews" && method === "POST") {
    const b = await formBody(request);
    const author = String(b.author || "").trim().slice(0, 60);
    const text = String(b.text || "").trim().slice(0, 600);
    const stars = Math.max(1, Math.min(5, parseInt(b.stars, 10) || 5));
    if (!b.real || !author || !text) return json({ error: "Name, words and the real-customer tick are needed" }, 400);
    const have = (await db.listReviews(env, id)).filter((r) => r.source === "manual").length;
    if (have >= MANUAL_MAX) return json({ error: "Too many reviews. Delete one first." }, 409);
    await db.addManualReview(env, id, { author, stars, text });
    return json({ ok: true });
  }
  const m = /^\/admin\/api\/reviews\/([A-Za-z0-9_-]{1,64})$/.exec(path);
  if (m && method === "POST") {
    const b = await formBody(request);
    return (await db.setReviewShow(env, id, m[1], !!b.show)) ? json({ ok: true }) : json({ error: "Not found" }, 404);
  }
  if (m && method === "DELETE") return (await db.deleteManualReview(env, id, m[1])) ? json({ ok: true }) : json({ error: "Not found" }, 404);

  return path.startsWith("/admin/api/") ? json({ error: "Not found" }, 404) : redirect("/admin");
}

async function sendLink(request, env, site, url, company) {
  const b = await formBody(request);
  const email = String(b.email || "").trim().toLowerCase();
  const owner = String(site.owner_email || "").trim().toLowerCase();
  if (email && owner && email === owner && (await db.linksLastHour(env, site.id, S.LINK_MINUTES)) < S.LINKS_PER_HOUR) {
    const token = S.newToken();
    await db.addLogin(env, { tokenHash: await S.sha256Hex(token), siteId: site.id, email: owner, expiresMs: Date.now() + S.LINK_MINUTES * 60e3 });
    const link = `${url.origin}/admin/login?t=${token}`;
    const { notify } = await getDeps();
    await notify.sendEmail(env, {
      to: owner,
      subject: `Your log in link for ${company || "your website"}`,
      text: `Tap this link to edit your website. It works once, for ${S.LINK_MINUTES} minutes:\n\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
      html: `<p>Tap the button to edit your website. It works once, for ${S.LINK_MINUTES} minutes.</p><p><a href="${esc(link)}" style="display:inline-block;background:#0b5cad;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Log in to edit my website</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
    });
    await db.logEvent(env, site.id, "owner_login_link", {});
  }
  return html(P.sentPage({ company }));
}

async function confirmLink(request, env, site, company) {
  const b = await formBody(request);
  const token = String(b.t || "");
  const bad = () => html(P.badLinkPage({ company }), { status: 400 });
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return bad();
  const hash = await S.sha256Hex(token);
  const row = await db.getLogin(env, hash);
  const owner = String(site.owner_email || "").trim().toLowerCase();
  if (!row || String(row.site_id) !== String(site.id) || Number(row.used) || !(Date.parse(row.expires_at) > Date.now())) return bad();
  if (String(row.email).toLowerCase() !== owner) return bad();
  if (!(await db.useLogin(env, hash))) return bad();
  const cookie = await S.signSession(env.SESSION_KEY, site.id, owner);
  return redirect("/admin", { "Set-Cookie": S.sessionCookie(cookie) });
}

async function upload(request, env, site, url, draft) {
  const slot = url.searchParams.get("slot") || "";
  if (!photoSlots(draft).some((s) => s.id === slot)) return json({ error: "Unknown picture spot" }, 400);
  const type = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = IMAGE_TYPES[type];
  if (!ext) return json({ error: "Only JPEG, PNG or WebP photos" }, 415);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_UPLOAD) return json({ error: "Photo is over 2 MB" }, 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_UPLOAD) return json({ error: "Photo is over 2 MB" }, 413);
  const magic = { jpg: [0xff, 0xd8, 0xff], png: [0x89, 0x50, 0x4e, 0x47], webp: [0x52, 0x49, 0x46, 0x46] }[ext];
  if (!magic.every((b, i) => bytes[i] === b) || (ext === "webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP")) return json({ error: "That file is not a photo" }, 415);
  const name = `${slot.replace(/[^A-Za-z0-9_-]/g, "") || "pic"}-${S.newToken().slice(0, 16)}.${ext}`;
  await db.putMedia(env, site.id, name, bytes, type);
  return json({ ok: true, url: `https://${url.host}/media/${encodeURIComponent(site.id)}/${name}` });
}

async function preview(env, site, draft) {
  const { render } = await getDeps();
  const form = clean(draft);
  let page;
  if (render && typeof render.renderForm === "function") {
    page = await render.renderForm(env, site.id, form);
  } else {
    const sr = await siteReviews(env, site.id);
    page = generateSite({ ...form, reviewList: sr.reviewList, live: { siteId: site.id, leadUrl: "/api/lead" } });
  }
  const bar = `<div style="position:sticky;top:0;z-index:99999;background:#16202a;color:#fff;font:600 16px/1.4 system-ui,sans-serif;padding:10px 16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between"><span>Preview. Visitors do not see this until you tap Publish.</span><a href="/admin" style="color:#fff">Back to editing</a></div>`;
  page = String(page).replace(/<body[^>]*>/i, (m) => m + bar);
  return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" } });
}

// Plain words for the owner when the page was refused.
function plainProblem(problems) {
  const p = (problems || []).join(" ");
  if (/phone/i.test(p)) return "Add your phone number first.";
  return "The page could not be published. Nothing was changed. Check your text and try again.";
}
