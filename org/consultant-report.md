# Consultant report: sample sites at a $10k bar (2026-11-02, branch claude/inspiring-edison-6s7ude @598e753)
How I judged them: I built maker.html (`build.mjs --lazy`), ran it from `python3 -m http.server`, made 9 sites (3 trades x Cinematic/Editorial/Classic, 4.9★/127 reviews/14 yrs/insured) and screenshotted each at 1280 and 375. The `impeccable` and `ui-ux-pro-max` skills are not installed here ("Unknown skill"), so I did the critique by hand. Copy is in org/copy/.

## 1. Design verdict
- **Editorial: 4.2/5.** This is the one that looks most like a $10k agency site: the house-shaped picture, serif type and before/after grid. Lead the demo with it.
- **Cinematic: 4.0/5.** Best "wow" (scroll story, drag slider), weakest at selling: the hero shows the problem, the page is long (13.5k px vs 9.6k), and proof comes late.
- **Classic: 3.6/5.** Clear and fast, but looks like a template. Offer it as the cheap/fast option, never as the demo.

Top 12 fixes, highest value first (file / section / rule):
1. **The hero sells the problem, not the result.** Cinematic opens on a worn roof with "Every roof shows its age." and no city or proof (`src/cine-kit.js:41,73,105` story frame 1; `src/cinematic.js:588-600`). Add a promise H1 plus a subline (trade + city + rating), keeping the story frames for scroll. *Rule: in 5 seconds a visitor needs what, where, why trust you, what next.* Copy: org/copy/headlines.md.
2. **No proof above the fold in any look.** Put a "★ 4.9 · 127 Google reviews" chip under the H1 (`cinematic.js:588`, `editorial.js:503`, Classic hero in `generate.js`). *Rule: proof sits next to the ask.*
3. **Reviews come too late** (about 85% of the way down). Cinematic: move the reviews block (`cinematic.js:683-700`) above Services and add one quote right after the trust strip. Editorial: move `editorial.js:618` up, before "Every kind of job". *Rule: trust order is promise → proof → work → process → ask.*
4. **Editorial "The work" shows half-built jobs** (bare fence posts) under 80px street names ("MAPLE LANE"), which bury the picture (`editorial.js:536-560`). Use the finished frame, cut titles to 32-40px, and add one result line from the owner's own data (job type + where). *Rule: show the outcome; the picture is the hero, not the label.*
5. **Phones get no sticky call bar** in Editorial or Cinematic, only a 44px icon in the header (`editorial.js:100`, `cinematic.js:140`). Add a bottom bar with "Call" + "Free estimate": 56px tall, safe-area aware, hidden over the form. *Rule: the thumb zone. Most home-service leads come from phones.*
6. **Editorial trust strip on phones** is 4 stacked cards, about 560px of scroll (`editorial.js:129-130`). Make it a 2x2 grid, icon + label, about 200px. *Rule: don't spend the first screens on filler.*
7. **The Cinematic scroll story is too long**: about 4 screens of runway per pinned beat (`.pin` `cinematic.js:161`, `.all-pin` `:225`, step math `:367`). Cut it to about 2.5 screens and let a flick skip it. *Rule: time to value. Skeptical buyers bail during long animations.*
8. **Classic hero at 1280x900:** the call button sits on the fold edge, half cut off (Classic hero in `generate.js`, 3-line display H1 + padding). Tighten the H1 size and gap so both CTAs show. *Rule: the main CTA is visible without scrolling.*
9. **Form friction** (`cinematic.js:703-709`, `editorial.js:631-637`): mark "Tell us about the job" as optional, keep name + phone + job (preselected), and rename the button "Send request" → "Get my free estimate". For pressure washing, add "Text us a photo" (sms:). *Rule: fewer required fields, a CTA that names the reward.*
10. **The Cinematic "Everything we do" opener is a near-white flat-roof picture** that reads as blank (`cinematic.js:626`). Start with the strongest variation (the picked one, or shingle/cedar/driveway). *Rule: every section's first frame has to earn the scroll.*
11. **Small trust type:** the Cinematic "At a glance" strip and kickers are 11-12px (`cinematic.js:601-606`). Raise them to 15-16px with icons. *Rule: body text at 16px or more; trust facts are content, not decoration.*
12. **Reviews stay honest:** keep the "Sample review" pill in demos. A live site with no pasted reviews hides the cards and shows only the rating linked to Google (`src/reviews.js`, live branch). *Rule: no invented reviews shown as real (CEO rule).*

