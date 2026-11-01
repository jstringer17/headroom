# Handoff: billing-desk (Hosted backend, Step 2 + Step 3 hooks)
Model: sonnet. Repo: /home/user/agency (branch agency-work). Report to the chief of staff only. Never spend, charge, switch Stripe to live, deploy, or change anything live.

Goal: customers pay monthly by card through Stripe; failed payments get reminders; cancel or long non-payment turns the site off; the CEO has one Customer Desk page showing every customer, money and leads, with upsell hooks ready.

Read first: org/plan.md section "Hosted backend" (Shared contract is binding), src/server.mjs and public/index.html (the existing local Lead Desk: statuses, look), src/store.mjs (data/leads.json shape).

Files you own (only you edit these):
- hosting/src/billing/** (entry hosting/src/billing/index.js exports `stripeWebhook(request, env)`, `billingSweep(env)`, `checkoutLink(env, siteId)`, `portalLink(env, siteId)`)
- hosting/src/desk/** (entry exports `deskApp(request, env)`)
- hosting/scripts/import-lead.mjs (Lead Desk lead marked Won -> new site row prefilled: company, trade, city, phone, rating; dry run by default)
- hosting/test/billing.test.js, hosting/test/desk.test.js, hosting/test/fixtures/stripe-*.json
Use host-core's db.js, notify.js, render.js; mock them until they land. No Stripe SDK and no new npm packages: call the Stripe REST API with fetch and verify webhook signatures with Web Crypto (HMAC-SHA256, 5 min tolerance).

Build:
1. Billing: Stripe Checkout (mode subscription; price ids from vars STRIPE_PRICE_MONTHLY, STRIPE_PRICE_SETUP) with metadata.siteId; webhook handles checkout.session.completed (save customer/sub, status live, publishSite), invoice.paid (paid_through), invoice.payment_failed (email owner the portal link), customer.subscription.updated/deleted (past_due beyond grace or canceled/unpaid -> status off). Idempotent (event id stored in events). Customer portal link for card change and cancel. Grace days from var GRACE_DAYS (default 14). billingSweep turns off sites past paid_through + grace (backup if a webhook is missed).
2. Customer Desk at desk.<AGENCY_DOMAIN>: protected by Cloudflare Access (CEO + partner emails; free) AND a check of the Cf-Access-Jwt-Assertion header in code; table of customers (name, trade, domain link, status, plan, paid through, MRR, leads this month / last lead date, Google review status, last publish), filters, and buttons: copy checkout link, open portal, pause/resume (with confirm), open site, "send login link". Totals on top: live sites, MRR, failed payments, leads this month. Mobile friendly, same plain style as public/index.html.
3. Upsell hooks (no selling, just the plumbing): addons table + Stripe add-on prices by var (SMS alerts, SEO pack, ads management, monthly report); desk shows "ready for upsell" when a site is live 60+ days with 5+ leads; monthly lead report email to owner as an add-on (built, off by default).

Done (pass/fail):
1. `cd hosting && npm test` passes billing + desk suites.
2. Tests with signed fixture events: paid -> live; payment_failed -> owner email + still live in grace; deleted -> off and visitor sees not-active page; bad signature -> 400 and no change; same event twice -> handled once.
3. billingSweep test: site 15 days past paid_through with GRACE_DAYS 14 -> off; 13 days -> still live.
4. Desk test: request without a valid Access header -> 403; totals match fixture rows; screenshots at 375px and 1280px in hosting/test-shots/desk/, no sideways scroll.
5. import-lead.mjs on a sample data/leads.json row prints the site row it would make and writes nothing without --apply.

Inputs: none to build. Pilot later needs STRIPE_SECRET_KEY (test), STRIPE_WEBHOOK_SECRET, price ids, CEO + partner emails for Cloudflare Access (CEO, see plan "Accounts").
Depends on: host-core (db.js, notify.js, render.js, schema.sql, router). Answers to: chief of staff.
CEO-only questions: monthly price and setup fee; add-on prices; grace days (suggest 14); partner's email for the desk.
End with a handoff of at most 10 lines: done, evidence, left, decision needed.

## RESULT (2026-11-01, billing-desk lead)
Done: billing (Checkout, webhook, portal, grace sweep, add-ons, monthly report off by default), Customer Desk with Access JWT check, import-lead.mjs. Files only under hosting/ (billing, desk, scripts/import-lead.mjs, test/).
Evidence: `cd hosting && node --test test/*.test.js` = 22/22 pass (all 5 done-criteria); screenshots hosting/test-shots/desk/desk-375.png and desk-1280.png, no sideways scroll.
Left: host-core not landed, so db/notify/render are reached via hosting/src/billing/deps.js (own SQL on contract tables; lazy-imports ../notify.js, ../render.js). Visitor-sees-not-active test auto-runs once hosting/src/index.js exists. e2e-local not run.
Decision needed: (1) host-core package.json test script must be `node --test test/*.test.js` (tests use node:test + node:sqlite, not vitest; needs Node 22+). (2) CEO: monthly price + setup fee (vars MONTHLY_CENTS, STRIPE_PRICE_*), add-on prices, grace days (default 14), partner email (DESK_EMAILS). (3) Add vars CF_ACCESS_TEAM, CF_ACCESS_AUD to wrangler.toml. (4) owner-admin must read logins as sha256-hex token_hash, link /admin/login?token=, 15 min. (5) Webhook events.id = Stripe event id; publish events expected as kind 'publish*'.
