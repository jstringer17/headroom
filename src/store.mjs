import fs from 'node:fs';
import { DATA_FILE, CHROME } from './config.mjs';
import { chromium } from 'playwright';

// Leads live in one JSON file, keyed by Google's place id.
export function loadLeads() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}

export function saveLeads(leads) {
  const tmp = DATA_FILE.pathname + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(leads, null, 1));
  fs.renameSync(tmp, DATA_FILE);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const pause = ([lo, hi]) => sleep(lo + Math.random() * (hi - lo));

export async function launchBrowser() {
  const opts = { args: ['--no-sandbox'] };
  if (fs.existsSync(CHROME)) opts.executablePath = CHROME;
  if (process.env.HTTPS_PROXY) opts.proxy = { server: process.env.HTTPS_PROXY };
  const browser = await chromium.launch(opts);
  const context = await browser.newContext({ locale: 'en-US', ignoreHTTPSErrors: true });
  return { browser, context };
}
