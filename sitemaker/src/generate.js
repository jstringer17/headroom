// Sample Site Maker: the generator.
// generateSite(form) is a pure function: form data in, one self-contained
// HTML document out (only Google Fonts load from the network, with system
// font fallbacks). No invented reviews, people or claims. The only picture is
// a hero picture the owner adds (heroImage: data URI or https URL).
//
// form = {
//   company*, trade* (key of TRADES), city, phone, rating, reviews, years,
//   services: [names] (default: the trade's first `pick`),
//   emergency (default false), freeEstimates (default true, false for
//   towing, junk removal and HVAC),
//   insured (default false), theme (default: trade default), themePicked (true when the owner chose a swatch), year,
//   heroImage (optional),
//   cinematic (default false: the scroll-story site, see cinematic.js), cine,
//   look ("cinematic" default or "editorial", see editorial.js) and editorial
// }
import { TRADES, TRADE_ORDER } from "./trades.js";
import { THEMES, THEME_ORDER } from "./themes.js";
import { generateCinematic, offeredPrices, cineUnit } from "./cinematic.js";
import { generateEditorial } from "./editorial.js";
import { generateClassic } from "./classic.js";
import { reviewsOf, rvwList } from "./reviews.js";
import { mobileBarHtml, ACTIONS_JS, PROOF_MORE_CSS } from "./actions.js";
import { credOf, credRatings, credBadges, credTop, credLine, credLd, credProofLis, credPlatformLis } from "./credibility.js";
import { variantCards, kitVariant, variantNote, variantPrice, PICK_NOUN } from "./variants.js";
import { CINE_KIT } from "./cine-kit.js";
import { pickerItems, pickerHtml, PICKER_CSS, PICKER_JS } from "./picker.js";
import { cineLook, placeholderArt, blueprintArt } from "./cine-look.js";

// Cinematic mode needs the art files' CINE_KIT, cineLook and placeholderArt.
let CINE = null;
export function useCine(deps) { CINE = deps; }
useCine({ CINE_KIT, cineLook, placeholderArt });

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function slugify(s) {
  return String(s || "sample").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "sample";
}

