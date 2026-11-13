// Gmail SMTP path of notify.sendEmail (node --test). A fake cloudflare:sockets connect() plays the server and records the transcript.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { mockEnv, mockFetch } from "./mock-env.js";
import { sendEmail, buildMessage, dotStuff, encodeHeaderWord, emailStatus, utcDay, GMAIL_DAILY_CAP } from "../src/notify.js";
import { loadCustomers } from "../src/desk/data.js";

const USER = "sunday.agency@gmail.com";
const PASS = "abcd efgh ijkl mnop";
const PASS_B64 = btoa("abcdefghijklmnop");
const b64 = (s) => Buffer.from(s, "utf8").toString("base64");

// One fake server per connection. script(line) -> reply string for that command; replies may be split into odd chunks.
function fakeConnect(opts = {}) {
  const conns = [];
  const connect = (addr, options) => {
    const c = { addr, options, transcript: [], data: "", closed: false };
    conns.push(c);
    const n = conns.length;
    if (opts.failConnection && opts.failConnection(n)) {
      return { opened: Promise.reject(new Error("connect refused")), readable: new ReadableStream(), writable: new WritableStream(), close: async () => { c.closed = true; } };
    }
    let ctl;
    const readable = new ReadableStream({ start(k) { ctl = k; } });
    const enc = new TextEncoder();
    const reply = (s) => {
      if (s == null) return;                                    // silence (timeout test)
      for (let i = 0; i < s.length; i += 7) ctl.enqueue(enc.encode(s.slice(i, i + 7)));   // split across reads on purpose
    };
    const replies = { ...DEFAULT_REPLIES, ...(opts.replies || {}), ...((opts.perConn && opts.perConn(n)) || {}) };
    let buf = "", inData = false;
    const writable = new WritableStream({
      write(chunk) {
        buf += new TextDecoder().decode(chunk);
        for (;;) {
          if (inData) {
            const end = buf.indexOf("\r\n.\r\n");
            if (end < 0) return;
            c.data = buf.slice(0, end + 2);
            buf = buf.slice(end + 5);
            inData = false;
            c.transcript.push("<DATA>");
            reply(replies.message);
            continue;
          }
          const i = buf.indexOf("\r\n");
          if (i < 0) return;
          const line = buf.slice(0, i);
          buf = buf.slice(i + 2);
          c.transcript.push(line);
          const verb = line.split(/[ :]/)[0].toUpperCase();
          const key = c.transcript.length === 3 ? "user" : c.transcript.length === 4 ? "pass" : verb;
          if (verb === "DATA") inData = true;
          reply(replies[key]);
        }
      },
    });
    queueMicrotask(() => reply(replies.greeting));
    return { opened: Promise.resolve(), readable, writable, close: async () => { c.closed = true; try { ctl.close(); } catch {} } };
  };
  connect.conns = conns;
  return connect;
}
const DEFAULT_REPLIES = {
  greeting: "220 smtp.gmail.com ESMTP ready\r\n",
  EHLO: "250-smtp.gmail.com at your service\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-AUTH LOGIN PLAIN XOAUTH2\r\n250-ENHANCEDSTATUSCODES\r\n250 SMTPUTF8\r\n",
  AUTH: "334 VXNlcm5hbWU6\r\n",
  user: "334 UGFzc3dvcmQ6\r\n",
  pass: "235 2.7.0 Accepted\r\n",
  MAIL: "250 2.1.0 OK\r\n",
  RCPT: "250 2.1.5 OK\r\n",
  DATA: "354 Go ahead\r\n",
  message: "250 2.0.0 OK 1700000000 queued\r\n",
  QUIT: "221 2.0.0 closing connection\r\n",
};

