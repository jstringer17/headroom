// Sort a folder of picture files into sitemaker/library/<trade>/<slot>.webp.
//   node sitemaker/ingest.mjs <folder> [--force] [--dry-run] [--library <dir>]
// Files are named <trade>-<slot>.(jpg|jpeg|png|webp), for example roofing-old.jpg or fencing-stakes.png.
// Trade keys are in src/trades.js, slot ids are in src/cine-kit.js (list: org/art/higgsfield-kit.md).
// Each picture is resized to 1600 px wide and written as WebP of about 250 KB (sharp if it is installed,
// else ffmpeg, else Python with Pillow, else the file is copied as it is). A picture that is already in
// the library is never replaced unless --force. Unknown trade or slot names are rejected with a list.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync, rmSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { TRADE_ORDER } from "./src/trades.js";
import { CINE_KIT } from "./src/cine-kit.js";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const positional = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--library");
const folder = positional[0];
const libDir = val("--library") || join(here, "library");
const FORCE = flag("--force"), DRY = flag("--dry-run");
const TARGET_KB = 260, WIDTH = 1600;

if (!folder || flag("--help")) {
  console.log("Usage: node sitemaker/ingest.mjs <folder> [--force] [--dry-run] [--library <dir>]\nFiles: <trade>-<slot>.(jpg|png|webp), e.g. roofing-old.jpg");
  process.exit(folder ? 0 : 1);
}
if (!existsSync(folder) || !statSync(folder).isDirectory()) { console.error(`Not a folder: ${folder}`); process.exit(1); }

// All slot ids per trade, in kit order: story, styles, before, after (required), then optional extras.
function slotsOf(trade) {
  const k = CINE_KIT[trade];
  if (!k) return { required: [], optional: [] };
  const required = [...(k.story || []).map((s) => s.id), ...(k.styles || []).map((s) => s.id)];
  if (k.beforeAfter) required.push("before", "after");
  const optional = ((k.editorial && k.editorial.extra) || []).map((x) => x.id);
  return { required, optional };
}

// Picture size from the file header (png, jpeg, webp) without any library.
function sizeOf(buf) {
  try {
    if (buf.slice(0, 8).toString("hex") === "89504e470d0a1a0a") return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") {
      const t = buf.slice(12, 16).toString();
      if (t === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (t === "VP8L") { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
      if (t === "VP8X") return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
    }
  } catch (_) { /* fall through */ }
  return null;
}

let sharp = null;
try { sharp = (await import("sharp")).default; } catch (_) { /* not installed */ }
const have = (cmd, a) => { try { return spawnSync(cmd, a, { stdio: "ignore" }).status === 0; } catch (_) { return false; } };
const hasFfmpeg = have("ffmpeg", ["-version"]);
const hasPil = have("python3", ["-I", "-c", "import PIL"]);

// Convert to WebP: 1600 px wide at most, quality lowered until it is about 250 KB. Returns the tool used.
async function convert(src, dest) {
  const target = TARGET_KB * 1024;
  if (sharp) {
    let buf;
    for (const q of [82, 76, 70, 64, 58, 52]) {
      buf = await sharp(src).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: q }).toBuffer();
      if (buf.length <= target) break;
    }
    writeFileSync(dest, buf); return "sharp";
  }
  if (hasFfmpeg) {
    for (const q of [82, 76, 70, 64, 58, 52]) {
      const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src, "-vf", `scale='min(${WIDTH},iw)':-2`, "-c:v", "libwebp", "-quality", String(q), dest]);
      if (r.status !== 0) break;
      if (statSync(dest).size <= target) return "ffmpeg";
    }
    if (existsSync(dest)) return "ffmpeg";
  }
  if (hasPil) {
    const code = "import sys,os\nfrom PIL import Image,ImageOps\nsrc,dest,w,t=sys.argv[1],sys.argv[2],int(sys.argv[3]),int(sys.argv[4])\nim=ImageOps.exif_transpose(Image.open(src)).convert('RGB')\nif im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)\nfor q in (82,76,70,64,58,52):\n    im.save(dest,'WEBP',quality=q,method=6)\n    if os.path.getsize(dest)<=t: break\n";
    const r = spawnSync("python3", ["-I", "-c", code, src, dest, String(WIDTH), String(target)]);
    if (r.status === 0) return "pillow";
  }
  copyFileSync(src, dest); return "copy";
}

