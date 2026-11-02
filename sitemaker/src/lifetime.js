// Sample Site Maker, round 4: the blocks every look shares, from the measured Lifetime spec
// (org/inspiration/lifetime/SPEC.md) and the Kai Stone note (org/inspiration/kai-stone.md):
//   offer bar, header logo slot, hero checks, star row under the hero button, the quote form card (in the hero on
//   desktop), what's included, featured project, how it works (3 steps), FAQ, service areas, final call band, full footer.
// Each look keeps its own personality through the --lt-* variables (fonts, colors, corners) and a few overrides.
// Rules: only facts the owner typed or ticked; samples are marked; no outside scripts; deterministic.
// (build.mjs joins every module into one script: every top-level name here starts with lt / LT_.)
import { esc, safeImage, liveFormAttrs, liveFormFields, liveFootLink } from "./generate.js";
import { credRatings, credLine, credTop } from "./credibility.js";

export const ltIcon = (p, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
export const LT_PHONE = '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7 2 2 0 0 1 5 3.5z"/>';
export const LT_CHECK = '<path d="M5 12.5l4.5 4.5L19 7"/>';
export const LT_PLUS = '<path d="M12 5v14M5 12h14"/>';
export const LT_ARROW = '<path d="M5 12h14M13 6l6 6-6 6"/>';
const LT_PIN = '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>';
const LT_STAR_P = '<path fill="currentColor" d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>';
export const ltStarsSvg = (n, s = 18) => `<span class="lt-stars" role="img" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"${i + 0.5 <= n ? "" : ' style="opacity:.3"'}>${LT_STAR_P}</svg>`).join("")}</span>`;

// The plain facts every block needs.
export function ltBase(form, d) {
  const tradeName = d.trade.label.replace(/ \(.*\)$/, "");
  const phoneShow = d.phone ? esc(d.phone.show) : "";
  return {
    tradeName, name: esc(d.company), area: d.city ? esc(d.city) : "",
    areaPhrase: d.city ? `${esc(d.city)} and nearby towns` : "your area and nearby towns",
    phoneShow, callHref: d.phone && d.phone.tel ? `tel:${esc(d.phone.tel)}` : "#contact",
    askLabel: d.freeEstimates ? "Get a free estimate" : "Ask for a price",
    askShort: d.freeEstimates ? "Free estimate" : "Get a price",
    logo: safeImage(form && form.logo),
  };
}

// Header brand: the owner's uploaded logo, else the look's own text wordmark.
export function ltBrand(form, d, wordmark, cls = "lt-brand") {
  const b = ltBase(form, d);
  return b.logo ? `<a class="${cls} lt-has-logo" href="#top"><img class="lt-logo" src="${esc(b.logo)}" alt="${b.name}" height="44"></a>` : wordmark;
}

// 1. Offer bar: only what the owner ticked or typed.
export function ltOffer(d, promise) {
  const b = ltBase(null, d), parts = [];
  if (d.freeEstimates) parts.push(promise ? esc(promise.offer.split(".")[0]) : "Free estimates");
  if (d.emergency) parts.push("Open 24/7 for emergencies");
  const sep = '<span aria-hidden="true"> · </span>';
  const call = d.phone ? `<span class="lt-offer-call">${parts.length ? sep : ""}Call <a href="${b.callHref}">${b.phoneShow}</a></span>` : "";
  return parts.length || call ? `<div class="lt-offer"><p${parts.length ? ' class="has-offer"' : ""}>${parts.join(sep)}${call}</p></div>` : "";
}

// 2. Three check bullets for the hero from the credibility profile (license and rating sit in the trust line).
export function ltChecks(d) {
  const c = d.cred, out = [];
  if (!c.license && !d.insured && d.years) out.push(`${d.years} year${d.years === 1 ? "" : "s"} in business`);
  if (c.certs && c.certs[0]) out.push(`${esc(c.certs[0])} certified`);
  if (c.warranty) out.push(esc(/warrant/i.test(c.warranty) ? c.warranty : `${c.warranty} warranty`));
  if (out.length < 3 && d.freeEstimates) out.push("Free estimates, no obligation");
  if (out.length < 3 && d.emergency) out.push("Open 24/7 for emergencies");
  if (out.length < 3 && c.family) out.push("Family owned");
  if (out.length < 3 && c.veteran) out.push("Veteran owned");
  if (out.length < 3) out.push(`Serving ${d.city ? esc(d.city) : "your area"} and nearby towns`);
  return out.slice(0, 3);
}
export const ltChecksHtml = (d, cls = "lt-checks") => `<ul class="${cls}">${ltChecks(d).map((x) => `<li>${ltIcon(LT_CHECK, 16)}<span>${x}</span></li>`).join("")}</ul>`;

// 3. Star row under the hero button: real numbers only (the owner's Google rating, else the first other rating), plus BBB.
export function ltRating(d) {
  const r = credRatings(d), first = r[0];
  if (!first) return "";
  const bbb = r.find((x) => x.k === "bbb");
  const main = first.k === "bbb" ? "" : `${ltStarsSvg(first.k === "google" ? d.rating : Number(first.label.split(" ").pop()), 18)}<b>${esc(first.label.split(" ").pop())}</b><span>on ${esc(first.name)}${first.sub ? ` · ${esc(first.sub)}` : ""}</span>`;
  const b = bbb ? `<span class="lt-bbb">${esc(bbb.label)}${bbb.sub ? ` ${esc(bbb.sub.toLowerCase())}` : ""}</span>` : "";
  return `<p class="lt-rate">${main}${b}</p>`;
}

// The hero trust line without the rating when the star row shows it.
export const ltTrust = (d) => { const t = credTop(d); return credRatings(d).length && credRatings(d)[0].k !== "bbb" ? t.slice(1) : t; };

// 4. The hero's one primary button (>= 60px) with "or call" under it and the star row (phones; desktop shows the form).
export function ltCta(d, btnCls = "lt-btn lt-go") {
  const b = ltBase(null, d);
  return `<div class="lt-cta" id="hero-cta"><a class="${btnCls} lt-primary" href="#ask" data-ask>${b.askLabel}</a>${d.phone ? `<p class="lt-orcall">or call <a href="${b.callHref}">${b.phoneShow}</a></p>` : ""}</div>`;
}

// 5. The quote form card: 4 fields. In the hero on desktop in every look; on phones the big button jumps to it.
export function ltForm(d, jobNames, o = {}) {
  const b = ltBase(null, d);
  const options = jobNames.map((n) => `<option>${esc(n)}</option>`).join("") + "<option>Something else</option>";
  return `<div class="lt-form${o.cls ? ` ${o.cls}` : ""}" id="contact">
      <h2>${d.freeEstimates ? "Get a free estimate" : "Ask for a price"}</h2>
      <p class="lt-formsub">${d.freeEstimates ? "No obligation. We call you back." : "Tell us the job and we call you back."}</p>
      <form id="ask"${liveFormAttrs(d)} novalidate>
        <div class="lt-pair"><label for="f-name">Your name<input type="text" id="f-name" name="name" autocomplete="name" enterkeyhint="next"></label>
        <label for="f-phone">Phone<input type="tel" id="f-phone" name="phone" autocomplete="tel" inputmode="tel" enterkeyhint="next"></label></div>
        <label for="f-job">What do you need?<select id="f-job" name="job">${options}</select></label>
        <label for="f-msg"><span>About the job <span class="lt-opt">(optional)</span></span><textarea id="f-msg" name="message" rows="2"></textarea></label>
        ${liveFormFields(d)}<button class="${o.btn || "lt-btn lt-go"} lt-submit" type="submit">${d.freeEstimates ? "Get my free estimate" : "Send my request"}</button>
        <p class="form-note lt-note" id="f-note" aria-live="polite">${d.phone ? `Or call <a href="${b.callHref}">${b.phoneShow}</a>. We only use your number to reply.` : "We will call you back."}</p>
      </form>
    </div>`;
}

// A tag for a service card from its own words (what kind of job it is, no claims). Falls back to the trade's name.
export function ltTag(n, d) {
  const tn = d.trade.label.replace(/ \(.*\)$/, "");
  return /emergenc|storm|24/i.test(n) ? (d.emergency ? "24/7" : "Urgent")
    : /repair|fix|patch|leak|broken|off-track|structural/i.test(n) ? "Repair"
    : /inspect|check|estimate|tune/i.test(n) ? (d.freeEstimates && /inspect|check/i.test(n) ? "Free check" : "Upkeep")
    : /insurance|claim/i.test(n) ? "Claims help"
    : /clean|wash|bright|dry/i.test(n) ? "Cleaning"
    : /new|install|replace|build|pour|custom|addition/i.test(n) ? "New install"
    : /trim|prun|mow|lawn|yard|mulch|sod|plant/i.test(n) ? "Yard"
    : /remov|haul|stump|clear|debris|junk/i.test(n) ? "Removal"
    : /paint|stain|seal|wallpaper/i.test(n) ? "Finish"
    : /tow|jump|lockout|tire|fuel|winch/i.test(n) ? "Roadside"
    : /gate|pool/i.test(n) ? "Safety"
    : /fence|chain|alumin|iron|ranch|vinyl|wood/i.test(n) ? "Fence build"
    : /commercial|office|rental/i.test(n) ? "Commercial"
    : /design|plan|color|help|manage/i.test(n) ? "Planning"
    : /gutter|door|window|drain|pipe|wir|panel|duct|skylight|flat|light|fan|charger|generator|heater|toilet|faucet|sewer|pump|opener|spring|cable|roller/i.test(n) ? "Repair or new"
    : tn;
}

// A section head: kicker + h2 (the look styles .lt-kicker / .lt-h2 / .lt-h2 em).
const ltHead = (kicker, h2, lede) => `<div class="lt-head rv"><p class="lt-kicker">${kicker}</p><h2 class="lt-h2">${h2}</h2>${lede ? `<p class="lt-lede">${lede}</p>` : ""}</div>`;

// 6. What's included with every job: only ticks and typed facts, plus two plain promises the whole page already makes.
export function ltIncluded(d, o = {}) {
  const c = d.cred, items = [];
  items.push(d.freeEstimates ? ["Free estimate", "We look at the job and give you the price at no cost."] : ["Clear price first", "You get the price before any work starts."]);
  items.push(["Price before work", "No surprise bills: you say yes to the price before we start."]);
  if (c.license || d.insured) items.push([c.license && d.insured ? "Licensed and insured" : c.license ? "Licensed" : "Insured", [c.license ? `License #${esc(c.license)}` : "", d.insured ? (c.coverage ? `${esc(c.coverage)} insurance` : "Insured crew") : "", c.bonded ? "bonded" : ""].filter(Boolean).join(", ") + "."]);
  if (c.warranty) items.push(["Warranty", `${esc(/warrant/i.test(c.warranty) ? c.warranty : `${c.warranty} warranty`)}.`]);
  if (d.emergency) items.push(["Emergency calls", "Open 24/7 for emergencies."]);
  items.push(["Clean-up", "We do the job you agreed to and leave the place clean."]);
  if (items.length < 6) items.push(["Kept in the loop", "We tell you when we come and what happens next."]);
  return `<section class="lt-sec ${o.cls || ""}" id="included"><div class="lt-wrap">
  ${ltHead("Every job", `What's <em>included</em>`)}
  <ul class="lt-inc">${items.slice(0, 6).map(([h, p]) => `<li class="rv">${ltIcon(LT_CHECK, 22)}<div><h3>${h}</h3><p>${p}</p></div></li>`).join("")}</ul>