const gmailEnv = (connect, extra = {}) => mockEnv({ GMAIL_USER: USER, GMAIL_APP_PASSWORD: PASS, __connect: connect, ...extra });
const quietLog = () => { const lines = []; const m = mock.method(console, "log", (...a) => lines.push(a.join(" "))); return { lines, restore: () => m.mock.restore() }; };
const decodeParts = (data) => [...data.matchAll(/Content-Transfer-Encoding: base64\r\n\r\n([A-Za-z0-9+/=\r\n]+?)\r\n--/g)].map((m) => Buffer.from(m[1].replace(/\r\n/g, ""), "base64").toString("utf8"));

test("full SMTP conversation: TLS 465, EHLO, AUTH LOGIN, MAIL/RCPT per recipient, DATA, QUIT, socket closed", async () => {
  const connect = fakeConnect();
  const env = gmailEnv(connect);
  const r = await sendEmail(env, { to: ["owner@site.test", "partner@site.test"], subject: "New lead: Pat", text: "Call Pat.\n.hidden line", html: "<p>Call Pat.</p>", replyTo: "pat@example.com" });
  assert.equal(r.ok, true);
  assert.match(r.id, /^<[0-9a-f]{32}@gmail\.com>$/);
  assert.equal(connect.conns.length, 1);
  const c = connect.conns[0];
  assert.deepEqual(c.addr, { hostname: "smtp.gmail.com", port: 465 });
  assert.equal(c.options.secureTransport, "on");
  assert.deepEqual(c.transcript, [
    "EHLO agency.test",
    "AUTH LOGIN",
    b64(USER),
    PASS_B64,
    `MAIL FROM:<${USER}>`,
    "RCPT TO:<owner@site.test>",
    "RCPT TO:<partner@site.test>",
    "DATA",
    "<DATA>",
    "QUIT",
  ]);
  assert.equal(c.closed, true);
  // headers
  const [head] = c.data.split("\r\n\r\n");
  const h = head.split("\r\n");
  assert.equal(h[0], `From: "Sunday Agency" <${USER}>`);
  assert.ok(h.includes("To: owner@site.test, partner@site.test"));
  assert.ok(h.includes("Reply-To: pat@example.com"));
  assert.ok(h.includes("Subject: New lead: Pat"));
  assert.ok(h.includes("MIME-Version: 1.0"));
  assert.ok(h.some((l) => /^Date: \w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} \+0000$/.test(l)));
  assert.ok(h.includes(`Message-ID: ${r.id}`));
  assert.ok(h.some((l) => /^Content-Type: multipart\/alternative; boundary="=_sunday_[0-9a-f]+"$/.test(l)));
  // every line ends in CRLF: no bare LF anywhere
  assert.equal(/[^\r]\n/.test(c.data), false);
  assert.ok(c.data.includes("Content-Type: text/plain; charset=UTF-8"));
  assert.ok(c.data.includes("Content-Type: text/html; charset=UTF-8"));
  assert.deepEqual(decodeParts(c.data), ["Call Pat.\r\n.hidden line", "<p>Call Pat.</p>"]);
  // counted in D1
  assert.equal(await env.DB.prepare("SELECT sent FROM email_sends WHERE day = ?").bind(utcDay()).first("sent"), 2);
});

test("multi-line replies are read whole, even when split across reads", async () => {
  // EHLO reply arrives in 7-byte chunks across 6 lines; if the client stopped at the first "250-" line,
  // the next reply it read for AUTH would be a 250, and the send would fail.
  const connect = fakeConnect({ replies: { greeting: "220-smtp.gmail.com\r\n220-second greeting line\r\n220 ready\r\n" } });
  const r = await sendEmail(gmailEnv(connect), { to: "o@site.test", subject: "x", text: "y" });
  assert.equal(r.ok, true);
  assert.equal(connect.conns[0].transcript[1], "AUTH LOGIN");
});

