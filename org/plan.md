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
- `CINE_KIT[trade]` = { story: [{ id, headline, accent, prompt }] (3-5 steps, same camera, one base picture edited step by step), styles: [{ id, name, note, prompt }] (2-4), beforeAfter: { title, before: { prompt }, after: { prompt } }, estimator: { sizes: [label...], options: [label...] } }. No prices anywhere in the kit. The price unit is NOT in the kit: it is `form.cine.unit` ("per job" | "per sq ft" | "per linear foot" | "per hour"), default per trade (roofing, pressure washing, home builder, framing: per sq ft; fencing: per linear foot; HVAC, restoration: per job; others per job), set by the form's "Price is" select.
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
4. No invented prices, reviews, claims or work photos: estimator shows only typed ranges with the chosen unit text (hidden if blank; test-cine.mjs checks default unit per trade and the override); every placeholder carries its label; each Higgsfield prompt says no people, no text.
5. Classic mode unchanged: node sitemaker/build.mjs && node sitemaker/test.mjs still passes; new node sitemaker/test-cine.mjs passes.
6. "Looks worth $10k" bar: org:qa-reviewer scores fencing, roofing and pressure washing from the cine-qa pack (screenshots at 375 and 1280, plus 8+ recorded scroll frames per story, side by side with the fence-reel notes) on the 7-line rubric in sitemaker/qa/RUBRIC.md. Pass = no line under 4 of 5 and average 4.3 or more, judged once on placeholder art and once with at least one trade's real Higgsfield pictures (when the CEO has made them).
7. CEO looks at one demo and says yes. Not met = Step 1b not done.

Risks: placeholder art makes it look cheap (bar 6 is judged twice for this reason); file size with many pictures (shrink to 1600px JPEG, budget in criterion 3); scroll jank on phones (transform/opacity only, no scroll-jacking); story frames that do not line up (art kit asks for one base picture edited step by step); Higgsfield credits (about 10-12 pictures per trade; CEO picks trades); motionsites.ai terms (study public pages only).

## CEO answers (2026-10-21) for Step 1b
- Priority trades for real pictures: roofing, fencing, pressure washing, HVAC, restoration, home builder, framing.
- Restoration, home builder and framing are NEW trades: add them to the maker (trade list, services, Higgsfield prompts, placeholder art) as trades 17-19. Total 19 trades.
- Order the picture kit by priority: roofing and fencing first, then pressure washing, HVAC, restoration, home builder, framing, so the CEO can make pictures in stages and spend credits slowly. Keep the picture count per trade as low as the design allows; list the exact count per trade at the top of the kit.
- Defaults (CEO did not say, safe and easy to change): still pictures only (no video); price estimator uses the CEO's typed ranges, unit set per trade (see Shared contract) and changeable in the form; stay off the motionsites.ai paid plan and do not sign up anywhere.
- The qa rubric ($10k bar) runs on fencing, roofing and pressure washing first.

# Hosted backend (Step 2 go-live + Step 3 upsell hooks; planned 2026-10-30, not started)

Goal: every sold site is FULLY working and hosted for a monthly fee: own domain, form that reaches the owner, owner can edit it from a phone, real Google reviews, paid monthly by card (no pay = site off), basic SEO, and one CEO desk that lists every customer.

