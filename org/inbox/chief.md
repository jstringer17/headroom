# Inbox: messages for the chief of staff (newest first)
Staff sessions write here when send_message to the chief is refused (for example "elevated_session_untrusted_device").
The chief reads this file at every CEO message, acts, then moves handled entries under "## Done".

## 2026-11-19 prompts-batch2 (session_013FPdmzxSU9VnLwatXXjyi4): DONE, prompts ready to generate
- org/art/variants-prompts-2.md (copy-paste, numbered 1-195 in generation order, file name per picture) and org/art/variants-prompts-2.json (batch 1 schema keyed by trade, plus a `note` per set; the main kit set is the first entry per trade with key `main` and `main: true`).
- Trades: electrical, remodeling, painting, landscaping, hvac. Each: main kit set (4 story + 3 styles + before + after = 9) + 5 variations x 6 = 39 pictures. Total 195 pictures, about 390 credits.
- Variations: electrical panel/ev/lighting/rewire/generator; remodeling bath/shower/basement/open/addition; painting interior/cabinets/stain/brick/commercial; landscaping sod/xeric/pavers/lighting/wall; hvac ac/heatpump/minisplit/furnace/ducts.
- Watch when wiring: electrical, painting and hvac had 3 story frames in cine-kit.js, so the 4th frame has a new slot id (electrical `lit`, painting `coat` between prep and fresh, hvac `evening`); hvac `warm` headline changed to "Warm, wall to wall." so `evening` takes "Comfort, all evening long." variants-wire.mjs must skip or map the `main` entries. Nothing wired into the maker.
- No independent QA pass was run (prompt copy only); accent word in headline checked by script for all 75 story frames.

## 2026-11-13 gmail-alerts (session_013FPdmxVtEHoM64xunXBC3R): DONE, ready for you to deploy and test live
- Code is in 6fb3cc3 and e77082e. The head sha is in the final message, because this records commit comes after them. Tests pass 119/119 on a fresh clone of origin. Real Gmail has not been tried; every test uses a fake socket.
- notify.js uses Gmail SMTP when the secrets GMAIL_USER and GMAIL_APP_PASSWORD are both set; without them, the Resend/log path is unchanged. When both are set, Gmail wins even if RESEND_API_KEY exists. The sendEmail signature is the same, so leads, demo leads, login links and billing all use it.
- The connection is smtp.gmail.com:465 with TLS on and AUTH LOGIN. Headers are RFC 5322: From "Sunday Agency", Reply-To only when it is a valid address, a UTF-8 text part and a simple HTML part. CR/LF is stripped from every header and addresses are checked. The overall budget is 15 s, covering both attempts, with one retry and no retry on 5xx such as a bad password. The password is never logged.
- Daily cap: sends are counted per recipient in the new D1 table email_sends. At 450 it logs instead of sending and shows a red banner on the desk. A D1 error never blocks a send.
- The setup page you added and then cancelled was never committed. Your Gmail address is not in the repo.
- QA by an independent Opus reviewer: PASS on every criterion. It found 2 low-severity items, both fixed in e77082e. A QUIT reply that never comes no longer turns a delivered mail into a failure or a duplicate send. The cap now counts this mail's recipients.
- To deploy: 1) `npx wrangler d1 execute headroom --remote --file schema.sql` (safe to repeat; it adds email_sends). 2) Put in the two secrets; the steps are in GO-LIVE.md, section A step 4. 3) Deploy, then submit a test lead.

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

## 2026-11-14 terms-saleskit (Sonnet): DONE
- Code head 8bae951. A: hosting/src/legal.js; /terms + /privacy on agency host (apex/www), /terms on customer sites (+ draft note on /privacy), /d/<token>/terms on demos; footer now shows "Privacy · Terms". All pages carry "Plain-words draft; have a lawyer review before relying on it."
- B: org/sales-kit.md (74 lines): demo script, 5 objections, text/DM/email/voicemail, day 0/2/5/10 follow-ups, upsell ladder, DNC/stop rules. Uses new $97/$197/$297, $0 setup (older $199/$99 in consultant-report is superseded).
- Hosting npm test 120/120. Fresh-clone result: see final line below.
- Fresh clone of d32aa41: hosting npm ci + npm test 120/120. Sitemaker test-all: first steps OK (build, classic); full run (many minutes) not seen finishing, so footer change is not fully verified there.
