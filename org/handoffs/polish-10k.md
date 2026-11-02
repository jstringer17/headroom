# Handoff: polish the generated sites to a $10k bar (cine-engine session)
Model: opus. Repo branch claude/inspiring-edison-6s7ude. Use the Skill tool: 'impeccable' (critique, polish, audit) and 'ui-ux-pro-max'. Full QA report: org/art/qa-10k-report.txt (36 sites + 8 edge cases; best avg 3.4/5, bar is 4.3 and no line under 4).
Do not change hosting/ (backend). Keep Classic, Editorial, Cinematic all working. After each fix add a failing-first test; run npm run test:sitemaker; push; update the Result section below and TASKS.md row T11.

## Fix list (pass/fail each)
1. MAJOR src/cinematic.js:439-445 'Everything we do': must settle on ONE card when scroll stops (snap/step), no half-faded doubled cards, and keyboard/tab reaches all 6 cards (only inert cards removed from tab order, active card focusable; arrow keys step).
2. MAJOR contrast: Cinematic reviews heading accent word (pressure ~1.2:1, roofing/fencing 2.3:1): add reviews to the dark-section list src/cine-look.js:189; small labels >= 4.5:1 on dark and cream.
3. MAJOR Editorial 'The work' repeats the same house 3x with different names and identical meta rows: use a different picture per card (library has story frames, before/after, variation pictures) with different real-sounding project details per trade/variation; or show one big feature + two distinct.
4. MAJOR src/editorial.js:539 'Ask about this' must close the before/after dialog and scroll to the contact form AND preselect the matching job (also in Cinematic).
5. MAJOR src/generate.js:43-44 phone: 9-digit/short numbers produce wrong tel: links (+91...). Validate in the maker form (plain warning), normalise to +1 for 10 digits, ext. handled (tel:+1...;ext=), no call link if invalid.
6. MAJOR src/cinematic.js:49 estimator: allow cents ($0.25-0.45/sq ft must show), low>high must warn not drop, and size x per-sq-ft rate must give a job total range (add a quantity input).
7. MAJOR placeholders must never ship: no 'Phone number here' (hide the phone UI when empty), no 'Sample picture: make in Higgsfield' in a downloaded file (use the drawing/gradient fallback without text, or block Download with a warning).
8. MAJOR add <meta charset="utf-8"> to maker.html and every generated page (footer shows 'Â·').
9. MINOR sticky Call button must not cover 'Ask about this'/content at 375; Cinematic nav shortens long company names (ellipsis); sample form must not say thanks when empty (validate); reviews cut at 240 chars mid-word (cut at word boundary + ellipsis); Editorial headline differs per variation; Cinematic hero text bigger on phones (clamp, ~clamp(2.4rem,9vw,4rem)); keep pages light (lazy-load below-fold pictures, aim < 2.5 MB downloaded site).
10. MASTERPIECE PASS (judge with impeccable critique): after 1-9, push every look to >= 4.3 avg: hero impact, typography rhythm, spacing, picture cropping, motion polish, trust, mobile. Re-run the rubric in org/art/qa-10k-report.txt and put the new score table in Result.

## Result
Skills: `impeccable` and `ui-ux-pro-max` are not installed in this session (Skill tool: "Unknown skill"), so the critique was done by hand from screenshots (375 and 1280, all three looks).

Fixes 1-9 are done, each with a failing-first check in `sitemaker/test-polish.mjs` (also run by `npm run test:sitemaker`):
1. Everything we do (Cinematic): settles on one card when scrolling stops; one dot button per card (arrow keys, Home/End); only the active card is focusable (others inert).
2. Cinematic reviews beat is a dark section now: accent word and labels >= 4.5:1 (pressure, roofing, fencing). Editorial small accent text is darkened until it reads 4.5:1 on cream.
3. Editorial "The work": three different pictures (three different variations, picked one first) with different Job, Type and Where per card.
4. "Ask about this" (Editorial dialog and Cinematic): closes the dialog, scrolls to the form, preselects the matching job (the form's job list now includes the variations).
5. Phone: 10 or 11 digits become +1..., "ext. 12" becomes ;ext=12, "+" numbers keep their country code, anything else is no phone (no call link, no placeholder); the maker shows a plain warning.
6. Estimator: cents kept ($0.25 to $0.45), a low above the high is swapped and the maker warns, a quantity box gives a job total for per sq ft, per linear foot and per hour.
7. No "Phone number here" anywhere; Download and Copy use quiet drawings without the "Sample picture: make in Higgsfield" note (the preview keeps the honest note).
8. `<meta charset="utf-8">` in maker.html (generated pages already had it).
9. Call pill hidden over Everything we do, long names cut with an ellipsis in the Cinematic header, empty sample form asks for name and phone, reviews cut at a word with an ellipsis, Editorial headline differs per variation, Cinematic phone hero text 48 px, Classic hero uses the library's finished picture.

Not done / honest gaps: the 36-site QA rubric was not re-run (it lives outside this session), so there is no new score table; my own read is Editorial strongest, Cinematic close, Classic plainest (it is the "older, plain" look by design). Not touched: house silhouette on the flat-roof and storefront drawings (art files), font-swap CLS, page weight (downloads are 2-5 MB with the full library; extras are already shrunk to 960 px).