test("header injection: CR/LF stripped from every header value; bad Reply-To dropped", async () => {
  const connect = fakeConnect();
  const env = gmailEnv(connect);
  const r = await sendEmail(env, {
    to: "o@site.test",
    subject: "Hello\r\nBcc: victim@evil.test\r\n\r\nInjected body",
    text: "ok",
    replyTo: "pat@example.com\r\nBcc: victim@evil.test",
  });
  assert.equal(r.ok, true);
  const [head] = connect.conns[0].data.split("\r\n\r\n");
  const h = head.split("\r\n");
  assert.equal(h.filter((l) => /^bcc:/i.test(l)).length, 0);
  assert.ok(h.includes("Subject: Hello Bcc: victim@evil.test Injected body"));
  assert.equal(h.some((l) => l.startsWith("Reply-To:")), false);
  // recipient with CRLF cannot add SMTP commands
  const c2 = fakeConnect();
  const r2 = await sendEmail(gmailEnv(c2), { to: "o@site.test\r\nRCPT TO:<x@evil.test>", subject: "s", text: "t" });
  assert.equal(r2.ok, false);
  assert.equal(c2.conns.length, 0);
});

test("non-ASCII subject is RFC 2047 encoded, folded, and decodes back", () => {
  const subject = "Nuevo cliente: José Muñoz quiere una cotización para el techo de la cocina ✓";
  const m = buildMessage({ from: USER, to: ["o@site.test"], subject, text: "hola" });
  const line = m.data.split("\r\n\r\n")[0].match(/Subject: ((?:.*)(?:\r\n .*)*)/)[1];
  const words = line.split("\r\n ");
  assert.ok(words.length > 1);
  for (const w of words) { assert.match(w, /^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/); assert.ok(w.length <= 75); }
  const back = words.map((w) => Buffer.from(w.slice(10, -2), "base64").toString("utf8")).join("");
  assert.equal(back, subject);
  assert.equal(encodeHeaderWord("plain ascii"), "plain ascii");
});

test("dot-stuffing doubles a leading dot on every line", () => {
  assert.equal(dotStuff(".a\r\nb\r\n.c\r\n..d"), "..a\r\nb\r\n..c\r\n...d");
  assert.equal(dotStuff("a.b\r\n"), "a.b\r\n");
});

test("one retry: first connection fails, second sends", async () => {
  const connect = fakeConnect({ failConnection: (n) => n === 1 });
  const env = gmailEnv(connect);
  const r = await sendEmail(env, { to: "o@site.test", subject: "x", text: "y" });
  assert.equal(r.ok, true);
  assert.equal(connect.conns.length, 2);
  assert.equal(connect.conns[1].transcript.at(-1), "QUIT");
  // a transient 4xx also gets exactly one retry, then gives up
  const busy = fakeConnect({ replies: { MAIL: "421 4.7.0 Try again later\r\n" } });
  const log = quietLog();
  const r2 = await sendEmail(gmailEnv(busy), { to: "o@site.test", subject: "x", text: "y" });
  log.restore();
  assert.equal(r2.ok, false);
  assert.match(r2.error, /MAIL FROM 421/);
  assert.equal(busy.conns.length, 2);
  assert.ok(busy.conns.every((c) => c.closed));
});

test("bad password: no retry, password never logged or returned", async () => {
  const connect = fakeConnect({ replies: { pass: "535-5.7.8 Username and Password not accepted.\r\n535 5.7.8 Learn more\r\n" } });
  const log = quietLog();
  const r = await sendEmail(gmailEnv(connect), { to: "o@site.test", subject: "x", text: "y" });
  log.restore();
  assert.equal(r.ok, false);
  assert.match(r.error, /AUTH password 535/);
  assert.equal(connect.conns.length, 1);
  const all = log.lines.join("\n") + JSON.stringify(r);
  for (const secret of [PASS, "abcdefghijklmnop", PASS_B64]) assert.equal(all.includes(secret), false);
  assert.equal(connect.conns[0].closed, true);
});

test("timeout: a silent server gives up within the overall budget and closes the socket", async () => {
  const connect = fakeConnect({ replies: { EHLO: null } });
  const log = quietLog();
  const t = Date.now();
  const r = await sendEmail(gmailEnv(connect, { __smtpTimeoutMs: 150 }), { to: "o@site.test", subject: "x", text: "y" });
  log.restore();
  assert.equal(r.ok, false);
  assert.match(r.error, /timeout/);
  assert.ok(Date.now() - t < 1000);
  assert.ok(connect.conns.every((c) => c.closed));
});

