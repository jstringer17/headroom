# Inbox: messages for the chief of staff (newest first)
Staff sessions write here when send_message to the chief is refused (for example "elevated_session_untrusted_device").
The chief reads this file at every CEO message, acts, then moves handled entries under "## Done".

## 2026-11-03 owner preview (session_013FPdmwTwsMrzb1gHMwjoKy): DONE, ready for you to deploy and test live
- Head a456109 (code). Fresh clone of 53df1c6: hosting 105/105, sitemaker test-all 14/14 (new step test-share). Fresh clone of a456109 (only Sunday Agency host/name strings changed): hosting 106/106, test-share PASS. WebKit not installed: iOS Safari not run.
- Defaults per your messages: Sunday Agency name in banner; maker origin https://maker.sundayagency.workers.dev; backend/DEMO_HOST headroom-sites.sundayagency.workers.dev.
- Maker: "Share with the owner" next to Download. Backend address defaults to https://headroom-sites.sundayagency.workers.dev; agency key typed once, kept in localStorage only. Shows link + Copy + QR + expiry.
- Backend: hosting/src/demo.js. POST /api/demo (X-Agency-Key, constant-time; CORS = MAKER_ORIGINS; 30/h/IP; 12 MB body; pictures to R2, library by name) -> https://<DEMO_HOST>/d/<128-bit hex>, 14 days.
  /d/<token>: live render + banner "Sample website made for <Company> by <AGENCY_NAME, default Sunday Agency>. Like it? Call/text <AGENCY_PHONE>", noindex meta + X-Robots-Tag, no schema.org rating; form -> AGENCY_EMAIL "[demo]" (events table, kind demo_lead); expired/revoked -> "This sample has expired".
- Desk: "Sample links" (company, created, views, expires) with Open, Copy, Extend 7 days, Revoke, Turn into a real site (downloads form.json + copies the new-site.mjs command).
- Independent QA (Opus): criteria 1-3 PASS, no blocker/major. Fixed 4 minors (orphan R2 files, extend undid revoke, preview bots counted as views, no agency email). Left: body read before size check without content-length; pasted https picture links kept as given; @graph rating not walked (live mode has none).
- To go live (GO-LIVE.md A4): run schema.sql again (demo_links); secret AGENCY_KEY; vars AGENCY_PHONE, AGENCY_EMAIL (AGENCY_NAME already Sunday Agency); MAKER_ORIGINS already = the maker host; redeploy the maker (it has the new button); DEMO_HOST = headroom-sites.sundayagency.workers.dev (wrangler.toml has workers_dev = false: turn it on); add that host to Turnstile; deploy Worker + maker.
- Risk: DEMO_HOST takes over that whole host (only sample links are served there). Not tested live.

## 2026-11-03 polish round 4 (session_013FPdmxro5Sn2RKVFK4oLko): DONE, target met
- Head 8984f0e (site code; records after it). Lifetime SPEC + Kai Stone applied to all 3 looks via sitemaker/src/lifetime.js.
- Independent Opus QA (cold, 5 passes): Cinematic 4.71, Editorial 4.50, Classic 4.57; no line < 4; no blockers/majors.
- SPEC per item: Classic 20 DONE / 2 PARTLY, Cinematic 19/3, Editorial 20/2, 0 NOT DONE (table in polish-10k.md).
- Fresh clone of 8984f0e: test-all 13/13 OK (features 245/0, round2 738/0 incl. new R4 SPEC checks). WebKit/iOS Safari NOT verified.
- New: form in hero on desktop (all looks), 62px CTA + "or call", star row, 2-button phone bar, offer bar, logo upload, towns field,
  what's included / featured project / FAQ / service areas / call band / full footer; heavier H1 (Classic 900; Fraunces/Bodoni <=72/40).
- PARTLY (by choice): Kai section order (picker before services, no map); live form keeps Email (hosting accepts email-only leads).
- Left (minor): Cinematic phone checks sit after the story, reduced-motion phone first screen has no button; towing bar says "Free estimate".
- Lowest lines (4): photos/motion in all; tools in Editorial/Classic. Next round, if wanted: those.
- No follow-up handoff written; BATON row set to done.

## 2026-11-02 polish round 4 (session_013FPdmvdFwEUwCe9wgNc5SW): handoff written, NOT started
- This session is near its context limit, so per your rule I wrote org/handoffs/polish-round4.md and stopped.
- Start a fresh Opus session with "Run org/handoffs/polish-round4.md". State: 7f068a2 site code, scores 4.43/4.38/4.43, fresh-clone 13/13.
- The file has the code map, the reviewer's way to 4.5 per look, harness commands and done criteria.
- Updated 21:2x with your scope change: SPEC.md applied to all 3 looks first (+ kai-stone.md if it lands), reviewer checks SPEC items one by one.

## 2026-11-02 polish-10k round 3 builder (session_013FPdmvdFwEUwCe9wgNc5SW): floor MET, target not
- Head 7f068a2. Fresh-clone test-all 13/13 OK (features 245/245, live 866, round2 594/0). WebKit not installed: iOS Safari not run.
- Independent Opus qa-reviewer (cold, 4 passes): Cinematic 4.43, Editorial 4.38, Classic 4.43, no line < 4, no blockers/majors.
- All QA-of-3e475f5 items fixed; Classic rebuilt on the Lifetime pattern; promise headline for all 19 trades; one picker everywhere.
- 4.5 target not reached; next steps per look are in org/handoffs/polish-10k.md "Result, round 3". Screens: org/art/round3/.

## 2026-11-02 polish-10k round 2 builder (session_013FPdmvdFwEUwCe9wgNc5SW): DONE, needs qa-reviewer
- Head 00f42c1 on claude/inspiring-edison-6s7ude. Full test-all passes, all 13 steps (features 245/245, live 866, variants 748, round2 486/0). WebKit not installed here: SKIPPED, not run.
- Read impeccable (polish, critique) and ui-ux-pro-max (landing, ux) from the CEO's repos, as you asked; the rule behind each change is cited in the commit messages.
- E NOT met. My own scores (not independent): Cinematic 4.29, Editorial 4.25, Classic 3.71. Next: qa-reviewer re-scores.
- Details: org/handoffs/polish-10k.md (Result), TASKS.md T11, phone before/after sheets in org/art/round2/.

## Done
