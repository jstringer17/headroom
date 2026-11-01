# Go live: runbook

Every step that spends money or changes something live needs the CEO's ok first. Write it in org/DECISIONS.md.
The chief of staff runs these steps, not a workstream session.

## A. One time, for the whole agency

1. **Cloudflare account** (CEO): turn on Workers Paid ($5/mo). Turn on 2-factor. Make an API token with: Workers Scripts edit, Workers Routes edit, D1 edit, R2 edit, Zone DNS edit, Zone read, Turnstile edit, Account Analytics (Web Analytics) edit. Save it as `CLOUDFLARE_API_TOKEN`, plus `CLOUDFLARE_ACCOUNT_ID`.
2. **Agency domain** (CEO buys it in Cloudflare Registrar, about $10/yr). Put it in `hosting/wrangler.toml`: `AGENCY_DOMAIN`, `FROM_EMAIL`.
3. **Database and storage**, from `hosting/`:
   ```
   npx wrangler d1 create headroom          # copy database_id into wrangler.toml (also save it as D1_DATABASE_ID)
   npx wrangler d1 execute headroom --remote --file schema.sql
   npx wrangler r2 bucket create headroom-sites
   ```
   Turn on D1 Time Travel (on by default) and plan a weekly export to R2.
4. **Email**: Resend account (free up to 3,000 a month). Add the agency domain; Cloudflare fills the DNS. `npx wrangler secret put RESEND_API_KEY`.
5. **Spam check**: Cloudflare dashboard > Turnstile > Add widget, mode Managed, hostname = the agency domain for now (golive.mjs adds each customer domain). Site key goes in wrangler.toml `TURNSTILE_SITE_KEY`; `npx wrangler secret put TURNSTILE_SECRET`. Without the secret the form refuses every message (on purpose).
6. **Other secrets**: `SESSION_KEY` (random 32+ characters), `OPS_KEY` (random 32+ characters, used by golive.mjs to publish). Billing and owner-admin secrets: see their handoffs (STRIPE_*, GOOGLE_PLACES_API_KEY, CF_ACCESS_*).
7. **Text alerts** (only if the CEO wants them at launch): Twilio number + 10DLC sign-up (1-3 weeks). Secrets `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`. With no keys, texts are skipped and logged; email still goes.
8. **Privacy page**: the CEO approves the wording in `hosting/src/notactive.js` (`privacyPage`) before the first paying site.
9. **Deploy**: `cd hosting && npm test && node ../sitemaker/test-all.mjs && npx wrangler deploy`.

## A2. Billing and the Customer Desk (billing-desk). Do after A, before the first paying site

Replace `<agency>` with the agency domain. Do Stripe in TEST mode first (toggle top right in the Stripe dashboard). Switching Stripe to live needs the CEO's ok.

**Settings (non-secret, `wrangler.toml` [vars]; all are in the file already, empty until you fill them)**

| Var | What | Default if empty |
|---|---|---|
| `STRIPE_PRICE_MONTHLY` | price id of the monthly plan | checkout link fails with "STRIPE_PRICE_MONTHLY is not set" |
| `STRIPE_PRICE_SETUP` | price id of the one-time setup fee | no setup line on checkout |
| `STRIPE_PRICE_SMS` / `_SEO` / `_ADS` / `_REPORT` | price ids of the add-ons | that add-on link says "no price set" |
| `MONTHLY_CENTS`, `ADDON_CENTS_SMS/SEO/ADS/REPORT` | prices in cents, only for the desk MRR number | counted as 0 |
| `GRACE_DAYS` | days a site stays on after a failed payment | 14 |
| `MONTHLY_REPORT` | "1" sends the monthly lead report e-mail (add-on) | "0" off |
| `ADMIN_LOOK` | "on" lets owners change the look | off |
| `CF_ACCESS_TEAM`, `CF_ACCESS_AUD`, `DESK_EMAILS` | desk lock, see below | desk answers 403 to everyone |

Secrets: first run `npx wrangler login` once (browser opens, allow), then `npx wrangler secret put STRIPE_SECRET_KEY` and `npx wrangler secret put STRIPE_WEBHOOK_SECRET` (each asks you to paste the value). Same login is needed for step A3 and every `wrangler` command.