## Shape (one sentence)
ONE Cloudflare Worker serves ALL customer sites by domain name. Each site is one row in D1 (the maker's `form` JSON plus status). On every save, the Worker runs the same `generateSite(form)` from sitemaker/src and stores the finished HTML in R2; visitors get that file. Photos live in R2. No server, no per-customer deploy, edits go live in seconds.
Why not one Pages project per customer: 100-project limit per account, each edit needs a redeploy, and owner edits get slow. "One deploy per customer" becomes "one row + one domain per customer" on one Worker (same cost: near zero).

## Shared contract (all three workstreams build to this; host-core owns the files)
- Folder `hosting/` (new). `hosting/src/index.js` routes by host + path:
  customer domain `/` and pages -> R2 `sites/<siteId>/index.html` (only when `status='live'`; `paused`/`off` -> a plain "This site is not active" page, no customer data);
  `/api/lead` -> host-core; `/admin*` on any customer domain -> `adminApp(request, env, ctx)` from `hosting/src/admin/index.js` (owner-admin);
  `/api/stripe` -> `stripeWebhook(request, env)` from `hosting/src/billing/index.js` (billing-desk);
  `desk.<AGENCY_DOMAIN>` -> `deskApp(request, env)` from `hosting/src/desk/index.js` (billing-desk);
  cron (daily) -> `refreshReviews(env)` from `hosting/src/reviews/index.js` (owner-admin) and `billingSweep(env)` from billing (billing-desk).
- Shared helpers (host-core): `hosting/src/db.js` (`getSite, saveSite, setStatus, addLead, logEvent`), `hosting/src/render.js` `publishSite(env, siteId)` (merges stored form + approved reviews, renders, writes R2, writes sitemap), `hosting/src/notify.js` `sendEmail(env,{to,subject,text,html})`, `sendSms(env,{to,text})` (no-op + log when no key).
- D1 tables (`hosting/schema.sql`): `sites(id, slug, domain, status draft|live|paused|off, form_json, owner_name, owner_email, owner_sms, notify_email, notify_sms, place_id, plan, stripe_customer, stripe_sub, paid_through, created_at, updated_at)`; `leads(id, site_id, name, phone, email, service, message, page, created_at, emailed, texted)`; `reviews(id, site_id, source google|manual, author, stars, text, posted_at, fetched_at, show)`; `logins(token_hash, site_id, email, expires_at, used)`; `addons(site_id, kind, status, stripe_item)`; `events(id, site_id, kind, data, at)`.
- Live-mode switch in the generator: `form.live = { siteId, leadUrl:"/api/lead", turnstileKey, analyticsToken, canonical }`. With `form.live` set: the form really sends; sample reviews and labelled placeholder pictures NEVER show (empty picture slots fall back to the unlabelled blueprint art or hide); `<link rel=canonical>`, Open Graph tags and schema.org `LocalBusiness` (name, phone, city, area, rating/count ONLY from real Google data) go in `<head>`. Without `form.live` every sample site is byte-for-byte as today (`node sitemaker/test-all.mjs` passes).
- Secrets (Worker secrets, never in git): `RESEND_API_KEY`, `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`, `GOOGLE_PLACES_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TURNSTILE_SECRET`, `SESSION_KEY`. Vars: `AGENCY_DOMAIN`, `FROM_EMAIL`.
- Everything is built and tested LOCALLY first (`wrangler dev` / Miniflare, Stripe test payloads signed locally, Places replies from a saved fixture). No account, key or spend is needed to build and pass tests. Deploying, buying domains, turning on billing = CEO ok, done by the chief of staff.

## Workstreams (3 sessions, no shared files)
1. host-core (opus): Worker, D1, R2, domains + go-live runbook, live form -> email/SMS + lead stored, SEO (sitemap, robots, schema, meta, Search Console steps), generator live mode. handoffs/host-core.md
2. owner-admin (sonnet): owner login by emailed link, phone-friendly editor (text, phone, services, prices, reviews, photos), preview + publish, Google reviews pull + manual fallback + "ask for a review" link. handoffs/owner-admin.md
3. billing-desk (sonnet): Stripe subscription (Checkout link, webhook, customer portal, failed-payment emails, cancel/unpaid = site off), CEO Customer Desk (all customers, status, money, leads, reviews health), upsell hooks (add-ons in Stripe, "ready for upsell" flag, monthly lead report). handoffs/billing-desk.md

Order: all 3 start at once on the contract. host-core lands `index.js`, `db.js`, `render.js`, `notify.js`, `schema.sql` first (first push within its first hour of work); the others mock those until then. Then: chief of staff merges, runs all tests, org:qa-reviewer checks, then ONE pilot site on a CEO test domain end to end (Stripe TEST mode), then CEO ok to switch Stripe to live and take the first paying customer.

## Done-criteria Hosted backend (pass/fail)
1. `cd hosting && npm test` passes all three suites; `node sitemaker/test-all.mjs` still passes.
2. Local end to end (one script, `hosting/scripts/e2e-local.mjs`, owned by host-core, run last): create site -> Stripe test checkout paid webhook -> site live at its domain -> form sent -> lead row + email (captured) -> owner logs in by link, edits phone on a 375px screen, publishes -> new phone on the live page -> Google reviews fixture shown with Google credit -> payment failed webhook x final -> site shows "not active" -> desk lists it with right status.
3. A live site never shows a sample review, a labelled placeholder picture, or "This is a sample site".
4. Security: owner A can never read or change owner B's site (test); form has Turnstile + honeypot + rate limit; webhook rejects bad signatures; all owner text escaped (existing esc/safeImage); photos only jpeg/png/webp under 2 MB after in-browser shrink.
5. org:qa-reviewer PASS on the admin at 375px (non-technical owner can change phone and a price in under 2 minutes without help).
6. Pilot: one real domain live on Cloudflare in Stripe test mode, Search Console verified, sitemap accepted (CEO ok needed).

## Costs (prices as of Oct 2026; check on sign-up)
Flat, for the whole agency: Cloudflare Workers Paid $5/mo (covers D1, R2, KV for many sites); agency domain ~$10/yr; Resend email $0 up to 3,000 emails/mo (then $20/mo); Turnstile, Web Analytics, Search Console, Stripe customer portal: $0. Optional SMS (Twilio): ~$1.15/mo number + ~$20 one-time 10DLC brand/campaign signup + ~$2-10/mo campaign fee.
Per customer per month: domain ~$0.90 (a .com at Cloudflare cost price, $10.44/yr); Stripe 2.9% + 30c card fee + 0.7% Billing fee (about $3.90 on a $99 plan); Google reviews $0 if pulled once a week (inside Google's free monthly calls; about 4 calls per customer); SMS ~1c per lead text if on. Total about $5 per customer per month on a $99 plan, plus ~$5-15/mo flat.

## Accounts and one-line asks for the CEO (in this order)
1. Cloudflare: "Make a Cloudflare account, add a card, turn on Workers Paid ($5/mo), make an API token with Workers, D1, R2, DNS edit, and give me the token and Account ID as secrets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID."
2. Agency domain: "Buy one agency domain in Cloudflare Registrar (~$10/yr) and tell me the name" (used for the desk, login emails, lead emails).
3. Email: "Make a free Resend account, add the agency domain (Cloudflare fills the DNS), and give me RESEND_API_KEY."
4. Stripe: "Make a Stripe account, finish the business check, stay in TEST mode, and give me the test secret key; tell me the monthly price and setup fee."
5. Google: "In Google Cloud, turn on Places API (New), add billing, make a key limited to Places API with a $5 budget alert, and add it as GOOGLE_PLACES_API_KEY" (this is task T3).
6. Search Console: "Sign in to Google Search Console with the agency Google account" (we add each site there).
7. Only if you want text alerts: "Make a Twilio account, buy one number, and start the 10DLC sign-up (takes 1-3 weeks)."

## CEO-only questions
- Monthly price, setup fee, and add-on prices (SMS alerts, SEO pack, ads, monthly report).
- Who owns the customer's domain if they leave (suggest: customer owns it, we hand it over on request; the site itself stops).
- Days of grace after a failed payment before the site goes off (suggest 14; Stripe retries 4 times).
- Text alerts at launch, or email only and texts as an add-on (suggest email first).
- Terms of service and privacy page text for customers and for visitors who send the form (needs a lawyer or a template you approve).

## Risks
Google review rules (show Google credit, at most 5 reviews from the API, refresh within 30 days, no editing; manual reviews are the owner's own words only); SMS law (10DLC, opt-in); form spam; one Cloudflare account holds every site (turn on 2-factor, D1 time-travel backups, weekly export to R2); a bad generator change breaks all live sites at once (publishSite keeps the last good HTML and only replaces it after a render passes checks); owners pasting other people's photos (admin says "your own photos only").
