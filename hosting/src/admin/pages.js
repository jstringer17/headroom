// The owner admin's pages, built as strings. Phone first: one column, big fields, plain words.
// One small inline script (the editor's), no framework, nothing loaded from outside.
import { esc } from "../../../sitemaker/src/generate.js";

const CSS = `
:root{--ink:#16202a;--muted:#55636f;--line:#d5dce2;--bg:#f3f5f7;--card:#fff;--accent:#0b5cad;--accent-ink:#fff;--ok:#1d7a3e;--bad:#b3261e;--r:14px}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow-wrap:anywhere}
a{color:var(--accent)}
.top{background:var(--ink);color:#fff;padding:12px 16px}
.top-in{max-width:680px;margin:0 auto;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.top b{font-size:17px;flex:1 1 auto;min-width:0}
.top a{color:#fff;font-size:16px}
main{max-width:680px;margin:0 auto;padding:16px 16px 140px}
h1{font-size:28px;line-height:1.2;margin:8px 0 12px}
h2{font-size:22px;margin:0 0 4px}
p{margin:0 0 12px}
.hint{color:var(--muted);font-size:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:18px 16px;margin:0 0 16px;scroll-margin-top:12px}
label{display:block;font-weight:600;margin:14px 0 6px}
input[type=text],input[type=email],input[type=tel],input[type=number],input[type=search],select,textarea{width:100%;font:inherit;padding:12px 14px;min-height:52px;border:2px solid var(--line);border-radius:10px;background:#fff;color:var(--ink)}
textarea{min-height:110px;resize:vertical}
input:focus,select:focus,textarea:focus,button:focus-visible,a:focus-visible{outline:3px solid #7fb3e8;outline-offset:1px;border-color:var(--accent)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:inherit;font-weight:700;min-height:52px;padding:12px 20px;border-radius:12px;border:2px solid var(--accent);background:var(--accent);color:var(--accent-ink);text-decoration:none;cursor:pointer}
.btn.light{background:#fff;color:var(--accent)}
.btn.wide{width:100%}
.btn.small{min-height:44px;padding:8px 14px;font-size:16px}
.btn.danger{border-color:var(--bad);background:#fff;color:var(--bad)}
.jump{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}
.jump a{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-size:16px;text-decoration:none}
.check{display:flex;gap:12px;align-items:flex-start;font-weight:400;margin:0;padding:12px 0;border-top:1px solid var(--line)}
.check:first-of-type{border-top:0}
.check input{width:26px;height:26px;flex:0 0 26px;margin:2px 0 0;accent-color:var(--accent)}
.check span{display:block}.check small{display:block;color:var(--muted);font-size:15px}
.swatches{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.swatch{display:flex;gap:10px;align-items:center;border:2px solid var(--line);border-radius:12px;padding:10px;font-weight:600;margin:0;cursor:pointer}
.swatch:has(input:checked){border-color:var(--accent)}
.swatch input{width:22px;height:22px;margin:0;accent-color:var(--accent)}
.dots{display:inline-flex;flex:0 0 auto}.dots i{width:22px;height:22px;border-radius:50%;display:block;border:2px solid #fff}.dots i+i{margin-left:-8px}
.size{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}
.size h3{font-size:18px;margin:0 0 4px}
.row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:end;margin-bottom:10px}
.row .opt{grid-column:1/-1;font-weight:600;margin:6px 0 -4px}
.row label{margin:0;font-weight:400;font-size:15px;color:var(--muted)}
.money{display:flex;align-items:center;border:2px solid var(--line);border-radius:10px;background:#fff}
.money:focus-within{outline:3px solid #7fb3e8;border-color:var(--accent)}
.money b{padding-left:12px;color:var(--muted)}.money input{border:0;min-width:0;outline:0}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.photo{border:1px solid var(--line);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px}
.photo .pic{aspect-ratio:4/3;border-radius:8px;background:#e6ebef center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:15px;text-align:center;padding:6px}
.photo p{font-size:15px;margin:0;font-weight:600}
.photo .btn{width:100%}
.photo input[type=file]{position:absolute;width:1px;height:1px;opacity:0}
.rv{border-top:1px solid var(--line);padding:12px 0}
.rv q{display:block;quotes:none;font-style:italic}
.rv .by{color:var(--muted);font-size:15px;margin:4px 0 8px}
.tag{display:inline-block;font-size:13px;font-weight:700;border-radius:6px;padding:2px 8px;background:#e8f0fb;color:#0b4a8a}
.bar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -4px 16px rgba(0,0,0,.06)}
.bar-in{max-width:680px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.bar .status{grid-column:1/-1;font-size:15px;color:var(--muted);margin:0;min-height:20px}
.status.ok{color:var(--ok)}.status.bad{color:var(--bad)}
.note{border-radius:12px;padding:14px 16px;margin:0 0 16px;background:#e7f4ec;color:#174d2b}
.note.bad{background:#fbeceb;color:#7a1a14}
.results{list-style:none;padding:0;margin:12px 0 0}
.results li{border-top:1px solid var(--line);padding:12px 0}
.copy{white-space:pre-wrap;background:#f7f9fa;border:1px dashed var(--line);border-radius:10px;padding:12px}
.qr{display:flex;justify-content:center;margin:12px 0}.qr svg{max-width:100%;height:auto}
.stack{display:grid;gap:10px}
@media (min-width:700px){h1{font-size:32px}.swatches{grid-template-columns:repeat(4,minmax(0,1fr))}.row{grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)}.row .opt{grid-column:auto;margin:0 0 14px}}
`;

