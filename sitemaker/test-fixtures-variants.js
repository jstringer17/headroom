// Fixture variations for tests, used only until the real kit has them (and ignored where it does).
// Each of roofing, fencing and pressure gets: the default ("std") plus two more, "alt1" and "alt2", with their own story,
// before/after pair and headlines. Run against CINE_KIT as: new Function("CINE_KIT", thisFile)(CINE_KIT)
for (const t of ["roofing", "fencing", "pressure"]) {
  const kit = CINE_KIT[t];
  if (!kit || kit.variants) continue;
  const mk = (key, n) => ({
    key, label: "Fixture " + key,
    story: [1, 2, 3].map((i) => ({ id: key + "/s" + i, headline: "Fixture " + key + " " + t + " step " + i + ".", accent: "step", prompt: "x" })),
    beforeAfter: { ...kit.beforeAfter, before: { ...kit.beforeAfter.before, id: key + "/before" }, after: { ...kit.beforeAfter.after, id: key + "/after" } },
  });
  kit.variants = [{ key: "std", label: "Standard", default: true }, mk("alt1"), mk("alt2")];
}
