# Launch checklist (sell ASAP). Owner = chief unless marked CEO.
| # | Step | Owner | Status |
|---|---|---|---|
| 1 | Sites at 4.5 (round 4: Lifetime + Kai Stone format) | Opus builder + QA | running |
| 2 | Offer: $0 setup, month to month, Starter $97 / Growth $197 / Pro $297 (DECISIONS) | done | Stripe test prices made (Starter/Growth/Pro) |
| 3 | Agency name + domain (~$10/yr, Cloudflare Registrar) | CEO picks name, one tap to buy | waiting on CEO |
| 4 | Email from the agency domain (Resend verify, DNS auto) | chief | after 3 |
| 5 | Desk login (Cloudflare Access) + webhook hostnames | chief | after 3 |
| 6 | Terms + privacy pages (plain words; lawyer glance advised) | chief | todo |
| 7 | Sales kit: demo script, DM/text/email templates, objection answers (org/consultant-report.md) + Lead Desk leads | chief | ready, refresh after 1 |
| 8 | First demo sites for 5 real local leads (sample only, never published as theirs) | chief | after 1 |
| 9 | Stripe live mode | CEO yes | after first yes from a customer |

| 10 | Owner sharing (14-day sample link, banner, views, demo leads to agency) | chief | LIVE on test hosts 2026-11-13, tested end to end |
| 11 | Gmail alerts: secrets GMAIL_USER/GMAIL_APP_PASSWORD set; REMIND CEO to rotate the app password (was pasted in chat) via setup link https://setup-9455ea.sundayagency.workers.dev/<token in chief scratchpad>, then delete setup-9455ea worker | chief | LIVE 2026-11-13: lead email sent from CEO Gmail as Sunday Agency, verified in inbox; rotation reminder still open |
| 12 | Demo links for 5 real no-website leads (14 days, created 2026-11-14): Golden Gates (fencing, Petaluma) /d/7e09418b70034c4173c3faddbcce33c5; Newton Construction (fencing, San Jose) /d/bab76f235412855f0ca8f1deb7965b71; Rescue Roofing Co (Daly City) /d/7a37fb437e84a6efe7510ebe4570ad48; Oates Roofing (Fremont, metal) /d/0e12e9c5fb74b4104e8a0fe0b47d1114; Legacy Roofing By Ken Garman (Santa Rosa, shake) /d/76777f87166fd4b92de91ec2db855265 (host headroom-sites.sundayagency.workers.dev). 5 earlier links without photos are unused (expire on their own). | chief | ready to call |
| 13 | Real spam check (Turnstile widget "Sunday Agency forms", managed) live; demo links re-made with it 2026-11-18: Golden Gates | /d/c391818b3cf0c5d59995d9f628ac425f ;Newton Construction | /d/b72a894e701bbfb45f1b66ecd3109673 ;Rescue Roofing Co | /d/3e1c67320bc28ec4793abf7d40ac6b51 ;Oates Roofing | /d/c3ab5df8d667fd1a79da46eb750f6b66 ;Legacy Roofing By Ken Garman | /d/dd9243a91073ac3136f195570bed0dae ; | chief | live; real-browser form test by CEO pending |
| 14 | Customer desk at https://desk.sundayagency.workers.dev (second Worker 'desk', same D1/R2, wrangler.desk.toml local), locked by Cloudflare Access app (team sundayagency), allowed: joshua.stringer13@gmail.com, stringerjosho@gmail.com; login via 'Cloudflare' button. Email-code login for partner needs token perm 'Access: Organizations, Identity Providers, and Groups Edit' | chief | live |
