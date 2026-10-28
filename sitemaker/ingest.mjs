// Sort a folder of picture files into sitemaker/library/<trade>/<slot>.webp.
//
// By name:   node sitemaker/ingest.mjs <folder> [--force] [--dry-run] [--library <dir>]
//   Files are named <trade>-<slot>.(jpg|jpeg|png|webp), for example roofing-old.jpg or fencing-stakes.png.
//
// By order:  node sitemaker/ingest.mjs --trade roofing --by-order <folder> [--yes] [--sort mtime|name]
//              [--skip 3,7] [--allow-fewer] [--with-optional] [--sheet out.jpg] [--force] [--library <dir>]
//   For downloads that kept their default names. The picture files are sorted (oldest first by modification
//   time, or by name) and handed to the trade's required slots in the picture book's order
//   (org/art/higgsfield-kit.md: story, styles, before, after; optional service pictures only with
//   --with-optional). It ALWAYS prints the table first (position, file, size, pixels, slot) and writes a
//   contact sheet picture so the order can be checked by eye; pictures are written only with --yes.
//   The count must match the slots, unless --allow-fewer (fewer files: the first slots are filled).
//   --skip drops downloads you rejected by their position in the sorted list (positions start at 1).
//
// Trade keys are in src/trades.js, slot ids in src/cine-kit.js. Each picture is resized to 1600 px wide and
// written as WebP of about 250 KB (sharp if installed, else ffmpeg, else Python with Pillow, else the file is
// copied as it is). A picture already in the library is never replaced unless --force.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync, rmSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { TRADE_ORDER } from "./src/trades.js";
import { CINE_KIT } from "./src/cine-kit.js";
import { extraVariantKeys, ownSlotIds, variantKey } from "./src/variants.js";
// Test hook: SITEMAKER_KIT_PATCH=<file.js> runs JS against CINE_KIT (fixture variations before the real ones exist).
if (process.env.SITEMAKER_KIT_PATCH) new Function("CINE_KIT", readFileSync(process.env.SITEMAKER_KIT_PATCH, "utf8"))(CINE_KIT);

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const VALUE_OPTS = ["--library", "--trade", "--sort", "--skip", "--sheet", "--variant"];
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUE_OPTS.includes(args[i - 1]));
const folder = positional[0];
const libDir = val("--library") || join(here, "library");
const FORCE = flag("--force"), DRY = flag("--dry-run");
const TARGET_KB = 260, WIDTH = 1600;

if (!folder || flag("--help")) {
  console.log("Usage:\n  node sitemaker/ingest.mjs <folder> [--force] [--dry-run] [--library <dir>]     files named <trade>-<slot>.jpg, e.g. roofing-old.jpg\n  node sitemaker/ingest.mjs --trade roofing --by-order <folder> [--yes] [--sort mtime|name] [--skip 3,7] [--allow-fewer] [--with-optional] [--sheet out.jpg] [--force]");
  process.exit(folder ? 0 : 1);
}
if (!existsSync(folder) || !statSync(folder).isDirectory()) { console.error(`Not a folder: ${folder}`); process.exit(1); }

// Slot ids of a trade's variation, in the picture book's order: story, styles, before, after (required), then the
// optional service pictures (default variation only). Non-default ids look like "metal/s1".
function slotsOf(trade, variant) {
  const k = CINE_KIT[trade];
  if (!k) return { required: [], optional: [] };
  const required = ownSlotIds(k, variant);
  const isDefault = variantKey(k, variant) === variantKey(k, "");
  const optional = isDefault ? ((k.editorial && k.editorial.extra) || []).map((x) => x.id) : [];
  return { required, optional };
}
// Variation keys of a trade, default first ([""] when the trade has none).
const variantsOf = (trade) => { const vs = ((CINE_KIT[trade] && CINE_KIT[trade].variants) || []).map((v) => v.key); return vs.length ? vs : [""]; };
// Where a slot's picture lives: library/<trade>/<id>.webp, and "metal/s1" means library/<trade>/metal/s1.webp.
const slotDir = (trade, id) => join(libDir, trade, ...id.split("/").slice(0, -1));
const slotBase = (id) => id.split("/").pop();
const findExisting = (trade, id) => ["webp", "jpg", "jpeg", "png"].map((e) => join(slotDir(trade, id), `${slotBase(id)}.${e}`)).find((q) => existsSync(q));

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

