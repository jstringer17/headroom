// What the owner may change in the site form, and the editor's view of it.
// The form is the maker's form (sitemaker/src/generate.js normalize, cinematic.js form.cine,
// editorial.js form.editorial). The trade, the variation and anything else not listed here
// stay as the maker set them.
import { TRADES } from "../../../sitemaker/src/trades.js";
import { THEMES, THEME_ORDER } from "../../../sitemaker/src/themes.js";
import { CINE_KIT } from "../../../sitemaker/src/cine-kit.js";
import { cineSlots, CINE_UNITS, cineUnit } from "../../../sitemaker/src/cinematic.js";
import { kitVariant } from "../../../sitemaker/src/variants.js";

export const LOOKS = { cinematic: "Story (moving pictures)", editorial: "Magazine", classic: "Simple" };
const str = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const digits = (v, max) => String(v ?? "").replace(/[^\d]/g, "").slice(0, max);
const clone = (o) => JSON.parse(JSON.stringify(o || {}));

export function lookOf(form) {
  if (form.look === "editorial" || (form.cine && form.cine.look === "editorial")) return "editorial";
  if (form.look === "classic" || (!form.cinematic && form.look !== "cinematic")) return "classic";
  return "cinematic";
}
const tradeOf = (form) => (TRADES[form.trade] ? form.trade : "roofing");
const kitOf = (form) => kitVariant(CINE_KIT[tradeOf(form)], form.cine && form.cine.variant);

// Picture spots for the look in use: classic has one top picture, the other looks the kit's slots.
export function photoSlots(form) {
  if (lookOf(form) === "classic" || !kitOf(form)) return [{ id: "hero", label: "Top picture" }];
  return cineSlots(kitOf(form)).map((s) => ({ id: s.id, label: s.label }));
}

// A picture URL the owner may set: one of this site's own uploads.
export function ownMediaUrl(url, siteId, hosts = []) {
  const u = String(url || "");
  const m = /^https:\/\/([a-z0-9.-]+(?::\d+)?)\/media\/([^/]+)\/[A-Za-z0-9._-]+\.(jpg|png|webp)$/.exec(u);
  if (!m || m[2] !== String(siteId)) return "";
  const ok = hosts.filter(Boolean).flatMap((h) => { const x = String(h).toLowerCase(); return [x, "www." + x.replace(/^www\./, ""), x.replace(/^www\./, "")]; });
  return ok.includes(m[1].toLowerCase()) ? u : "";
}

