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
