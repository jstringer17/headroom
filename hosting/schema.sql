-- Hosted backend database (Cloudflare D1). Shared contract: org/plan.md "Hosted backend".
-- All times are ISO 8601 text in UTC: new Date().toISOString() (sorts and compares as text). paid_through and expires_at too.
-- events.id is text: a random id, or the Stripe event id (billing uses it to handle each Stripe event once).
-- Booleans are 0/1. Apply locally: npx wrangler d1 execute headroom --local --file schema.sql

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,                -- short random id, also the R2 folder: sites/<id>/
  slug TEXT,
  domain TEXT UNIQUE,                 -- bare host, lower case, no "www." (www is served too)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','paused','off')),
  form_json TEXT NOT NULL DEFAULT '{}', -- the maker's form; hosting-only settings live in form.hosting = { analyticsToken, google:{rating,count} }
  owner_name TEXT,
  owner_email TEXT,
  owner_sms TEXT,
  notify_email TEXT,                  -- where leads go (falls back to owner_email)
  notify_sms TEXT,                    -- text alerts for leads (empty = off)
  place_id TEXT,                      -- Google Place ID for reviews
  plan TEXT,
  stripe_customer TEXT,
  stripe_sub TEXT,
  paid_through TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS sites_status ON sites(status);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id),
  name TEXT, phone TEXT, email TEXT, service TEXT, message TEXT, page TEXT,
  created_at TEXT,
  emailed INTEGER NOT NULL DEFAULT 0,
  texted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS leads_site ON leads(site_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id),
  source TEXT NOT NULL CHECK (source IN ('google','manual')),
  author TEXT, stars INTEGER, text TEXT,
  posted_at TEXT, fetched_at TEXT,
  show INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS reviews_site ON reviews(site_id, show);

CREATE TABLE IF NOT EXISTS logins (
  token_hash TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  email TEXT,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addons (
  site_id TEXT NOT NULL REFERENCES sites(id),
  kind TEXT NOT NULL,
  status TEXT,
  stripe_item TEXT,
  PRIMARY KEY (site_id, kind)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  site_id TEXT,
  kind TEXT NOT NULL,
  data TEXT,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_site ON events(site_id, at);

-- Form rate limit (host-core): one row per lead attempt, key = hashed visitor IP, at = Date.now() ms. Swept by cron.
CREATE TABLE IF NOT EXISTS hits (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS hits_key ON hits(key, at);

-- Owner preview (demo.js): temporary sample-site links for sales demos. token = 128-bit random hex (the link /d/<token>).
-- form_json = the maker form with uploaded pictures moved to R2 demo/<token>/; the rendered page is R2 demo/<token>/index.html.
CREATE TABLE IF NOT EXISTS demo_links (
  token TEXT PRIMARY KEY,
  company TEXT,
  trade TEXT,
  form_json TEXT NOT NULL DEFAULT '{}',
  site_id TEXT,                       -- set if it was turned into a real site
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,           -- default created_at + 14 days; desk can extend by 7
  views INTEGER NOT NULL DEFAULT 0,
  last_view TEXT,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS demo_links_created ON demo_links(created_at);
