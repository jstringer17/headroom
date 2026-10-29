// Customer reviews for every look. Pure functions; each look escapes and styles the result itself.
//   form.reviewList = [{ name, town, text, stars }] (up to 3), form.reviewLink = a Google / Facebook page URL.
// With no review text typed, three SAMPLE reviews are shown, each marked as a sample. Typed ones are shown as the
// owner's, with no sample mark.
export const RVW_MAX = 3;
export const RVW_TEXT_MAX = 240;
export const RVW_SAMPLE_TAG = "Sample review, replace with a real one";
const RVW_SAMPLES = [
  { name: "Sample name", town: "Your town", text: "They showed up when they said they would, explained the price before starting and left everything tidy.", stars: 5 },
  { name: "Sample name", town: "Your town", text: "Easy to reach, quick to answer and the work looks great. We would call them again.", stars: 5 },
  { name: "Sample name", town: "Your town", text: "Straight talk, fair price and no surprises on the bill. Worth the call.", stars: 5 },
];

// A link only if it is a plain http(s) address.
export function rvwSafeLink(url) {
  const u = String(url || "").trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : "";
}

export function reviewsOf(f) {
  const list = Array.isArray(f && f.reviewList) ? f.reviewList : [];
  const typed = list.slice(0, RVW_MAX).map((r) => {
    const s = parseInt(r && r.stars, 10);
    return {
      name: String((r && r.name) || "").trim().slice(0, 40),
      town: String((r && r.town) || "").trim().slice(0, 40),
      text: String((r && r.text) || "").trim().slice(0, RVW_TEXT_MAX),
      stars: s >= 1 && s <= 5 ? s : 5,
    };
  }).filter((r) => r.text);
  const real = typed.length > 0;
  return { real, items: real ? typed : RVW_SAMPLES.map((r) => ({ ...r })), link: rvwSafeLink(f && f.reviewLink) };
}

// n of 5 stars as a small inline SVG row (filled stars use currentColor, empty ones are faint).
export function rvwStars(n, size = 18) {
  const star = '<path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>';
  return `<svg class="rvw-stars" viewBox="0 0 ${5 * 24} 24" width="${5 * size}" height="${size}" role="img" aria-label="${n} out of 5 stars">${Array.from({ length: 5 }, (_, i) => `<g transform="translate(${i * 24} 0)" fill="currentColor"${i < n ? "" : ' opacity=".22"'}>${star}</g>`).join("")}</svg>`;
}

// The review cards. p = class prefix ("" or "ed-"), esc = the look's HTML escaper.
export function rvwList(rv, esc, p = "") {
  return `<ul class="${p}rvw-list">${rv.items.map((r) => `<li class="${p}rvw ${p}rv"><div class="${p}rvw-top">${rvwStars(r.stars)}${rv.real ? "" : `<span class="${p}rvw-tag">${RVW_SAMPLE_TAG}</span>`}</div><blockquote class="${p}rvw-q">${esc(r.text)}</blockquote>${r.name || r.town ? `<p class="${p}rvw-by">${esc([r.name, r.town].filter(Boolean).join(", "))}</p>` : ""}</li>`).join("")}</ul>`;
}
