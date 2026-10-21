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