// ---- By order: downloads that kept their default names, handed to the trade's slots in book order.
async function contactSheet(items, out) {
  // items: [{ path, label }]. A grid of 320x180 thumbnails with the position and slot under each one.
  mkdirSync(dirname(out), { recursive: true });
  if (hasPil) {
    const code = "import sys\nfrom PIL import Image,ImageDraw,ImageFont\nout=sys.argv[1]\nitems=[a.split('|',1) for a in sys.argv[2:]]\nW,H,L,G=320,180,30,10\ncols=min(4,len(items))\nrows=(len(items)+cols-1)//cols\nsheet=Image.new('RGB',(cols*(W+G)+G,rows*(H+L+G)+G),(245,242,235))\nd=ImageDraw.Draw(sheet)\ntry:\n    f=ImageFont.load_default(size=15)\nexcept TypeError:\n    f=ImageFont.load_default()\nfor i,(p,l) in enumerate(items):\n    x=G+(i%cols)*(W+G); y=G+(i//cols)*(H+L+G)\n    try:\n        im=Image.open(p).convert('RGB'); im.thumbnail((W,H)); sheet.paste(im,(x+(W-im.width)//2,y+(H-im.height)//2))\n    except Exception:\n        d.rectangle([x,y,x+W,y+H],outline=(180,0,0))\n    d.text((x+4,y+H+6),l[:44],fill=(20,20,20),font=f)\nsheet.save(out,quality=85)\n";
    const r = spawnSync("python3", ["-I", "-c", code, out, ...items.map((i) => `${i.path}|${i.label}`)]);
    if (r.status === 0) return "pillow";
  }
  if (hasFfmpeg) {
    // no labels without a font: tiles are left to right, top to bottom, in the order of the table
    const cols = Math.min(4, items.length), W = 320, H = 180;
    const inputs = items.flatMap((i) => ["-i", i.path]);
    const scale = items.map((_, k) => `[${k}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2[v${k}]`).join(";");
    const layout = items.map((_, k) => `${(k % cols) * W}_${Math.floor(k / cols) * H}`).join("|");
    const graph = `${scale};${items.map((_, k) => `[v${k}]`).join("")}xstack=inputs=${items.length}:layout=${layout}[o]`;
    const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", graph, "-map", "[o]", "-frames:v", "1", out]);
    if (r.status === 0) return "ffmpeg";
  }
  return null;
}

