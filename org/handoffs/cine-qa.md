# Handoff: cine-qa (Step 1b, Cinematic mode)
Model: sonnet. Repo: /home/user/agency (branch agency-work). Report to the chief of staff only.

Goal: a repeatable check and a review pack so org:qa-reviewer can judge "looks worth $10k" from screenshots plus recorded scroll frames, not from a feeling.

Read first: org/plan.md (Step 1b, criteria 1-7 and the Shared contract), org/inspiration/lynam_up-reels.md, sitemaker/test.mjs (reuse its browser setup and checks).

Files you own (only you edit these):
- sitemaker/test-cine.mjs (new): pass/fail checks for Step 1b criteria 1-5
- sitemaker/qa/capture.mjs (new): for a trade, widths 375 and 1280: full-page screenshot, 8+ frames across the scroll story, each tab, slider at 0/50/100, estimator with a typed price table; plus a reduced-motion run
- sitemaker/qa/RUBRIC.md (new): 7 lines scored 1-5 (first screen stops you; photos and motion feel premium; type and the one accent word; layout rhythm cream/photo; tools work and feel smooth; trust and call button always clear; phone feel), each with what a 3 and a 5 look like
- sitemaker/qa/out/ (generated pack: index.html contact sheet showing our frames beside the reel notes)
Do not edit sitemaker/src/*, test.mjs, build.mjs.

test-cine.mjs must check: 16 trades build in cinematic mode with no empty sections; no sideways scroll at 375/1280; tabs and slider work by keyboard and pointer; estimator hidden when prices blank and shows exactly the typed numbers when filled; no "$" in output unless typed; every empty slot shows the placeholder label; reduced motion has no running animation; file size with 12 x 1600px pictures under 6 MB; no outside scripts; scroll animations change only transform/opacity (no layout shift: CLS ~0).

Until cine-engine lands, write the checks against the contract and a tiny hand-made sample page; mark tests that need the real build as skipped, not passed.

Done (pass/fail): node sitemaker/test-cine.mjs runs and reports pass/fail per criterion; capture.mjs makes the full pack for fencing, roofing, pressure washing in one command; RUBRIC.md exists; a dry run on the merged build is handed to org:qa-reviewer. You do not grade the look yourself.

Depends on: cine-engine (build), cine-art (labels, slots). Answers to: chief of staff; send bugs to cine-engine via the chief of staff.
CEO-only questions: none.
End with a handoff of at most 10 lines: done, evidence, left, decision needed.
