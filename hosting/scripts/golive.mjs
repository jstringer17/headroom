// Attach a customer domain to the Worker and switch the site on.
//   node hosting/scripts/golive.mjs <siteId> --domain example.com [--gsc <google-site-verification token>]
// DRY RUN by default: prints every Cloudflare API call and changes NOTHING (no network at all).
// --apply really does it. Only after the CEO says ok (org/DECISIONS.md). Needs CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
// D1_DATABASE_ID, TURNSTILE_SITE_KEY and OPS_KEY in the environment. See hosting/GO-LIVE.md.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.cloudflare.com/client/v4";
export const WORKER = "headroom-sites";
const clean = (d) => String(d || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");

// The steps, in order. Each step: { title, method, url, body?, use?(result, state) }. ${ZONE} etc. are filled in as results come back.
export function plan({ siteId, domain, gsc, account = "${CLOUDFLARE_ACCOUNT_ID}", d1 = "${D1_DATABASE_ID}", sitekey = "${TURNSTILE_SITE_KEY}" }) {
  const d = clean(domain);
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) throw new Error(`bad domain: ${domain}`);
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(String(siteId || ""))) throw new Error(`bad site id: ${siteId}`);
  return [
    { title: "Find the domain's zone (bought in Cloudflare Registrar = already there)", method: "GET", url: `${API}/zones?name=${d}`, use: (r, s) => { s.ZONE = r.result && r.result[0] && r.result[0].id; } },
    { title: "Only if no zone: add the domain to Cloudflare (then set the 2 nameservers it returns at the registrar and wait)", method: "POST", url: `${API}/zones`, body: { name: d, account: { id: account }, type: "full" }, when: (s) => !s.ZONE, use: (r, s) => { s.ZONE = r.result && r.result.id; s.NS = r.result && r.result.name_servers; } },
    { title: `Point ${d} at the Worker (Workers Custom Domain, makes DNS + certificate)`, method: "PUT", url: `${API}/accounts/${account}/workers/domains`, body: { hostname: d, zone_id: "${ZONE}", service: WORKER, environment: "production" } },
    { title: `Point www.${d} at the Worker too`, method: "PUT", url: `${API}/accounts/${account}/workers/domains`, body: { hostname: `www.${d}`, zone_id: "${ZONE}", service: WORKER, environment: "production" } },
    ...(gsc ? [{ title: "Google Search Console: add the DNS TXT proof", method: "POST", url: `${API}/zones/\${ZONE}/dns_records`, body: { type: "TXT", name: d, content: `google-site-verification=${gsc}`, ttl: 3600 } }] : []),
    { title: "Turnstile: read the widget's allowed hostnames", method: "GET", url: `${API}/accounts/${account}/challenges/widgets/${sitekey}`, use: (r, s) => { s.TS = r.result || {}; } },
    { title: `Turnstile: allow ${d} (keeps the hostnames already there)`, method: "PUT", url: `${API}/accounts/${account}/challenges/widgets/${sitekey}`, body: { name: "${TS.name}", mode: "${TS.mode}", domains: ["${TS.domains}", d] } },
    { title: "Web Analytics: add the site (free, no cookies); returns its token", method: "POST", url: `${API}/accounts/${account}/rum/site_info`, body: { host: d, auto_install: false }, use: (r, s) => { s.RUM = r.result && r.result.site_token; } },
    { title: "D1: set the domain, the analytics token, and status live", method: "POST", url: `${API}/accounts/${account}/d1/database/${d1}/query`, body: { sql: "UPDATE sites SET domain = ?, status = 'live', form_json = json_set(form_json, '$.hosting.analyticsToken', ?), updated_at = ? WHERE id = ?", params: [d, "${RUM}", "${NOW}", siteId] } },
    { title: "Render and store the live page", method: "POST", url: `https://${d}/api/ops/publish`, body: { siteId }, auth: "ops" },
  ];
}

const fill = (v, s) => JSON.parse(JSON.stringify(v).replace(/"\$\{TS\.domains\}",?/g, () => (s.TS && s.TS.domains ? s.TS.domains.map((x) => JSON.stringify(x)).join(",") + "," : "")).replace(/\$\{(\w+)(?:\.(\w+))?\}/g, (m, a, b) => {
  const v2 = b ? s[a] && s[a][b] : s[a];
  return v2 == null ? m : String(v2).replace(/"/g, '\\"');
}));

export function printPlan(steps, out = console.log) {
  out("DRY RUN: nothing is changed. Add --apply (only after the CEO says ok) to do these calls.\n");
  steps.forEach((st, i) => {
    out(`${i + 1}. ${st.title}\n   ${st.method} ${st.url}${st.body ? `\n   ${JSON.stringify(st.body)}` : ""}`);
  });
  out("\nAfter: Search Console > Add property (Domain) > Verify; then Sitemaps > submit https://<domain>/sitemap.xml. Check list in hosting/GO-LIVE.md.");
}

async function apply(steps, env) {
  const s = { NOW: new Date().toISOString() };
  for (const [i, st0] of steps.entries()) {
    if (st0.when && !st0.when(s)) { console.log(`${i + 1}. skip: ${st0.title}`); continue; }
    const st = fill(st0, s);
    const auth = st0.auth === "ops" ? `Bearer ${env.OPS_KEY}` : `Bearer ${env.CLOUDFLARE_API_TOKEN}`;
    const r = await fetch(st.url, { method: st.method, headers: { authorization: auth, "content-type": "application/json" }, body: st.body ? JSON.stringify(st.body) : undefined });
    const j = await r.json().catch(() => ({}));
    console.log(`${i + 1}. ${r.ok ? "ok  " : "FAIL"} ${st.title}`);
    if (!r.ok) { console.log(JSON.stringify(j).slice(0, 800)); process.exit(1); }
    if (st0.use) st0.use(j, s);
    if (s.NS) { console.log(`Set these nameservers at the registrar, wait for Cloudflare to say Active, then run again: ${s.NS.join(", ")}`); process.exit(0); }
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const get = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const valued = new Set(["--domain", "--gsc"]);
  const siteId = argv.find((x, i) => !x.startsWith("--") && !valued.has(argv[i - 1]));
  if (!siteId || !get("domain")) {
    console.log("Usage: node hosting/scripts/golive.mjs <siteId> --domain example.com [--gsc TOKEN] [--apply]");
    process.exit(2);
  }
  const env = process.env;
  const doApply = argv.includes("--apply");
  const steps = plan({
    siteId, domain: get("domain"), gsc: get("gsc"),
    ...(doApply ? { account: env.CLOUDFLARE_ACCOUNT_ID, d1: env.D1_DATABASE_ID, sitekey: env.TURNSTILE_SITE_KEY } : {}),
  });
  if (!doApply) return printPlan(steps);
  const need = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "D1_DATABASE_ID", "TURNSTILE_SITE_KEY", "OPS_KEY"].filter((k) => !env[k]);
  if (need.length) { console.log(`Missing: ${need.join(", ")}`); process.exit(2); }
  await apply(steps, env);
  console.log("Live. Now verify in Search Console and submit the sitemap (GO-LIVE.md).");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
