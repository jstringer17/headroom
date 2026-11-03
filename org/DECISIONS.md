# Decisions (newest first)
- 2026-10-21 CEO says YES to publish the new maker to the existing private artifact link, AFTER the Editorial look is tailored closer to the Northpeak reference and passes qa. Who: CEO.
- 2026-10-21 Build in 3 steps: maker, go-live, upsells. Why: each works alone. Who: CEO.
- 2026-10-21 Step 1 default: download only, no auto-publish. Why: publishing/spend needs CEO ok. Who: chief of staff.
- 2026-10-21 Talk to CEO in plain, very short words. Who: CEO.
| 2026-11-02 | Chief started a Mac session to open accounts; cloud-staff messaging may be refused afterwards, so staff report through files (org/COMMS.md) | repo is the source of truth | chief |
| 2026-11-01 | Backend on one Cloudflare Worker + D1 + R2, Stripe test mode first, nothing live without CEO yes | cheap per customer (~$5/mo on $99) | CEO yes, planner |
| 2026-11-02 | Agency keeps the customer's web address; site stays on 14 days after a failed payment (GRACE_DAYS=14), then off | CEO answered | CEO |
| 2026-11-02 | Alerts: email at launch, text (Twilio 10DLC, 1-3 weeks approval) turned on when approved | CEO answered | CEO |
| 2026-11-02 | Chief of staff writes plain terms + privacy pages; a lawyer should glance before first paying customer | CEO ok | CEO |
| 2026-11-02 | Price: chief suggested $99/mo + $199 setup (waivable); CEO has not confirmed yet | open | chief |
| 2026-11-03 | Maker is shared from Cloudflare: https://sample-site-maker.headroom-sites-agency.workers.dev (free static Worker); public Claude link job cancelled | Claude public share blocked SVGs; hosting is free and works for the partner | CEO |
| 2026-11-03 | Agency name: Sunday Agency. Free hosts: maker https://maker.sundayagency.workers.dev, backend https://headroom-sites.sundayagency.workers.dev (old headroom-sites-agency hosts removed) | CEO named it; free workers.dev | CEO |
