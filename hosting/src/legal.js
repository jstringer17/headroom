// Plain-words Terms and Privacy. Two sets:
//  - agency pages (Sunday Agency's own terms for customers, and its privacy policy), served on the agency host
//  - site pages (what a visitor of a customer's site needs: terms of use and privacy)
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const DRAFT_NOTE = "Plain-words draft; have a lawyer review before relying on it.";

const shell = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>body{margin:0;font:18px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f4f0;color:#222}main{max-width:40rem;margin:0 auto;padding:24px}h1{font-size:30px;margin:0 0 8px}h2{font-size:21px;margin:28px 0 6px}a{color:#1d4f9c}.draft{background:#fff3cd;border:1px solid #e0c36a;padding:10px 14px;border-radius:8px;font-size:16px}</style>
</head><body><main>
<p class="draft">${DRAFT_NOTE}</p>
${body}
</main></body></html>
`;
const respond = (html) => new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600", "x-content-type-options": "nosniff" } });

const agencyName = (env) => esc((env && env.AGENCY_NAME) || "Sunday Agency");
const contactLine = (env) => {
  const phone = String((env && env.AGENCY_PHONE) || "").trim();
  const dom = String((env && env.AGENCY_DOMAIN) || "").trim();
  const bits = [];
  if (phone) bits.push(`call or text ${esc(phone)}`);
  if (dom) bits.push(`email hello@${esc(dom)}`);
  return bits.length ? bits.join(" or ") : "contact us using the details we gave you";
};

export function agencyTermsPage(env) {
  const a = agencyName(env);
  return respond(shell(`Terms of Service | ${a}`, `<h1>Terms of Service</h1>
<p>Last updated: November 2026. These are the rules between ${a} ("we", "us") and the business that signs up ("you"). We wrote them in plain words on purpose.</p>
<h2>What we do</h2>
<p>We build you a website and keep it online. We host it, collect the form leads, and email them to you. You get a business website, not a license to run your own hosting.</p>
<h2>Price</h2>
<ul><li>Starter: $97 a month</li><li>Growth: $197 a month</li><li>Pro: $297 a month</li></ul>
<p>There is no setup fee ($0). You pay month to month. The price you sign up at is the price we charge until we tell you of a change at least 30 days before it starts.</p>
<h2>Month to month, cancel any time</h2>
<p>There is no contract. You can cancel any time. Tell us (call, text or email) or use the cancel link in your billing email. Your plan runs to the end of the month you already paid for. We do not give refunds for part of a month.</p>
<h2>Your domain</h2>
<p>We register your domain name in our account so we can keep your site connected. If you cancel and ask, we will move the domain to you or point it where you say. Domain renewal costs are passed to you at cost. Give us a few business days to do the move.</p>
<h2>If a payment fails</h2>
<p>If your card fails, we will email and text you. If we cannot collect payment, your site turns off 14 days after the failed payment. Pay the balance and we turn it back on. Your pictures and text stay saved, so you do not lose your work.</p>
<h2>Leads</h2>
<p>When someone fills in the form on your site, we email it to the address you gave us. Make sure that address works. We do not promise a number of leads or any result in sales or Google rank. Nobody can promise that.</p>
<h2>Google reviews</h2>
<p>Reviews shown on your site come from Google, and we say so on the site. We never make up reviews or show reviews that are not real. You may not ask us to.</p>
<h2>What you promise</h2>
<ul><li>The words, pictures, license and insurance details you give us are true, and you have the right to use them.</li><li>You are properly licensed and insured where the law requires it.</li><li>You will not use the site to break the law or mislead people.</li></ul>
<h2>What we can turn off</h2>
<p>We can take down a site that breaks the law, is a scam, or hurts other people. If we do, we will tell you why.</p>
<h2>Limits</h2>
<p>We work hard to keep your site up, but we cannot promise it never goes down. Our total responsibility to you is limited to what you paid us in the last 3 months. We are not responsible for lost sales.</p>
<h2>Changes and questions</h2>
<p>If we change these terms, we will tell you before they apply. Questions? ${contactLine(env)}.</p>
<p>See also our <a href="/privacy">Privacy Policy</a>.</p>`));
}

export function agencyPrivacyPage(env) {
  const a = agencyName(env);
  return respond(shell(`Privacy Policy | ${a}`, `<h1>Privacy Policy</h1>
<p>Last updated: November 2026. This explains what ${a} does with information, in plain words.</p>
<h2>What we collect</h2>
<ul><li><b>From business owners:</b> your name, business name, business phone number, email, address, and what you tell us for your site (words and pictures).</li><li><b>Payments:</b> handled by Stripe. We never see or store your full card number.</li><li><b>From people who use a contact form on a site we host:</b> their name, phone number, email (if they give it) and their message.</li></ul>
<h2>How we use it</h2>
<p>We use it to build and run your site, send you the leads your site gets, bill you, and answer your questions. Form details go to the business that owns that site.</p>
<h2>We never sell your data</h2>
<p>We do not sell your information or your customers' information, and we do not share it for ads.</p>
<h2>Who helps us</h2>
<p>We use a few companies to run things: Cloudflare (hosting, spam checks, cookie-free visit counts), Stripe (payments), an email service (to send lead emails), and Google (to show your Google reviews). They only get what they need to do their job.</p>
<h2>Contact forms</h2>
<p>A form message is saved so we can email it to the business. We keep it only as long as needed to deliver it and keep business records. The business that gets it decides what to do with it after that.</p>
<h2>Texts and calls</h2>
<p>If you ask us to stop texting or calling, we stop. Tell us or reply STOP.</p>
<h2>Your choices</h2>
<p>Ask us to see, fix or delete your information: ${contactLine(env)}. If you cancel, we delete your site data when you ask, except records we must keep for taxes and billing.</p>
<p>See also our <a href="/terms">Terms of Service</a>.</p>`));
}

// Customer-site pages: shown to people who visit a contractor's website.
export function siteTermsPage(site, env) {
  const name = esc((site && site.form && site.form.company) || "This business");
  const a = agencyName(env);
  return respond(shell(`Terms of use | ${name}`, `<h1>Terms of use</h1>
<p>This website belongs to ${name}. It is run for them by ${a}.</p>
<h2>Using this site</h2>
<p>The site is here to tell you about ${name} and let you ask for a quote. Please do not misuse it, send spam through the form, or try to break it.</p>
<h2>Quotes and prices</h2>
<p>What you read here is general information, not a final price. ${name} will give you a written price for your job before work starts.</p>
<h2>Reviews</h2>
<p>Reviews shown on this site come from Google and are labeled as such.</p>
<h2>Limits</h2>
<p>We try to keep the information right but cannot promise it is always up to date. Use of this site is at your own risk.</p>
<p><a href="/privacy">Privacy</a> · <a href="/">Back to the home page</a></p>`));
}
