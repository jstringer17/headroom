// Email (Resend) and SMS (Twilio). No key = nothing is sent, the message is logged, and { ok:false, skipped:true } comes back.

export async function sendEmail(env, { to, subject, text, html, replyTo }) {
  const list = (Array.isArray(to) ? to : [to]).map((x) => String(x || "").trim()).filter(Boolean);
  if (!list.length) return { ok: false, error: "no recipient" };
  if (!env.RESEND_API_KEY) {
    console.log("[email not sent: no RESEND_API_KEY]", JSON.stringify({ to: list, subject }));
    return { ok: false, skipped: true };
  }
  const body = {
    from: env.FROM_EMAIL || `Leads <leads@${env.AGENCY_DOMAIN || "example.com"}>`,
    to: list,
    subject: String(subject || "").slice(0, 200),
    text: text || undefined,
    html: html || undefined,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j.id } : { ok: false, error: j.message || `resend ${r.status}` };
  } catch (e) {
    return { ok: false, error: String(e && e.message) };
  }
}

export async function sendSms(env, { to, text }) {
  const num = String(to || "").trim();
  if (!num) return { ok: false, error: "no recipient" };
  if (!env.TWILIO_SID || !env.TWILIO_TOKEN || !env.TWILIO_FROM) {
    console.log("[sms not sent: no Twilio keys]", JSON.stringify({ to: num }));
    return { ok: false, skipped: true };
  }
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(env.TWILIO_SID)}/Messages.json`, {
      method: "POST",
      headers: { authorization: `Basic ${btoa(`${env.TWILIO_SID}:${env.TWILIO_TOKEN}`)}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: num, From: env.TWILIO_FROM, Body: String(text || "").slice(0, 600) }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, id: j.sid } : { ok: false, error: j.message || `twilio ${r.status}` };
  } catch (e) {
    return { ok: false, error: String(e && e.message) };
  }
}
