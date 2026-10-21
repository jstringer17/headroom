# Handoff: Lumova organic Higgsfield marketing

Written 2026-10-21. A new session should read this first.

## Goal
Organic-first marketing for five refill products on one Shopify store, using Higgsfield characters (2 women, 2 men) plus slideshows. Spend is Higgsfield time and credits. A small paid budget goes only behind proven winners.

## Store and products
Shopify: wrpnhp-8d.myshopify.com ("My Store", USD). All five are DRAFT, no photos, 0 inventory, so the store is not live and the Meta pixel is unverified.

| Product | Price | Landed cost | Breakeven CPA* |
| --- | --- | --- | --- |
| Hair-First Shower Filter | $44.99 kit, $19.99 refill 3-pack | $10.26 (CJ) | about $33 |
| Single-Blade Safety Razor | $44.99 | $12.15 (CJ) | about $31 |
| Star Blemish Patches | $16.99 / 240, $24.99 / 480 | unknown | unknown |
| Face & Brow Razors (40) | $27.99 | unknown | unknown |
| Hydrating Eye Patches (30 pairs) | $29.99 | unknown | unknown |

*Assumes 2.9% + $0.30 fees and that landed cost includes shipping. Supplier links are in the Shopify product admin and the user's last table. The CJ shower listing was confirmed by the user to include the showerhead, hose and adapter.

## Done
- Content pack, published: https://claude.ai/artifact/56dFeDu4tnUefLMJg4TbZU (source: scratchpad `content-pack.html`, lost with the session; the artifact is the copy). 19 slideshows, 12 Higgsfield video prompts, cast, claim rules, 5-day run plan. Built for Seedance 2.0 on the Higgsfield website.
- Research: Meta Ad Library scans (Oct 19), TikTok hashtag stats, Davie Fogarty's "I Helped a Complete Stranger Build an AI Ecom Store" transcript, the Sora Sundays reference video (@sundayshops).
- Higgsfield API project built at `/home/user/higgsfield-studio` (TypeScript, `@higgsfield/client`, Seedance 2.5 text-to-video). It lives only in the old cloud box and was never pushed. The test run failed with "Not enough credits".
- `org` plugin installed in the cloud box from `jstringer17/claude-org`.

## Not done
- No video or slideshow has been generated or posted.
- Supplier photos: CJ and AliExpress block the cloud browser. The user will upload 3-6 photos per product into Higgsfield by hand, or connect Claude in Chrome.
- Higgsfield API has no credits. The free Seedance week is on the website (Seedance 2.0), not the API.
- Studio Nine (partner's app, https://studio-nine-five.vercel.app/) is not hooked to Higgsfield. Needs its GitHub repo name and an API key with credit.
- Full swipe file (hook, angle, format, offer, CTA, length per ad) not built. One pattern has 3+ competitors: benefit checklist + money-back guarantee + BOGO (Eskiin, My Filterbaby, Muravai).

## Open decisions (ask the user)
1. Weekly budget ceiling.
2. Landed cost for patches, face razors, eye patches.
3. Organic first, or paid now? Recommendation: organic first, paid only on the shower filter and razor.
4. Competitors for patches, face razors, eye patches.
5. Brand name is "Lumova" in the drafts; confirm it is final.

## Rules to keep
- Label Higgsfield content as AI. No fake customer reviews; AI characters demo and explain only.
- Never claim "removes chlorine", percentages, "clears acne", "heals", "anti-wrinkle" or "gets rid of dark circles" without supplier lab proof.
- Paid test rules the user supplied (pre-launch fixes recommended): the $30-per-ad-set verdict is underpowered at about 2,000 impressions, so use 2 creatives plus a control per ad set and $30 per ad. Scale only at CPA at or below breakeven.
- Save no secrets here. The Higgsfield API key was pasted in chat on 2026-10-20 and should be rotated.

## Environment notes
- Network access was set to Full by the user, so TikTok and Meta Ad Library pages load in the cloud box. Supplier sites still block it.
- The user prefers very short answers and no code unless asked.
