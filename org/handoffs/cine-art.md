# Handoff: cine-art (Step 1b, Cinematic mode)
Model: opus (taste work: this is where the $10k look is won or lost). Repo: /home/user/agency (branch agency-work). Report to the chief of staff only.

Goal: set the cinematic look (type, color, layout rhythm, motion feel) and a Higgsfield picture kit for all 16 trades, so the CEO can make the pictures and the site looks worth $10k.

Read first: org/plan.md (Step 1b, Shared contract), org/inspiration/lynam_up-reels.md, org/inspiration/styles.md, sitemaker/src/trades.js (existing `prompt` per trade and copy rules), sitemaker/src/themes.js.

Files you own (only you edit these):
- sitemaker/src/cine-look.js (new): cineLook(theme) -> { css, fontsHref }, placeholderArt(trade, slotId, label)
- sitemaker/src/cine-kit.js (new): CINE_KIT for all 16 trades, per the contract
- org/art/direction.md (new): the look in one page, plus the study notes below
- org/art/higgsfield-kit.md (new): CEO-facing picture list per trade, 5th-grade words
Do not edit generate.js, maker-ui.*, trades.js, themes.js, tests (ask the owner).

Step A, study (both sources, ideas only):
- The fence reel notes (cream + full-bleed photo, serif headline with one italic accent word, glass cards, small accent button, calm premium feel).
- motionsites.ai public pages: look at its categories and styles for hero sections, animated backgrounds and 3D. Write in your own words what makes each one feel expensive and which could work for a contractor site in one file with no outside scripts (3D = CSS 3D/parallax/canvas ideas, no libraries). Do not copy their prompts, templates or code, do not sign up, buy, or accept Terms: if something needs that, stop and ask the chief of staff. If the site will not load, say so and work from the reel.
- Output: org/art/direction.md with a "Taken from the reel" and "Taken from motionsites.ai" list (ideas, not text), and what you rejected and why.

Step B, build:
- Look: one serif display font + one sans (Google Fonts only), cream light sections, the 4 existing themes mapped to the new look, accent used sparingly, contrast AA.
- Placeholder art: drawn in SVG, good-looking (it is judged), never photo-like, label always visible: "Sample picture: make in Higgsfield".
- Kit per trade: story (3-5 steps from one base picture edited step by step, same camera and light, e.g. fence: stakes, posts, rail, done; pressure washing: dirty to clean; roofing: old roof, tear-off, new), 2-4 style tabs, one before/after pair, estimator sizes/options (labels only, no prices). Every prompt: 16:9, no people, no faces, no text, no logos; before pictures show wear, not a fake "our job" claim.

Done (pass/fail): all 16 trades in CINE_KIT with every field filled; every prompt says no people and no text; no price, review count or claim in either file; direction.md has both study lists; higgsfield-kit.md lists each picture with its prompt and the slot it fills, and counts total pictures; placeholder art renders for every slot. Hand files to cine-engine for merge.

Depends on: nothing. Answers to: chief of staff. cine-engine depends on you.
CEO-only questions (via chief of staff): which 3 trades get real pictures first; stills only or also Higgsfield video; ok to view motionsites.ai paid tier (default: no).
End with a handoff of at most 10 lines: done, evidence, left, decision needed.
