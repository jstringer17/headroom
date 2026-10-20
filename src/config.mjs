// What to search for. Edit these lists to change the run.
export const NICHES = ['roofer', 'HVAC contractor', 'plumber', 'electrician'];

export const CITIES = [
  // Texas
  'San Antonio, TX', 'Fort Worth, TX', 'El Paso, TX',
  // Arizona
  'Tucson, AZ', 'Mesa, AZ',
  // California (Bay Area / Tri-Valley / Contra Costa)
  'San Francisco, CA', 'Danville, CA', 'San Ramon, CA', 'Pleasanton, CA',
  'Livermore, CA', 'Concord, CA', 'Fremont, CA', 'Martinez, CA', 'Orinda, CA',
  'Lafayette, CA', 'Alamo, CA', 'Blackhawk, CA',
];

// Most businesses to read per search (Maps shows ~120 max).
export const MAX_PER_SEARCH = 60;

// Pauses keep Google from flagging us. Milliseconds.
export const PAUSE_BETWEEN_PLACES = [1200, 2500];
export const PAUSE_BETWEEN_SEARCHES = [8000, 15000];

// Skip big chains and franchises.
export const SKIP_NAMES = [
  'home depot', "lowe's", 'lowes', 'rescue rooter', 'roto-rooter', 'mr. rooter',
  'mr. electric', 'one hour heating', 'benjamin franklin plumbing', 'aire serv',
  'service experts', 'sears', 'abc supply', 'srs distribution', 'ferguson',
  'beacon building', 'supply', 'wholesale',
];

export const DATA_FILE = new URL('../data/leads.json', import.meta.url);

export const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
