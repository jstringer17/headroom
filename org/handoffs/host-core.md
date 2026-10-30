# Handoff: host-core (Hosted backend, Step 2)
Model: opus. Repo: /home/user/agency (branch agency-work). Report to the chief of staff only. Never spend, deploy, buy, or change anything live: build and test locally, then hand back.

Goal: one Cloudflare Worker that hosts every sold contractor site by domain, sends form leads to the owner, stores them, and gives each site SEO basics. Also the generator's "live mode" so a sold site has no sample bits.

Read first: org/plan.md section "Hosted backend" (the Shared contract is binding), sitemaker/src/generate.js (generateSite, normalize, esc, safeImage), sitemaker/src/cinematic.js and editorial.js (head + form + submit script), sitemaker/src/reviews.js, sitemaker/test-all.mjs.

Files you own (only you edit these):
- hosting/package.json, hosting/wrangler.toml, hosting/schema.sql, hosting/vitest.config.js
- hosting/src/index.js (router + cron), db.js, render.js (publishSite), notify.js (Resend email, Twilio SMS; no key = log only), leads.js (/api/lead), seo.js (sitemap.xml, robots.txt), media.js (serve R2 photos at /media/*), notactive.js
- hosting/scripts/new-site.mjs (form JSON -> D1 row, local), golive.mjs (DRY RUN by default: prints the Cloudflare API calls to attach the domain; `--apply` only after CEO ok), e2e-local.mjs
- hosting/GO-LIVE.md (runbook: buy/attach domain, DNS, Search Console verify by DNS TXT, submit sitemap, Turnstile site key, check list)
- hosting/test/core.test.js
- In sitemaker/src: generate.js, cinematic.js, editorial.js ONLY for live mode (form.live) and head tags; new sitemaker/test-live.mjs (add it to test-all.mjs steps).
Do not create or edit hosting/src/admin/*, reviews/*, billing/*, desk/* (other sessions). Mock them in your tests until they land; import them by the exact names in the contract.

Build:
1. Router per contract. Serve R2 `sites/<id>/index.html` by Host header lookup (domains table/column, cached in memory per isolate). Unknown host -> 404. status not live -> notactive page.
2. `publishSite(env, id)`: form_json + live block + reviews where show=1 -> generateSite -> sanity checks (no "Sample review", no "Sample picture", no "This is a sample site", size < 6 MB) -> write R2 only if checks pass; keep the previous file otherwise and log an event. Also writes sitemap.
3. `/api/lead`: POST JSON from the live form; Turnstile check, honeypot, 5 per IP per 10 min, max lengths; store in leads; email owner (plain, phone tap link, reply-to visitor email); SMS owner if notify_sms set; reply ok. Visitor sees "Thanks, we got it. We will call you soon."
4. Generator live mode: form posts with fetch to live.leadUrl + Turnstile widget; samples and placeholder labels never render; canonical, Open Graph, schema.org LocalBusiness/HomeAndConstructionBusiness JSON-LD (aggregateRating only from google source); privacy link in footer. Without form.live, output unchanged.
5. Cloudflare Web Analytics beacon only when live.analyticsToken is set (free, no cookies).

Done (pass/fail):
1. `cd hosting && npm install && npm test` passes; `node sitemaker/test-all.mjs` passes; `node sitemaker/test-live.mjs` passes (all 19 trades x 3 looks in live mode: no sample text, valid JSON-LD, form posts to leadUrl, no sideways scroll at 375).
2. Lead test: a posted lead lands in D1, one email is "sent" (captured mock) with name/phone/message; spam (honeypot, bad Turnstile, 6th in 10 min) is refused and not emailed.
3. Two sites on two hosts: each host gets only its own page; paused site shows notactive; unknown host 404.
4. Bad render keeps the old live file (test).
5. `node hosting/scripts/golive.mjs <id> --domain example.com` prints the plan and changes nothing.
6. e2e-local.mjs passes once the other two sessions have landed (run last; until then mark those steps SKIPPED, not passed).

Inputs: none to build. For the pilot later: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, RESEND_API_KEY, agency domain, Turnstile keys (CEO, see plan "Accounts").
Depends on: nothing to start. owner-admin and billing-desk depend on your db.js/render.js/notify.js/schema.sql: push those first. Answers to: chief of staff.
CEO-only questions: agency domain name; privacy page text; email-only or email + SMS at launch.
End with a handoff of at most 10 lines: done, evidence, left, decision needed.
