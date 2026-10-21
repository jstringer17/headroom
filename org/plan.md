# Plan: Sample Site Maker (Step 1 of 3)

Goal: owner types a company name, picks a trade, ticks a few filters, gets a finished one-page sample site to show on a Zoom.

## Step 1 (now): Sample Site Maker
- Private Artifact page "Sample Site Maker". One build, one session.
- Inputs: company name, trade dropdown, city, phone, star rating, review count, years in business, services (checkboxes per trade), emergency 24/7, free estimates, licensed and insured, color theme (3-4).
- Trades: roofing, HVAC, plumbing, electrical, landscaping, tree service, pressure washing, garage doors, painting, concrete, fencing, pest control, junk removal, cleaning, towing, remodeling.
- Output: live preview + Download as one HTML file. Hero, services, reviews, call button, contact form. Mobile first.
- Optional: pick a lead from Lead Desk to prefill.
- Rules: no fake work photos, no invented reviews (only typed-in numbers), no real people names.
- Source also saved in repo: sitemaker/ (generator + templates).

## Step 2: Go live (needs CEO ok per spend/publish)
Cloudflare Pages per client, owner admin login (edit phone/hours/text/photos only), real Google reviews + "ask for review" text.

## Step 3: Upsells after month 2
SEO, ads, monthly report.

## Done-criteria Step 1 (pass/fail)
1. Roofing and HVAC sites both generate from the form.
2. Each looks good at 375px wide, no sideways scroll.
3. Download file opens alone, no network needed except fonts.
4. All 16 trades produce a site; no empty sections.
5. No fake photos, no made-up reviews.
6. Reviewed by org:qa-reviewer.

## Step 1b: Cinematic mode (planned 2026-10-21, not started)
Why: CEO says Step 1 sites are clean but not worth $10k. Target look: lynam_up fence reel (org/inspiration/lynam_up-reels.md) plus ideas from motionsites.ai (hero, animated backgrounds, 3D). Ideas only: never copy their prompts, templates or code; no sign-up, paid tier or Terms click without CEO ok.
Same format: a "Cinematic" switch in the same Sample Site Maker (form, live preview, one-file download, same artifact 73v4S1BSpREDeXxZM8PxJQ). Classic mode stays as it is.

What a cinematic site has (top to bottom):
1. Scroll story hero: full-bleed photo frames that change as you scroll (fence: stakes, posts, rail, done), one short serif headline per step, one accent word in italic.
2. "Pick your style": tabs over one big photo, glass info card, small accent button.
3. "Drag the line": before/after slider (mouse, touch, keyboard).
4. Price estimator: shows only ranges the owner typed in the form. Blank = hidden, never a made-up number.
5. Cream sections between photo sections, then services, reviews (typed numbers only), call button, contact form.

Pictures: CEO makes them in Higgsfield (connector cannot generate). Until then every slot shows clearly labeled placeholder art ("Sample picture: make in Higgsfield"), drawn in code, never a fake work photo.

Shared contract (all workstreams build to this; sitemaker/src/cine-kit.js and cine-look.js are owned by art-direction):
- `CINE_KIT[trade]` = { story: [{ id, headline, accent, prompt }] (3-5 steps, same camera, one base picture edited step by step), styles: [{ id, name, note, prompt }] (2-4), beforeAfter: { title, before: { prompt }, after: { prompt } }, estimator: { unit, sizes: [label...], options: [label...] } }. No prices anywhere in the kit.
- `cineLook(theme)` returns { css, fontsHref } ; `placeholderArt(trade, slotId, label)` returns an inline SVG data URI with the label visible on the art.
- Form pictures: `form.cine.images[slotId]` (data URI or https, same safeImage rule). Form prices: `form.cine.prices[size][option] = { low, high }` as typed.

Workstreams (3 parallel sessions, no shared files):
- cine-engine (sonnet): generator wiring, scroll engine, the 3 interactive modules, maker form fields. handoffs/cine-engine.md
- cine-art (opus): art direction study (reels + motionsites.ai), type/color/visual system, placeholder art, Higgsfield picture kit per trade. handoffs/cine-art.md
- cine-qa (sonnet): QA harness with screenshots and recorded scroll frames, the $10k rubric, a reel-vs-ours compare sheet. handoffs/cine-qa.md
Order: all 3 start at once against the contract above. Then cine-engine merges cine-art's files and builds maker.html; then cine-qa runs the harness; then org:qa-reviewer judges. Publishing the updated artifact needs CEO ok (chief of staff does it).

## Done-criteria Step 1b (pass/fail)
1. Cinematic switch on: all 16 trades build a cinematic site with no empty sections, using placeholder art only.
2. Each of the 4 modules works at 375px and 1280px with no sideways scroll; slider and tabs work by touch and keyboard; motion turns off under prefers-reduced-motion and the page still reads well.
3. Download is one HTML file that works offline except fonts; with 12 pictures added it stays under 6 MB.
4. No invented prices, reviews, claims or work photos: estimator shows only typed ranges (hidden if blank); every placeholder carries its label; each Higgsfield prompt says no people, no text.
5. Classic mode unchanged: node sitemaker/build.mjs && node sitemaker/test.mjs still passes; new node sitemaker/test-cine.mjs passes.
6. "Looks worth $10k" bar: org:qa-reviewer scores fencing, roofing and pressure washing from the cine-qa pack (screenshots at 375 and 1280, plus 8+ recorded scroll frames per story, side by side with the fence-reel notes) on the 7-line rubric in sitemaker/qa/RUBRIC.md. Pass = no line under 4 of 5 and average 4.3 or more, judged once on placeholder art and once with at least one trade's real Higgsfield pictures (when the CEO has made them).
7. CEO looks at one demo and says yes. Not met = Step 1b not done.

Risks: placeholder art makes it look cheap (bar 6 is judged twice for this reason); file size with many pictures (shrink to 1600px JPEG, budget in criterion 3); scroll jank on phones (transform/opacity only, no scroll-jacking); story frames that do not line up (art kit asks for one base picture edited step by step); Higgsfield credits (about 10-12 pictures per trade; CEO picks trades); motionsites.ai terms (study public pages only).

## CEO answers (2026-10-21) for Step 1b
- Priority trades for real pictures: roofing, fencing, pressure washing, HVAC, restoration, home builder, framing.
- Restoration, home builder and framing are NEW trades: add them to the maker (trade list, services, Higgsfield prompts, placeholder art) as trades 17-19. Total 19 trades.
- Order the picture kit by priority: roofing and fencing first, then pressure washing, HVAC, restoration, home builder, framing, so the CEO can make pictures in stages and spend credits slowly. Keep the picture count per trade as low as the design allows; list the exact count per trade at the top of the kit.
- Defaults (CEO did not say, safe and easy to change): still pictures only (no video); price estimator uses the CEO's typed ranges, shown per job; stay off the motionsites.ai paid plan and do not sign up anywhere.
- The qa rubric ($10k bar) runs on fencing, roofing and pressure washing first.
