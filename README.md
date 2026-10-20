# Contractor Agency: Lead Finder

Finds contractors on Google Maps, checks their websites, scores them 0–100, and shows them in a dashboard you call from.

## Setup (once)

```bash
npm install
npx playwright install chromium   # skip if Chromium is already installed
```

## Use it

```bash
npm run dashboard        # open http://localhost:3000, click "Find leads"
```

Or from the command line:

```bash
npm run find                                   # every niche x city in src/config.mjs
node src/scrape.mjs "roofer" "Tucson, AZ"      # one search
node src/check-sites.mjs                       # check websites of new leads
node src/score.mjs                             # re-score and print the top 10
```

Leads are saved in `data/leads.json` (not committed).

## How scoring works

Up to 60 points for website problems, up to 40 for business signals.

| Signal | Points (before scaling) |
| --- | --- |
| No website | 45 |
| Facebook/Yelp page only, or broken/parked site | 40 |
| Not mobile-friendly | 15 |
| No https | 10 |
| No tap-to-call / no quote form | 8 each |
| Not updated in 3+ years | 7 |
| 5–25 Google reviews | 25 |
| 4.3★ or better | 10 |
| 150+ reviews (probably has an agency) | −10 |
| No phone number | score 0 |

Websites that block our checker show as "Check by hand" and get no website points.

## Review counts

Google Maps hides review counts from signed-out visitors, so the scraper can't read them. To fill them in, set `GOOGLE_PLACES_API_KEY` and run `node src/enrich-reviews.mjs` (uses Google's official Places API; there's a monthly free credit).

## Be gentle with Google

Searches pause between places and between searches. If Google starts showing a captcha, the scraper stops; wait an hour before running again. Edit search lists and pauses in `src/config.mjs`.
