// Writes org/art/higgsfield-kit.md from the kit: node org/art/kit-doc.mjs
import { CINE_KIT, CINE_ORDER, kitSlots } from "../../sitemaker/src/cine-kit.js";
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
  md += "\n";
}
writeFileSync(new URL("./higgsfield-kit.md", import.meta.url), md);
console.log("wrote", total, "pictures");