**1. Stripe products (dashboard > Product catalog > Add product)**
1. "Website hosting": Pricing = Recurring, Monthly, the monthly price. Save. Open it, copy the Price ID (`price_...`) into `STRIPE_PRICE_MONTHLY`.
2. "Setup fee": Pricing = One-off, the setup price. Copy its Price ID into `STRIPE_PRICE_SETUP`. (Skip if there is no setup fee.)
3. Add-ons (only the ones we sell): one Recurring Monthly product each; copy the Price ID into `STRIPE_PRICE_SMS` / `SEO` / `ADS` / `REPORT`.
4. Developers > API keys > Secret key (starts `sk_test_`) > Reveal > copy. `npx wrangler secret put STRIPE_SECRET_KEY`.
5. Settings (gear) > Billing > Customer portal > Activate. Turn on: Update payment methods, Cancel subscriptions (at end of billing period), Invoice history. Save.

**2. Attach the two hostnames to the Worker**
Cloudflare dashboard > Workers & Pages > `headroom-sites` > Settings > Domains & Routes > Add > Custom domain. Add `desk.<agency>`, then add `hooks.<agency>` the same way. (Certificate is automatic.)

**3. Lock the desk with Cloudflare Access (free)**
1. Dashboard left menu > Zero Trust. First time: pick a team name (this is `CF_ACCESS_TEAM`, the `<team>` in `<team>.cloudflareaccess.com`), choose the Free plan, finish. (Card needed even for $0.)
2. Access > Applications > Add an application > Self-hosted.
3. Application name: `Customer Desk`. Session duration: 24 hours. Add public hostname: Subdomain `desk`, Domain `<agency>`, Path empty.
4. Add policy: name `CEO and partner`, Action = Allow, Include > Selector = Emails > type the CEO email and the partner email (press Enter after each). Save the policy, then Next > Save/Add application.
5. Open the new application > Overview (or Basic information) > copy **Application Audience (AUD) Tag**. Put it in `CF_ACCESS_AUD`.
6. `wrangler.toml`: `CF_ACCESS_TEAM = "<team>"`, `CF_ACCESS_AUD = "<tag>"`, `DESK_EMAILS = "ceo@...,partner@..."` (same two emails). `npx wrangler deploy`.
7. Check: open `https://desk.<agency>` in a private window. You get the Access login, type an allowed email, get a 6-digit code by email, and see the Customer Desk. An email not on the list gets no code. If you see "Forbidden" after logging in, one of the three vars is wrong (the desk checks the token itself and refuses on any mismatch).

