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


## CEO round 2 (2 Nov, from the CEO's own words). Do these FIRST, they change structure
A. ONE before/after only. The page has two (the standalone 'Before to after, drag the line' section AND the compare inside 'Everything we do'). Remove the standalone section; the drag-the-line before/after lives inside the style picker (below) per variation. No second slider anywhere (Cinematic, Editorial, Classic).
B. 'Pick your style' must list EVERY variation of the trade (roofing: shingle, metal, tile, slate, shake, flat; fencing 6; pressure 6; trades with variations only), not just 3. MERGE 'Pick your style' and 'Everything we do' into ONE section (same trade-specific title, e.g. 'Pick your roof.'): tabs/chips for all variations, big picture, one-line description, price range if typed, [Compare before/after] toggle using the drag slider, [Ask about this] (preselects the job in the form). Honors 'Services we offer' unticks. Mobile: chips scroll horizontally, no hidden options. Remove the old duplicates and their tests; update tests.
C. CREDIBILITY PROFILE in the maker (new group 'Credibility, type once'): year founded OR years in business (age auto from founded year), BBB rating (A+..F) + BBB accredited toggle + link, Google rating + count + link, Yelp rating + count + link, Angi (Angie's List) rating + count + link, Facebook rating/link, HomeAdvisor/Nextdoor/Thumbtack (one 'other' row), license number, insured + bonded + amount, warranty text, number of jobs done, family-owned / veteran-owned toggles, awards (up to 3 short lines), manufacturer certifications (GAF, Owens Corning, etc, free text up to 3). Every filled field is plugged in EVERYWHERE it belongs, automatically, in all 3 looks: hero trust strip (top 3 strongest only, ranked: rating, years, license/insured), a proof bar under the hero with logos-as-text badges (no third-party logos/trademark images: text badges styled by us), reviews section header, contact section footer line, footer, schema.org LocalBusiness (aggregateRating only from fields the owner typed; never invent), and the hosted admin. Empty fields show nothing (no placeholders, no fake numbers). Save the profile in the browser (localStorage, per user) with a 'Reuse last business' option so repeat entries are not retyped; the hosted admin edits the same fields (coordinate with owner-admin via the form JSON keys; keep the key names in sitemaker/src/generate.js and document them in the Result section).
D. FRICTIONLESS BUTTONS, still sexy: audit every button/link in all looks: min 48x48 CSS px tap target on phones, visible resting state at AA contrast on any background (no ghost buttons that vanish on photos: use solid or glass + border), clear hover/press/focus-visible states, one primary action per screen (Call or Free estimate) always reachable: persistent bottom bar on mobile (Call, Text, Free estimate) that never covers content or form fields and hides while the keyboard is open; header call button always visible; tel:/sms: links; 'Ask about this' and Compare buttons obvious; form: big fields, autofill attributes, inputmode, one-tap submit, no CAPTCHA friction beyond invisible Turnstile, sticky success message. Add Playwright checks for tap-target size and contrast of every button at 375 and 1280 in all 3 looks.
E. Keep scores: after A-D re-run the rubric; each look >= 4.3.


F. MOBILE QUALITY (CEO: phone version is not as clean as desktop in transitions and photos). At 375x812 and 390x844, all 3 trades x 6 variations x Cinematic/Editorial: pictures must be art-directed for portrait (object-position per slot so the subject (roof/fence/driveway) stays in frame; generate portrait-friendly crops via CSS or a second webp per slot if needed, <=200 KB), no letterboxing, no blurry upscales, text never over the subject, headline sizes balanced; transitions must be as smooth as desktop (no jank, no flashes between story frames, no layout shift, pinned sections that work with iOS Safari address-bar resize: use svh/dvh, avoid 100vh traps, test with Playwright WebKit and Chromium mobile emulation + CPU throttle 4x); tap/scroll feel (no scroll-jacking that traps the thumb, momentum preserved). Provide before/after phone screenshots of every look in the Result.
G. Process: you are the Opus builder for this job (replaces the previous Sonnet session). Use Skill 'impeccable' and 'ui-ux-pro-max' and the consultant report org/consultant-report.md. A separate Opus qa-reviewer will test your work; fix all findings; do not report done until your own Playwright tests for A-F pass and screenshots are looked at by you.



### Independent QA of 3e475f5 (Opus qa-reviewer, 2 Nov): FAIL. Scores Cinematic 3.86, Editorial 3.75, Classic 3.14. Fix ALL, then round 3:
BLOCKERS: (1) one ticked variation (cine.offer=["metal"]) brings back unoffered styles + old 2-slider layout in Cinematic and removes before/after in Editorial/Classic (src/picker.js:35 cards.length>=2 fallback + cinematic.js/editorial.js); must render picker with that one variation + its one slider. (2) hvac (trades w/o variations): Editorial + Classic have NO before/after; give exactly one. (3) test-all red: test.mjs classic 'motion: 3 parts still hidden after scrolling' (also reveal content at opacity 0 when focused by Tab).
MAJOR: Editorial picture not draggable (only thin range bar moves); reviews platform row (BBB/Yelp/Angi) only in Cinematic, add to Editorial + Classic reviews; Classic footer lacks cred line (bonded, coverage, warranty, BBB, family/veteran); before/after pairs not the same shot for the DEFAULT roofing variation (library roofing/before+after are different shots: use story old.webp vs new.webp, same camera, as the default pair when the kit pair is not same-shot; check all 3 trades' default pairs by eye); phone story frames soft and badly cropped (1600x893 landscape upscaled 2-2.6x; roofing frame 2/4 roof cut at right, 2/3 sky, CTAs over the house): per-slot object-position art direction, CTAs below subject, consider a cropped portrait derivative per slot at native resolution (no upscaling beyond 1.5x at DPR 3 is impossible; prefer showing the subject smaller over blurring); Classic action bar covers form fields (hide near form/when field focused, like Cinematic).
MINOR: tap targets <48px (header name link, contact phone link, Classic footer links); Editorial contact phone link 3.8:1 -> 4.5:1; hvac 'Ask about this' picks wrong job; Editorial see-through nav shows headline behind; sample 5-star cards show when no reviews typed (keep the samples labeled, but make it a single clearly-labeled example card, not three fake-looking 5-star cards); maker: 'other' platform review count field, save trade+look in 'Reuse last business'.
Not verified by QA: WebKit/iOS, 390/430 widths, all 18 variations frame-by-frame; you must cover these with your own screenshots.

## Round 3 (CEO, 2 Nov): every look >= 4.3, target 4.5, Classic included
Inspo: org/inspiration/lifetime/NOTES.md + screenshots (Classic and proof/conversion patterns), Northpeak (craft). Fix all findings of the independent QA (org/inbox, chief adds them). Cleaner, not busier: fewer chips on phones, one promise hero (consultant fix 1), Classic rebuilt to the Lifetime pattern (offer bar, promise H1, proof strip, form in hero on desktop, service cards with tags, featured project, owner card + reviews, FAQ, final CTA band, full footer) with real library pictures. Re-score with an independent reviewer; target 4.5, floor 4.3, no line < 4.

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


## Result, CEO round 2 (cine-engine, stopped early on the chief's request; state at push)
Done and checked by their own tests (test-polish.mjs, test-buttons.mjs both pass when run alone):
- A+B: the page has ONE before/after. Trades with variations (roofing, fencing, pressure) get one section `#styles` "Pick your roof / fence / wash" in all three looks: chips for every offered variation (sideways-scrolling row on phones), big picture with its own drag slider, one-line note, typed price range, [Compare before and after] and [Ask about this] (preselects the job). The old standalone before/after, the 3-style tabs and "Everything we do" are gone for those trades. Trades without variations keep style tabs + one slider.
- C: Credibility profile. Maker group "Credibility, type once" (ids `cred-*`), saved in this browser (localStorage key `sitemaker-business-v1`) with "Reuse last business" / "Forget saved business". Form JSON keys (documented at the top of `sitemaker/src/credibility.js`, normalised in `generate.js` `normalize()` as `d.cred`): top level `rating` + `reviews` (Google), `years`, `insured`; `cred.googleUrl`, `cred.founded` (years in business is worked out from it), `cred.bbb {rating, accredited, url}`, `cred.yelp` / `cred.angi {rating, count, url}`, `cred.facebook {rating, url}`, `cred.other {name, rating, count, url}`, `cred.license`, `cred.bonded`, `cred.coverage`, `cred.warranty`, `cred.jobs`, `cred.family`, `cred.veteran`, `cred.awards[3]`, `cred.certs[3]`. Shown: hero top-3 line, badge bar under the hero (text badges, no logos), platform row in reviews, license/insurance line in contact and footer, schema.org JSON-LD (aggregateRating only when the owner typed both stars and count). Empty or invalid fields show nothing.
- D: tap targets 48px, no ghost buttons, AA contrast checked for every button in all three looks at 375 and 1280; phone action bar (Call, Text, Free estimate) that hides while a field has focus or the keyboard is open; header call always visible on phones; form fields have autofill/inputmode/enterkeyhint hints and a big submit.

Not done / not verified at push time:
- The full `npm run test:sitemaker` was still running when I was told to stop. test.mjs (classic), test-cine, test-features, test-library and test-variants-maker were NOT re-run after the round-2 structure change; expect some of their checks to need updating (they still assume old section ids / counts in places). Run the suite first and fix those before anything else.
- E (re-run the rubric, each look >= 4.3) was not done. No hosted-admin work (owner-admin should read the `cred` keys above).
- The impeccable and ui-ux-pro-max skills are not installed in this session.

## Result, CEO round 2 (Opus builder, took over from cine-engine; 2 Nov)
Skills: not installed as Skill-tool skills; on the chief's message I read them from the CEO's repos (jstringer17/impeccable `skill/reference/polish.md`, `critique.md`; jstringer17/ui-ux-pro-max-skill `search.py --domain landing|ux`) and used them as the rubric. Changes they drove:
- impeccable critique, Working Memory Rule ("8+ items: overloaded"): the proof bar showed 9-12 chips (~400 px) on phones. Phones now show the 4 strongest + a "+N more" button (48 px) that reveals the rest; desktop and no-JS show all. ~170 px. Tested in test-round2.
- ui-ux-pro-max landing pattern trust-authority-conversion ("Hero: mission/credibility > Proof") + consultant fix 1: the Cinematic first screen now says what and where ("Roofing in Tulsa, OK") in the accent color before the trust facts.
- impeccable polish 4 ("interaction and state"): Cinematic never loaded the keyboard script, so the phone bar did not hide while typing outside the form (estimator quantity); now it does.
Built on the cine-engine push (its `cred` keys and maker group stay the contract). What I fixed or added on top:
- **Blocker fixed:** the style picker called `scrollIntoView` on load, so Cinematic and Editorial opened ~1,800-3,000 px down the page (at the picker). Now only the chip row scrolls sideways. Checked by `test-round2` ("page opens at the top", every look/trade at 375, 390, 1280); it failed before the fix.
- **A/B in Classic:** Classic had only a thumbnail list (no chips, no compare). It now uses the shared picker (`src/picker.js`): chips for every offered variation, big picture, plain one-line note per variation (`VARIANT_NOTES` in `src/variants.js`, used by all looks), price range if typed, Compare (the one drag line; pointer, touch, arrow keys), prev/next buttons and swipe, Ask about this (picks the job; the form now lists the variations).
- Cinematic nav had a dead "Before and after" link (section merged away): removed; `test-round2` now fails on any link to a missing section.
- F: the pinned story's progress was offset by the header height, so the last frame finished while the section was already letting go. Progress now runs 0..1 exactly over the pinned runway (tested). Pins use svh; story pictures fill the frame (no letterbox, tested at 375/390). Phone crops of all 18 roofing/fencing/pressure variations looked at frame by frame: the roof/fence/driveway stays in frame and the headline sits over lawn/sky, not the subject. Story scroll under 4x CPU throttle: p95 frame 16.8 ms (roofing, fencing, pressure), max 50 ms. Load layout shift < 0.1 on phones (tested).
- C: "warranty warranty" doubled text fixed; badge label/value spacing fixed; Editorial's 4-cell strip no longer repeats facts already in the proof chips.
- Tests: full `node sitemaker/test-all.mjs` passes, all 13 steps (classic, engine, looks, library, variants 748, variants-maker, polish, buttons, features 245/245, live 866, round2 486/0; WebKit skipped). New `sitemaker/test-round2.mjs` (in `test-all`): A-F checks with the real library. Old checks updated to the round-2 rules (header call always visible = up to 2 call buttons in the first screen; rating may show in hero strip + proof bar + reviews; accent contrast measured on the section it sits on; Classic picker chips counted).
- Before/after phone sheets (375, every look, 3 trades): `org/art/round2/{cinematic,editorial,classic}-375-before-after.jpg`. Harness: `node sitemaker/qa/round2-shots.mjs`, story frames: `node sitemaker/qa/story-frames.mjs <out> roofing`.

Self-score on the rubric (mine, NOT independent; the qa-reviewer must re-score):
| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 4 | 4 | 3 |
| 2 Photos and motion | 4 | 4 | 3 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 3 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 4 |
| 8 Editorial craft | - | 4 | - |
| Average | 4.29 | 4.25 | 3.71 |
E is NOT met: no look clearly reaches 4.3 by my own read, Classic is well below (it is the plain look by design). Biggest remaining gaps: Cinematic hero still opens on the problem ("Every roof shows its age."), not a promise (consultant fix 1); Editorial phone proof chips are busy (9+ chips); Classic hero is a template.
Not verified: iOS Safari/WebKit (WebKit is not installed in this container; `test-round2` prints SKIPPED for it). No hosted-admin work (owner-admin reads the `cred` keys listed above).

### Independent QA of a4f4922 (Opus qa-reviewer, 2 Nov): FAIL. Cinematic 4.14, Editorial 4.25, Classic 3.86 (floor 4.3, no line < 4)
Method: judged cold from org/art/round3/*.jpg, my own shots (`round2-shots.mjs --out=/tmp/qa3`, 3 looks x roofing/fencing/pressure x 375/430/1280, 162 shots), phone story frames of all 18 variations (`story-frames.mjs /tmp/qa3story`, 71 frames, looked at as 3 sheets), full-page edge cases (one ticked variation `cine.offer=["metal"]`, hvac, towing, empty profile, 82-char company name + no phone; 3 looks x 375/1280), Playwright probes (drag on picture, phone bar vs every form field at 375/430, Ask-about-this per chip, tap targets <44 px, contrast), and `test-all` from a fresh clone. **WebKit is not installed in this container: iOS Safari is NOT verified.** Chromium only.

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 4 | 4 | 4 |
| 2 Photos and motion | 4 | 4 | 3 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 3 |
| 5 Tools | 4 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 4 |
| 8 Editorial craft | - | 4 | - |
| **Average** | **4.14 FAIL** | **4.25 FAIL** | **3.86 FAIL (two lines at 3)** |
Real progress since 3e475f5 (+0.28 / +0.50 / +0.72), and no line is below 4 in Cinematic or Editorial, but none reaches the 4.3 floor; the 4.5 target is not close.

**Items of "Independent QA of 3e475f5"**
- B1 one ticked variation: FIXED. `offer:["metal"]` gives 1 chip + 1 slider in all 3 looks, H1 "Metal roofs built for decades." (/tmp/qa3edge/*-onemetal-*.jpg).
- B2 hvac before/after: FIXED. Editorial and Classic have exactly one before/after slider (Cinematic: one before/after + the thermostat tool). Towing also one.
- B3 test-all red: FIXED. See test summary below (classic step PASS: all checks).
- M Editorial picture drag: FIXED. Mouse drag from 50% to 20% across the picture moves the line (value 50 -> 20) in Editorial, Classic and Cinematic.
- M platform row in Editorial + Classic reviews: FIXED (Google + BBB chips in both, round3 sheets col 5).
- M Classic footer cred line: FIXED (`foot-cred`: "Licensed #ROC 334512 · Insured $1M · Bonded · 10-year workmanship warranty · BBB A+ accredited · Family owned").
- M same-shot default pairs: FIXED for roofing shingle, fencing cedar, pressure driveway (same camera both sides, round3 sheets col 4).
- M phone story frames soft/badly cropped: FIXED for sharpness (measured 1.47-1.53x at DPR 3, 390 px), subject now in frame and CTAs below the picture in all 18. Still weak: fencing-vinyl subject is a thin white line on the horizon (sky/lawn fill the frame); pressure-driveway has 3 frames, all others 4.
- M Classic action bar over form fields: FIXED (bar steps aside for every field and the submit at 375 and 430).
- m tap targets: MOSTLY FIXED. Only remaining: Classic hero "Or call (918) 555-0142" link 94x30 px at 375 (inline in a sentence; still a thumb target on phones).
- m Editorial contact phone contrast: FIXED (rgb(218,170,140) on rgb(20,17,15), about 9:1).
- m hvac Ask about this: NOT FIXED (partly). Chips map "Central air" -> AC repair, "Heat pump" -> Heat pumps, but "Ductless mini-split" -> AC repair and the "Before and after" chip -> AC repair; the job list has no ductless/new-system choice (/tmp/qa3edge/classic-hvac.html `#f-job`).
- m Editorial see-through nav: FIXED (solid cream bar).
- m sample review cards: FIXED (one card, labeled "Sample review, replace with a real one").
- m maker other-site count + Reuse saves trade/look: FIXED (src/maker-ui.html:157 `cred-other-count`; src/maker-ui.js SAVED_IDS includes trade, look).

**Round 3 Classic vs org/inspiration/lifetime/NOTES.md:** offer bar yes; promise H1 yes for roofing/fencing/pressure only; proof strip yes; form in hero on desktop yes; service cards with tags yes (but tags are mostly the generic "Service"); featured project yes (real pair + 3 steps, no scope/warranty bullets); owner card + reviews yes (no photo slot, initials only); FAQ yes; final CTA band yes; full footer yes. Structure is there; the craft is not yet at 4.3 (below).

**BLOCKER**
- none new. (test-all: see below.)

**MAJOR**
1. Cinematic promise headline sits on the BEFORE picture. First screen says "Cedar privacy fences, built straight." over an empty lawn with stakes; "Your driveway, bright again." over the oil-stained driveway; "Shingle roofs that last" over the worn roof (/tmp/qa3/cinematic-fencing-cedar-1280-0top.jpg, story frame 0 of every variation). Cause: src/cinematic.js:586-588 swaps only the headline of step 0, not its picture. Fix: when the promise is used, frame 0 shows the finished picture (last step's image), and the story starts from frame 1; or keep the problem headline. Costs line 1 a point in Cinematic.
2. Promise hero only exists for 3 of 19 trades. src/promise.js:5-33 has roofing/fencing/pressure; every other trade falls back to problem or label headlines: Cinematic hvac "Cold creeps in at the glass.", towing "Stuck on the side of the road.", Classic hvac "Heating and air conditioning service." (/tmp/qa3edge/*-hvac-*.jpg). Round 3 asked for one promise hero. Fix: add a promise per trade in PROMISES (`_` key), test that every trade's H1 is a promise.
3. Classic phone rhythm is long and template-like: 6 stacked full-width service cards (~1,400 px) before the picker, page 8,243-8,323 px at 375 (/tmp/qa3edge/classic-onemetal-375.jpg, classic-long-375.jpg), every section is a white card on white/pale. "Cleaner, not busier" is not met. Fix: on phones show services as a 2-column compact grid or a horizontal scroller (max ~600 px), alternate one full-bleed photo band (featured project picture) between proof and services, cut the "Three steps" section on phones or fold into FAQ.
4. Classic photos (line 2 = 3): hero picture is darkened to near-black so the house barely reads (/tmp/qa3edge/c0.jpg from classic-onemetal-1280); overlay is .82/.62/.35 black plus a bottom gradient (src/classic.js:285); trades without library art get a flat blue hero with no picture at all (/tmp/qa3edge/tiles/classic-hvac-1280.jpg); only plain reveals, no photo motion. Fix: lighten to about .65 -> .15 behind the text column only so the house reads beside the form, use the trade's drawing in the hero when there is no photo.
5. Classic phone header clips the company name mid-letter with no ellipsis ("Bright Side Pressure Washi", "Northeastern Oklahoma Pre"; org/art/round3/classic-375.jpg row 3, /tmp/qa3edge/tiles/classic-long-375.jpg). Cause: src/classic.js:276 `.brand-name{display:inline-flex;...text-overflow:ellipsis}` (ellipsis does not apply to a flex container's anonymous text). Fix: wrap the name in a `<span>` with the overflow/ellipsis rules, or use `display:block` + line-height 48px.

**MINOR**
- Cinematic contact phone breaks inside the number at 1280: "(918) 555-" / "0142" (pressure; /tmp/qa3/cinematic-pressure-driveway-1280-5contact.jpg). Cause: src/cine-look.js:192 `.big-phone{white-space:normal;overflow-wrap:anywhere}` overrides src/cinematic.js:351 nowrap. Fix: scope the cine-look rule to <=600 px or use `white-space:nowrap` with a smaller clamp.
- Cinematic hvac before/after says "Dirty" / "Clean" (and aria "dirty and clean") over an old/new AC unit: src/cinematic.js:102. Fix: ["Old", "New", "Drag the line"].
- Trades without variations show a chip literally named "Before and after" next to style chips (src/picker.js:55), and it maps Ask about this to the first job. Fix: label it with the pair's subject ("Old unit to new"), map Ask to the best matching job.
- Header phone glyph with no phone: when phone is empty the header icon button (and "Contact us" with a phone icon) still shows a phone glyph but links to #contact (all 3 looks, /tmp/qa3edge/*-long-375.jpg). Fix: use a chat/arrow icon when there is no phone.
- Classic owner card initials read as words: "Northeastern Oklahoma..." -> "NO". Fix: skip initials that form a stop word (NO, OK, OR...) or use the trade icon.
- Classic desktop proof strip with 3 facts is left-aligned leaving half the row empty (c0.jpg). Fix: spread facts across the row / center.
- Editorial desktop header phone sits ~12 px higher than the button (/tmp/qa3/editorial-fencing-cedar-1280-0top.jpg): src/editorial.js:315 sets `.ed-nav .ed-tel{display:inline}` which drops the inline-flex centering from line 216. Fix: keep inline-flex + align-items:center.
- Editorial hero silhouette peak is clipped flat at the top (same shot). Fix: give the clip-path 2-4 px headroom.
- Cinematic last story frame changes crop/zoom versus frame 3 (visible jump; all 18 sheets, column 4). Fix: keep the same object-position/scale on the last step.
- Picker price line and "Estimate from the owner" sit under the phone bar when the picker is scrolled to its natural stop (org/art/round3/classic-375.jpg col 3). Fix: add bottom padding = bar height to #styles on phones.

**Tests (fresh clone /tmp/qa3clone, branch at a4f4922, `node sitemaker/test-all.mjs`)**
13/13 steps OK, exit 0, "all steps passed": build (test library) OK; classic PASS all checks; engine PASS (19 trades x 2 widths); looks test-cine criteria 4/5/D/E/R/S all PASS; library PASS; variants PASS (748); variants-maker PASS; polish PASS; buttons PASS; features 245/245; live PASS (866, 19 trades x 3 looks); round2 513 pass / 0 fail with **WebKit SKIPPED (not installed)**; build (full library, lazy) maker.html 489.9 KB, 116 pictures 21.48 MB not embedded. Note: the suites pass while MAJOR 1-5 above exist, so no test guards them; add checks for frame-0 picture = finished picture when a promise is shown, promise H1 for every trade, Classic phone page height budget, and header-name ellipsis.

**Not verified:** WebKit/iOS Safari (not installed), real devices, the hosted admin, page weight on download.

### Independent QA of 338323a (Opus qa-reviewer, 2 Nov): FAIL, close. Cinematic 4.29, Editorial 4.25, Classic 4.14 (floor 4.3, no line < 4 is now met by all three)
Method: evidence regenerated cold at 338323a: refreshed org/art/round3/*.jpg; my `round2-shots.mjs --out=/tmp/qa4` (3 looks x 3 trades x 375/1280, 108 shots); story frames of all 18 variations (/tmp/qa3story, 89 frames, looked at as sheets); full-page edge cases (one ticked `offer:["metal"]`, hvac, towing, empty profile, 82-char name + no phone; 3 looks x 375/1280, /tmp/qa3edge); Playwright probes (drag, phone bar vs every field at 375/430, Ask per chip, taps < 44 px, header text alignment, phone wrap, hero pill contrast). test-all not re-run (coordinator runs it at 2714e20; my a4f4922 run was 13/13). **WebKit is not installed: iOS Safari NOT verified.**

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 4 | 4 | 4 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 4 |
| 8 Editorial craft | - | 4 | - |
| **Average** | **4.29 FAIL (0.01 short)** | **4.25 FAIL** | **4.14 FAIL** |
No line is below 4 in any look. The gaps are now small and specific (below).

**a4f4922 findings: FIXED / NOT FIXED**
- M1 Cinematic promise over the before picture: FIXED. Frame 1/5 shows the finished picture (clean driveway, finished cedar fence; /tmp/qa4/cinematic-pressure-driveway-1280-0top.jpg, all 18 story sheets), then the story.
- M2 promise for all trades: FIXED for Cinematic and Classic (hvac "Heating and air that keep every room comfortable.", towing "Towing and roadside help when you need it."). Editorial kept its own lines by choice; towing's "STUCK? HELP ON THE road." is still problem-first (minor, below).
- M3 Classic phone length: FIXED. 2-column compact service cards, no steps block; pages 5,259-6,676 px at 375 (were 8,243-8,323).
- M4 Classic pictures: FIXED on desktop (house reads beside the form, /tmp/qa4/classic-roofing-shingle-1280-0top.jpg; hvac gets drawing + glow). On phones the roofing hero shows mostly flat grey sky (org/art/round3/classic-375.jpg row 1 col 1): see MAJOR 2.
- M5 Classic name ellipsis: FIXED ("Northeastern Oklahoma ...", "Bright Side Pressure Was..."), but the fix introduced MAJOR 1.
- m Cinematic phone wraps at 1280: FIXED (1 line, src/cine-look.js:192-193). m hvac Dirty/Clean: FIXED (Old/New, chip "Old to new"). m "Before and after" chip: FIXED for hvac; towing still says "Before and after" (acceptable). m phone glyph with no phone: FIXED (arrow). m initials: FIXED ("N"). m proof strip spread: FIXED. m Editorial header phone: FIXED (text centre 31 = button centre 31). m picker under phone bar: FIXED. m Classic "Or call" 30 px link: FIXED (no target < 44 px in any look at 375).
- m hvac Ask about this: FIXED as no-wrong-job ("Central air" and "Ductless mini-split" -> "Something else"), but it now loses the job; see MINOR.
- Not changed by choice (agree they are minor, still open): Cinematic last-frame zoom jump, Editorial silhouette peak clipped, fencing-vinyl subject tiny, no owner photo slot.
- Regression checks: one ticked variation still 1 chip + 1 slider in all looks; hvac/towing exactly one before/after (Cinematic hvac also has the thermostat tool); no "undefined/NaN/Phone number here/Higgsfield" text in edge pages; no sideways scroll; no page errors; drag on picture works in all 3 looks; phone bar steps aside for every field at 375/430.

**BLOCKER**: none.

**MAJOR**
1. Classic header name is no longer vertically centred (regression from the ellipsis fix), on every Classic page at every width: name text centre y=69 vs Call button centre y=82 at 1280 (13 px high), same at 375 vs the round call button (/tmp/qa4/classic-roofing-shingle-1280-0top.jpg; org/art/round3/classic-375.jpg every frame). Cause: src/classic.js:278 `line-height:48px` is reset by the later `font:800 20px/1.1` shorthand in the same rule (computed line-height 22px). Fix: put `line-height:48px` after the `font` shorthand (or `font:800 20px/48px var(--head)`); add a test that the name's text centre is within 2 px of the header button's.
2. Classic phone hero after the lighter overlay: the "ROOFING IN TULSA, OK" pill is orange rgb(242,122,31) on about rgb(105,117,132) = 1.7:1 (pressure yellow 3.7:1; fencing 4.7:1 passes), and at 375 the roofing hero picture shows mostly flat grey sky, no house (org/art/round3/classic-375.jpg row 1). Fix: on phones keep the darker overlay (or a solid dark pill background, e.g. rgba(0,0,0,.55)), set the hero `object-position` so the house is in frame at 375, and add the pill to the contrast test.

**MINOR**
- hvac (and every trade without variations) "Ask about this" now picks "Something else" for "Central air" and "Ductless mini-split": no wrong job, but the lead loses what was asked. Fix: add the style chips to the job list as roofing does (`#f-job` in /tmp/qa3edge/classic-hvac.html lacks them).
- Editorial towing H1 "STUCK? HELP ON THE road." is problem-first, against the round-3 "one promise hero" (coordinator chose to keep Editorial lines; flag only).
- Classic service tags are still mostly the generic "SERVICE" (Lifetime: Most popular / Emergency / Same day / Free). Fix: tag from the owner's ticks (emergency, free estimates) and leave the rest untagged.
- Cinematic phone first screen: picture fills the top half only, headline + 2 buttons + 2 lines below on dark; strong, but not the rubric's full-bleed single-button 5. Optional: one button on the first frame.
- Carried over by choice: Cinematic last-frame crop jump, Editorial silhouette peak, fencing-vinyl subject size, pressure-driveway story has 4 frames (others 5).

**To reach 4.3+:** fix MAJOR 1-2 (Classic phone first screen goes to 5 on line 7 and keeps line 1 at 4+), give Cinematic one more point (line 3: pressure's display face mixes a sans headline with a serif italic accent; or line 7 by a single primary button on the first phone frame), Editorial line 8 (silhouette peak, header/price glyph spacing "$ 4.50").
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, the coordinator's fresh-clone test-all at 2714e20.

### Independent QA of 920705e (Opus qa-reviewer, 2 Nov): FAIL by a hair. Cinematic 4.29, Editorial 4.25, Classic 4.29 (floor 4.3; no line < 4 in any look)
Method: fresh evidence at 920705e: `round2-shots.mjs --out=/tmp/qa5` (3 looks x 3 trades x 375/430/1280, 162 shots; Classic phone looked at frame by frame, sheet /tmp/qa5/sheet-classic-phone.jpg); full-page edge cases regenerated (/tmp/qa3edge: one ticked metal, hvac, towing, empty, long name + no phone); probes: header text centre, hero pill contrast on the real picture, Ask about this per chip, taps < 44 px, phone wrap. Story frames not re-shot (no Cinematic story change since 338323a). test-all not run by me (coordinator runs it). **WebKit not installed: iOS Safari NOT verified.**

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 4 | 4 | 4 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 5 |
| 8 Editorial craft | - | 4 | - |
| **Average** | **4.29 FAIL (-0.01)** | **4.25 FAIL (-0.05)** | **4.29 FAIL (-0.01)** |
Classic +0.15: line 7 goes to 5 (phone first screen now photo with the house in frame, promise H1 and Call above the fold, 48 px targets everywhere, bar steps aside for every field). Cinematic and Editorial are unchanged from 338323a, because their remaining gaps were not in this round. Each look needs one more line at 5 to pass.

**338323a findings: FIXED / NOT FIXED**
- MAJOR 1 Classic name off-centre: FIXED. Name text centre 82 = button centre 82 at 375 and 1280, computed line-height 48px.
- MAJOR 2 Classic phone hero pill + picture: FIXED. Pill on rgba(0,0,0,.45): median contrast roofing 6.7:1 (375) / 5.6:1 (1280), fencing 9.4 / 10.7, pressure 10.2 / 12.1. Phone hero is a full-width picture with the house/fence/driveway in frame above the text (/tmp/qa5/classic-*-375-0top.jpg).
- MINOR Ask about this loses the job: FIXED. hvac chips keep their job in all 3 looks (Central air -> Central air, Heat pump -> Heat pump, Ductless -> Ductless, Old to new -> New AC and furnace).
- MINOR Editorial towing problem-first H1: FIXED ("ROADSIDE HELP, right WHERE YOU ARE.").
- MINOR generic Classic tags: FIXED (Repair / New install / Urgent / Free check / Repair or new; one "Service" left on Flat roofs).
- Still open by choice: Cinematic last-frame crop jump, Editorial silhouette peak, fencing-vinyl subject size, no owner photo slot.
- Regression checks pass: one ticked variation = 1 chip + 1 slider in all looks; hvac/towing exactly one before/after; no undefined/NaN/placeholder text, no sideways scroll, no page errors in the 15 edge pages; no tap target < 44 px at 375 in any look; Cinematic phone number one line at 1280; Editorial header phone centred.

**BLOCKER**: none. **MAJOR**: none.

**MINOR (what stands between each look and 4.3)**
- Cinematic, line 1 or 7 -> 5: phone first frame stacks headline + 2 buttons + 2 text lines under a half-height picture (org/art/round3/cinematic-375.jpg col 1). Fix: one primary button (Call) on frame 1, move "Get a free estimate" and the trust line to the next frame or the proof bar; or line 3: pressure theme mixes a sans display face with a serif italic accent (cinematic-pressure-*-0top.jpg) - use the serif for the display line like roofing/fencing.
- Editorial, line 8 -> 5: hero silhouette peak clipped flat (/tmp/qa5/editorial-fencing-cedar-1280-0top.jpg) and the Didone dollar sign sets a visible gap ("$ 4.50 to $ 7", org/art/round3/editorial-375.jpg col 3). Fix: 2-4 px clip-path headroom; render prices in the sans or with `font-feature-settings`/a negative letter-spacing on the "$".
- Classic, line 2 -> 5: the picker's standing-seam metal picture is cropped so the bottom third is a dark wall under the roof (/tmp/qa3edge/classic-onemetal-375.jpg, picker), and there is no photo band between proof and services on phones (all white cards until the picker). Fix: object-position per variation for the picker slot (metal: center 30%), and one full-width featured-project photo band earlier on phones.
- Classic offer bar wraps to 2 lines at 375 when the offer is long ("Free estimate with color samples at your door · Call (918) 555-0142"). Fix: drop the number from the bar on phones (the header button already calls).
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, coordinator's test-all at 920705e.

### Independent QA of ba7f982 (Opus qa-reviewer, 2 Nov): Cinematic PASS 4.43, Editorial PASS 4.38, Classic FAIL 4.29 (floor 4.3, no line < 4 in any look)
Method: fresh evidence at ba7f982: `round2-shots.mjs --out=/tmp/qa6` (3 looks x 3 trades x 375/1280, 108 shots; phone sheets /tmp/qa6/sheet-{cinematic,editorial,classic}.jpg, Editorial silhouettes /tmp/qa6/ed-sil.jpg); story frames of all 18 variations re-shot (/tmp/qa3story, 89 frames); 15 edge pages x 2 widths re-generated (/tmp/qa3edge: one ticked metal, hvac, towing, empty, long name + no phone): no undefined/NaN/placeholder text, no sideways scroll, no page errors; one ticked = 1 chip + 1 slider in all looks; hvac exactly one before/after. test-all not run by me (coordinator runs it at ba7f982). **WebKit not installed: iOS Safari NOT verified.**

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 5 | 4 | 4 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 5 |
| 8 Editorial craft | - | 5 | - |
| **Average** | **4.43 PASS** | **4.38 PASS** | **4.29 FAIL (-0.01)** |
Target 4.5 is not reached by any look.

**920705e suggestions: FIXED / NOT FIXED**
- Cinematic phone first frame one button: FIXED. Picture, one serif line with one italic accent, one Call button, a single place line (/tmp/qa6/sheet-cinematic.jpg cols 1 and 3). Line 1 goes to 5. (Pressure still uses its sans display face with a serif italic accent: theme choice, line 3 stays 4.)
- Editorial silhouette apex: FIXED. Roofing apex on sky, fencing on foliage, pressure on the roof; no flat clip (/tmp/qa6/ed-sil.jpg). A ~6 px white sliver remains at the very tip of the pressure silhouette (minor).
- Editorial "$ 4.50" gap: FIXED (prices in the sans: "$4.50 to $7", sheet-editorial col 2). With the apex fix, line 8 goes to 5.
- Picker framing per trade: FIXED for shingle, cedar and driveway (roof, fence and driveway in frame). NOT FIXED for standing-seam metal: the library picture itself is a roof close-up whose bottom third is a dark wall; object-position cannot fix it (/tmp/qa3edge/classic-onemetal-375.jpg, picker and photo band).
- Classic phone photo band: ADDED, but see MINOR 1 (it repeats the hero picture).
- Classic phone offer bar one line: FIXED ("Free estimate with color samples at your door", no number).

**BLOCKER**: none. **MAJOR**: none.

**MINOR**
1. Classic phone shows the same photo three times within ~2,500 px: hero, the new photo band and the picker's first picture are all `roofing/new.webp` (fencing `after.webp`, pressure `clean.webp`) in /tmp/qa6/classic-*.html. This is why Classic line 2 stays 4. Fix: band uses a different real picture (another offered variation's after, or the featured project's after), never the hero's or the picker's first.
2. Classic first screen on phones still carries a lot: 2 full-width buttons + 4-line paragraph + trust line + 2 check bullets before the form (sheet-classic col 1/3). For line 1 = 5: keep Call as the one primary, make "Get a free estimate" a text link to the form, cut the paragraph to one line on phones (the trust line and bullets already say it).
3. Metal picture (library `roofing/metal/after.webp`) is a close-up with a dark wall in the lower third; in the band and the picker it reads as a dark block. Fix in the library (re-crop or replace) or per-picture object-position `50% 15%` for metal.
4. Pressure Editorial silhouette tip shows a ~6 px white sky sliver (ed-sil.jpg right). Fix: move that slot's crop up 2-3%.
5. Still open by choice: Cinematic last-frame crop jump, fencing-vinyl subject size, no owner photo slot.
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, coordinator's test-all at ba7f982.

### Independent QA of 7f068a2 (Opus qa-reviewer, 2 Nov): PASS on the floor for all three. Cinematic 4.43, Editorial 4.38, Classic 4.43 (floor 4.3, no line < 4). Target 4.5 NOT reached.
Method: fresh evidence at 7f068a2: `round2-shots.mjs --out=/tmp/qa7` (3 looks x 3 trades x 375/1280, 108 shots; Classic + Cinematic phone sheet /tmp/qa7/sheet.jpg); all 18 story variations re-shot (/tmp/qa3story, 89 frames; first frames sheet /tmp/qa3story/f0.jpg); 15 edge pages x 2 widths (/tmp/qa3edge): no undefined/NaN/placeholder text, no sideways scroll, no page errors; one ticked metal = 1 chip + 1 slider in all looks and no photo band (correct: no second variation to show); hvac exactly one before/after. test-all not run by me (coordinator runs it at 7f068a2). **WebKit not installed: iOS Safari NOT verified.**

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 5 | 4 | 5 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 4 | 4 | 5 |
| 8 Editorial craft | - | 5 | - |
| **Average** | **4.43 PASS** | **4.38 PASS** | **4.43 PASS** |

**ba7f982 findings: FIXED / NOT FIXED**
- MINOR 1 band repeats the hero: FIXED. Band = `roofing/metal/after`, `fencing/vinyl/after`, `pressure/siding/after`, never the hero or the picker's first picture; with one offered variation there is no band.
- MINOR 2 busy Classic phone first screen: FIXED. Photo, pill, H1 with one accent word, one Call button, trust line, checks; form follows (/tmp/qa7/classic-*-375-0top.jpg). Classic line 1 goes to 5. Phone page 5,112-6,292 px (was up to 6,966).
- MINOR 3 metal picture framing: FIXED in the picker (50% 12%).
- MINOR 4 Editorial pressure apex: PARTLY. Apex is now the house roof, but a ~15 px pale overcast-sky tip remains and reads as a blunt point against the cream (/tmp/qa7/apex.jpg). Cosmetic.
- Cinematic picture cap 440 px: checked; all 18 first frames show the finished picture, one button, no letterbox (f0.jpg).

**BLOCKER**: none. **MAJOR**: none.

**MINOR (the way to 4.5; each look needs about one more line at 5)**
- Cinematic line 7 or 4: story frames keep ~40 px of empty dark between picture and headline and the bottom quarter is empty on 812 px phones (f0.jpg); tighten so the picture can grow to the 1.5x cap or the headline sits higher. Line 3: pressure display face is sans with a serif italic accent (theme choice).
- Editorial line 1 or 5: the phone first screen shows headline + 2 buttons + trust line with the silhouette mostly below the fold (round 3 sheets col 1); line 5 tools are the plain picker/estimator.
- Classic line 2 or 4: no photo motion; fencing services still tagged "SERVICE" on 4 of 6 cards (/tmp/qa3edge/tile-long.jpg col 2); white card runs between the band and the picker.
- Carried over by choice: Cinematic last-frame crop jump, fencing-vinyl story subject size, no owner photo slot.
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, coordinator's test-all at 7f068a2.

## Result, round 3 (Opus builder, 2 Nov): floor met, target not
Head 7f068a2. Independent QA (Opus qa-reviewer, cold, 4 passes): Cinematic 4.43, Editorial 4.38, Classic 4.43; no line under 4; no blockers or majors (section "Independent QA of 7f068a2" above). 4.5 target NOT reached.
Fresh clone of 7f068a2: `node sitemaker/test-all.mjs` 13/13 OK (features 245/245, live 866, variants 748, round2 594/0). WebKit/iOS Safari NOT verified (not installed here).
Done since QA of 3e475f5: every item of that QA; one shared picker (src/picker.js) in all looks and trades; same-camera default pairs (kit.samePair); phone story: sharp picture on top (<=1.5x at 3x), one button, words below; no load CLS (pinned layout from <head>, headline waits for fonts <=900 ms); promise headline for all 19 trades (src/promise.js), Cinematic opens on it over the FINISHED picture; Classic rebuilt on the Lifetime pattern (src/classic.js); tests updated to the round-3 rules + new checks (promise H1 per trade, finished picture behind the promise, Classic phone height budget, header ellipsis, one ticked variation, hvac one before/after, Ask-about-this job).
Next for 4.5 (reviewer): Cinematic: close the dark gap between picture and headline on 812 px phones; Editorial: one button on the phone first screen, bring the silhouette higher; Classic: fewer generic "Service" tags, some photo motion.

### Independent QA of ad4a2f3 (Opus qa-reviewer, 2 Nov): FAIL. Cinematic 4.43 PASS, Editorial 4.13 FAIL, Classic 4.29 FAIL (floor 4.3, no line < 4 is met by all three)
Method: fresh evidence at ad4a2f3, no source edits. `round2-shots.mjs --out=/tmp/qa8 --widths=375,390,1280` (162 shots, 0 page errors); full-page shots of all 9 pages at 375/1280 (/tmp/qa8full) and reduced motion (/tmp/qa8rm); Cinematic desktop scroll frames (/tmp/qa8x/ci1280s.jpg); `story-frames.mjs /tmp/qa8story` (18 variations, 89 frames; sheets /tmp/qa8x/story-roof.jpg, /tmp/qa8x/story-f0.jpg); DOM measures (/tmp/qa8x/roof.json, fp.json); edge pages hvac/towing/no phone/bare/live x 3 looks (/tmp/qa8edge, /tmp/qa8x/edge.json): no undefined/NaN, no sideways scroll; only page error is Turnstile 400020 from the fake test sitekey in live mode. Logo upload checked by generating with `logo` (header + footer img in all looks). sitemaker/test-all.mjs not run (runs elsewhere). **WebKit not installed: iOS Safari NOT verified.**

**SPEC checklist** (D = DONE, P = PARTLY, N = NOT DONE; evidence under /tmp/qa8 unless a path is given)
| Item | Classic | Cinematic | Editorial |
|---|---|---|---|
| Offer top bar | D (*-roofing-shingle-1280-0top) | D | D |
| Logo slot + wordmark fallback | D (lt-logo in header/footer) | D | D |
| <=5 header links | D (4) | D (5) | D (5) |
| Call + Free estimate 48px, phone solid pill | D (48/48, orange pill) | D (48/48) | D (48/48) |
| H1 size/face | D Archivo 900 67-76 / 33-40 | P Fraunces 600 72/40; pressure is Manrope 800 sans | D Bodoni Moda 700 69/40 |
| Sub + 3 checks | D | P desktop yes; phone checks sit after the story (y 3538) | D |
| Form in hero desktop / phone button to form | D | D (card over frame 1, /tmp/qa8x/ci1280s.jpg) | D (card covers 47% of silhouette) |
| Primary CTA >=60 + "or call" | D (62px) | D (62px) | D (62px) |
| Star row under hero button | D (4.9 / 127 real) | D | D |
| Badge row (owner-typed text) | D (proof strip) | D (strip after story) | D (pill strip) |
| Phone bar 2 halves | D (172x52 x2) | D | D |
| Credentials | D | D | D |
| Services grid + tags | P (fencing 4/6 "Fence build"; pressure "Decks and fences" = "Fence build") | P (same pressure tag) | P (rows; same pressure tag on desktop) |
| Featured project | D | D | D |
| What's included | D | D | D |
| FAQ | D | D | D |
| Service areas (typed towns) | D (6 chips) | D | D |
| Final CTA band | D | D | D |
| Full footer | D | D | D |
| Personality kept | D | D (story; RM stacks, /tmp/qa8x/ci-rm-375.jpg) | P (photo cards yes; desktop silhouette half hidden, /tmp/qa8x/ed-tops.jpg) |
| Kai section order | P (picker before services; no map) | P | P |
| Kai 4 fields + consent | P (sample 4 + consent line; live adds Email = 5) | P | P |
Counts: Classic 19 D / 3 P / 0 N; Cinematic 17 D / 5 P / 0 N; Editorial 18 D / 4 P / 0 N.

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 5 | 4 | 5 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 4 | 4 | 4 |
| 7 Phone feel | 5 | 4 | 5 |
| 8 Editorial craft | - | 4 | - |
| **Average** | **4.43 PASS** | **4.13 FAIL** | **4.29 FAIL** |
Line 6 is 4 (not 5) in all looks only because of MAJOR 1 (a service claim the owner never made). Fix it and line 6 returns to 5: Cinematic 4.57, Classic 4.43, Editorial 4.25.

**Round-3 "way to 4.5" items:** Cinematic phone frame gap FIXED (picture fades into headline on all 18 variations). Pressure font mix FIXED as all sans (consistent), but this conflicts with the SPEC serif. Editorial phone first screen FIXED (one button, silhouette visible). Classic photo motion FIXED (14s settle zoom, reduced-motion gated). Fencing "SERVICE" tags PARTLY ("Fence build" on 4/6). White-card run PARTLY (services, included, steps still card runs).

**BLOCKER:** none.
**MAJOR 1:** pressure washing "Decks and fences" is tagged "Fence build" in all three looks (src/lifetime.js:116, ltTag): the site says a pressure washer builds fences. Fix: test the trade before the fence rule, e.g. return "Cleaning" first when `d.trade.key === "pressure"` (or `/wash|clean/` in the trade label), and only use fence tags for the fencing trade; give fencing material tags (Wood / Vinyl / Chain link / Metal) instead of 4 x "Fence build".
**MINOR 2:** Editorial desktop: the form card covers ~47% of the hero silhouette (apex and roof gone), line 8 drops to 4. Fix: shrink the card to ~380px and push it fully right of the silhouette, or move the silhouette left/up so >75% and the apex stay visible.
**MINOR 3:** Cinematic pressure H1 is Manrope sans; SPEC says Cinematic keeps a heavier serif. Fix: Fraunces for the pressure display face too, or record the exception in SPEC.
**MINOR 4:** Credentials list repeats "Insured and bonded" and "Bonded" (Classic about card; 2 hits in classic-roofing-shingle.html). Fix: drop the separate "Bonded" row when the insured row already says bonded.
**MINOR 5:** Live mode adds an Email field (5 visible fields; Kai: 4). Fix: drop Email, or replace the optional message with it.
**MINOR 6:** Cinematic phone: the 3 checks are not in the hero (after the story); with reduced motion the phone first screen shows the H1 but no primary button (button after the stacked frames). Fix: put the CTA under the first stacked frame in reduced motion.
**MINOR 7:** Classic white-card runs (services, included, steps); towing bottom bar says "Free estimate" (consider "Get help").
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, test-all at ad4a2f3.

### Independent QA of 61ffc58 (Opus qa-reviewer, 2 Nov): PASS for all three. Cinematic 4.57, Editorial 4.38, Classic 4.43 (floor 4.3, no line < 4). 4.5 target reached by Cinematic only.
Method: fresh evidence at 61ffc58, scored again from scratch. `round2-shots.mjs --out=/tmp/qa9 --widths=375,390,1280` (162 shots, exit 0); `story-frames.mjs /tmp/qa9story` (18 variations); DOM measures /tmp/qa9m.json; 30 edge pages (hvac/towing/no phone/bare/live x 3 looks x 2 widths, /tmp/qa9edge): no undefined/NaN, no sideways scroll, no page errors except Turnstile 400020 from the fake test key. Sheets: /tmp/qa9x-ed.jpg, /tmp/qa9x-cip.jpg, /tmp/qa9x-st.jpg, /tmp/qa9x-top375.jpg. test-all not run by me. **WebKit not installed: iOS Safari NOT verified.**

**Builder claims:**
- MAJOR 1 FIXED: no "Fence build" in any pressure page. Pressure tags are Siding / Concrete / Wood / Roof / Gutters / Commercial; fencing tags are Wood / Vinyl / Chain link / Metal / Gates / Repair, in all three looks (Editorial `ed-row-tag` the same).
- MINOR 2 FIXED: the Editorial 1280 card covers 15% of the silhouette's box (was 47%), and the apex and roof show in all 3 trades (/tmp/qa9x-ed.jpg).
- MINOR 3 FIXED: the Cinematic H1 is Fraunces for every trade (pressure and hvac 700, others 600).
- MINOR 4 FIXED: the Classic owner card has "Insured and bonded" only.

| Line | Cinematic | Editorial | Classic |
|---|---|---|---|
| 1 First screen | 5 | 4 | 5 |
| 2 Photos and motion | 4 | 4 | 4 |
| 3 Type and accent | 4 | 5 | 4 |
| 4 Rhythm | 4 | 4 | 4 |
| 5 Tools | 5 | 4 | 4 |
| 6 Trust and call | 5 | 5 | 5 |
| 7 Phone feel | 5 | 4 | 5 |
| 8 Editorial craft | - | 5 | - |
| **Average** | **4.57 PASS** | **4.38 PASS** | **4.43 PASS** |

**SPEC counts (same 22 items as at ad4a2f3):**
- Classic 20 D / 2 P / 0 N: P = Kai section order, live 5 fields.
- Cinematic 19 D / 3 P / 0 N: P = phone checks after the story, Kai section order, live 5 fields.
- Editorial 20 D / 2 P / 0 N: P = Kai section order, live 5 fields.
- Rows now DONE: service tags (all three looks), Cinematic H1, Editorial personality.

**BLOCKER:** none. **MAJOR:** none.
**MINOR (open)**
- 5. Live mode shows 5 fields (Email added; Kai says 4). Fix: drop the Email field from `liveFormFields` (src/generate.js:174), or replace the optional message with it.
- 6. Cinematic phone: the checks come after the story. With reduced motion the first screen has no primary button. Fix: under reduced motion, render `.lt-cta` right after the first stacked frame.
- 7. Classic white-card runs (services, included, steps). Towing's bottom bar says "Free estimate". Fix: use the trade's ask label, e.g. "Get help".
- 8 (new). Some tags repeat the card name: "Chain link" on Chain link, "Gates" on Gates, "Repair" on Fence repair. Fix: in `ltTag`, return "" when the tag is already in the name, and do not render an empty tag.
- 9 (new). The Cinematic pressure and hvac accent word is upright: the grotesk rule `h1 em,h2 em,... {font-style:normal}` is still in src/cine-look.js:187. That gives Cinematic line 3 a 4. Fix: drop that rule now that the display face is Fraunces, so the accent is the italic serif like the other trades.
- 10 (new). The Editorial 1280 silhouette is now about 320 px wide and the card reaches y 854 of 860, so the hero reads card-first. Line 1 stays at 4. Fix: about 64% silhouette width with the card from 44%, keeping coverage under 25%, or trim the card padding so it ends about 40 px above the fold.
**Not verified:** WebKit/iOS Safari, real devices, hosted admin, test-all at 61ffc58.