</div></section>`;
}

// 7. Featured project: a before and an after picture of the picked job, with its scope as bullets.
export function ltFeatured(d, o) {
  if (!o || !o.before || !o.after) return "";
  return `<section class="lt-sec ${o.cls || ""}" id="project"><div class="lt-wrap lt-feat rv">
  <div class="lt-feat-pics"><figure><img src="${esc(o.before)}" alt="Before" loading="lazy" decoding="async"><figcaption>Before</figcaption></figure><figure><img src="${esc(o.after)}" alt="After" loading="lazy" decoding="async"><figcaption>After</figcaption></figure></div>
  <div class="lt-feat-text"><p class="lt-kicker">${d.live ? "Featured project" : "Sample project"}</p><h2 class="lt-h2">${esc(o.title)}</h2>
    <ul class="lt-scope">${o.steps.slice(0, 4).map((s) => `<li>${ltIcon(LT_CHECK, 18)}<span>${esc(s)}</span></li>`).join("")}</ul>
    ${d.live ? "" : '<p class="lt-small">A sample to show the kind of work. Your own jobs go here when the site goes live.</p>'}
    <a class="lt-link" href="#ask">${d.freeEstimates ? "Get a free estimate for a job like this" : "Ask about a job like this"} ${ltIcon(LT_ARROW, 18)}</a></div>
