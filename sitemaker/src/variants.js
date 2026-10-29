// Picture variations per trade (roofing: shingle, metal, tile, ...). Pure functions, no imports.
//
// CINE_KIT[trade].variants = [{ key, label, default?, story?, beforeAfter?, styles? }]. The first entry is the
// default: it has no story or beforeAfter and means the trade's own, with bare slot ids ("old", "before").
// Every other variant brings its own story frames and before/after pair, with ids like "metal/s1" and
// "metal/before" (the library file is library/<trade>/metal/s1.webp). A variant without styles keeps the
// trade's styles, whose pictures (bare ids) are shared by all variants.

// The variant key to use: the one asked for if the trade has it, else the first.
export function variantKey(kit, wanted) {
  const vs = (kit && kit.variants) || [];
  if (!vs.length) return "";
  return vs.some((v) => v.key === wanted) ? wanted : vs[0].key;
}

// The kit for one variant: story, beforeAfter and styles swapped in, plus variantKey and slotPrefix.
export function kitVariant(kit, wanted) {
  if (!kit) return kit;
  const vs = kit.variants || [];
  const key = variantKey(kit, wanted);
  const v = vs.find((x) => x.key === key);
  if (!v || v === vs[0]) return { ...kit, variantKey: key, slotPrefix: "" };
  return {
    ...kit,
    story: v.story || kit.story,
    beforeAfter: v.beforeAfter || kit.beforeAfter,
    styles: v.styles || kit.styles,
    variantKey: key,
    slotPrefix: `${key}/`,
  };
}

// Required slot ids of a kit (or kit variant), in the picture book's order: story, styles, before, after.
export function kitSlotIds(kit) {
  if (!kit) return [];
  const ids = [...(kit.story || []).map((s) => s.id), ...(kit.styles || []).map((s) => s.id)];
  if (kit.beforeAfter) ids.push((kit.beforeAfter.before && kit.beforeAfter.before.id) || "before", (kit.beforeAfter.after && kit.beforeAfter.after.id) || "after");
  return ids;
}

// Every non-default variant key of a trade (these have their own library folder).
export function extraVariantKeys(kit) {
  return ((kit && kit.variants) || []).slice(1).map((v) => v.key);
}

// The slots a variant owns (what its pictures cover): its own story, before/after and styles. The default
// variant owns the trade's own story, styles, before and after. Shared style pictures belong to the default.
export function ownSlotIds(kit, wanted) {
  if (!kit) return [];
  const vs = kit.variants || [];
  const key = variantKey(kit, wanted);
  const v = vs.find((x) => x.key === key);
  if (!v || v === vs[0]) return kitSlotIds({ ...kit, variants: undefined });
  const ids = [...(v.story || []).map((x) => x.id), ...(v.styles || []).map((x) => x.id)];
  if (v.beforeAfter) ids.push((v.beforeAfter.before && v.beforeAfter.before.id) || `${key}/before`, (v.beforeAfter.after && v.beforeAfter.after.id) || `${key}/after`);
  return ids;
}

// The variations the owner offers (form.cine.offer = list of keys; missing = all). Only trades with 2+ variations.
export function offeredVariants(kit, offer) {
  const vs = (kit && kit.variants) || [];
  if (vs.length < 2) return [];
  return Array.isArray(offer) ? vs.filter((v) => offer.includes(v.key)) : vs;
}

// One card per offered variation for the "Everything we do" section: its after picture is the card image and
// its before and after pair is the detail. The ids are the library's slot ids (default variation keeps bare ids).
export function variantCards(kit, offer) {
  return offeredVariants(kit, offer).map((v) => {
    const kv = kitVariant(kit, v.key), ba = kv.beforeAfter || {};
    return { key: v.key, label: v.label || v.key, before: (ba.before && ba.before.id) || `${kv.slotPrefix}before`, after: (ba.after && ba.after.id) || `${kv.slotPrefix}after` };
  });
}
