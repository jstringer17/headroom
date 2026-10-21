// Sample Site Maker page logic. Runs after generate.js, trades.js and
// themes.js are inlined above it (see build.mjs).
(function () {
  const $ = (id) => document.getElementById(id);
  const tradeSel = $("trade");
  const svcBox = $("services");
  const themeBox = $("themes");
  let themeTouched = false;
  let lastHtml = "";
  let downloads = null;

  TRADE_ORDER.forEach((k) => {
    const o = document.createElement("option");
    o.value = k; o.textContent = TRADES[k].label;
    tradeSel.appendChild(o);
  });

  THEME_ORDER.forEach((k) => {
    const th = THEMES[k];
    const lab = document.createElement("label");
    lab.className = "swatch"; lab.htmlFor = "theme-" + k;
    lab.innerHTML = '<input type="radio" name="theme" id="theme-' + k + '" value="' + k + '"><span><span class="chip"><i style="background:' + th.dark + '"></i><i style="background:' + th.accent + '"></i></span>' + esc(th.label) + "</span>";
    themeBox.appendChild(lab);
  });

  function setTrade(key, keepChecks) {
    const t = TRADES[key];
    tradeSel.value = key;
    svcBox.innerHTML = "";
    t.services.forEach(([n], i) => {
      const id = "svc-" + i;
      const lab = document.createElement("label");
      lab.className = "check"; lab.htmlFor = id;
      lab.innerHTML = '<input type="checkbox" id="' + id + '" value="' + esc(n) + '"' + (i < t.pick ? " checked" : "") + "> " + esc(n);
      svcBox.appendChild(lab);
    });
    if (!keepChecks) $("emergency").checked = t.emergency;
    if (!themeTouched) $("theme-" + t.theme).checked = true;
  }

  function readForm() {
    const theme = (document.querySelector('input[name="theme"]:checked') || {}).value;
    return {
      company: $("company").value,
      trade: tradeSel.value,
      city: $("city").value,
      phone: $("phone").value,
      rating: $("rating").value,
      reviews: $("reviews").value,
      years: $("years").value,
      services: Array.from(svcBox.querySelectorAll("input:checked")).map((i) => i.value),
      emergency: $("emergency").checked,
      freeEstimates: $("freeEstimates").checked,
      insured: $("insured").checked,
      theme,
    };
  }

  let timer = 0;
  function render() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      lastHtml = generateSite(readForm());
      $("frame").srcdoc = lastHtml;
      $("code-box").hidden = true;
    }, 120);
  }

  function say(msg, bad) {
    const s = $("status");
    s.textContent = msg; s.className = "status" + (bad ? " bad" : "");
  }

  function fileName() {
    return slugify($("company").value) + "-sample-site.html";
  }

  function needName() {
    if ($("company").value.trim()) return false;
    say("Type the company name first.", true);
    $("company").focus();
    return true;
  }

  $("maker").addEventListener("input", (e) => {
    if (e.target.name === "theme") themeTouched = true;
    if (e.target.id !== "lead-paste") render();
  });
  $("maker").addEventListener("submit", (e) => e.preventDefault());
  tradeSel.addEventListener("change", () => { setTrade(tradeSel.value); render(); });

  $("view-phone").addEventListener("click", () => setView(true));
  $("view-desk").addEventListener("click", () => setView(false));
  function setView(phone) {
    $("stage").classList.toggle("phone", phone);
    $("view-phone").setAttribute("aria-pressed", String(phone));
    $("view-desk").setAttribute("aria-pressed", String(!phone));
  }

  $("download").addEventListener("click", async () => {
    if (needName()) return;
    const html = generateSite(readForm());
    const name = fileName();
    if (downloads) {
      try {
        await downloads.save({ filename: name, data: html });
        say("Saved " + name + ". Open it to see the site.");
      } catch (err) {
        const code = err && err.code;
        if (code === "declined") say("Download canceled.");
        else if (code === "rate_limited") say("A save box is already open. Finish that one first.");
        else say("Download is not working here. Use Copy code instead.", true);
      }
      return;
    }
    if (!window.claude) {
      // Opened as a plain file outside Claude: a normal browser download works.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      say("Saved " + name + ".");
      return;
    }
    say("Download is not working here. Use Copy code instead.", true);
  });

  $("copy").addEventListener("click", () => {
    if (needName()) return;
    const html = generateSite(readForm());
    const fallback = () => {
      $("code").value = html;
      $("code-box").hidden = false;
      $("code").focus(); $("code").select();
      say("Copy did not work here. The code is in the box below.");
    };
    try {
      navigator.clipboard.writeText(html).then(() => say("Copied. Paste it into a file named " + fileName() + "."), fallback);
    } catch (_) { fallback(); }
  });

  $("lead-fill").addEventListener("click", () => {
    const got = parseLead($("lead-paste").value);
    const st = $("lead-status");
    const keys = Object.keys(got);
    if (!keys.length) { st.textContent = "Could not read that. Paste the lead's name, phone, and town."; st.className = "status bad"; return; }
    if (got.trade) setTrade(got.trade);
    ["company", "city", "phone", "rating", "reviews"].forEach((k) => { if (got[k] != null) $(k).value = got[k]; });
    const words = { company: "name", phone: "phone", city: "town", rating: "stars", reviews: "reviews", trade: "trade" };
    st.textContent = "Filled in: " + keys.map((k) => words[k]).filter(Boolean).join(", ") + ". Check it looks right.";
    st.className = "status";
    render();
  });

  setTrade("roofing");
  lastHtml = generateSite(readForm());
  $("frame").srcdoc = lastHtml;

  if (window.claude && window.claude.use) {
    window.claude.use("downloads").then((d) => {
      downloads = d;
      if (!d) $("download").hidden = true;
    }).catch(() => { $("download").hidden = true; });
  }
})();
