# Handoff: cine-engine (Step 1b, Cinematic mode)
Model: sonnet. Repo: /home/user/agency (branch agency-work). Report to the chief of staff only.

Goal: add a "Cinematic" switch to the Sample Site Maker that builds a scroll-story site with 3 interactive tools, in the same one-file format (form, live preview, download).

Read first: org/plan.md (Step 1 and "Step 1b: Cinematic mode", incl. the Shared contract), org/inspiration/lynam_up-reels.md, sitemaker/src/generate.js, sitemaker/src/maker-ui.html, sitemaker/src/maker-ui.js, sitemaker/build.mjs, sitemaker/test.mjs.

Files you own (only you edit these):
- sitemaker/src/cinematic.js (new: section HTML, scroll engine and module JS/CSS behavior)
- sitemaker/src/generate.js (wire `form.cinematic`; classic output must stay byte-identical)
- sitemaker/src/maker-ui.html, sitemaker/src/maker-ui.js (switch, picture slot per kit slot, price table inputs)
- sitemaker/build.mjs, sitemaker/maker.html (generated)
Do not edit: cine-kit.js, cine-look.js, themes.js, trades.js (ask cine-art), test.mjs, test-cine.mjs, sitemaker/qa/ (cine-qa).

Inputs: the contract in plan.md. Until cine-art delivers, use a stub kit/look inside your own scratch test only, not in their file names. At merge, add src/cine-look.js and src/cine-kit.js to build.mjs's file list.

Build:
1. Scroll story hero: sticky full-bleed frame stack, crossfade + slow zoom tied to scroll, one headline per step (serif, one italic accent word). IntersectionObserver/rAF, transform and opacity only, no scroll-jacking, no outside scripts or libraries.
2. Style tabs over a photo with a glass card (real buttons, arrow keys, aria-selected).
3. Before/after slider (pointer + touch + keyboard, role="slider", aria-valuenow).
4. Price estimator from typed ranges only; pick size and option, show "$low to $high". Any blank cell = that choice not offered; all blank = section hidden. Never compute or invent a number.
5. prefers-reduced-motion: no motion, story shows as stacked frames.
6. Pictures: each slot takes upload (shrink to 1600px JPEG like the hero today) or https; empty slot uses placeholderArt with its label.

Done (pass/fail): plan.md Step 1b criteria 1-5 pass on your side (cine-qa's test-cine.mjs is the check for 1-4; you run it after merge); node sitemaker/build.mjs && node sitemaker/test.mjs still pass; classic output unchanged for all 16 trades (diff before/after). Do not publish the artifact: hand back the built maker.html path.

Depends on: cine-art (kit + look files, contract owner). Answers to: chief of staff; cine-qa reports bugs to you.
CEO-only questions: none for you; route any through the chief of staff.
End with a handoff of at most 10 lines: done, evidence, left, decision needed.

## Status (cine-engine, 2026-10-21)
Done: sitemaker/src/cinematic.js (story, tabs, slider, estimator, reduced motion, slots); generate.js wired (`form.cinematic`, `useCine`); maker form (switch, picture slot per kit slot, price table); build.mjs adds cine files when present. Classic output identical for 16 trades; build + test.mjs pass. Checked with a stub kit in scratch at 375 and 1280: no sideways scroll, tabs/slider/estimator work, reduced motion stacks the frames.
Left at merge (cine-art not delivered; files absent here): add src/cine-kit.js and src/cine-look.js, rebuild (build.mjs then calls useCine itself), run test-cine.mjs. For ESM tests add `import * as K` + `useCine` call, or import both in generate.js.
Assumptions to confirm with cine-art: slotId = story step id, style id, "before", "after"; estimator may add optional `sizeLabel`/`optionLabel`; cineLook.css loads after engine CSS so it can override tokens.
Update: estimator unit is a per-trade setting (form.cine.unit; defaults roofing sq ft, fencing linear foot, pressure sq ft, HVAC job, restoration job, builder and framing sq ft; form select switches job / sq ft / linear foot / hour). New trade keys assumed: restoration, homebuilder, framing. plan.md and test-cine.mjs not mine: chief of staff and cine-qa to update.
Decision needed: none.