</div></section>`;
}

// 8. How it works: three steps.
export function ltSteps(d, o = {}) {
  const b = ltBase(null, d);
  const steps = [
    ["Call or send the form", d.phone ? `Call ${b.phoneShow}, or send the form at the top of this page.` : "Send the form at the top of this page."],
    [d.freeEstimates ? "Get your free estimate" : "Get a clear price", "We look at the job and tell you the price before any work starts."],
    ["The work gets done", "We do the job you agreed to and keep you posted."],
  ];
  return `<section class="lt-sec ${o.cls || ""}" id="how"><div class="lt-wrap">
  ${ltHead("How it works", `Three steps, no <em>surprises</em>`)}
  <ol class="lt-steps">${steps.map(([h, p], i) => `<li class="rv"><span aria-hidden="true">${i + 1}</span><div><h3>${esc(h)}</h3><p>${p}</p></div></li>`).join("")}</ol>
</div></section>`;
}

// 9. FAQ
export function ltFaq(d, o = {}) {
  const b = ltBase(null, d), tn = b.tradeName.toLowerCase();
  const svc = d.services.map((s) => s[0].toLowerCase());
  const list = svc.length > 1 ? `${svc.slice(0, -1).join(", ")}, and ${svc[svc.length - 1]}` : svc[0] || tn;
  const faqs = [
    ["How much will it cost?", d.freeEstimates ? "Every job is different. We look at yours and give you a free estimate before any work starts." : "Every job is different. Call us and we will tell you the price before any work starts."],
    ["What areas do you serve?", `${b.area || "Our town"}${d.areas && d.areas.length ? `, ${d.areas.map(esc).join(", ")}` : ""} and nearby towns. Not sure about your street? Call and ask.`],
    ["Do you take emergency calls?", d.emergency ? `Yes. We are open 24/7 for emergencies.${d.phone ? ` Call ${b.phoneShow}.` : ""}` : "Call us and ask about emergency service."],
    [`What ${tn} work do you do?`, `${list.charAt(0).toUpperCase() + list.slice(1)}. If your job is not on the list, just ask.`],
    ["Are you licensed and insured?", d.cred.license || d.insured ? `${d.cred.license ? `Yes. License #${esc(d.cred.license)}` : "Yes"}${d.insured ? `${d.cred.license ? ", and" : ","} insured${d.cred.coverage ? ` (${esc(d.cred.coverage)})` : ""}` : ""}.` : "Ask us and we will show you our paperwork."],
    ["How do I get started?", `${d.phone ? `Call ${b.phoneShow}` : "Call us"} or send the form at the top of the page. Have the address and a short note about the job ready.`],
  ];
  return `<section class="lt-sec ${o.cls || ""}" id="faq"><div class="lt-wrap lt-faq-grid">
  ${ltHead("Questions", `Straight <em>answers</em>`, "Before you call, here is what most people ask.")}
  <div class="lt-faq">${faqs.map(([q, a]) => `<details class="rv"><summary><span>${esc(q)}</span>${ltIcon(LT_PLUS, 22)}</summary><p>${a}</p></details>`).join("")}</div>
