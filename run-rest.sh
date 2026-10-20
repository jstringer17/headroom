#!/bin/sh
# Finish the first big run: check + score what we have, then search the cities not reached yet.
cd "$(dirname "$0")"
node src/check-sites.mjs && node src/score.mjs
for city in "Pleasanton, CA" "Livermore, CA" "Concord, CA" "Fremont, CA" "Martinez, CA" "Orinda, CA" "Lafayette, CA" "Alamo, CA" "Blackhawk, CA"; do
  for niche in "roofer" "HVAC contractor" "plumber" "electrician"; do
    node src/scrape.mjs "$niche" "$city" || exit 1
  done
  node src/check-sites.mjs && node src/score.mjs
done
echo ALL DONE
