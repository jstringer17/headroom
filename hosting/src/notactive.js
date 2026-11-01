// Plain pages that show no customer data (not active, not found) plus the visitor privacy page.
const page = (title, body, extraHead = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${title}</title>${extraHead}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:18px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f4f0;color:#222}main{max-width:34rem;padding:24px}h1{font-size:28px;margin:0 0 8px}a{color:#1d4f9c}</style>
</head><body><main>${body}</main></body></html>
`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const headers = (status) => ({ status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });

export function notActivePage() {
  return new Response(page("Not active", "<h1>This site is not active</h1><p>Please check back later.</p>"), headers(503));
}

export function notFoundPage(home = true) {
  return new Response(page("Not found", `<h1>Page not found</h1>${home ? '<p><a href="/">Go to the home page</a></p>' : ""}`), headers(404));
}

// DRAFT text: the CEO must approve the real privacy wording before the first paying site (org/plan.md CEO-only questions).
export function privacyPage(site) {
  const name = esc((site && site.form && site.form.company) || "This business");
  return new Response(page(`Privacy | ${name}`, `<h1>Privacy</h1>
<p>When you send the form on this site, ${name} gets your name, phone number, email (if you give it) and your message, so they can call you back about your job.</p>
<p>We do not sell your details. We keep them only as long as needed to answer you and keep business records.</p>
<p>The form is checked by Cloudflare Turnstile to stop spam. Visits are counted by Cloudflare Web Analytics, which uses no cookies.</p>
<p>Want your details removed? Call or email ${name} and ask.</p>
<p><a href="/">Back to the home page</a></p>`), { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
