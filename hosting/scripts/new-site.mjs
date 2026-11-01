// Make a hosted site row from a maker form (LOCAL only; nothing touches Cloudflare unless you run the printed commands with --remote).
//   node hosting/scripts/new-site.mjs form.json --domain acme.com --owner-email owner@acme.com [--owner-name "Al"] [--notify-sms +15125550000]
//        [--place-id ChIJ...] [--id abc123] [--status draft|live] [--out site.sql] [--local]
// Writes SQL (one INSERT) and pulls any uploaded pictures out of the form into files for R2 (media/<id>/<slot>.<ext>),
// so the D1 row stays small. --local also runs the SQL and R2 puts against `wrangler dev --local` storage.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

export function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith("--")) {
      const key = k.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) a[key] = true; else { a[key] = next; i++; }
    } else a._.push(k);
  }
  return a;
}

const q = (v) => (v === null || v === undefined || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
export const cleanDomain = (d) => String(d || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(9)), (x) => "abcdefghijklmnopqrstuvwxyz0123456789"[x % 36]).join("");

// Pull data: pictures out of the form. Returns { form, files: [{ key, path, type }] }.
export function extractPictures(form, id, domain, outDir) {
  const f = JSON.parse(JSON.stringify(form));
  const files = [];
  const take = (src, name) => {
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(src || ""));
    if (!m) return src;
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const file = `${name.replace(/[^A-Za-z0-9_-]/g, "-")}.${ext}`;
    const path = join(outDir, file);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path, Buffer.from(m[2], "base64"));
    files.push({ key: `media/${id}/${file}`, path, type: `image/${m[1]}` });
    return `https://${domain}/media/${file}`;
  };
  if (f.heroImage) f.heroImage = take(f.heroImage, "hero");
  if (f.cine && f.cine.images) for (const k of Object.keys(f.cine.images)) f.cine.images[k] = take(f.cine.images[k], k);
  return { form: f, files };
}

// One INSERT for the site, plus the owner's maker-typed reviews as manual review rows (the live page reads reviews only from the table).
export function siteSql({ id, form, domain, status, owner_name, owner_email, notify_sms, place_id, now }) {
  const f = { ...form };
  const typed = (Array.isArray(f.reviewList) ? f.reviewList : []).filter((r) => r && String(r.text || "").trim()).slice(0, 3);
  delete f.reviewList;
  const cols = { id, slug: domain.split(".")[0], domain, status, form_json: JSON.stringify(f), owner_name, owner_email, notify_email: owner_email, notify_sms, place_id, created_at: now, updated_at: now };
  let sql = `INSERT INTO sites (${Object.keys(cols).join(", ")}) VALUES (${Object.values(cols).map(q).join(", ")});\n`;
  for (const r of typed) {
    const stars = Math.min(5, Math.max(1, parseInt(r.stars, 10) || 5));
    const author = [r.name, r.town].map((x) => String(x || "").trim()).filter(Boolean).join(", ").slice(0, 80);
    sql += `INSERT INTO reviews (site_id, source, author, stars, text, posted_at, fetched_at, show) VALUES (${q(id)}, 'manual', ${q(author)}, ${stars}, ${q(String(r.text).trim().slice(0, 240))}, ${q(now)}, NULL, 1);\n`;
  }
  return sql;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const file = a._[0];
  const domain = cleanDomain(a.domain);
  if (!file || !domain || !a["owner-email"]) {
    console.log("Usage: node hosting/scripts/new-site.mjs form.json --domain acme.com --owner-email owner@acme.com [--owner-name N] [--notify-sms +1...] [--place-id P] [--id ID] [--status draft|live] [--local]");
    process.exit(2);
  }
  const status = a.status === "live" ? "live" : "draft";
  const id = typeof a.id === "string" ? a.id.replace(/[^a-z0-9_-]/gi, "") : randomId();
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const outDir = join(root, ".wrangler", "new-site", id);
  const { form, files } = extractPictures(raw, id, domain, outDir);
  if (!form.company || !form.trade) console.log("WARNING: form has no company or trade.");
  if (!form.phone) console.log("WARNING: form has no phone; publishSite will refuse it.");
  const sql = siteSql({ id, form, domain, status, owner_name: a["owner-name"] || null, owner_email: a["owner-email"], notify_sms: a["notify-sms"] || null, place_id: a["place-id"] || null, now: new Date().toISOString() });
  const out = typeof a.out === "string" ? a.out : join(outDir, "site.sql");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, sql);
  const cmds = [
    ["npx", "wrangler", "d1", "execute", "headroom", "--local", "--file", out],
    ...files.map((f) => ["npx", "wrangler", "r2", "object", "put", `headroom-sites/${f.key}`, "--local", "--file", f.path, "--content-type", f.type]),
  ];
  console.log(`site id: ${id}\ndomain:  ${domain}\nstatus:  ${status}\nSQL:     ${out} (${sql.length} bytes)\npictures: ${files.length}`);
  console.log("\nLocal commands (run from hosting/):\n" + cmds.map((c) => "  " + c.join(" ")).join("\n"));
  console.log("\nThen publish it: POST /api/ops/publish {\"siteId\":\"" + id + "\"} with the OPS_KEY, or save it once in the owner admin.");
  if (a.local) {
    for (const c of cmds) {
      const r = spawnSync(c[0], c.slice(1), { cwd: root, stdio: "inherit" });
      if (r.status !== 0) { console.log("FAILED:", c.join(" ")); process.exit(1); }
    }
    console.log("done (local)");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
