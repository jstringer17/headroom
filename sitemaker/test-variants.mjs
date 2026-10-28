// Picture variants (kit.variants): data shape, slot ids, library paths, prompt rules, placeholders.
// node sitemaker/test-variants.mjs
import { CINE_KIT, cineVariants, cineVariant, variantSlots, kitSlots } from "./src/cine-kit.js";
import { placeholderSvg } from "./src/cine-look.js";
let fails = 0, n = 0;
const ok = (c, msg) => { n++; if (!c) { fails++; console.log("FAIL", msg); } };
const SLOTS = ["s1", "s2", "s3", "s4", "before", "after"];
for (const t of ["roofing", "fencing", "pressure"]) {
  const vs = cineVariants(t);
  ok(vs.length === 6 && vs[0].default && vs.filter((v) => v.default).length === 1, `${t}: 6 variants, the first is the only default`);
  ok(variantSlots(t, vs[0].key).map((s) => s.slotId).join() === kitSlots(t).map((s) => s.slotId).join(), `${t}: default variant keeps today's slot ids`);
  ok(variantSlots(t, vs[0].key).every((s) => s.path === `library/${t}/${s.slotId}.webp`), `${t}: default paths are library/<trade>/<slot>.webp`);
  ok(cineVariant(t, "nope").variant === vs[0].key && cineVariant(t, vs[0].key).slotPrefix === "", `${t}: unknown key falls back to the default`);
  const ids = new Set(kitSlots(t).map((s) => s.slotId));
  for (const v of vs.slice(1)) {
    const slots = variantSlots(t, v.key), k = cineVariant(t, v.key);
    ok(slots.map((s) => s.slotId).join() === SLOTS.map((s) => `${v.key}/${s}`).join(), `${t}/${v.key}: slots s1..s4, before, after`);
    ok(slots.every((s) => s.path === `library/${t}/${v.key}/${s.slotId.split("/")[1]}.webp`), `${t}/${v.key}: library/<trade>/<variant>/<slot>.webp`);
    ok(k.slotPrefix === `${v.key}/` && k.story.length === 4 && k.beforeAfter.before.id === `${v.key}/before`, `${t}/${v.key}: cineVariant swaps story and pair`);
    for (const s of slots) {
      ok(!ids.has(s.slotId), `${t}: slot id ${s.slotId} repeats`); ids.add(s.slotId);
      for (const w of ["16:9", "No people", "no faces", "no text", "no logos"]) ok(s.prompt.includes(w), `${s.slotId}: prompt lacks "${w}"`);
      const svg = placeholderSvg(t, s.slotId, s.label);
      ok(svg.includes("Sample picture: make in Higgsfield") && svg.includes('id="qt"'), `${s.slotId}: quiet labeled placeholder`);
    }
    for (const s of k.story) ok(s.headline && s.headline.includes(s.accent), `${t}/${v.key}: accent word "${s.accent}" is in "${s.headline}"`);
  }
}
const total = ["roofing", "fencing", "pressure"].reduce((a, t) => a + cineVariants(t).slice(1).length * 6, 0);
ok(total === 90, `90 new variant pictures (got ${total})`);
console.log(fails ? `${fails} of ${n} variant checks failed` : `PASS: variants (${n} checks, ${total} new pictures)`);
process.exit(fails ? 1 : 0);
