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
  let heroData = "";
  const hasCine = typeof CINE_KIT !== "undefined";
  const cineImages = {}; // trade -> slotId -> picture
  const cinePrices = {}; // trade -> size -> option -> { low, high }

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
    if (!keepChecks) {
      $("emergency").checked = false;
      $("freeEstimates").checked = t.freeEstimates !== false;
    }
    if (!themeTouched) $("theme-" + t.theme).checked = true;
    $("higgs-prompt").value = t.prompt;
    buildCine();
  }

  // Cinematic: one picture slot per kit slot, and a price table of typed ranges.
  function buildCine() {
    if (!hasCine) return;
    const key = tradeSel.value, kit = CINE_KIT[key];
    $("cine-switch").hidden = !kit;
    $("cine-fields").hidden = !kit || !$("cinematic").checked;
    if (!kit) return;
    const imgs = cineImages[key] = cineImages[key] || {};
    $("cine-slots").innerHTML = cineSlots(kit).map((s) => '<div class="slot" data-slot="' + esc(s.id) + '"><span class="slot-head">' + esc(s.label) + '</span>' +
      '<label class="btn file-btn">Upload a picture<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload picture for ' + esc(s.label) + '"></label>' +
      '<input type="text" inputmode="url" class="slot-url" placeholder="Or paste https:// link" aria-label="Picture link for ' + esc(s.label) + '" value="' + (/^https:/.test(imgs[s.id] || "") ? esc(imgs[s.id]) : "") + '">' +
      '<div class="hero-pick"' + (/^data:/.test(imgs[s.id] || "") ? "" : " hidden") + '><img alt="" ' + (/^data:/.test(imgs[s.id] || "") ? 'src="' + imgs[s.id] + '"' : "") + '><button class="btn slot-clear" type="button">Remove</button></div>' +
      '<p class="status" aria-live="polite"></p></div>').join("");
    const pr = cinePrices[key] = cinePrices[key] || {};
    const est = kit.estimator || { sizes: [], options: [] };
    $("cine-prices").innerHTML = est.sizes.map((sz) => '<div class="price-row"><b>' + esc(sz) + "</b>" + est.options.map((op) => {
      const c = (pr[sz] || {})[op] || {};
      return '<div class="price-cell"><span>' + esc(op) + '</span><input type="number" min="0" step="1" inputmode="numeric" placeholder="Low" data-size="' + esc(sz) + '" data-opt="' + esc(op) + '" data-end="low" aria-label="' + esc(sz + ", " + op + ", low price") + '" value="' + esc(c.low || "") + '">' +
        '<input type="number" min="0" step="1" inputmode="numeric" placeholder="High" data-size="' + esc(sz) + '" data-opt="' + esc(op) + '" data-end="high" aria-label="' + esc(sz + ", " + op + ", high price") + '" value="' + esc(c.high || "") + '"></div>';
    }).join("") + "</div>").join("");
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
      heroImage: heroData || $("hero-url").value.trim(),
      cinematic: hasCine && $("cinematic").checked,
      cine: hasCine ? { images: cineImages[tradeSel.value] || {}, prices: cinePrices[tradeSel.value] || {} } : undefined,
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
    if (e.target.id === "hero-url") onHeroUrl();
    if (e.target.id === "cinematic") buildCine();
    const dp = e.target.dataset || {};
    if (dp.end) {
      const pr = cinePrices[tradeSel.value];
      ((pr[dp.size] = pr[dp.size] || {})[dp.opt] = pr[dp.size][dp.opt] || {})[dp.end] = e.target.value;
    }
    if (e.target.classList.contains("slot-url")) onSlotUrl(e.target);
    if (e.target.id !== "lead-paste" && e.target.id !== "hero-file" && e.target.type !== "file") render();
  });
  $("cine-slots").addEventListener("change", (e) => { if (e.target.type === "file") onSlotFile(e.target); });
  $("cine-slots").addEventListener("click", (e) => {
    if (!e.target.classList.contains("slot-clear")) return;
    const slot = e.target.closest(".slot");
    delete cineImages[tradeSel.value][slot.dataset.slot];
    slot.querySelector(".slot-url").value = "";
    slot.querySelector(".hero-pick").hidden = true;
    slotSay(slot, "Picture removed."); render();
  });
  function slotSay(slot, msg, bad) { const s = slot.querySelector(".status"); s.textContent = msg; s.className = "status" + (bad ? " bad" : ""); }
  function onSlotUrl(input) {
    const slot = input.closest(".slot"), v = input.value.trim(), imgs = cineImages[tradeSel.value];
    if (!v) { delete imgs[slot.dataset.slot]; slot.querySelector(".hero-pick").hidden = true; slotSay(slot, ""); return; }
    if (!/^https:\/\/\S+$/.test(v)) { delete imgs[slot.dataset.slot]; slotSay(slot, "A picture link starts with https://", true); return; }
    imgs[slot.dataset.slot] = v; slot.querySelector(".hero-pick").hidden = true;
    slotSay(slot, "Link added. Upload the file instead to keep the picture inside the download.");
  }
  function onSlotFile(input) {
    const file = input.files && input.files[0], slot = input.closest(".slot");
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { slotSay(slot, "Pick a JPG, PNG, or WebP picture.", true); return; }
    slotSay(slot, "Getting the picture ready...");
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const data = shrink(img, 300);
      URL.revokeObjectURL(url); input.value = "";
      cineImages[tradeSel.value][slot.dataset.slot] = data;
      slot.querySelector(".slot-url").value = "";
      const box = slot.querySelector(".hero-pick"); box.hidden = false; box.querySelector("img").src = data;
      slotSay(slot, "Picture added (" + Math.round(data.length * 0.75 / 1024) + " KB).");
      render();
    };
    img.onerror = () => { URL.revokeObjectURL(url); slotSay(slot, "Could not open that picture. Try a JPG or PNG.", true); };
    img.src = url;
  }
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

  // Hero picture: shrink to about 1600px wide JPEG under ~400 KB so the
  // download stays one small file. Cinematic slots use 300 KB each so 12 pictures stay under 6 MB.
  function heroSay(msg, bad) { const s = $("hero-status"); s.textContent = msg; s.className = "status" + (bad ? " bad" : ""); }
  function showHero(src) {
    $("hero-pick").hidden = !src;
    if (src) $("hero-thumb").src = src; else $("hero-thumb").removeAttribute("src");
  }
  function shrink(img, maxKB) {
    maxKB = maxKB || 400;
    const canvas = document.createElement("canvas");
    let width = Math.min(1600, img.naturalWidth);
    for (let round = 0; round < 4; round++) {
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * width / img.naturalWidth);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const q of [0.82, 0.72, 0.62, 0.52]) {
        const url = canvas.toDataURL("image/jpeg", q);
        if (url.length * 0.75 <= maxKB * 1024) return url;
      }
      width = Math.round(width * 0.8);
    }
    return canvas.toDataURL("image/jpeg", 0.5);
  }
  $("hero-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { heroSay("Pick a JPG, PNG, or WebP picture.", true); return; }
    heroSay("Getting the picture ready...");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      heroData = shrink(img);
      URL.revokeObjectURL(url);
      $("hero-url").value = "";
      e.target.value = "";
      showHero(heroData);
      heroSay("Picture added (" + Math.round(heroData.length * 0.75 / 1024) + " KB). It is saved inside the download.");
      render();
    };
    img.onerror = () => { URL.revokeObjectURL(url); heroSay("Could not open that picture. Try a JPG or PNG.", true); };
    img.src = url;
  });
  function onHeroUrl() {
    const v = $("hero-url").value.trim();
    if (!v) { if (!heroData) { showHero(""); heroSay(""); } return; }
    heroData = "";
    if (!/^https:\/\/\S+$/.test(v)) { showHero(""); heroSay("A picture link starts with https://", true); return; }
    showHero("");
    heroSay("Link added. It may not show in this preview, but it shows in the downloaded site when online. Upload the file instead to keep the picture inside the download.");
  }
  $("hero-clear").addEventListener("click", () => {
    heroData = ""; $("hero-url").value = ""; showHero(""); heroSay("Picture removed."); render();
  });
  $("higgs-copy").addEventListener("click", () => {
    const st = $("higgs-status");
    const fail = () => { $("higgs-prompt").focus(); $("higgs-prompt").select(); st.textContent = "Copy did not work here. The text is selected, copy it yourself."; };
    try { navigator.clipboard.writeText($("higgs-prompt").value).then(() => { st.textContent = "Copied. Paste it into Higgsfield."; }, fail); } catch (_) { fail(); }
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