if (flag("--by-order")) {
  const trade = val("--trade");
  if (!trade || !TRADE_ORDER.includes(trade)) {
    console.error(`--by-order needs --trade <key>. Trades: ${TRADE_ORDER.join(", ")}`);
    process.exit(2);
  }
  const sort = val("--sort") || "mtime";
  if (!["mtime", "name"].includes(sort)) { console.error("--sort is mtime or name"); process.exit(2); }
  const vkeys = variantsOf(trade).filter(Boolean);
  const wantVariant = val("--variant") || "";
  if (wantVariant && !vkeys.includes(wantVariant)) { console.error(`${trade} has ${vkeys.length ? "the variations: " + vkeys.join(", ") : "no variations"}; got --variant ${wantVariant}`); process.exit(2); }
  const variant = wantVariant && wantVariant !== vkeys[0] ? wantVariant : "";
  const { required, optional } = slotsOf(trade, variant);
  const slots = flag("--with-optional") ? [...required, ...optional] : required;
  const skip = new Set((val("--skip") || "").split(",").map((x) => parseInt(x, 10)).filter((n) => n > 0));
  const imgs = readdirSync(folder).filter((f) => statSync(join(folder, f)).isFile() && !f.startsWith(".") && /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => ({ f, path: join(folder, f), m: statSync(join(folder, f)).mtimeMs, bytes: statSync(join(folder, f)).size }));
  imgs.sort(sort === "name" ? (a, b) => a.f.localeCompare(b.f, undefined, { numeric: true }) : (a, b) => a.m - b.m || a.f.localeCompare(b.f, undefined, { numeric: true }));
  imgs.forEach((x, i) => { x.pos = i + 1; });
  const bad = [...skip].filter((n) => n > imgs.length);
  if (bad.length) { console.error(`--skip position ${bad.join(", ")} is past the last picture (${imgs.length} pictures).`); process.exit(2); }
  const keep = imgs.filter((x) => !skip.has(x.pos));
  keep.forEach((x, i) => { x.slot = slots[i] || null; });
  const sizeTxt = (x) => { const z = sizeOf(readFileSync(x.path)); x.px = z ? `${z.w}x${z.h}` : "?"; return x.px; };
  imgs.forEach(sizeTxt);
  console.log(`\n${trade}${variant ? "/" + variant : ""}: ${imgs.length} picture files in ${folder}, sorted by ${sort}${skip.size ? `, skipping position ${[...skip].sort((a, b) => a - b).join(", ")}` : ""}; ${slots.length} slots${flag("--with-optional") ? " (with optional)" : " (required only)"}`);
  console.log("\npos  file                              KB      pixels      slot");
  for (const x of imgs) console.log(`${String(x.pos).padEnd(4)} ${x.f.slice(0, 33).padEnd(33)} ${String(Math.round(x.bytes / 1024)).padEnd(7)} ${x.px.padEnd(11)} ${skip.has(x.pos) ? "(skipped)" : x.slot || "(no slot left)"}`);
  const sheetOut = val("--sheet") || join(here, "test-out", `ingest-${trade}-order.jpg`);
  const tool = await contactSheet(keep.filter((x) => x.slot).map((x) => ({ path: x.path, label: `${x.pos}. ${x.slot}  ${x.f}` })), sheetOut);
  console.log(tool ? `\ncontact sheet (${tool}): ${sheetOut}` : "\n(no contact sheet: needs Pillow or ffmpeg)");
  for (const x of keep) { const z = sizeOf(readFileSync(x.path)); if (z && Math.abs(z.w / z.h - 16 / 9) > 0.08) console.log(`warning: ${x.pos} ${x.f} is ${z.w}x${z.h}, not 16:9`); if (x.bytes > 2 * 1024 * 1024) console.log(`warning: ${x.pos} ${x.f} is over 2 MB`); }
  const unfilled = slots.slice(keep.length);
  if (keep.length > slots.length) {
    console.error(`\nRefused: ${keep.length} pictures for ${slots.length} slots. Drop the extra downloads with --skip <positions>.`);
    process.exit(3);
  }
  if (unfilled.length && !flag("--allow-fewer")) {
    console.error(`\nRefused: ${keep.length} pictures for ${slots.length} slots; missing: ${unfilled.join(", ")}. Add them, or pass --allow-fewer to fill only the first ${keep.length} slots.`);
    process.exit(3);
  }
  if (unfilled.length) console.log(`\nfewer pictures than slots: not filled: ${unfilled.join(", ")}`);
  if (!flag("--yes")) { console.log("\nDry run only. Check the table and the contact sheet, then run again with --yes to write."); process.exit(0); }
  let written = 0, left = 0;
  for (const x of keep) {
    const dir = slotDir(trade, x.slot), base = slotBase(x.slot);
    const existing = findExisting(trade, x.slot);
    if (existing && !FORCE) { console.log(`left alone: ${trade}/${x.slot} (already in the library; use --force to replace)`); left++; continue; }
    mkdirSync(dir, { recursive: true });
    if (existing) rmSync(existing);
    const dest = join(dir, `${base}.webp`);
    const used = await convert(x.path, dest);
    if (used === "copy") { rmSync(dest, { force: true }); copyFileSync(x.path, join(dir, `${base}${extname(x.f).toLowerCase() === ".jpeg" ? ".jpg" : extname(x.f).toLowerCase()}`)); console.log(`warning: ${x.f}: no image converter (sharp, ffmpeg, Pillow); copied as it is`); }
    console.log(`written: ${trade}/${x.slot}  <- ${x.f} (${used})`);
    written++;
  }
  console.log(`\n${written} written, ${left} left alone`);
  process.exit(0);
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
  let slot = stem.slice(trade.length + 1).trim().toLowerCase().replace(/[ _]+/g, "-");
  // <trade>-<variant>-<slot>: the variation key comes first. The default variation's key may be written too.
  const vkeys = variantsOf(trade).filter(Boolean);
  const vk = vkeys.find((v) => slot.startsWith(v + "-"));
  let variant = "";
  if (vk) { variant = vk; slot = slot.slice(vk.length + 1); }
  const isDefaultVariant = !vk || vk === vkeys[0];
  if (vk && vk === vkeys[0]) variant = "";
  const id = vk && vk !== vkeys[0] ? `${vk}/${slot}` : slot;
  const { required, optional } = slotsOf(trade, variant);
  if (!required.includes(id) && !optional.includes(id)) {
    const shown = required.map((x) => x.split("/").pop());
    errors.push(`${f}: unknown slot "${slot}" for ${trade}${variant ? " variant " + variant : ""}. Slots: ${shown.join(", ")}${optional.length ? " (optional: " + optional.join(", ") + ")" : ""}${vkeys.length ? ". Variations: " + vkeys.join(", ") : ""}`);
    continue;
  }
  const buf = readFileSync(join(folder, f));
  const sz = sizeOf(buf);
  if (sz && Math.abs(sz.w / sz.h - 16 / 9) > 0.08) warnings.push(`${f}: ${sz.w}x${sz.h} is not 16:9 (pictures are cropped to fit; make them wide)`);
  if (buf.length > 2 * 1024 * 1024) warnings.push(`${f}: ${(buf.length / 1048576).toFixed(1)} MB is over 2 MB (it is shrunk to about ${TARGET_KB} KB)`);
  const dir = slotDir(trade, id), base = slotBase(id);
  const existing = findExisting(trade, id);
  if (existing && !FORCE) { skipped.push(`${trade}/${id} (already in the library; use --force to replace)`); (found[trade] = found[trade] || new Set()).add(id); continue; }
  if (DRY) { done.push(`${trade}/${id} (dry run)`); (found[trade] = found[trade] || new Set()).add(id); continue; }
  mkdirSync(dir, { recursive: true });
  if (existing) rmSync(existing);
  const dest = join(dir, `${base}.webp`);
  const tool = await convert(join(folder, f), dest);
  if (tool === "copy") {
    // no converter: keep the original format so the library still works
    rmSync(dest, { force: true });
    const keep = join(dir, `${base}${ext === ".jpeg" ? ".jpg" : ext}`);
    copyFileSync(join(folder, f), keep);
    warnings.push(`${f}: no image converter found (sharp, ffmpeg, Pillow); copied as it is, not resized`);
  }
  done.push(`${trade}/${id} (${tool}, ${Math.round(statSync(existsSync(dest) ? dest : join(dir, `${base}${ext}`)).size / 1024)} KB)`);
  (found[trade] = found[trade] || new Set()).add(id);
}

