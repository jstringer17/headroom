# Handoff: Contractor Website Agency

Written 2026-10-21. Owner: jstringer17. Style they want: plain words (5th-grade level), short answers.

Code: GitHub repo `jstringer17/headroom`, branch `claude/inspiring-edison-6s7ude` (its root is the lead-finder project; `org/HANDOFF.md` is this file). Attach that repo to the new session first.

## Goal

Sell monthly-subscription websites to contractors (roofing, HVAC, plumbing, electrical) that have no site or a bad one. Find leads, cold-call, book a 10-15 minute Zoom, show a pre-built sample site, close on the call. Automate everything except the calls and Zooms.

## What exists

| Thing | Where | State |
| --- | --- | --- |
| Strategy doc (video breakdowns, scripts, pricing, niches, numbers, 30-day plan, automation table) | https://claude.ai/code/artifact/569400fe-aba3-4d9e-bf76-5fb2c3eb531b | Done. 7 of 9 videos read from full transcripts. |
| Lead Desk CRM (hosted page, its own database) | https://claude.ai/artifact/1LHiAxi9qH3oJXEz8pe7ja | Live. 2,306 scored leads loaded. Private until shared. |
| Lead finder code | the repo above (`src/`, `public/`) | Works. Scrapes Google Maps, checks websites, scores 0-100. |

## Decisions already made

- **No Notion, no GitHub-based CRM.** The CRM is the Lead Desk artifact, using the artifact `db` capability. The user finds GitHub complicated.
- **Restaurants are out.** Contractors only.
- **Offer:** $0 setup, month-to-month. Starter $97, Growth $197 (the one to push), Pro $297. Upsells only after month 2.
- **Do not copy from Kai Stone's videos:** the made-up "Julie Becker" referral, review gating (hiding low stars), and mass cold texting without permission (TCPA).

## How the lead data flows

1. `node src/scrape.mjs "<niche>" "<City, ST>"` reads Google Maps in headless Chrome (works from the cloud container, no login). Pauses are built in; a captcha stops it.
2. `node src/check-sites.mjs` visits each site (HTTP, then a real browser tab if blocked). Bot-protected sites become "Check by hand."
3. `node src/score.mjs` writes score, reasons and website state.
4. Data lives in `data/leads.json`. It is **gitignored and lost when the container ends.** The durable copy is the Lead Desk database.

Config (niches, cities, pauses, skip list): `src/config.mjs`. `run-rest.sh` finished the first big run.

## How Lead Desk stores data

- `leads/c00..c23`: one doc each, `{items:[...100 leads], order}`. Short keys: `n` name, `c` category, `r` rating, `a` address, `p` phone, `w` website, `t` town, `s` state, `q` niche, `sc` score, `ws` website state, `why` reasons, `m` Maps URL.
- `crm/<place id>`: one doc per touched lead: `status`, `notes`, `followUp`, `plan`, `updatedAt`. Created on first edit.
- To reload leads: rebuild chunk files from `data/leads.json` (drop leads with no phone and non-contractor categories such as supply stores, auto shops, clubs), then write them with ArtifactData `batch` `set`, 12 per call, pinning `if_version` on existing docs.
- Page source: `public/` is the old local dashboard. The hosted page was published from a scratchpad file and is not in the repo; read it back with the Artifact tool `read` action if you need to edit it.

## Open items

1. **Share Lead Desk** with the partner as Editor (Share menu). Only the owner can open it now.
2. **GitHub repo:** the GitHub integration returned 403 on repo creation. The user can create `contractor-agency` themselves and connect it at https://claude.ai/connect-github. Until then the code is backed up on the branch above.
3. **Google Places API key** (user adds env var `GOOGLE_PLACES_API_KEY` in the environment settings; never paste it in chat). Then run `node src/enrich-reviews.mjs`. Maps hides review counts when signed out, so scores use star rating until then.
4. **Find leads button** is not in Lead Desk. New cities need a scrape run in a session, then a reload into the db.
5. **Sample-site maker** (next build): template per niche + a data file from a lead, preview on Cloudflare Pages. Higgsfield for hero images only, never fake work photos.
6. **Missing transcripts:** `XT_orwnK_wA` and `ROJuUm7F73Q` (Kai's $75K and $145K videos). YouTube blocked them.
7. Known data quirk: Maps sometimes gives a wrong category (a salon listed as Plumber). Spot-check before calling.
8. Not built yet from the strategy doc: Notion sync (declined), texting/reminder automation, billing, monthly client report.

## Gotchas

- YouTube blocks the cloud IP. `yt-dlp` with `--extractor-args "youtube:player_client=tv_embedded"` and `--write-auto-subs` worked intermittently after waiting; other clients fail.
- Google Search shows a captcha from the cloud. Google Maps does not.
- Long background jobs: use `setsid nohup`, not a plain background command (those hit a 2-hour cap).
- Push code with `git push backup main:claude/inspiring-edison-6s7ude` (the `backup` remote points at the headroom repo).
