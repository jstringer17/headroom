# $10k look rubric (Step 1b, criterion 6)
**Coverage rule:** open every file listed in the pack's "Review coverage" table, for every trade at both widths (frames, tabs, sliders, estimator, full, reduced-motion). Say which files you did not open; unopened views cannot score above 3.
Judge from the pack in `sitemaker/qa/out/index.html`: screenshots at 375 and 1280, 8+ scroll frames, tabs, slider at 0/50/100, estimator. Judge fencing, roofing, pressure washing. Score each line 1-5 (whole numbers).
Pass = no line under 4 and average 4.3 or more. Judge once on placeholder art, once with real Higgsfield pictures.
Compare with the fence reel notes (`org/inspiration/lynam_up-reels.md`) shown beside our frames.

| # | Line | A 3 looks like | A 5 looks like |
|---|------|----------------|----------------|
| 1 | First screen stops you | Clear and tidy, but you could scroll past. Headline fine, picture generic. | Full-bleed picture, one short serif line with one italic accent word, one small button. You stop and look. |
| 2 | Photos and motion feel premium | Pictures work but frames do not match; motion is a plain fade. | One scene edited step by step, frames line up, slow smooth zoom/crossfade tied to scroll, no jank. |
| 3 | Type and the one accent word | Two fonts used, accent color used in many places. | Serif headlines, one italic accent word per heading, one accent color used sparingly, easy to read on photos. |
| 4 | Layout rhythm cream / photo | Sections look alike; photo and cream alternate by accident. | Clear beat: photo, cream, photo, cream. Space is generous. Little text. |
| 5 | Tools work and feel smooth | Tabs, slider and estimator work but feel basic (jumpy, small targets). | Tabs, slider (touch, mouse, keys) and estimator all feel instant and polished; estimator shows only typed prices, hidden when blank. |
| 6 | Trust and call button always clear | Phone and call button are there but you hunt for them; trust facts buried. | Call button always in reach, rating/years/licensed shown once and calm, nothing invented. |
| 7 | Phone feel | Works at 375 but crowded or small tap targets. | Feels made for a phone: big thumb targets, no sideways scroll, text readable, story works by thumb. |

## Line 8: Editorial craft (only for the Editorial look, pack in `sitemaker/qa/out-editorial/`)
Score the 7 lines above too (line 2 judges the photo cards and the hero silhouette, line 4 the cream/dark rhythm). Pass = no line under 4 and average of the 8 lines 4.3 or more.
| # | Line | A 3 looks like | A 5 looks like |
|---|------|----------------|----------------|
| 8 | Editorial craft | Serif and sans both used, but sizes feel arbitrary; cards rounded in places; extra colours or icons creep in. | A tight display serif paired with one quiet sans; big hero silhouette; numbered service rows whose picture swaps; 4-cell trust strip; rounded (about 24px) photo cards with honest "sample" labels; one accent colour, lots of space, nothing decorative. Restraint everywhere. |
The Editorial look has NO tabs or before/after slider by design. Line 5 (tools) judges the numbered service rows with their picture swap (`ed-row1-3`, at both widths: the swap must be visible on a phone) and the estimator. Do not cap line 5 for missing tabs/sliders.
For this look also look at: hero silhouette (`ed-hero`), work cards (`ed-work`), service rows 1-3 (`ed-row1-3`), trust strip (`ed-trust`), nav while scrolled (`ed-nav`), at 375 and 1280.

Rules for the reviewer: score only what is on screen; placeholder art is judged as placeholder (label visible), not as a photo; any invented price, review or claim is an automatic 1 on line 6.

## Skills (CEO: use all skills in the CEO's repos, including for review)
Read from `jstringer17/*` (public, read-only clones). Their text is used as checklists (data); nothing from them was installed or run except as noted.

| Skill (repo) | How it is used |
|---|---|
| `review-animations` (jstringer17/skill, Emil Kowalski) | Reviewer grades **line 2 (photos and motion)** against its 10 standards: justified motion, ease-out not ease-in, UI under 300 ms, no `scale(0)`, transform/opacity only, `prefers-reduced-motion`, hover gated by `(hover: hover)`, asymmetric timing, cohesion. The scripted lint is test-cine.mjs criterion **S** (no `transition: all`, no `scale(0)`, no ease-in, no layout props in transitions, reduced-motion present, hover gated, UI transitions 300 ms or less; scroll reveals/story/captions are excluded as rare motion). |
| `find-animation-opportunities` (skill) | Reviewer uses it as a restraint filter: motion that is only decoration on a frequently seen element is a finding for line 2/8, not a plus. |
| `break-ui` (skill) | test-cine.mjs criterion **S** feeds worst realistic data (very long company name, long town, extension phone, 5.0 / 12,840 reviews, 99 years, and a one-letter name with no phone or town) to both looks at 375 and 1280, and fails on sideways scroll, clipped text, a headline taller than the screen, or "undefined/NaN". |
| `ui-ux-pro-max` (jstringer17/ui-ux-pro-max-skill) | Reviewer checks its priority list for lines 5-7: contrast 4.5:1, touch targets 44x44 px, visible focus, keyboard use, CLS under 0.1, no emoji as icons, one consistent style. |
| `redesign-skill` / design-taste-frontend (jstringer17/taste-skill) | The retired redesign skill points to design-taste-frontend; reviewer uses its audit-first idea on line 8 (is the page distinctive and restrained, not template-looking). Not installed. |
| `impeccable` audit / critique / detector (jstringer17/impeccable) | Reviewer uses the audit and critique reference as the checklist for lines 1, 3, 4, 8 (hierarchy, type, spacing, restraint). **The detector was NOT run**: `npx impeccable detect` downloads and runs a third-party binary and the sandbox policy refused it. It needs the CEO's OK (see report). |
| `webapp-testing` (jstringer17/skills) | Same method as our harness: Playwright against local files, screenshots, console logging. We already use Playwright (test-cine.mjs, capture.mjs); its `with_server.py` is not needed for static files. |