// base = the current draft (or published form). input = what the browser sent. Returns the new draft.
export function applyEdits(base, input, { siteId, allowLook = false, hosts = [] } = {}) {
  const f = clone(base);
  const i = input && typeof input === "object" ? input : {};
  const trade = TRADES[tradeOf(f)];
  if ("company" in i) f.company = str(i.company, 80);
  if ("phone" in i) f.phone = str(i.phone, 30);
  if ("city" in i) f.city = str(i.city, 80);
  if ("years" in i) f.years = digits(i.years, 3);
  if (Array.isArray(i.services)) {
    const names = trade.services.map((s) => s[0]);
    f.services = names.filter((n) => i.services.includes(n));
  }
  for (const k of ["emergency", "freeEstimates", "insured"]) if (k in i) f[k] = !!i[k];
  if (THEMES[i.theme]) { f.theme = i.theme; f.themePicked = true; }
  if (allowLook && LOOKS[i.look]) {
    f.look = i.look;
    f.cinematic = i.look === "cinematic";
    if (f.cine && f.cine.look) delete f.cine.look;
  }
  const kit = kitOf(f);
  if (i.cine && typeof i.cine === "object") {
    f.cine = f.cine && typeof f.cine === "object" ? f.cine : {};
    if (CINE_UNITS.includes(i.cine.unit)) f.cine.unit = i.cine.unit;
    if (i.cine.prices && typeof i.cine.prices === "object" && kit && kit.estimator) {
      const out = {};
      for (const size of kit.estimator.sizes || []) for (const opt of kit.estimator.options || []) {
        const c = i.cine.prices[size] && i.cine.prices[size][opt];
        const low = digits(c && c.low, 8), high = digits(c && c.high, 8);
        if (low || high) ((out[size] = out[size] || {})[opt] = { low, high });
      }
      f.cine.prices = out;
    }
    if (i.cine.images && typeof i.cine.images === "object") {
      f.cine.images = f.cine.images && typeof f.cine.images === "object" ? f.cine.images : {};
      for (const s of photoSlots(f)) {
        if (!(s.id in i.cine.images) || s.id === "hero") continue;
        const v = i.cine.images[s.id];
        if (v === "" || v === null) delete f.cine.images[s.id];
        else if (ownMediaUrl(v, siteId, hosts)) f.cine.images[s.id] = v;
      }
    }
  }
  if ("heroImage" in i) {
    if (i.heroImage === "" || i.heroImage === null) delete f.heroImage;
    else if (ownMediaUrl(i.heroImage, siteId, hosts)) f.heroImage = i.heroImage;
  }
  if (i.editorial && Array.isArray(i.editorial.projects)) {
    f.editorial = f.editorial && typeof f.editorial === "object" ? f.editorial : {};
    f.editorial.projects = [0, 1, 2].map((n) => {
      const p = i.editorial.projects[n] || {};
      return { name: str(p.name, 60), where: str(p.where, 60), job: str(p.job, 80), type: str(p.type, 40), time: str(p.time, 40) };
    });
  }
  return clean(f);
}

// Keys the owner never sets in the form: reviews come from the reviews table at publish,
// rating and count only from Google data, and live mode is added by render.
export function clean(form) {
  const f = clone(form);
  for (const k of ["reviewList", "rating", "reviews", "live"]) delete f[k];
  return f;
}

// Everything the editor page needs to draw its fields.
export function editorModel(form, { allowLook = false } = {}) {
  const tradeKey = tradeOf(form);
  const trade = TRADES[tradeKey];
  const kit = kitOf(form);
  const on = Array.isArray(form.services) ? form.services : trade.services.slice(0, trade.pick).map((s) => s[0]);
  const look = lookOf(form);
  const est = look !== "classic" && kit && kit.estimator;
  const prices = (form.cine && form.cine.prices) || {};
  return {
    tradeKey,
    tradeLabel: trade.label,
    company: form.company || "",
    phone: form.phone || "",
    city: form.city || "",
    years: form.years || "",
    services: trade.services.map(([name, desc]) => ({ name, desc, on: on.includes(name) })),
    emergency: !!form.emergency,
    freeEstimates: form.freeEstimates === undefined ? trade.freeEstimates !== false : !!form.freeEstimates,
    insured: !!form.insured,
    theme: THEMES[form.theme] ? form.theme : trade.theme,
    themes: THEME_ORDER.map((k) => ({ key: k, label: THEMES[k].label, dark: THEMES[k].dark, accent: THEMES[k].accent })),
    look,
    lookLabel: LOOKS[look],
    looks: Object.entries(LOOKS).map(([key, label]) => ({ key, label })),
    allowLook,
    prices: est ? {
      sizes: est.sizes || [],
      options: est.options || [],
      sizeLabel: est.sizeLabel || "Size",
      optionLabel: est.optionLabel || "Option",
      cells: prices,
      unit: cineUnit(tradeKey, form.cine && form.cine.unit),
      units: CINE_UNITS,
    } : null,
    photos: photoSlots(form).map((s) => ({ ...s, url: s.id === "hero" ? form.heroImage || "" : (form.cine && form.cine.images && form.cine.images[s.id]) || "" })),
    projects: look === "editorial" ? [0, 1, 2].map((n) => ((form.editorial && form.editorial.projects) || [])[n] || {}) : null,
  };
}
