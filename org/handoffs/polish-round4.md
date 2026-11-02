# Handoff: polish round 4, every look to 4.5 (Opus builder)
Model: opus. Branch claude/inspiring-edison-6s7ude. Start: `git pull origin claude/inspiring-edison-6s7ude`. Report: org/inbox/chief.md (10 lines, newest first) + push. Do not touch hosting/.
Why a new session: the round-2/3 builder session ran out of room (chief's rule: write this file and stop). Round 3 ended at 7f068a2 (site code), b55c0fb (records).

## SCOPE CHANGE (chief, 2 Nov 21:17, CEO): read this first
The CEO says round 3 did NOT take the Lifetime inspo (format, form placement, font sizes, call buttons, badges). Round 4 =
**org/inspiration/lifetime/SPEC.md (measured, with DO decisions) applied to ALL 3 looks**, plus the 4.5 target. Apply
org/inspiration/kai-stone.md too if it exists when you start (a research note may land). The independent Opus reviewer must
check the SPEC items ONE BY ONE with screenshots (give it SPEC.md and ask for a DONE / NOT DONE row per item, per look).
SPEC DO items, short: offer top bar; header logo slot (owner upload, text wordmark fallback), <=5 links, Call + Free estimate
buttons 48px; H1 Classic bold sans 900 ~56/34px, Cinematic/Editorial serif but heavier/shorter max ~72/40px, who+where+promise;
sub line + 3 check bullets from the credibility profile; FORM IN THE HERO on desktop in all looks (Cinematic: a right card over
the first story frame), phone: big button jumping to the form; one primary CTA >= 60px tall + "or call (xxx)" text link;
badge row under the hero (only owner-typed certifications; manufacturer logos only if the owner uploads them, else styled text);
phone bottom bar = 2 half buttons Call / Free estimate (today it is 3: Call, Text, Free estimate); sections: credentials,
services grid with tags, featured project (before/after + scope bullets), what's included, FAQ, service areas, final CTA band,
full footer. Each look keeps its personality (Cinematic scroll story under the hero, Editorial photo cards, Classic = Lifetime).
Note: Classic (src/classic.js) already has most of this; compare it to SPEC numbers (H1 is Archivo 800 46/66px today; primary
CTA 54px; phone bar 3 buttons) and close the gaps. Cinematic and Editorial need the most work (form in hero, header, CTA, badges,
sections). Keep the tests green and extend test-round2 with SPEC checks (form visible in the first desktop screen in all looks,
primary CTA >= 60px, phone bar 2 buttons, H1 sizes, <= 5 nav links).

Kai Stone note LANDED (21:20): org/inspiration/kai-stone.md. Apply its "Apply to our sites" items together with SPEC.md:
form in the hero to the right of the headline; phone number as a pill button in the header; star/badge row under the hero
button; 60px primary button; heavy sans H1 (~76px/900 on his site; Classic only); section order testimonials > work > trades >
3 steps > FAQ > closing CTA where it fits. Where SPEC and Kai Stone differ, the newer chief note wins (Kai Stone), ask the chief if unsure.

## Where it stands (read these, nothing else first)
- Scores, independent Opus qa-reviewer, cold, at 7f068a2: Cinematic 4.43, Editorial 4.38, Classic 4.43; no line < 4; no blockers/majors. Its last section in org/handoffs/polish-10k.md ("Independent QA of 7f068a2") lists the way to 4.5.
- Tests: fresh clone of 7f068a2, `node sitemaker/test-all.mjs` 13/13 OK (~35 min; run in background). WebKit is NOT installed (round2 prints SKIPPED). Never claim green without a fresh clone run.
- Rubric: sitemaker/qa/RUBRIC.md (lines 1-7, Editorial + line 8). Inspo: org/inspiration/lifetime/NOTES.md (+ jpgs), org/inspiration/northpeak-editorial.md, org/consultant-report.md, org/copy/headlines.md.
- Skills: not installed as Skill tools. Read them from the CEO's repos (public clone works): `git clone --depth 1 https://github.com/jstringer17/impeccable` (skill/reference/critique.md, polish.md, layout.md, animate.md) and `.../ui-ux-pro-max-skill` (`python3 src/ui-ux-pro-max/scripts/search.py "<q>" --domain landing|ux|style`). Cite the rule in commit messages.

## Code map (round 3)
- src/picker.js: the ONE picker for every look/trade (chips, big picture, Compare = the only slider, prev/next, swipe, Ask about this -> form job). pickerItems() (variations, one ticked = one item; no-variation trades = before/after chip + styles), pickerHead(), per-trade --fp-m framing + per-variation `own` map (metal/flat/slat).
- src/promise.js: promise H1 per trade (+ per variation for roofing/fencing/pressure). Cinematic frame 0 = promise over the FINISHED picture (src/cinematic.js ~585, `frames`). Editorial keeps its own headlines (cine-kit editorial lines).
- src/classic.js: Classic rebuilt on the Lifetime pattern (offer bar, hero with form on desktop, proof strip, service cards with clTag(), picker, phone photo band, featured project (desktop), owner card + reviews, steps (desktop), FAQ, call band, footer). CSS in CL_CSS at the bottom.
- src/cinematic.js: phone story layout in the `@media (max-width:759px)` block after `.frame img{...}` (picture on top, max-height 440px so <=1.5x upscale at DPR 3; headline above the buttons; one button on frame 1). CLS guard: `<head>` script sets `js cine-motion cine-wait`, headline revealed after its fonts load (max 900 ms).
- src/credibility.js (cred profile, badges, credTop, credLine, schema), src/actions.js (phone bar, keyboard hide, +N more proof, nearform, reveal-on-focus), src/variants.js (VARIANT_NOTES, kit.samePair default pairs).
- Harness: `node sitemaker/qa/round2-shots.mjs --out=DIR --looks=a,b --trades=a,b --widths=375,390,430,1280` (full library via Playwright route, full profile); `node sitemaker/qa/story-frames.mjs DIR roofing fencing pressure` (phone story, all 18 variations). Sheets: PIL in scratch; LOOK at them.
- Tests to keep green and extend: sitemaker/test-round2.mjs (A-F + R3 checks: promise H1, finished picture behind promise, Classic phone height <= 7400, header ellipsis, upscale <= 1.5x, one ticked variation, hvac one before/after, Ask-about-this job), test.mjs (Classic), test-buttons.mjs (48px + contrast), test-polish.mjs, test-cine.mjs (CLS < 0.02).

## Round 4 work (from the reviewer's "way to 4.5"; cleaner, not busier)
1. Cinematic (needs one more 5: line 7 or 4): phone frames keep ~40 px of empty dark between picture and headline and the bottom quarter is empty on 812 px phones. Pin the headline right under the picture (or let the picture grow up to the 1.5x cap and center the block), so the frame reads as one composition. Optional line 3: pressure theme mixes a sans display face with a serif italic accent (src/cine-look.js pressure look); use one family.
2. Editorial (line 1 or 5): phone first screen = headline + 2 buttons + trust line, silhouette mostly below the fold. One primary button on phones, silhouette higher/smaller so it shows in the first screen. Also the ~15 px pale-sky tip of the pressure silhouette apex (src/editorial.js `.ed-sil img[data-real]` object-position, or per-trade).
3. Classic (line 2 or 4): no photo motion (add a slow, reduced-motion-safe scale/parallax on the hero photo and band only, transform/opacity only, <= 1 effect); 4 of 6 fencing services still tagged "SERVICE" (src/classic.js clTag: add fence/gate/wood/vinyl/repair words or use the trade name); a long white-card run between the band and the picker on phones (tint one section or put the picker before services).
4. Carried over (minor, do if cheap): Cinematic last story frame crop/zoom jump; fencing-vinyl story subject small; no owner photo slot in Classic (could take the form's hero picture box? only if the owner gives one).
5. Every change: Playwright screenshots 375/390/430/1280 looked at; add a failing-first check in test-round2 where it is measurable; commit + push often.

## Done criteria
- Independent Opus qa-reviewer (spawn via Agent, subagent_type org:qa-reviewer, cold, no source edits, appends "### Independent QA of <sha>" to org/handoffs/polish-10k.md): every look >= 4.5 average, no line < 4 (aim: no line < 4.5 where possible). Never self-score as final.
- Fresh-clone `node sitemaker/test-all.mjs` 13/13 OK at the final sha. State WebKit not verified.
- Final report in org/inbox/chief.md (10 lines: sha, test counts, score table, what is left) + T11 row in org/TASKS.md.