export function page(title, body, { nonce = "", script = "", company = "", nav = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style></head><body>
<header class="top"><div class="top-in"><b>${esc(company || "Your website")}</b>${nav ? '<a href="/admin">Edit</a><a href="/admin/ask">Ask for a review</a><form method="post" action="/admin/logout" style="margin:0"><button class="btn small light" style="min-height:36px">Log out</button></form>' : ""}</div></header>
<main>${body}</main>${script ? `<script nonce="${esc(nonce)}">${script}</script>` : ""}</body></html>`;
}

export function loginPage({ company, msg = "", bad = false }) {
  return page("Log in", `<h1>Edit your website</h1>
${msg ? `<p class="note${bad ? " bad" : ""}" role="status">${esc(msg)}</p>` : ""}
<div class="card"><form method="post" action="/admin/login">
<p>Type the email address we have for you. We will send you a link to log in. No password needed.</p>
<label for="email">Your email</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required>
<p style="margin-top:16px"><button class="btn wide">Send me a link</button></p></form></div>`, { company });
}

export function sentPage({ company }) {
  return page("Check your email", `<h1>Check your email</h1><div class="card">
<p>If that email is the one we have for ${esc(company || "this website")}, a log in link is on its way.</p>
<p>Open the email on this phone and tap the link. It works once, for 15 minutes.</p>
<p class="hint">Nothing came? Look in your spam folder, or <a href="/admin">try again</a>.</p></div>`, { company });
}

export function confirmPage({ company, token }) {
  return page("Log in", `<h1>Log in</h1><div class="card"><form method="post" action="/admin/login/confirm">
<input type="hidden" name="t" value="${esc(token)}"><p>Tap the button to log in to ${esc(company || "your website")}.</p>
<button class="btn wide">Log in</button></form></div>`, { company });
}

export function badLinkPage({ company }) {
  return page("Link not working", `<h1>That link does not work any more</h1><div class="card">
<p>Log in links work once and only for 15 minutes.</p><p><a class="btn wide" href="/admin">Send me a new link</a></p></div>`, { company });
}

export function messagePage({ company, title, text }) {
  return page(title, `<h1>${esc(title)}</h1><div class="card"><p>${esc(text)}</p></div>`, { company });
}

const field = (id, label, value, type = "text", extra = "") =>
  `<label for="${id}">${label}</label><input id="${id}" type="${type}" data-k="${id}" value="${esc(value)}" ${extra}>`;
const toggle = (key, label, small, on) =>
  `<label class="check"><input type="checkbox" data-k="${key}"${on ? " checked" : ""}><span>${label}${small ? `<small>${small}</small>` : ""}</span></label>`;

function pricesCard(p) {
  if (!p) return "";
  const cell = (s, o, end) => esc((p.cells[s] && p.cells[s][o] && p.cells[s][o][end]) || "");
  const sizes = p.sizes.map((s, si) => `<div class="size"><h3>${esc(s)}</h3>${p.options.map((o, oi) => {
    const id = `p${si}-${oi}`;
    return `<div class="row"><p class="opt">${esc(o)}</p>
<div><label for="${id}l">From</label><div class="money"><b>$</b><input id="${id}l" type="text" inputmode="numeric" data-size="${esc(s)}" data-opt="${esc(o)}" data-end="low" value="${cell(s, o, "low")}" aria-label="${esc(s)}, ${esc(o)}: lowest price"></div></div>
<div><label for="${id}h">To</label><div class="money"><b>$</b><input id="${id}h" type="text" inputmode="numeric" data-size="${esc(s)}" data-opt="${esc(o)}" data-end="high" value="${cell(s, o, "high")}" aria-label="${esc(s)}, ${esc(o)}: highest price"></div></div></div>`;
  }).join("")}</div>`).join("");
  return `<section class="card" id="prices"><h2>Prices</h2><p class="hint">Leave both boxes empty to hide a choice. These show as a price range, not a final price.</p>
<label for="unit">Prices are</label><select id="unit" data-unit>${p.units.map((u) => `<option${u === p.unit ? " selected" : ""}>${esc(u)}</option>`).join("")}</select>${sizes}</section>`;
}

function photosCard(photos) {
  return `<section class="card" id="photos"><h2>Photos</h2><p class="hint">Use your own work photos. Big photos are made smaller on your phone before they are sent.</p>
<div class="photos">${photos.map((ph) => `<div class="photo" data-photo="${esc(ph.id)}"><div class="pic" ${ph.url ? `style="background-image:url('${esc(ph.url)}')"` : ""}>${ph.url ? "" : "No photo yet"}</div><p>${esc(ph.label)}</p>
<label class="btn small" style="margin:0">${ph.url ? "Change photo" : "Add photo"}<input type="file" accept="image/jpeg,image/png,image/webp" data-slot="${esc(ph.id)}"></label>
${ph.url ? `<button type="button" class="btn small light" data-remove="${esc(ph.id)}">Remove</button>` : ""}</div>`).join("")}</div></section>`;
}

function reviewsCard({ reviews, google, placeId }) {
  const g = reviews.filter((r) => r.source === "google");
  const own = reviews.filter((r) => r.source === "manual");
  const gHtml = !placeId
    ? `<p>Show your real Google reviews on your site. <a href="/admin/google">Find your Google listing</a></p>`
    : `${google ? `<p><span class="tag">Google</span> ${google.rating ? `${esc(google.rating)} out of 5 from ${esc(google.count)} reviews` : ""}</p>` : `<p class="hint">Your Google reviews show here after the next weekly update.</p>`}
${g.map((r) => `<div class="rv"><q>${esc(r.text)}</q><p class="by">${esc(r.author)}, ${"\u2605".repeat(Number(r.stars) || 0)} on Google</p>${toggleReview(r)}</div>`).join("")}
<p class="hint" style="margin-top:8px">Google reviews are shown just as Google has them. <a href="/admin/google">Change listing</a></p>`;
  return `<section class="card" id="reviews"><h2>Reviews</h2>${gHtml}
<h3 style="font-size:18px;margin:18px 0 0">Reviews you add</h3>
${own.length ? own.map((r) => `<div class="rv"><q>${esc(r.text)}</q><p class="by">${esc(r.author)}, ${"\u2605".repeat(Number(r.stars) || 0)}</p>${toggleReview(r)}<button type="button" class="btn small danger" data-del-review="${esc(r.id)}">Delete</button></div>`).join("") : `<p class="hint">None yet.</p>`}
<form id="add-review"><label for="rv-name">Customer's name and town</label><input id="rv-name" type="text" maxlength="60" placeholder="Maria G., Fresno" required>
<label for="rv-stars">Stars</label><select id="rv-stars"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
<label for="rv-text">What they said</label><textarea id="rv-text" maxlength="600" required></textarea>
<label class="check"><input type="checkbox" id="rv-real" required><span>These are a real customer's own words, and they said I can use them.</span></label>
<button class="btn wide light">Add review</button></form>
<p style="margin-top:14px"><a class="btn wide light" href="/admin/ask">Ask a customer for a review</a></p></section>`;
}
const toggleReview = (r) => `<label class="check"><input type="checkbox" data-review="${esc(r.id)}"${Number(r.show) ? " checked" : ""}><span>Show on my site</span></label>`;

export function editorPage({ m, reviews, google, placeId, hasPrevious, nonce, notice = "" }) {
  const services = m.services.map((s) => `<label class="check"><input type="checkbox" data-svc value="${esc(s.name)}"${s.on ? " checked" : ""}><span>${esc(s.name)}<small>${esc(s.desc)}</small></span></label>`).join("");
  const swatches = m.themes.map((t) => `<label class="swatch"><input type="radio" name="theme" data-k="theme" value="${t.key}"${t.key === m.theme ? " checked" : ""}><span class="dots"><i style="background:${t.dark}"></i><i style="background:${t.accent}"></i></span>${esc(t.label)}</label>`).join("");
  const look = m.allowLook
    ? `<label for="look">Page style</label><select id="look" data-k="look">${m.looks.map((l) => `<option value="${l.key}"${l.key === m.look ? " selected" : ""}>${esc(l.label)}</option>`).join("")}</select>`
    : `<p class="hint" style="margin-top:14px">Page style: ${esc(m.lookLabel)}. To change the style, reply to your log in email and we will do it for you.</p>`;
  const projects = m.projects ? `<section class="card" id="jobs"><h2>Recent jobs</h2><p class="hint">Up to three jobs you are proud of. Leave empty to hide.</p>${m.projects.map((p, n) => `<div class="size"><h3>Job ${n + 1}</h3>
${["name|What it was|Kitchen remodel", "where|Where|Clovis", "job|What you did|New cabinets and counters", "type|Kind of job|Remodel", "time|How long it took|3 weeks"].map((x) => { const [f, l, ph] = x.split("|"); return `<label for="pj${n}${f}">${l}</label><input id="pj${n}${f}" type="text" data-proj="${n}" data-f="${f}" value="${esc(p[f] || "")}" placeholder="${ph}" maxlength="80">`; }).join("")}</div>`).join("")}</section>` : "";
  const body = `<h1>Edit your website</h1>
${notice ? `<p class="note" role="status">${esc(notice)}</p>` : ""}
<nav class="jump" aria-label="Jump to">${[["business", "Phone and name"], m.prices && ["prices", "Prices"], ["services", "Services"], ["photos", "Photos"], ["reviews", "Reviews"], ["colors", "Colors"], m.projects && ["jobs", "Recent jobs"]].filter(Boolean).map(([id, l]) => `<a href="#${id}">${l}</a>`).join("")}</nav>
<section class="card" id="business"><h2>Your business</h2>
${field("phone", "Phone number", m.phone, "tel", 'autocomplete="tel" inputmode="tel"')}
${field("company", "Business name", m.company, "text", 'maxlength="80"')}
${field("city", "Town or area you work in", m.city, "text", 'maxlength="80"')}
${field("years", "Years in business", m.years, "text", 'inputmode="numeric" maxlength="3"')}</section>
${pricesCard(m.prices)}
<section class="card" id="services"><h2>Services</h2><p class="hint">Tick the work you do.</p>${services}</section>
<section class="card" id="extras"><h2>Good to know</h2>
${toggle("emergency", "Emergency calls, day and night", "Shows a 24/7 note on your site.", m.emergency)}
${toggle("freeEstimates", "Free estimates", "", m.freeEstimates)}
${toggle("insured", "Licensed and insured", "", m.insured)}</section>
${photosCard(m.photos)}
${reviewsCard({ reviews, google, placeId })}
<section class="card" id="colors"><h2>Colors</h2><div class="swatches">${swatches}</div>${look}</section>
${projects}
<div class="bar"><div class="bar-in"><p class="status" id="status" role="status" aria-live="polite">All changes saved as a draft. Visitors see them after you tap Publish.</p>
<a class="btn light" href="/admin/preview" id="preview">Preview</a><button type="button" class="btn" id="publish">Publish</button>
${hasPrevious ? '<button type="button" class="btn small light" id="undo" style="grid-column:1/-1">Undo last publish</button>' : ""}</div></div>`;
  return page("Edit your website", body, { nonce, script: EDITOR_JS, company: m.company, nav: true });
}

export function googlePage({ company, query, results, placeId, error }) {
  const list = results && results.length
    ? `<ul class="results">${results.map((r) => `<li><b>${esc(r.name)}</b><br><span class="hint">${esc(r.address)}</span>
<form method="post" action="/admin/google" style="margin-top:8px"><input type="hidden" name="place_id" value="${esc(r.placeId)}"><button class="btn small">This is my business</button></form></li>`).join("")}</ul>`
    : results ? `<p class="hint" style="margin-top:12px">Nothing found. Try your business name the way it shows on Google Maps.</p>` : "";
  return page("Google listing", `<h1>Your Google listing</h1>
${error ? `<p class="note bad" role="status">${esc(error)}</p>` : ""}
${placeId ? `<p class="note">Your Google listing is linked. Reviews update once a week.</p>` : ""}
<div class="card"><form method="get" action="/admin/google"><label for="q">Business name and town</label>
<input id="q" name="q" type="search" value="${esc(query || "")}" required><p style="margin-top:12px"><button class="btn wide">Search Google</button></p></form>${list}</div>
<p><a href="/admin">Back to editing</a></p>`, { company, nav: true });
}

export function askPage({ company, link, text, qr, nonce }) {
  if (!link) {
    return page("Ask for a review", `<h1>Ask for a review</h1><div class="card"><p>First link your Google listing, then you get a link and a QR code to send to customers.</p>
<p><a class="btn wide" href="/admin/google">Find your Google listing</a></p></div>`, { company, nav: true });
  }
  return page("Ask for a review", `<h1>Ask for a review</h1>
<div class="card"><h2>Send this message</h2><p class="hint">Copy it into a text or email to a happy customer.</p>
<p class="copy" id="ask-text">${esc(text)}</p><button type="button" class="btn wide" data-copy="ask-text">Copy message</button></div>
<div class="card"><h2>Or let them scan this</h2><p class="hint">Show it on your phone, or print it on a card or invoice.</p><div class="qr">${qr}</div>
<p class="hint" style="word-break:break-all">${esc(link)}</p><button type="button" class="btn wide light" data-copy-link="${esc(link)}">Copy link only</button></div>`,
  { company, nav: true, nonce, script: ASK_JS });
}

const ASK_JS = `document.addEventListener("click",function(e){var b=e.target.closest("[data-copy],[data-copy-link]");if(!b)return;var t=b.dataset.copyLink||document.getElementById(b.dataset.copy).textContent;var done=function(){var o=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=o},1500)};if(navigator.clipboard)navigator.clipboard.writeText(t).then(done,function(){});});`;

// The editor: autosave on every change, photos shrunk in the browser, preview, publish, undo.
const EDITOR_JS = `(function(){
var $=function(s){return document.querySelector(s)},all=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var pics={},st=$("#status"),timer=null,saving=null;
var H={"Content-Type":"application/json","X-Admin":"1"};
function say(t,c){st.textContent=t;st.className="status"+(c?" "+c:"")}
function collect(){var o={};all("[data-k]").forEach(function(el){if(el.type==="radio"){if(el.checked)o[el.dataset.k]=el.value}else o[el.dataset.k]=el.type==="checkbox"?el.checked:el.value});
o.services=all("[data-svc]").filter(function(e){return e.checked}).map(function(e){return e.value});
var cine={images:{}},u=$("[data-unit]");for(var k in pics)if(k!=="hero")cine.images[k]=pics[k];if(u){cine.unit=u.value;cine.prices={};all("[data-size]").forEach(function(e){var s=e.dataset.size,p=e.dataset.opt;cine.prices[s]=cine.prices[s]||{};cine.prices[s][p]=cine.prices[s][p]||{};cine.prices[s][p][e.dataset.end]=e.value})}
o.cine=cine;if("hero" in pics)o.heroImage=pics.hero;var pj=all("[data-proj]");if(pj.length){var ps=[{},{},{}];pj.forEach(function(e){ps[+e.dataset.proj][e.dataset.f]=e.value});o.editorial={projects:ps}}return o}
function save(){clearTimeout(timer);timer=null;say("Saving...");saving=fetch("/admin/api/draft",{method:"PUT",headers:H,body:JSON.stringify(collect())}).then(function(r){if(!r.ok)throw r;return r.json()}).then(function(){say("Saved as a draft. Tap Publish to put it on your site.","ok")},function(){say("Could not save. Check your connection and try again.","bad")});return saving}
function later(){clearTimeout(timer);say("Typing...");timer=setTimeout(save,700)}
document.addEventListener("input",function(e){if(e.target.closest("#add-review")||e.target.type==="file"||e.target.dataset.review!==undefined)return;later()});
document.addEventListener("change",function(e){var t=e.target;if(t.dataset.review!==undefined){post("/admin/api/reviews/"+t.dataset.review,{show:t.checked}).then(function(){say(t.checked?"Review will show after you publish.":"Review will be hidden after you publish.","ok")});return}
if(t.dataset.slot!==undefined){upload(t);return}if(t.closest("#add-review"))return;later()});
function post(url,body){return fetch(url,{method:"POST",headers:H,body:JSON.stringify(body||{})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw j;return j})})}
function flush(){return timer?save():(saving||Promise.resolve())}
$("#preview").addEventListener("click",function(e){e.preventDefault();flush().then(function(){location.href="/admin/preview"})});
$("#publish").addEventListener("click",function(){var b=this;b.disabled=true;say("Publishing...");flush().then(function(){return post("/admin/api/publish")}).then(function(){location.href="/admin?done=published"},function(){b.disabled=false;say("Could not publish. Try again in a minute.","bad")})});
var un=$("#undo");if(un)un.addEventListener("click",function(){if(!confirm("Put your site back the way it was before your last publish?"))return;post("/admin/api/undo").then(function(){location.href="/admin?done=undone"},function(){say("Could not undo.","bad")})});
document.addEventListener("click",function(e){var r=e.target.closest("[data-remove]");if(r){setPic(r.dataset.remove,"");return}var d=e.target.closest("[data-del-review]");if(d&&confirm("Delete this review?"))fetch("/admin/api/reviews/"+d.dataset.delReview,{method:"DELETE",headers:H}).then(function(){location.reload()})});
$("#add-review").addEventListener("submit",function(e){e.preventDefault();post("/admin/api/reviews",{author:$("#rv-name").value,stars:+$("#rv-stars").value,text:$("#rv-text").value,real:$("#rv-real").checked}).then(function(){location.href="/admin?done=review#reviews"},function(){say("Could not add the review.","bad")})});
function setPic(slot,url){pics[slot]=url;
var box=document.querySelector('[data-photo="'+slot+'"] .pic');if(box){box.style.backgroundImage=url?"url('"+url+"')":"";box.textContent=url?"":"No photo yet"}save()}
function shrink(file){return createImageBitmap(file).then(function(img){var s=Math.min(1,1600/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
var q=.85;function go(){return new Promise(function(ok){c.toBlob(ok,"image/jpeg",q)}).then(function(b){if(b&&b.size>2e6&&q>.4){q-=.15;return go()}return b})}return go()})}
function upload(input){var f=input.files&&input.files[0];if(!f)return;say("Getting your photo ready...");shrink(f).then(function(b){if(!b||b.size>2e6)throw 0;say("Sending photo...");return fetch("/admin/api/upload?slot="+encodeURIComponent(input.dataset.slot),{method:"POST",headers:{"Content-Type":"image/jpeg","X-Admin":"1"},body:b})}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){setPic(input.dataset.slot,j.url)},function(){say("That photo did not work. Try another one.","bad")});input.value=""}
})();`;