## 2. Conversion
- **Hero promise:** result + place + proof + one action. Example: "A new roof, done right the first time." / "Roof repair and replacement in Tulsa. 4.9★ from 127 Google reviews." / [Call (918) 555-0142] [Get my free estimate].
- **CTAs:** one main action per screen. Phones: call. Desktop: the form. Same words everywhere ("Get my free estimate"). Never more than 2 buttons in a row.
- **Trust order:** rating chip (hero) → years/insured/free estimates strip → 1 quote → before/after → services → full reviews → 4 steps → form + phone.
- **Form:** 3 required fields max. The job is preselected by "Ask about this" (already built). The note under the button promises only what the owner ticked.
- **Mobile call button:** sticky bottom bar (fix 5), tel: links checked (already fixed), shown after the hero, hidden over the form.
- **Review placement:** 1 quote high, the full block before the form, the rating in the hero. Sample reviews are always labeled.
- **Copy:** org/copy/headlines.md has an H1, subline and offer line for roofing (6 variations + storm), fencing (6) and pressure washing (6), plus CTA labels. Offers by trade: roofing "Free roof check, written price before any work"; fencing "Free estimate, we mark the lines before we dig"; pressure "Free quote by text: send a photo, get a price".

## 3. Sales
**10-minute demo (on their phone, not your laptop):**
1. (1 min) "I already built yours." Text them the link while you sit together and let them open it.
2. (2 min) Thumb through: their name, city and phone; tap Call so their own phone rings.
3. (2 min) Drag the before/after slider, then tap "Ask about this" and show that the form picks the job.
4. (2 min) Show their Google rating up top. "Real reviews go here; we pull your Google ones."
5. (1 min) Switch looks/colors live in the maker. "Pick the one you like."
6. (2 min) Close: "$199 setup, $99 a month, live this week. Send me 10 job photos tonight." Take the card on the spot.

**Price and offer:**
- Core: $199 setup + $99/mo. Includes hosting, domain help, 2 small changes a month, and a monthly lead email.
- Annual: $990/yr, setup waived (2 months free).
- Founding offer for the first 10 per trade/city: setup waived if they sign within 7 days. A real deadline, not a fake one.
- Risk reversal: cancel any month, no contract; their domain stays theirs.

**Objections:**
- "I get work from word of mouth." → Referrals Google you first. This makes sure they find you, and not the other guy.
- "I already have a site / my nephew made one." → Open both on your phone side by side. Which one would you call?
- "$99 is a lot." → One extra roof, fence or wash a year pays for it many times over. Cancel any month.
- "I'm too busy." → That is the point. I need 10 photos and 10 minutes. I do the rest.
- "Facebook is enough." → Keep it. Google doesn't rank Facebook posts for "{trade} near me". The site and Google profile do that.
- "Send me info." → I'll text the link now. Can I call Thursday at 4 to hear what you'd change?

**Outreach:** text, DM, email and follow-ups are in org/copy/outreach.md. Send each a built sample link, follow up on day 3 and day 7, then stop.

**Upsell ladder (add one rung only after the lead email shows the site working):**
1. Google Business Profile setup + photo posts: $149 one-time, then $49/mo.
2. Review engine (text customers a review link after each job): $49/mo.
3. Local SEO (city/service pages, citations, monthly report): $299/mo. Extra service-area page: $49 each.
4. Google Local Services Ads / Search ads management: $299/mo + their ad spend. Call tracking is included.
5. Seasonal promo landing page (storm season, spring fence, summer wash): $99 each.
6. Monthly results report (calls, forms, top pages): free with tier 3 or higher. Its job is to sell the next rung.