// US numbers only get a call link when they have 10 digits (or 11 with a leading 1); "+" numbers keep their country code;
// anything else (9 digits, 7 digits) is no phone at all, so no wrong call link is ever made. "ext. 12" or "x12" adds ;ext=12.
export function formatPhone(raw) {
  let t = String(raw || "").trim();
  if (!t) return null;
  let ext = "";
  const m = t.match(/\s*(?:ext\.?|extension|x|#)\s*(\d{1,6})\s*$/i);
  if (m) { ext = m[1]; t = t.slice(0, m.index).trim(); }
  const d = t.replace(/\D/g, "");
  const tail = ext ? ` ext. ${ext}` : "";
  const ten = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  if (!t.startsWith("+") && ten.length === 10) return { show: `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}${tail}`, tel: `+1${ten}${ext ? `;ext=${ext}` : ""}` };
  if (t.startsWith("+") && d.length >= 8 && d.length <= 15) return { show: t + tail, tel: `+${d}${ext ? `;ext=${ext}` : ""}` };
  return null;
}

// Fill in smart defaults so only company + trade are needed.
export function normalize(form) {
  const f = form || {};
  const tradeKey = TRADES[f.trade] ? f.trade : "roofing";
  const trade = TRADES[tradeKey];
  const names = trade.services.map((s) => s[0]);
  let picked = Array.isArray(f.services) ? f.services.filter((n) => names.includes(n)) : names.slice(0, trade.pick);
  if (!picked.length) picked = names.slice(0, 3);
  const rating = parseFloat(f.rating);
  const reviews = parseInt(String(f.reviews ?? "").replace(/[^\d]/g, ""), 10);
  const years = parseInt(String(f.years ?? "").replace(/[^\d]/g, ""), 10);
  return {
    company: String(f.company || "").trim() || "Your Company",
    tradeKey,
    trade,
    city: String(f.city || "").trim(),
    phone: formatPhone(f.phone),
    rating: rating >= 1 && rating <= 5 ? Math.round(rating * 10) / 10 : null,
    reviews: reviews > 0 ? reviews : null,
    years: (() => { const c = credOf(f, f.year); const yr = Number(f.year) || new Date().getFullYear(); return c.founded ? yr - c.founded : years > 0 && years < 200 ? years : null; })(),
    cred: credOf(f, f.year),
    services: trade.services.filter((s) => picked.includes(s[0])),
    areas: (Array.isArray(f.areas) ? f.areas : String(f.areas || "").split(/[,;\n]/)).map((x) => String(x).replace(/\s+/g, " ").trim().slice(0, 30)).filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 10), // towns the owner serves (typed)
    emergency: !!f.emergency,
    freeEstimates: f.freeEstimates === undefined ? trade.freeEstimates !== false : !!f.freeEstimates,
    insured: !!f.insured,
    themeKey: THEMES[f.theme] ? f.theme : trade.theme,
    themePicked: !!(THEMES[f.theme] && f.themePicked), // the owner chose a swatch: it overrides the trade's own palette
    rv: (() => { const r = reviewsOf(f); if (!r.link) r.link = credOf(f, f.year).googleUrl; return r; })(), // review cards: typed ones, or three marked samples
    year: f.year || new Date().getFullYear(),
  };
}

const STAR = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>';


// Only a base64 image data URI or a plain https URL is accepted as the hero picture.
export function safeImage(src) {
  const s = String(src || "").trim();
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  if (/^https:\/\/[^\s"'<>()\\]+$/.test(s)) return s;
  return "";
}

// ---------- Live mode (a sold site, hosted by hosting/) ----------
// form.live = { siteId, leadUrl:"/api/lead", turnstileKey, analyticsToken, canonical, privacyUrl, google:{rating,count} }
// With it: the form really sends, no sample bits render, and SEO tags go in <head>. Without it: nothing changes.
export const LIVE_SAMPLE_SUBMIT = 'document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();var f=e.target,n=document.getElementById("f-note"),g=function(k){var x=f.elements[k];return x&&x.value!=null?String(x.value).trim():""};if(!g("name")||(!g("phone")&&!g("email"))){n.textContent="Please add your name and a phone number.";return}n.textContent="Thanks! This is a sample site. The form starts sending when the site goes live.";});';
const liveUrl = (u) => (/^https:\/\/[^\s"'<>\\]+$/.test(String(u || "").trim()) ? String(u).trim() : "");
const livePath = (u, dflt) => { const s = String(u || "").trim(); return /^\/[A-Za-z0-9/_.-]*$/.test(s) || liveUrl(s) ? s : dflt; };
export function liveOf(form) {
  const l = form && form.live;
  if (!l || typeof l !== "object") return null;
  const g = l.google && typeof l.google === "object" ? l.google : null;
  const gr = g ? parseFloat(g.rating) : NaN, gc = g ? parseInt(g.count, 10) : NaN;
  return {
    siteId: String(l.siteId || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64),
    leadUrl: livePath(l.leadUrl, "/api/lead"),
    turnstileKey: String(l.turnstileKey || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100),
    analyticsToken: String(l.analyticsToken || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100),
    canonical: liveUrl(l.canonical),
    privacyUrl: livePath(l.privacyUrl, "/privacy"),
    google: gr >= 1 && gr <= 5 ? { rating: Math.round(gr * 10) / 10, count: gc > 0 ? gc : null } : null,
  };
}
// Live mode: real reviews only, rating only from Google data.
function liveNormalize(d, live) {
  d.live = live;
  if (!d.rv.real) d.rv = { real: false, items: [], link: d.rv.link };
  d.rating = live.google ? live.google.rating : null;
  d.reviews = live.google ? live.google.count : null;
  return d;
}
// Everything a look adds to <head> in live mode.
export function liveHead(d, form, title, description) {
  const L = d.live;
  if (!L) {
    const extra = credLd(d);
    if (!Object.keys(extra).length) return "";
    const tn = d.trade.label.replace(/ \(.*\)$/, "");
    const json0 = JSON.stringify({ "@context": "https://schema.org", "@type": "HomeAndConstructionBusiness", name: d.company, ...(d.phone && d.phone.tel ? { telephone: d.phone.tel } : {}), ...(d.city ? { address: { "@type": "PostalAddress", addressLocality: d.city } } : {}), knowsAbout: [tn], ...extra }).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
    return `<script type="application/ld+json">${json0}</script>\n`;
  }
  const img = liveUrl(form && form.heroImage);
  const tradeName = d.trade.label.replace(/ \(.*\)$/, "");
  const ld = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: d.company,
    description: `${d.company} is a ${d.trade.noun} serving ${d.city ? `${d.city} and nearby towns` : "the local area"}.`,
    ...(L.canonical ? { url: L.canonical } : {}),
    ...(d.phone && d.phone.tel ? { telephone: d.phone.tel } : {}),
    ...(d.city ? { address: { "@type": "PostalAddress", addressLocality: d.city }, areaServed: d.city } : {}),
    ...(img ? { image: img } : {}),
    knowsAbout: [tradeName, ...d.services.map((s) => s[0])],
    ...(L.google && L.google.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: L.google.rating, reviewCount: L.google.count, bestRating: 5 } } : {}),
    ...(() => { const e = credLd(d); delete e.aggregateRating; return e; })(),
  };
  const json = JSON.stringify(ld).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  return [
    L.canonical && `<link rel="canonical" href="${esc(L.canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(d.company)}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    L.canonical && `<meta property="og:url" content="${esc(L.canonical)}">`,
    img && `<meta property="og:image" content="${esc(img)}">`,
    `<script type="application/ld+json">${json}</script>`,
    L.turnstileKey && `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`,
  ].filter(Boolean).join("\n") + "\n";
}
// Extra form fields in live mode: optional email, a hidden honeypot, and the Turnstile box.
export function liveFormFields(d) {
  const L = d.live;
  if (!L) return "";
  return `<label for="f-email">Email (if you want)<input type="email" id="f-email" name="email" autocomplete="email"></label>
    <div style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    ${L.turnstileKey ? `<div class="cf-turnstile" data-sitekey="${esc(L.turnstileKey)}" data-size="flexible"></div>` : ""}
    `;
}
// The form's attributes in live mode (works with no JavaScript too: the Worker answers a plain POST).
export function liveFormAttrs(d) {
  return d.live ? ` action="${esc(d.live.leadUrl)}" method="post"` : "";
}
// Swap the sample "this form does not send" handler for the real one (plain ES5).
export function liveScript(js, d) {
  if (!d.live) return js;
  const url = JSON.stringify(d.live.leadUrl).replace(/</g, "\\u003c");
  const site = JSON.stringify(d.live.siteId);
  const real = 'document.getElementById("ask").addEventListener("submit",function(e){e.preventDefault();var f=e.target,n=document.getElementById("f-note"),b=f.querySelector("[type=submit]");' +
    'function v(k){var x=f.elements[k];return x&&x.value!=null?String(x.value).trim():""}' +
    'if(!v("name")||(!v("phone")&&!v("email"))){n.textContent="Please add your name and a phone number.";return}' +
    'var t=f.querySelector("[name=\'cf-turnstile-response\']");' +
    'var body={siteId:' + site + ',name:v("name"),phone:v("phone"),email:v("email"),service:v("job"),message:v("message"),website:v("website"),token:t?t.value:"",page:location.pathname};' +
    'b.disabled=true;n.textContent="Sending...";' +
    'function done(ok,msg){b.disabled=false;n.textContent=ok?"Thanks, we got it. We will call you soon.":(msg||"Sorry, that did not send. Please call us.");if(ok)f.reset();if(window.turnstile)try{turnstile.reset()}catch(_){}}' +
    'fetch(' + url + ',{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){done(r.ok&&j.ok,j.error)})},function(){done(false)});});';
  return js.replace(LIVE_SAMPLE_SUBMIT, real);
}
// Footer link and the free, cookie-free analytics beacon.
export function liveFootLink(d) {
  return d.live ? `<a href="${esc(d.live.privacyUrl)}">Privacy</a>` : "";
}
export function liveBeacon(d) {
  return d.live && d.live.analyticsToken ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${esc(d.live.analyticsToken)}"}'></script>\n` : "";
}
// Live mode never shows labelled placeholder art: empty slots get the unlabelled blueprint drawing.
export function liveArt(trade) { return blueprintArt(trade); }

export function generateSite(form) {
  const live = liveOf(form);
  const d = live ? liveNormalize(normalize(form), live) : normalize(form);
  const editorial = form && (form.look === "editorial" || (form.cine && form.cine.look === "editorial"));
  // A file that ships (Download, Copy: form.clean) has quiet drawings without the "Sample picture: make in Higgsfield" note.
  const cleanArt = (a, b, c, o) => placeholderArt(a, b, c, { ...(o || {}), note: false, quiet: true });
  const shipArt = live ? liveArt : form && form.clean ? cleanArt : null;
  if (form && (form.cinematic || form.look === "cinematic" || editorial) && CINE && CINE.CINE_KIT[d.tradeKey]) return (editorial ? generateEditorial : generateCinematic)(form, d, shipArt ? { ...CINE, placeholderArt: shipArt } : CINE);
  return generateClassic(form, d, { phArt: shipArt || placeholderArt, CINE });
}

// Map a lead's category / niche text to a trade key.
export function guessTrade(text) {
  const s = String(text || "").toLowerCase();
  if (!s) return null;
  let best = null, bestLen = 0;
  for (const key of TRADE_ORDER) {
    for (const m of TRADES[key].match) {
      if (s.includes(m) && m.length > bestLen) { best = key; bestLen = m.length; }
    }
  }
  return best;
}

// Read a pasted lead. Accepts Lead Desk JSON (short keys n,c,r,a,p,w,t,s,q)
// or loose text (name on the first line, then phone / rating / town anywhere).
export function parseLead(text) {
  const raw = String(text || "").trim();
  const out = {};
  if (!raw) return out;
  try {
    const j = JSON.parse(raw);
    const o = Array.isArray(j) ? j[0] : (j && j.items ? j.items[0] : j);
    if (o && typeof o === "object") {
      if (o.n) out.company = String(o.n);
      if (o.p) out.phone = String(o.p);
      if (o.t) out.city = o.s ? `${o.t}, ${o.s}` : String(o.t);
      if (o.r != null && o.r !== "") out.rating = String(o.r);
      const rc = o.rc ?? o.reviews ?? o.u;
      if (rc != null && rc !== "") out.reviews = String(rc);
      const tr = guessTrade(`${o.q || ""} ${o.c || ""}`);
      if (tr) out.trade = tr;
      return out;
    }
  } catch (_) { /* not JSON, fall through */ }
  const lines = raw.split(/\r?\n|\t/).map((l) => l.trim()).filter(Boolean);
  const phone = raw.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  if (phone) out.phone = phone[0].trim();
  const rating = raw.match(/(?:^|[^\d.])([1-5]\.\d)(?![\d])/);
  if (rating) out.rating = rating[1];
  const count = raw.match(/\(([\d,]+)\)|([\d,]+)\s*(?:google\s*)?reviews?/i);
  if (count) out.reviews = (count[1] || count[2]).replace(/,/g, "");
  const town = raw.match(/([A-Z][A-Za-z.'-]*(?:\s[A-Z][A-Za-z.'-]*){0,3}),\s*([A-Z]{2})\b/);
  if (town) out.city = `${town[1]}, ${town[2]}`;
  const nameLine = lines.find((l) => /[a-z]/i.test(l) && !/^https?:|www\.|@/.test(l) && !(phone && l.includes(phone[0])) && !/^[\d.\s()★*/]+$/.test(l));
  if (nameLine) out.company = nameLine.replace(/\s+[·|-]\s+.*$/, "").slice(0, 80);
  const tr = guessTrade(raw.replace(out.company || "", " ")) || guessTrade(raw);
  if (tr) out.trade = tr;
  return out;
}