</div></section>`;
}

// 10. Service areas: the owner's town plus the towns they typed.
export function ltAreas(d, o = {}) {
  const b = ltBase(null, d);
  if (!b.area && !(d.areas && d.areas.length)) return "";
  const towns = [b.area ? b.area.split(",")[0].trim() : "", ...(d.areas || []).map(esc)].filter(Boolean);
  return `<section class="lt-sec ${o.cls || ""}" id="areas"><div class="lt-wrap lt-areas rv">
  <div><p class="lt-kicker">Service area</p><h2 class="lt-h2">Where we <em>work</em></h2><p class="lt-lede">${b.area ? `Based in ${b.area}.` : ""} ${towns.length > 1 ? "We serve these towns and the places around them." : "We serve the town and the places around it."} Not sure about your street? Call and ask.</p></div>
  <ul class="lt-towns">${towns.map((x, i) => `<li${i ? "" : ' class="home"'}>${ltIcon(LT_PIN, 18)}<span>${x}</span></li>`).join("")}<li class="more"><span>+ nearby towns</span></li></ul>
</div></section>`;
}

// 11. Final call band.
export function ltBand(d, o = {}) {
  const b = ltBase(null, d);
  return `<section class="lt-band-sec ${o.cls || ""}" id="call" aria-label="Call us"><div class="lt-wrap"><div class="lt-band rv">
  <h2>${d.freeEstimates ? "Get your free estimate <em>today</em>" : "Get a clear price <em>today</em>"}</h2>
  <p>${b.area ? `Homes and businesses in ${b.area} and nearby towns.` : "Homes and businesses near you."}${d.emergency ? " Open 24/7 for emergencies." : ""}</p>
  <div class="lt-band-btns">${d.phone ? `<a class="lt-btn lt-go lt-big" href="${b.callHref}">${ltIcon(LT_PHONE, 24)}<span>${b.phoneShow}</span></a>` : ""}<a class="lt-btn lt-line" href="#ask">${b.askLabel}</a></div>