test("silent server after the message is accepted: still ok, no retry, no duplicate send", async () => {
  const connect = fakeConnect({ replies: { QUIT: null } });
  const r = await sendEmail(gmailEnv(connect, { __smtpTimeoutMs: 300 }), { to: "o@site.test", subject: "x", text: "y" });
  assert.equal(r.ok, true);
  assert.equal(connect.conns.length, 1);
  assert.equal(connect.conns[0].transcript.at(-1), "QUIT");
  assert.equal(connect.conns[0].closed, true);
});

test("daily cap: at 450 it logs instead of sending and the desk shows a warning", async () => {
  const connect = fakeConnect();
  const env = gmailEnv(connect);
  await env.DB.prepare("INSERT INTO email_sends (day, sent) VALUES (?, ?)").bind(utcDay(), GMAIL_DAILY_CAP - 1).run();
  assert.equal((await emailStatus(env)).warning, "");
  assert.equal((await sendEmail(env, { to: "o@site.test", subject: "x", text: "y" })).ok, true);   // 449 -> 450
  assert.match((await emailStatus(env)).warning, /Further emails today will only be logged/);
  const log = quietLog();
  const r = await sendEmail(env, { to: "o@site.test", subject: "Lead 451", text: "y" });
  log.restore();
  assert.deepEqual(r, { ok: false, skipped: true, error: "gmail daily cap" });
  assert.equal(connect.conns.length, 1);
  assert.ok(log.lines.some((l) => l.includes("Gmail daily cap") && l.includes("Lead 451")));
  const st = await emailStatus(env);
  assert.equal(st.sentToday, 450);
  assert.equal(st.cappedToday, 1);
  assert.match(st.warning, /1 email\(s\) were not sent/);
  const desk = await loadCustomers(env);
  assert.match(desk.email.warning, /Gmail daily limit reached/);
});

test("D1 failure never blocks sending", async () => {
  const connect = fakeConnect();
  const env = gmailEnv(connect, { DB: { prepare() { throw new Error("D1 down"); } } });
  const r = await sendEmail(env, { to: "o@site.test", subject: "x", text: "y" });
  assert.equal(r.ok, true);
  assert.equal((await emailStatus(env)).sentToday, 0);
});

test("without Gmail secrets the Resend and log paths are unchanged", async () => {
  const connect = fakeConnect();
  const realFetch = globalThis.fetch;
  const f = mockFetch();
  globalThis.fetch = f;
  try {
    const r = await sendEmail(mockEnv({ RESEND_API_KEY: "re_test", GMAIL_USER: USER, __connect: connect }), { to: "o@site.test", subject: "x", text: "y", replyTo: "p@example.com" });
    assert.deepEqual(r, { ok: true, id: "em_1" });
    assert.equal(f.calls.email[0].reply_to, "p@example.com");
    const log = quietLog();
    const r2 = await sendEmail(mockEnv({ GMAIL_APP_PASSWORD: PASS, __connect: connect }), { to: "o@site.test", subject: "x", text: "y" });
    log.restore();
    assert.deepEqual(r2, { ok: false, skipped: true });
    assert.ok(log.lines.some((l) => l.includes("no RESEND_API_KEY")));
    assert.equal(connect.conns.length, 0);
    assert.equal(await emailStatus(mockEnv()), null);
  } finally { globalThis.fetch = realFetch; }
});

test("text-only email still gets a simple HTML alternative (escaped)", () => {
  const m = buildMessage({ from: USER, to: ["o@site.test"], subject: "s", text: "Hi <b>\nline 2", html: "" });
  assert.deepEqual(decodeParts(m.data), ["Hi <b>\r\nline 2", "<!doctype html><html><body><p>Hi &lt;b&gt;<br>line 2</p></body></html>"]);
});
