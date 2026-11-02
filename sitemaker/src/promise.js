// One promise headline per trade and variation (org/copy/headlines.md, CEO round 3: "say the result, not the problem").
// [headline, accent word, offer line]. The offer line is shown only when the owner ticked "Free estimates".
// No claim the owner did not make; words from test.mjs BANNED are avoided ("done right", "same day", ...).
export const PROMISES = {
  hvac: { _: ["Heating and air that keep every room comfortable.", "comfortable", "Free estimate on a new system."] },
  plumbing: { _: ["Plumbing fixed, the water running right.", "right", "A clear price before we start."] },
  electrical: { _: ["Electrical work, safe and up to code.", "safe", "A clear price before we start."] },
  landscaping: { _: ["A yard you want to be in.", "want", "Free estimate for your yard."] },
  tree: { _: ["Tree work, safe from the first cut.", "safe", "Free estimate. We look before we cut."] },
  garage: { _: ["Garage doors that open every time.", "every", "A clear price before we start."] },
  painting: { _: ["Painting with clean, sharp lines.", "sharp", "Free estimate and color help."] },
  concrete: { _: ["Concrete poured flat, finished smooth.", "smooth", "Free estimate for your slab."] },
  pest: { _: ["Pests out, and kept out.", "kept", "A clear plan and price first."] },
  junk: { _: ["Junk gone, the space back.", "gone", "A price before we load the truck."] },
  cleaning: { _: ["A clean home, without lifting a finger.", "clean", "A clear price for your home."] },
  towing: { _: ["Towing and roadside help when you need it.", "need", "Call for a price before we hook up."] },
  remodeling: { _: ["Kitchens and baths, remodeled with care.", "care", "Free estimate and a plan on paper."] },
  restoration: { _: ["Water, fire and mold damage, put back right.", "back", "We come out and tell you the plan."] },
  builder: { _: ["Custom homes, planned with you.", "with", "Free first meeting and a plan on paper."] },
  framing: { _: ["Framing that is straight, square and ready.", "square", "Free estimate from your plans."] },
  roofing: {
    _: ["A new roof, start to finish.", "new", "Free roof check. A written price before any work."],
    shingle: ["Shingle roofs that last through the storms.", "last", "Free estimate. Most roofs take a day or two."],
    metal: ["Metal roofs built for decades.", "decades", "Free estimate with color samples at your door."],
    tile: ["Tile roofs, set to stay.", "set", "Free estimate. We match your tile."],
    slate: ["Slate roofs, laid by hand.", "hand", "Free estimate and side-by-side samples."],
    shake: ["Cedar shake roofs, done by hand.", "done", "Free estimate. Ask about treated shake."],
    flat: ["Flat roofs that stay dry.", "dry", "Free leak check."],
  },
  fencing: {
    _: ["Fences that frame the yard.", "frame", "Free estimate. We mark the lines before we dig."],
    cedar: ["Cedar privacy fences, built straight.", "built", "Free estimate. Most yards take 1 to 3 days."],
    vinyl: ["Vinyl fences that never need paint.", "never", "Free estimate with style samples."],
    aluminum: ["Aluminum fences with zero rust.", "zero", "Free estimate. Pool-code options."],
    chainlink: ["Chain link fences, pulled tight.", "tight", "Free estimate and a quick install."],
    splitrail: ["Split rail fences that fit the land.", "fit", "Free estimate for any acreage."],
    slat: ["A modern slat fence, made to measure.", "made", "Free estimate and a drawing before we build."],
  },
  pressure: {
    _: ["Years of grime, gone in a day.", "gone", "Free quote by text. Send a photo, get a price."],
    driveway: ["Your driveway, bright again.", "bright", "Free quote from a photo."],
    siding: ["Siding clean, without the damage.", "clean", "Free quote. Safe for plants and pets."],
    deck: ["Decks washed and ready for summer.", "ready", "Free quote from a photo."],
    fence: ["Fences that look new again.", "look", "Free quote. Pairs well with deck washing."],
    roof: ["Black streaks off your roof.", "off", "Free quote. No high pressure on shingles."],
    storefront: ["A storefront customers notice.", "notice", "Free quote. Early-morning visits so you stay open."],
  },
};

// { headline, accent, offer } for a trade and its picked variation; null when the trade has no promise copy.
export function promiseFor(tradeKey, variantKey) {
  const t = PROMISES[tradeKey];
  if (!t) return null;
  const p = (variantKey && t[variantKey]) || t._;
  return { headline: p[0], accent: p[1], offer: p[2] };
}
