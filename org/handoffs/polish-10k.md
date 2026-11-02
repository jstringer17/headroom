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
(fill in: head sha, test counts, score table)