// Summary: every trade (and every variation), pictures in the library now and what is missing.
console.log("\ntrade / variation       in library   missing");
let allHave = 0, allNeed = 0;
for (const trade of TRADE_ORDER) {
  for (const v of variantsOf(trade)) {
    const { required } = slotsOf(trade, v);
    const present = required.filter((sl) => findExisting(trade, sl));
    allHave += present.length; allNeed += required.length;
    const missing = required.filter((sl) => !present.includes(sl)).map((sl) => sl.split("/").pop());
    const label = v && v !== variantsOf(trade)[0] ? `${trade}/${v}` : variantsOf(trade).length > 1 ? `${trade}/${v}` : trade;
    console.log(`${label.padEnd(23)} ${String(present.length + "/" + required.length).padEnd(12)} ${missing.length ? missing.join(", ") : "-"}`);
  }
}
console.log(`\nlibrary: ${allHave} of ${allNeed} pictures`);
if (done.length) console.log(`\nwritten (${done.length}):\n  ` + done.join("\n  "));
if (skipped.length) console.log(`\nleft alone (${skipped.length}):\n  ` + skipped.join("\n  "));
if (warnings.length) console.log(`\nwarnings (${warnings.length}):\n  ` + warnings.join("\n  "));
if (errors.length) { console.error(`\nrejected (${errors.length}):\n  ` + errors.join("\n  ")); process.exit(2); }
