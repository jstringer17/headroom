// Writes org/art/higgsfield-kit.md from the kit: node org/art/kit-doc.mjs
import { CINE_KIT, CINE_ORDER, kitSlots, cineVariants, variantSlots } from "../../sitemaker/src/cine-kit.js";
import { TRADES } from "../../sitemaker/src/trades.js";
import { writeFileSync } from "fs";

const NEW = { restoration: "Restoration", builder: "Home builder", framing: "Framing" };
const name = (t) => (TRADES[t] && TRADES[t].label) || NEW[t] || t;
const total = CINE_ORDER.reduce((n, t) => n + kitSlots(t).length, 0);
const how = {
  story0: "Make this one new. It is the base picture for the story.",
  story: "Use Edit on the picture just above.",
  style: "Style tab picture. Make it new.",
  before: "Before picture for the drag slider. Make it new.",
  after: "After picture. Use Edit on the before picture.",
};

let md = `# Higgsfield picture kit (Cinematic mode)
Made from sitemaker/src/cine-kit.js. Run \`node org/art/kit-doc.mjs\` after any kit change.

**Total: ${total} pictures for ${CINE_ORDER.length} trades.** Make them in this order (top first). Stop any time: empty slots show a drawn sample.

| # | Trade | Pictures |
|---|---|---|
${CINE_ORDER.map((t, i) => `| ${i + 1} | ${name(t)} | ${kitSlots(t).length} |`).join("\n")}

## How to make them
1. Every picture is wide (16:9). Every prompt already says: no people, no faces, no text, no logos.
2. Story pictures are one scene that changes step by step. Make story picture 1. Then pick it in Higgsfield, use **Edit**, and paste the next prompt. Keep editing the newest one. This keeps the same camera and light, so the scroll looks smooth.
3. The "after" picture: use **Edit** on your "before" picture.
4. Before pictures show normal wear and age. Never call them "our job" unless they really are.
5. Save each picture with its slot name (like \`roofing old\`). In the maker, put it in the slot with the same name.
6. Check each picture: no people, no words or numbers, no brand names. If one shows up, make it again.

`;
for (const [i, t] of CINE_ORDER.entries()) {
  const slots = kitSlots(t);
  md += `## ${i + 1}. ${name(t)} (${slots.length} pictures)\n\n`;
  for (const s of slots) {
    const tip = how[s.kind === "story" && s.index === 0 ? "story0" : s.kind];
    md += `- **Slot \`${s.slotId}\`**: ${s.label.replace(/\.$/, "")}. _${tip}_\n  > ${s.prompt}\n`;
  }
  const extra = (CINE_KIT[t].editorial && CINE_KIT[t].editorial.extra) || [];
  if (extra.length) {
    md += `\nOptional, for the Editorial look's service rows (${extra.length} more; skip them and a drawn sample shows):\n`;
    for (const x of extra) md += `- **Slot \`${x.id}\`**: ${x.label}. _Make it new._\n  > ${x.prompt}\n`;
  }
  md += "\n";
}
writeFileSync(new URL("./higgsfield-kit.md", import.meta.url), md);
console.log("wrote", total, "pictures");

// Variants (other looks of one trade): org/art/variants-kit.md
const VT = CINE_ORDER.filter((t) => CINE_KIT[t].variants);
const vnew = (t) => cineVariants(t).filter((v) => !v.default);
const vtotal = VT.reduce((n, t) => n + vnew(t).reduce((m, v) => m + variantSlots(t, v.key).length, 0), 0);
let vmd = `# Higgsfield picture kit: variants
Made from sitemaker/src/cine-kit.js (prompts from org/art/variants-prompts.json). Run \`node org/art/kit-doc.mjs\` after any change.

**Total: ${vtotal} new pictures** for ${VT.length} trades (about ${vtotal * 2} credits at 2 per 2K picture). The first look of each trade is the main kit (higgsfield-kit.md) and is not repeated here.

| Trade | Variants | New pictures |
|---|---|---|
${VT.map((t) => `| ${name(t)} | ${cineVariants(t).map((v) => v.label + (v.default ? " (main kit)" : "")).join(", ")} | ${vnew(t).length * 6} |`).join("\n")}

## How to make them
1. Same rules as the main kit: wide 16:9, no people, no faces, no text, no logos.
2. Each variant is one scene: make s1 new, then use **Edit** on the newest picture for s2, s3 and s4.
3. Make "before" new, then use **Edit** on it for "after".
4. Save each file as \`<trade>-<variant>-<slot>.jpg\` (like \`roofing-metal-s1.jpg\`). The ingest script puts it at library/<trade>/<variant>/<slot>.webp.

`;
for (const t of VT) {
  vmd += `## ${name(t)}\n\n`;
  for (const v of vnew(t)) {
    vmd += `### ${v.label} (\`${v.key}\`)\n\n`;
    for (const s of variantSlots(t, v.key)) {
      const slot = s.slotId.split("/")[1];
      const tip = s.kind === "story" ? (s.index === 0 ? how.story0 : how.story) : how[s.kind];
      vmd += `- **\`${t}-${v.key}-${slot}\`**: ${s.label.replace(/\.$/, "")}. _${tip}_\n  > ${s.prompt}\n`;
    }
    vmd += "\n";
  }
}
writeFileSync(new URL("./variants-kit.md", import.meta.url), vmd);
console.log("wrote", vtotal, "variant pictures");