</div></div></section>`;
}

// 12. Full footer.
export function ltFooter(form, d, o = {}) {
  const b = ltBase(form, d), fine = credLine(d);
  const svcHref = o.svcHref || "#services";
  return `<footer class="lt-foot"><div class="lt-wrap">
  <div>${b.logo ? `<img class="lt-foot-logo" src="${esc(b.logo)}" alt="${b.name}" height="40">` : `<p class="lt-foot-name">${b.name}</p>`}<p class="lt-foot-tag">${esc(b.tradeName)}${b.area ? ` in ${b.area}` : ""}</p>${fine ? `<p class="lt-foot-cred">${esc(fine)}</p>` : ""}</div>
  <div class="lt-foot-cols">
    <div><h3>Services</h3><ul>${d.services.slice(0, 6).map(([n]) => `<li><a href="${svcHref}">${esc(n)}</a></li>`).join("")}</ul></div>
    <div><h3>Contact</h3><ul>${d.phone ? `<li><a href="${b.callHref}">${b.phoneShow}</a></li>` : ""}<li><a href="#ask">${b.askLabel}</a></li><li>${b.area || "Your town"} and nearby towns</li><li>${d.emergency ? "Open 24 hours" : "Ask about emergency service"}</li></ul></div>
    <div><h3>Company</h3><ul>${d.years ? `<li>${d.years} year${d.years === 1 ? "" : "s"} in business</li>` : ""}${d.insured ? "<li>Licensed and insured</li>" : ""}<li><a href="#reviews">Reviews</a></li><li><a href="#faq">Questions</a></li></ul></div>
  </div>
  <div class="lt-foot-base foot-base"><span>&copy; ${esc(d.year)} ${b.name}</span><span>${d.live ? liveFootLink(d) : "Sample site"}</span></div>
