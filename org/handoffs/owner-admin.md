# Handoff: owner-admin (Hosted backend, Step 2)
Model: sonnet. Repo: /home/user/agency (branch agency-work). Report to the chief of staff only. Never spend, deploy, or change anything live.

Goal: a non-technical contractor opens <their-domain>/admin on a phone, logs in with a link sent to their email, changes text, phone, services, prices, reviews and photos, sees a preview, and taps Publish. Real Google reviews show on the site, with a manual fallback.

Read first: org/plan.md section "Hosted backend" (Shared contract is binding), sitemaker/src/generate.js (normalize: which form fields exist), sitemaker/src/trades.js (services per trade), sitemaker/src/cinematic.js (form.cine.prices, form.cine.images, unit), sitemaker/src/reviews.js, sitemaker/src/maker-ui.js (how the maker edits the same form; reuse ideas, not the file).

Files you own (only you edit these):
- hosting/src/admin/** (entry hosting/src/admin/index.js exports `adminApp(request, env, ctx)`; HTML pages built as strings, one small inline script, no framework, no outside scripts)
- hosting/src/reviews/** (entry exports `refreshReviews(env)` and `findPlace(env, name, city)`)
- hosting/test/admin.test.js, hosting/test/reviews.test.js, hosting/test/fixtures/places-*.json
Use host-core's db.js, render.js (publishSite), notify.js (sendEmail); until they land, mock them in tests with the contract's names. No new npm packages (ask the chief of staff if one is truly needed).

Build:
1. Login: owner types email -> if it matches sites.owner_email for this host, email a one-time link (15 min, single use, token stored hashed in logins) -> HttpOnly Secure SameSite=Lax cookie signed with SESSION_KEY, 30 days. No passwords. Rate limit 5 links/hour. Every admin call checks the session's site_id equals the host's site.
2. Editor (mobile first, big fields, plain words): business name, phone, city/area, years, short texts, services on/off, prices low/high per row with unit, emergency/free estimate/insured toggles, look and color, reviews (Google ones show on/off; add own review text from a real customer), photos per picture spot (shrink in browser to 1600px JPEG, under 2 MB, upload to R2 `media/<siteId>/...`, saved as https URL). Autosave draft; "Preview" renders the draft; "Publish" calls publishSite. "Undo last publish" keeps one previous version.
3. Google reviews: owner or CEO links the Google listing once (findPlace by name + city, pick from list -> place_id). Daily cron refreshes each live site at most once a week (Places API New, Place Details, fields rating, userRatingCount, reviews; field mask to keep cost down). Store with source=google; show Google credit and link; never edit Google text; keep max 5; drop rows older than 30 days if not refreshed. No key or API error -> keep last good data, else manual reviews only. Rating/count shown on the site come only from Google data.
4. "Ask for a review" button: copyable text + the Google review link (https://search.google.com/local/writereview?placeid=<id>) and a QR code drawn in code.

Done (pass/fail):
1. `cd hosting && npm test` passes admin + reviews suites.
2. Test: owner of site A cannot read, preview, upload to, or publish site B (each route tested); expired/used link refused.
3. Test: phone change + publish -> published HTML has the new phone and tel: link; HTML in a text field shows as text (escaped).
4. Test: Places fixture -> reviews stored, Google credit shown, rating in JSON-LD; API error keeps old reviews; no key -> no call made.
5. Screenshots of every admin screen at 375px and 1280px in hosting/test-shots/admin/, no sideways scroll; handed to org:qa-reviewer (bar: change phone and one price in under 2 minutes, no help).
6. One-week call budget: test shows refreshReviews skips sites fetched under 7 days ago.

Inputs: none to build (Places fixture is a hand-made JSON in the documented shape). Live check later needs GOOGLE_PLACES_API_KEY (CEO task T3).
Depends on: host-core (db.js, render.js, notify.js, schema.sql, router mounting /admin). Answers to: chief of staff; bugs in shared files go to host-core via the chief of staff.
CEO-only questions: may owners change the look and colors themselves, or only text/phone/prices/photos/reviews (suggest: yes to colors, look change by request)?
End with a handoff of at most 10 lines: done, evidence, left, decision needed.