**4. Stripe webhook (must NOT sit behind Access)**
We use `hooks.<agency>`, which has no Access app, so Stripe can reach it. Do not put the webhook on `desk.<agency>`: Access would block Stripe. (Alternative if ever needed: a second Access application for `desk.<agency>` with Path `api/stripe` and a policy with Action = Bypass, Include = Everyone. Not used.) The Worker answers `/api/stripe` on any attached hostname and checks Stripe's signature itself.
1. Stripe dashboard (test mode) > Developers > Webhooks > Add endpoint (newer dashboards: Add destination > Your account > Webhook endpoint).
2. Endpoint URL: `https://hooks.<agency>/api/stripe`. If the form asks for an **API version**, pick `2025-09-30.clover` (the version the Worker pins for its own Stripe calls; set var `STRIPE_API_VERSION` to change both together). The Worker reads both the old and the new (`basil` and later) invoice shapes, so an older endpoint version also works.
3. Select events (exactly these five): `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Add endpoint. Open it > Signing secret > Reveal (`whsec_...`). `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
5. Check: on the endpoint page press Send test webhook (any event). Delivery shows 200 with "ignored" (no matching site) or 400 if the secret is wrong.
6. No dashboard button? Stripe CLI fallback (install from stripe.com/docs/stripe-cli, then `stripe login`): `stripe listen --forward-to https://hooks.<agency>/api/stripe` prints a temporary `whsec_...` (use it only while testing; it replaces the dashboard one for that run), and `stripe trigger invoice.paid` sends a sample. Samples belong to a fake customer, so the Worker answers 200 `ignored: no matching site`. That proves the signature and route; the full test is the real test checkout in the pilot list below. Local (`npx wrangler dev`): forward to `http://localhost:8787/api/stripe` and set `STRIPE_WEBHOOK_SECRET` in `.dev.vars`.
7. **Going live later (CEO ok first):** switch the Stripe dashboard to live mode and repeat steps 1 and 4 there. Live mode has its own secret key (`sk_live_`), its own price ids (recreate the products), its own portal settings, its own webhook endpoint and a DIFFERENT `whsec_`. Update `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and every `STRIPE_PRICE_*` var, then `npx wrangler deploy`.
8. Test card for the pilot: 4242 4242 4242 4242, any future date, any CVC. A failing renewal: 4000 0000 0000 0341.

**5. Pilot check list**
- [ ] Desk > "Checkout link" on a draft site, open it, pay with the test card: the site goes live, the desk shows live with Paid through ~1 month out.
- [ ] Stripe > Customers > the customer > Cancel subscription (immediately): the site shows "This site is not active" within about 5 seconds.
- [ ] Desk "Send login link": the owner e-mail arrives and the link opens the editor.

## B. Each new customer site

1. **Make the row** from the maker form (the form JSON the maker exports):
   `node hosting/scripts/new-site.mjs form.json --domain theirsite.com --owner-email owner@theirsite.com --owner-name "Name" [--place-id ChIJ...]`
   It writes SQL and pulls uploaded pictures into files. Run the printed commands with `--remote` instead of `--local`.
2. **Domain**: buy it in Cloudflare Registrar (about $10.44/yr for .com, at cost) in the agency account. Customer owns it; we hand it over if they leave (CEO to confirm). If the domain is somewhere else, golive.mjs adds the zone and prints 2 nameservers to set at their registrar.
   If the domain already has an A/AAAA/CNAME record on the bare name or www (old website), delete it first or the Custom Domain step fails.
3. **Look at the plan** (changes nothing): `node hosting/scripts/golive.mjs <siteId> --domain theirsite.com --gsc <token>`
   Get `<token>`: Search Console > Add property > Domain > theirsite.com > copy the TXT value after `google-site-verification=`.
4. **Do it** (after CEO ok): same command plus `--apply`, with `CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID D1_DATABASE_ID TURNSTILE_SITE_KEY OPS_KEY` set. It: finds/adds the zone, points the bare domain and www at the Worker (certificate is automatic), adds the Search Console TXT record, allows the domain in Turnstile, adds Web Analytics and saves its token, sets the site live, and publishes the page.
5. **Search Console**: press Verify (DNS can take a few minutes). Then Sitemaps > submit `https://theirsite.com/sitemap.xml`.
6. **Check list** (all must be yes):
   - [ ] `https://theirsite.com` and `https://www.theirsite.com` show the site with a padlock.
   - [ ] No "Sample" anywhere on the page; phone number taps to call.
   - [ ] Send a test form from a phone: the owner gets the email within a minute; the visitor sees "Thanks, we got it. We will call you soon."
   - [ ] `https://theirsite.com/robots.txt` lists the sitemap; `/sitemap.xml` shows the home page.
   - [ ] Search Console says Verified and the sitemap is Success.
   - [ ] Paste the address into https://search.google.com/test/rich-results: the LocalBusiness item has no errors.
   - [ ] Cloudflare Web Analytics shows the visit (next day is fine).
   - [ ] Desk shows the site as live.

## C. If something goes wrong

- A publish that fails a check (sample text, too big, no phone, no working form) is refused and the old page stays up. See `events` rows with kind `publish_blocked`.
- Site off fast: set status `paused` (desk Pause button, or `UPDATE sites SET status='paused' WHERE id=?`). Visitors see "This site is not active". Nothing is deleted.
- Lead emails not arriving: check `events` kind `lead_email_failed`, then the Resend dashboard. Leads are always stored in D1 first.
