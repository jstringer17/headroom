# Handoff: open the 5 accounts (Claude in Chrome, on the CEO's laptop)
Model: whatever Claude in Chrome runs. Owner: the CEO signs in; you click. Email for every account: joshuastringer13@gmail.com (a Gmail connector can read codes, but ask the CEO to read any code that does not arrive).

Rules: one account at a time. STOP and wait for the CEO at every password, email code, card number, phone code, "I am human" check and terms checkbox: the CEO types or ticks those. Never buy anything without asking first and saying the price. Stripe stays in TEST mode (never click Activate/Go live). Never paste a key anywhere except the reply box described at the end. Keep a numbered tick list in your reply.

1. Cloudflare: dash.cloudflare.com/sign-up. After sign-in: My Profile > API Tokens > Create Token > template "Edit Cloudflare Workers" (Account Resources: the account; Zone Resources: All zones) > Create. Also open the account home and copy the Account ID (right sidebar).
2. Stripe: dashboard.stripe.com/register. Stay in Test mode (toggle top right). Developers > API keys: copy the "Secret key" (sk_test_...).
3. Resend: resend.com/signup (free plan). API Keys > Create API Key > "Sending access". Copy it (re_...).
4. Google Places: console.cloud.google.com > New project "sitemaker" > APIs & Services > Enable "Places API (New)" > Credentials > Create API key > Restrict key: API restrictions = Places API (New) only. Billing may ask for a card: CEO decides; a $200/month free credit usually covers it.
5. Agency web address: Cloudflare dashboard > Domain Registration > Register Domains. Search short agency-style names, show the CEO the top 3 with yearly price, buy ONLY after the CEO says which one and yes.

At the end reply to the CEO with one block listing: Cloudflare token, Account ID, Stripe test key, Resend key, Places key, domain name. Tell the CEO to paste that block to the chief of staff and then rotate the keys later.
