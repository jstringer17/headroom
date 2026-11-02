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
