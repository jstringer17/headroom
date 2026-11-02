// Credibility profile: type once, shown everywhere it belongs, in every look. Pure functions; callers escape.
//
// Form keys (form.cred, plus the older top-level rating / reviews / years / insured, which stay):
//   rating, reviews           Google stars and count (top level, as before)
//   cred.googleUrl            link to the Google profile
//   cred.founded              year the company started ("1998"); years in business is worked out from it
//   cred.bbb = { rating:"A+", accredited:true, url }
//   cred.yelp / cred.angi = { rating:"4.5", count:"38", url }     cred.facebook = { rating, url }
//   cred.other = { name:"Nextdoor", rating, count, url }          (HomeAdvisor, Nextdoor, Thumbtack, ...)
//   cred.license ("123456"), cred.bonded (bool), cred.coverage ("$2M"), insured stays top level
//   cred.warranty (text), cred.jobs (number), cred.family (bool), cred.veteran (bool)
//   cred.awards = [up to 3 short lines], cred.certs = [up to 3 short lines]
// Empty or invalid fields give nothing: no placeholders and no made-up numbers.

const BBB = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
const text = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const url = (u) => { const t = String(u || "").trim(); return /^https?:\/\/[^\s"'<>\\]+$/i.test(t) ? t : ""; };
const rate = (r) => { const n = parseFloat(r); return n >= 1 && n <= 5 ? Math.round(n * 10) / 10 : null; };
const count = (c) => { const t = String(c ?? "").replace(/[\s,]/g, ""); const n = /^\d+$/.test(t) ? parseInt(t, 10) : 0; return n > 0 ? n : null; };
const site = (o, withCount) => {
  if (!o) return null;
  const rating = rate(o.rating);
  return rating ? { rating, count: withCount ? count(o.count) : null, url: url(o.url) } : null;
};

export function credOf(f, year) {
  const c = (f && f.cred) || {};
  const y = Number(year) || new Date().getFullYear();
  const founded = parseInt(c.founded, 10);
  const bbbRating = BBB.includes(String((c.bbb && c.bbb.rating) || "").toUpperCase().replace(/\s/g, "")) ? String(c.bbb.rating).toUpperCase().replace(/\s/g, "") : "";
  const other = c.other && text(c.other.name, 24) ? { name: text(c.other.name, 24), ...(site(c.other, true) || { rating: null, count: null, url: "" }) } : null;
  return {
    founded: founded >= 1900 && founded <= y ? founded : null,
    googleUrl: url(c.googleUrl),
    bbb: bbbRating || (c.bbb && c.bbb.accredited) ? { rating: bbbRating, accredited: !!(c.bbb && c.bbb.accredited), url: url(c.bbb && c.bbb.url) } : null,
    yelp: site(c.yelp, true), angi: site(c.angi, true), facebook: site(c.facebook, false),
    other: other && other.rating ? other : null,
    license: text(c.license, 30), bonded: !!c.bonded, coverage: text(c.coverage, 20), warranty: text(c.warranty, 60),
    jobs: count(c.jobs), family: !!c.family, veteran: !!c.veteran,
    awards: (Array.isArray(c.awards) ? c.awards : []).map((a) => text(a, 40)).filter(Boolean).slice(0, 3),
    certs: (Array.isArray(c.certs) ? c.certs : []).map((a) => text(a, 30)).filter(Boolean).slice(0, 3),
  };
}

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const num = (n) => n.toLocaleString("en-US");

// Rating sources, in order of trust: Google first (the owner's own typed stars), then BBB, Yelp, Angi, Facebook, other.
export function credRatings(d) {
  const c = d.cred, out = [];
  if (d.rating) out.push({ k: "google", name: "Google", label: `Google ${d.rating.toFixed(1)}`, sub: d.reviews ? plural(d.reviews, "review") : "", url: c.googleUrl });
  if (c.bbb && c.bbb.rating) out.push({ k: "bbb", name: "BBB", label: `BBB ${c.bbb.rating}`, sub: c.bbb.accredited ? "Accredited" : "", url: c.bbb.url });
  else if (c.bbb && c.bbb.accredited) out.push({ k: "bbb", name: "BBB", label: "BBB", sub: "Accredited", url: c.bbb.url });
  if (c.yelp) out.push({ k: "yelp", name: "Yelp", label: `Yelp ${c.yelp.rating.toFixed(1)}`, sub: c.yelp.count ? plural(c.yelp.count, "review") : "", url: c.yelp.url });
  if (c.angi) out.push({ k: "angi", name: "Angi", label: `Angi ${c.angi.rating.toFixed(1)}`, sub: c.angi.count ? plural(c.angi.count, "review") : "", url: c.angi.url });
  if (c.facebook) out.push({ k: "facebook", name: "Facebook", label: `Facebook ${c.facebook.rating.toFixed(1)}`, sub: "", url: c.facebook.url });
  if (c.other) out.push({ k: "other", name: c.other.name, label: `${c.other.name} ${c.other.rating.toFixed(1)}`, sub: c.other.count ? plural(c.other.count, "review") : "", url: c.other.url });
  return out;
}

// Every badge, text only (styled by the look; no third-party logos), strongest first.
export function credBadges(d) {
  const c = d.cred, out = credRatings(d).map(({ label, sub, url: u }) => ({ label, sub, url: u }));
  if (c.founded) out.push({ label: `Since ${c.founded}`, sub: d.years ? plural(d.years, "year") : "" });
  else if (d.years) out.push({ label: plural(d.years, "year"), sub: "in business" });
  if (c.license) out.push({ label: "Licensed", sub: `#${c.license}` });
  if (d.insured) out.push({ label: c.license ? "Insured" : "Licensed and insured", sub: c.coverage });
  if (c.bonded) out.push({ label: "Bonded", sub: "" });
  if (c.warranty) out.push({ label: "Warranty", sub: c.warranty });
  if (c.jobs) out.push({ label: `${num(c.jobs)}+ jobs`, sub: "completed" });
  if (c.family) out.push({ label: "Family owned", sub: "" });
  if (c.veteran) out.push({ label: "Veteran owned", sub: "" });
  for (const a of c.awards) out.push({ label: a, sub: "Award" });
  for (const a of c.certs) out.push({ label: a, sub: "Certified" });
  return out;
}

// The three strongest lines for the hero: a rating, the years, then license / insured.
export function credTop(d) {
  const c = d.cred, out = [];
  const r = credRatings(d)[0];
  if (r) out.push(r.k === "google" ? `${d.rating.toFixed(1)} stars on Google${d.reviews ? ` (${num(d.reviews)})` : ""}` : r.k === "bbb" ? `${r.label}${r.sub ? ` ${r.sub.toLowerCase()}` : ""}` : `${r.label}${r.sub ? ` (${r.sub.replace(/ reviews?$/, "")})` : ""}`);
  if (c.founded && d.years) out.push(`Since ${c.founded}`);
  else if (d.years) out.push(`${plural(d.years, "year")} in business`);
  if (c.license && d.insured) out.push(`Licensed #${c.license} and insured`);
  else if (c.license) out.push(`Licensed #${c.license}`);
  else if (d.insured) out.push(c.bonded ? "Insured and bonded" : "Licensed and insured");
  else if (c.warranty) out.push(/warrant/i.test(c.warranty) ? c.warranty : `${c.warranty} warranty`);
  return out.slice(0, 3);
}

// One line for the contact section and the footer.
export function credLine(d) {
  const c = d.cred, bits = [];
  if (c.license) bits.push(`Licensed #${c.license}`);
  if (d.insured) bits.push(c.coverage ? `Insured ${c.coverage}` : "Insured");
  if (c.bonded) bits.push("Bonded");
  if (c.warranty) bits.push(/warrant/i.test(c.warranty) ? c.warranty : `${c.warranty} warranty`);
  if (c.bbb && (c.bbb.rating || c.bbb.accredited)) bits.push(`BBB ${[c.bbb.rating, c.bbb.accredited ? "accredited" : ""].filter(Boolean).join(" ")}`);
  if (c.family) bits.push("Family owned");
  if (c.veteran) bits.push("Veteran owned");
  return bits.join(" · ");
}

// schema.org data for the head: only what the owner typed (no invented rating).
export function credLd(d) {
  const c = d.cred, links = [c.googleUrl, c.bbb && c.bbb.url, c.yelp && c.yelp.url, c.angi && c.angi.url, c.facebook && c.facebook.url, c.other && c.other.url].filter(Boolean);
  const ld = {};
  if (links.length) ld.sameAs = links;
  if (c.founded) ld.foundingDate = String(c.founded);
  if (c.awards.length) ld.award = c.awards;
  if (d.rating && d.reviews) ld.aggregateRating = { "@type": "AggregateRating", ratingValue: d.rating, reviewCount: d.reviews, bestRating: 5 };
  return ld;
}

// Markup helpers (text badges styled by each look). p = class prefix ("" or "ed-"), esc = the look's escaper.
export function credProofLis(badges, esc, p = "", icon = "") {
  return badges.map((b) => {
    const inner = `${icon}<b>${esc(b.label)}</b>${b.sub ? ` <span>${esc(b.sub)}</span>` : ""}`;
    return `<li class="${p}rv">${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner}</li>`;
  }).join("");
}
// Where the other rating sites go in the reviews header: name, stars, count, link when typed.
export function credPlatformLis(d, esc, p = "") {
  return credRatings(d).filter((r) => r.k !== "google" || r.url).map((r) => {
    const inner = `<b>${esc(r.label)}</b>${r.sub ? ` <span>${esc(r.sub)}</span>` : ""}`;
    return `<li class="${p}plat">${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner}</li>`;
  }).join("");
}