</div></footer>`;
}

// Shared CSS. Each look sets: --lt-head --lt-body --lt-hw (heading weight) --lt-ink --lt-muted --lt-paper --lt-tint --lt-card
// --lt-line --lt-dark --lt-accent --lt-accent-ink --lt-hi --lt-em --lt-r --lt-btn-r --lt-max --lt-pad
export const LT_CSS = `
.lt-wrap{max-width:var(--lt-max,1240px);margin:0 auto;padding-inline:max(20px,env(safe-area-inset-left,0px)) max(20px,env(safe-area-inset-right,0px))}
.lt-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:56px;padding:0 26px;border:0;border-radius:var(--lt-btn-r,10px);font:700 17px/1 var(--lt-body);text-decoration:none;cursor:pointer;transition:transform .16s cubic-bezier(.16,1,.3,1),box-shadow .2s cubic-bezier(.16,1,.3,1),background-color .2s}
.lt-btn:active{transform:scale(.97)}
.lt-go{background:var(--lt-accent);color:var(--lt-accent-ink)}
@media (hover:hover){.lt-go:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(0,0,0,.22)}}
.lt-line{background:transparent;color:inherit;box-shadow:inset 0 0 0 2px currentColor}
.lt-primary,.lt-submit{min-height:62px;font-size:18px}
.lt-offer{background:var(--lt-dark);color:#fff;font:600 14px/1.4 var(--lt-body);text-align:center;padding:9px 16px}
.lt-offer p{margin:0}
.lt-offer a{color:var(--lt-hi);font-weight:700;display:inline-flex;align-items:center;min-height:44px;margin-block:-9px}
@media (max-width:639px){.lt-offer .has-offer .lt-offer-call{display:none}}
.lt-logo{display:block;height:44px;width:auto;max-width:200px;object-fit:contain}
.lt-has-logo{display:flex;align-items:center;min-height:48px;margin-right:auto}
.lt-checks{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:8px}
.lt-checks li{display:flex;gap:10px;align-items:flex-start;font-weight:600;font-size:16px;line-height:1.4}
.lt-checks svg{flex:none;margin-top:1px;color:var(--lt-check-ink,#0b0b0b);background:var(--lt-hi);border-radius:50%;padding:3px;width:22px;height:22px}
.lt-cta{display:grid;justify-items:start;gap:4px;margin-top:22px;align-self:stretch}
.lt-cta .lt-primary{width:100%;max-width:420px}
.lt-orcall{margin:4px 0 0;font-size:16px}
.lt-orcall a{font-weight:700;display:inline-flex;align-items:center;min-height:44px;color:inherit}
.lt-rate{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:10px 0 0;font-size:15px;line-height:1.3}
.lt-rate b{font-weight:800}
.lt-stars{display:inline-flex;gap:1px;color:#f5b301}
.lt-bbb{font:700 13px/1 var(--lt-body);letter-spacing:.04em;padding:6px 9px;border-radius:6px;box-shadow:inset 0 0 0 1.5px currentColor}
.lt-form{background:var(--lt-card,#fff);color:var(--lt-ink);border-radius:var(--lt-r,14px);padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.3)}
.lt-form h2{margin:0;font:var(--lt-hw,800) 26px/1.1 var(--lt-head);letter-spacing:-.01em;color:var(--lt-ink)}
.lt-formsub{margin:6px 0 0;color:var(--lt-muted);font-size:15px}
.lt-form form{display:grid;gap:12px;margin-top:16px;background:none;padding:0;border-radius:0;color:inherit}
.lt-form label{display:grid;gap:6px;font:600 15px/1.3 var(--lt-body);color:var(--lt-ink)}
.lt-pair{display:grid;gap:12px}
.lt-opt{font-weight:500;color:var(--lt-muted)}
.lt-form input,.lt-form select,.lt-form textarea{width:100%;font:400 17px/1.4 var(--lt-body);color:var(--lt-ink);background:#fff;border:1.5px solid #8f8a82;border-radius:10px;padding:12px 14px;min-height:50px}
.lt-form textarea{min-height:64px;resize:vertical}
.lt-form input:focus,.lt-form select:focus,.lt-form textarea:focus{outline:none;border-color:var(--lt-ink);box-shadow:0 0 0 3px var(--lt-accent)}
.lt-submit{width:100%;margin-top:4px}
.lt-note{margin:0;font-size:14px;color:var(--lt-muted)}
.lt-note a{color:var(--lt-ink);font-weight:700;display:inline-flex;align-items:center;min-height:44px}
@media (min-width:640px){.lt-pair{grid-template-columns:1fr 1fr}}
.lt-sec{padding-block:var(--lt-pad,64px);background:var(--lt-paper);color:var(--lt-ink)}
.lt-sec.lt-tint{background:var(--lt-tint)}
.lt-head{max-width:760px;margin-bottom:28px}
.lt-kicker{display:flex;align-items:center;gap:10px;margin:0 0 12px;font:800 13px/1 var(--lt-body);letter-spacing:.14em;text-transform:uppercase;color:var(--lt-muted)}
.lt-kicker::before{content:"";width:28px;height:3px;border-radius:2px;background:var(--lt-accent)}
.lt-h2{margin:0;font:var(--lt-hw,800) clamp(30px,6vw,46px)/1.06 var(--lt-head);letter-spacing:-.02em;color:var(--lt-ink);text-wrap:balance}
.lt-h2 em{color:var(--lt-em)}
.lt-lede{margin:12px 0 0;color:var(--lt-muted);max-width:56ch}
.lt-inc{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.lt-inc li{display:flex;gap:14px;align-items:flex-start;background:var(--lt-card,#fff);border:1px solid var(--lt-line);border-radius:var(--lt-r,14px);padding:18px}
.lt-inc svg{flex:none;color:var(--lt-accent-ink);background:var(--lt-accent);border-radius:50%;padding:4px;width:30px;height:30px}
.lt-inc h3{margin:0;font:var(--lt-hw,800) 19px/1.2 var(--lt-head);color:var(--lt-ink)}
.lt-inc p{margin:4px 0 0;color:var(--lt-muted);font-size:16px;line-height:1.5}
.lt-feat{display:grid;gap:24px}
.lt-feat-pics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.lt-feat-pics figure{margin:0;position:relative;border-radius:var(--lt-r,14px);overflow:hidden;aspect-ratio:1/1;background:var(--lt-tint)}
.lt-feat-pics img{width:100%;height:100%;object-fit:cover;display:block}
.lt-feat-pics figcaption{position:absolute;left:10px;top:10px;font:800 12px/1 var(--lt-body);letter-spacing:.1em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.62);padding:7px 10px;border-radius:6px}
.lt-scope{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px}
.lt-scope li{display:flex;gap:10px;align-items:flex-start;font-weight:600;line-height:1.4}
.lt-scope svg{flex:none;margin-top:2px;color:var(--lt-em)}
.lt-small{margin:14px 0 0;font-size:14px;color:var(--lt-muted)}
.lt-link{display:inline-flex;align-items:center;gap:8px;min-height:48px;margin-top:8px;font-weight:700;color:var(--lt-ink);text-decoration:underline;text-underline-offset:4px}
.lt-steps{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.lt-steps li{display:flex;gap:16px;align-items:flex-start;background:var(--lt-card,#fff);border:1px solid var(--lt-line);border-radius:var(--lt-r,14px);padding:18px}
.lt-steps span{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--lt-dark);color:var(--lt-hi);font:800 19px/1 var(--lt-head)}
.lt-steps h3{margin:0;font:var(--lt-hw,800) 19px/1.2 var(--lt-head);color:var(--lt-ink)}
.lt-steps p{margin:4px 0 0;color:var(--lt-muted);font-size:16px}
.lt-faq-grid{display:grid;gap:8px}
.lt-faq details{border-bottom:1px solid var(--lt-line)}
.lt-faq summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:64px;padding:12px 0;font:700 18px/1.3 var(--lt-body);cursor:pointer;color:var(--lt-ink)}
.lt-faq summary::-webkit-details-marker{display:none}
.lt-faq summary svg{flex:none;transition:transform .2s}
.lt-faq details[open] summary svg{transform:rotate(45deg)}
.lt-faq details p{margin:0;padding:0 0 18px;color:var(--lt-muted);max-width:60ch}
.lt-areas{display:grid;gap:22px}
.lt-towns{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.lt-towns li{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border-radius:999px;background:var(--lt-card,#fff);border:1.5px solid var(--lt-line);font-weight:700;font-size:15px;color:var(--lt-ink)}
.lt-towns li.home{background:var(--lt-dark);border-color:var(--lt-dark);color:#fff}
.lt-towns li svg{color:var(--lt-em)}.lt-towns li.home svg{color:var(--lt-hi)}
.lt-towns li.more{background:transparent;border-style:dashed;color:var(--lt-muted)}
.lt-band-sec{padding:8px 0 var(--lt-pad,64px);background:var(--lt-paper)}
.lt-band{background:var(--lt-dark);color:#fff;border-radius:calc(var(--lt-r,14px) + 6px);padding:40px 22px;text-align:center;display:grid;gap:14px;justify-items:center}
.lt-band h2{margin:0;font:var(--lt-hw,800) clamp(30px,6vw,48px)/1.06 var(--lt-head);letter-spacing:-.02em;text-wrap:balance}
.lt-band h2 em{color:var(--lt-hi)}
.lt-band p{margin:0;color:rgba(255,255,255,.82);max-width:46ch}
.lt-band-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:6px}
.lt-big{min-height:64px;font:800 clamp(22px,5.6vw,30px)/1 var(--lt-body);font-variant-numeric:tabular-nums;padding:0 28px}
.lt-band .lt-line{min-height:64px;color:#fff}
.lt-foot{background:var(--lt-dark);color:rgba(255,255,255,.8);font-size:15px}
.lt-foot .lt-wrap{display:grid;gap:28px;padding-block:48px 28px}
.lt-foot p{margin:0}
.lt-foot-name{font:var(--lt-hw,800) 22px/1.2 var(--lt-head);color:#fff}
.lt-foot-logo{display:block;height:40px;width:auto;max-width:200px;background:#fff;border-radius:8px;padding:4px 8px}
.lt-foot-tag{margin-top:4px!important}
.lt-foot-cred{margin-top:10px!important;max-width:52ch}
.lt-foot-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.lt-foot-cols h3{margin:0 0 8px;font:800 14px/1 var(--lt-body);letter-spacing:.1em;text-transform:uppercase;color:#fff}
.lt-foot-cols ul{list-style:none;margin:0;padding:0}
.lt-foot-cols li{min-height:32px;display:flex;align-items:center}
.lt-foot-cols a{color:inherit;text-decoration:none;display:inline-flex;align-items:center;min-height:44px}
@media (hover:hover){.lt-foot-cols a:hover{color:#fff}}
.lt-foot-base{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;border-top:1px solid rgba(255,255,255,.2);padding-top:18px;grid-column:1/-1}
.lt-foot-base a{color:inherit;display:inline-flex;align-items:center;min-height:48px}
@media (max-width:639px){.lt-sec{padding-block:var(--lt-pad-m,52px)}.lt-inc{grid-template-columns:1fr 1fr;gap:8px}.lt-inc li{flex-direction:column;gap:8px;padding:14px}.lt-inc p{font-size:14px}.lt-inc h3{font-size:16px}}
@media (min-width:640px){.lt-inc{grid-template-columns:1fr 1fr}.lt-steps{grid-template-columns:repeat(3,1fr)}.lt-steps li{flex-direction:column}}
@media (min-width:1024px){
  .lt-sec{padding-block:var(--lt-pad-d,96px)}
  .lt-inc{grid-template-columns:repeat(3,1fr);gap:16px}
  .lt-feat{grid-template-columns:1.2fr 1fr;align-items:center;gap:48px}
  .lt-feat-pics figure{aspect-ratio:4/5}
  .lt-faq-grid{grid-template-columns:.8fr 1.4fr;gap:48px}
  .lt-areas{grid-template-columns:1fr 1.2fr;align-items:center;gap:48px}
  .lt-band{padding:64px 40px}
  .lt-foot .lt-wrap{grid-template-columns:5fr 7fr;align-items:start}
  .lt-foot-cols{grid-template-columns:repeat(3,1fr)}
  .lt-form{padding:26px}
}
@media (prefers-reduced-motion:reduce){.lt-btn,.lt-faq summary svg{transition:none}}
`;
