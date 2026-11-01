// host-core's shared helpers (see "Shared contract" in org/plan.md), loaded on first use.
// Tests and the local screenshot server hand in stand-ins with useDeps() until host-core lands.
//   render.publishSite(env, siteId)          merges stored form + shown reviews, renders, writes R2
//   render.renderForm(env, siteId, form)     optional: same render without writing (used for Preview if present)
//   notify.sendEmail(env, { to, subject, text, html })
let deps = null;

export function useDeps(d) { deps = d; }

export async function getDeps() {
  if (!deps) {
    const [render, notify] = await Promise.all([import("../render.js"), import("../notify.js")]);
    deps = { render, notify };
  }
  return deps;
}