const files = readdirSync(folder).filter((f) => statSync(join(folder, f)).isFile() && !f.startsWith("."));
const errors = [], warnings = [], done = [], skipped = [];
const found = {}; // trade -> Set(slot)
const keys = [...TRADE_ORDER].sort((a, b) => b.length - a.length);

for (const f of files.sort()) {
  const ext = extname(f).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) { errors.push(`${f}: not a jpg, png or webp picture`); continue; }
  const stem = basename(f, extname(f));
  const trade = keys.find((k) => stem.toLowerCase().startsWith(k) && /^[-_ ]/.test(stem.slice(k.length)));
  if (!trade) {
    const guess = stem.split(/[-_ ]/)[0];
    errors.push(`${f}: unknown trade "${guess}". Trades: ${TRADE_ORDER.join(", ")}`);
    continue;
  }
  const slot = stem.slice(trade.length + 1).trim().toLowerCase().replace(/[ _]+/g, "-");
  const { required, optional } = slotsOf(trade);
  if (!required.includes(slot) && !optional.includes(slot)) {
    errors.push(`${f}: unknown slot "${slot}" for ${trade}. Slots: ${required.join(", ")}${optional.length ? " (optional: " + optional.join(", ") + ")" : ""}`);
    continue;
  }
  const buf = readFileSync(join(folder, f));
  const sz = sizeOf(buf);
  if (sz && Math.abs(sz.w / sz.h - 16 / 9) > 0.08) warnings.push(`${f}: ${sz.w}x${sz.h} is not 16:9 (pictures are cropped to fit; make them wide)`);
  if (buf.length > 2 * 1024 * 1024) warnings.push(`${f}: ${(buf.length / 1048576).toFixed(1)} MB is over 2 MB (it is shrunk to about ${TARGET_KB} KB)`);
  const dir = join(libDir, trade);
  const existing = ["webp", "jpg", "jpeg", "png"].map((e) => join(dir, `${slot}.${e}`)).find((p) => existsSync(p));
  if (existing && !FORCE) { skipped.push(`${trade}/${slot} (already in the library; use --force to replace)`); (found[trade] = found[trade] || new Set()).add(slot); continue; }
  if (DRY) { done.push(`${trade}/${slot} (dry run)`); (found[trade] = found[trade] || new Set()).add(slot); continue; }
  mkdirSync(dir, { recursive: true });
  if (existing) rmSync(existing);
  const dest = join(dir, `${slot}.webp`);
  const tool = await convert(join(folder, f), dest);
  if (tool === "copy") {
    // no converter: keep the original format so the library still works
    rmSync(dest, { force: true });
    const keep = join(dir, `${slot}${ext === ".jpeg" ? ".jpg" : ext}`);
    copyFileSync(join(folder, f), keep);
    warnings.push(`${f}: no image converter found (sharp, ffmpeg, Pillow); copied as it is, not resized`);
  }
  done.push(`${trade}/${slot} (${tool}, ${Math.round(statSync(existsSync(dest) ? dest : join(dir, `${slot}${ext}`)).size / 1024)} KB)`);
  (found[trade] = found[trade] || new Set()).add(slot);
}

// Summary: every trade, pictures in the library now (found here or already there) and what is missing.
console.log("\ntrade           in library   missing");
let allHave = 0, allNeed = 0;
for (const trade of TRADE_ORDER) {
  const { required } = slotsOf(trade);
  const dir = join(libDir, trade);
  const present = required.filter((s) => ["webp", "jpg", "jpeg", "png"].some((e) => existsSync(join(dir, `${s}.${e}`))));
  allHave += present.length; allNeed += required.length;
  const missing = required.filter((s) => !present.includes(s));
  console.log(`${trade.padEnd(15)} ${String(present.length + "/" + required.length).padEnd(12)} ${missing.length ? missing.join(", ") : "-"}`);
}
console.log(`\nlibrary: ${allHave} of ${allNeed} pictures`);
if (done.length) console.log(`\nwritten (${done.length}):\n  ` + done.join("\n  "));
if (skipped.length) console.log(`\nleft alone (${skipped.length}):\n  ` + skipped.join("\n  "));
if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ` + warnings.join("\n  "));
if (errors.length) { console.error(`\nrejected (${errors.length}):\n  ` + errors.join("\n  ")); process.exit(2); }
