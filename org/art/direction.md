# Art direction: Cinematic mode (Step 1b)
Owner: cine-art. Code: sitemaker/src/cine-look.js (look + placeholder art), sitemaker/src/cine-kit.js (picture kit). CEO picture list: org/art/higgsfield-kit.md.

## The look in one page
**Feel.** A calm film about one job, not a brochure. One big picture at a time, a few words in a large serif, lots of cream paper between scenes. The only loud thing on the page is one small accent button.

**Type.** Instrument Serif (display, true italic) + Manrope (everything else), both from Google Fonts (`CINE_FONTS_HREF`).
- Headlines: serif, weight 400, tight leading (1.02), slightly negative tracking, `text-wrap: balance`. Sizes `.cine-xl` 44 to 112px, `.cine-l` 36 to 76px, `.cine-m` 28 to 44px.
- One word per headline in italic (`.cine-accent`), in the accent color. Never two.
- Eyebrows: 12px sans caps, 0.18em tracking, a short rule before it. Body 17px, line height 1.6.

**Color.** Cream paper `#f6f1e7`, second paper `#ede5d6`, ink `#1d1b18`, muted `#5b5449`. Each classic theme keeps its dark color (`night`, used for picture scrims and dark sections) and its accent:

| Theme | Button | Italic word on cream | Italic word on picture |
|---|---|---|---|
| navy | #f27a1f | #a94a0b (5.1:1) | #ff9a4d |
| forest | #e9b949 | #7a5710 (5.8:1) | #f3cd6e |
| steel | #cf2f27 | #b0261f (5.9:1) | #ff8a7e |
| sky | #ffc23d | #855a00 (5.4:1) | #ffd36b |

All text pairs pass AA 4.5:1 (checked by script, including on the second paper and button text).

**Layout rhythm.** Picture section (full bleed, 100svh) then cream section, repeat. Section padding 80 to 168px. Content width 1180px with a 20 to 40px gutter. Headlines bottom-left over pictures, with a soft bottom and left scrim (`.cine-scrim`) so no text sits on a busy area. A faint film grain (`.cine-grain`) over pictures makes AI images and placeholders feel shot, not rendered.

**Motion feel.** Slow and sure. Crossfade 900ms, slow zoom 1.00 to 1.06 across a story step, captions rise 18px and fade in 700ms, easing `cubic-bezier(.2,.7,.1,1)`. Transform and opacity only, no scroll-jacking. Under `prefers-reduced-motion` everything is still and readable.

**Components (classes the engine can use).** `.cine-photo`, `.cine-frame` + `.is-on` + `--zoom`, `.cine-caption`, `.cine-step`, `.cine-progress`; `.cine-glass` card; `.cine-btn` (+ `.ghost`); `.cine-tabs` / `.cine-tab[aria-selected]`; `.cine-ba`, `.cine-ba-line`, `.cine-ba-handle`, `.cine-ba-tag`; `.cine-est`, `.cine-chip[aria-pressed]`, `.cine-range`, `.cine-note`; `.cine-section` (+ `.alt`), `.cine-dark`, `.cine-head`, `.cine-eyebrow`, `.cine-lede`, `.cine-reveal`. Wrap the page in `.cine`. Focus rings use the accent text color.

**Placeholder art.** Ink-on-paper sketches: architectural line drawing, flat warm tones, dotted grid sky, viewfinder corner marks, a "16:9 SKETCH" tag. Each slot draws its own step (stakes, posts, rails, finished fence; dirty, half, clean; etc.), so the scroll story already works before any real picture exists. Clearly a drawing, never photo-like. The label "Sample picture: make in Higgsfield" plus the slot name is drawn on every one, bottom left. `placeholderArt()` returns an SVG data URI (utf-8, not base64), so it is used directly and should not go through `safeImage`, which only allows uploaded JPEG/PNG/WebP or https.

**Picture rules.** Every prompt: 16:9, no people, no faces, no hands, no text, no logos, no signs. Story frames are one base picture edited step by step (same camera, lens, light, framing). Before pictures show normal wear and age, never "our job". No prices, review counts or claims in the kit.

## Study notes
Sources: the lynam_up fence reel (org/inspiration/lynam_up-reels.md, frames reviewed earlier) and motionsites.ai public pages (home, backgrounds), read on 2026-10-21. Nothing copied: no prompts, templates or code. No sign-up and no paid tier. Most motionsites.ai background previews are locked behind its paid plan ("Unlock background"), so for those I used only the public category names and showcase titles.

### Taken from the reel (ideas)
1. Cream paper sections between full-bleed photo sections: the cream makes the photos feel framed, like a printed book.
2. Serif headline with one italic accent word in the accent color: reads as "designed" with almost no effort.
3. The scroll builds the job inside one photo (stakes, posts, rail, done): one story per trade, one camera.
4. Very few words per screen: one short headline per step.
5. Glass info card over the style photo, and a small accent button, not a big banner button.
6. Three tools that make the site feel custom: style tabs, drag before/after, price estimator.
7. Calm, premium pacing: nothing flashes, nothing bounces.

### Taken from motionsites.ai (ideas, in my words)
1. **Hero as a scene, not a banner.** Their landing showcases (realty, "portal" style) lead with one full-screen moving image and a tiny amount of type. Expensive because the image does the selling and the type stays out of the way. Use: our story hero.
2. **Category thinking: hero, background, 3D, interactive are separate layers.** A page feels rich when one layer moves and the rest is still. Use: only the picture layer moves (zoom + crossfade); type and cards stay still.
3. **Animated backgrounds "made to convert".** Slow ambient motion behind a section reads as film. Use (no video, no libraries): a slow 1.00 to 1.06 zoom on the current frame, plus static film grain. Rejected live video loops (file size, Higgsfield credits; CEO default is stills only).
4. **3D and product-viewer pages (cars, "roadster", 3D viewer).** Expensive because you can turn the object. Use, in one file with CSS only: a light parallax between picture and caption, and the before/after slider as our "turn it" moment. Rejected real 3D (WebGL / libraries / model files): too heavy for one offline file and off-brand for a roofer.
5. **Photography / portfolio pages.** Big images, thin type, generous margins, grain. Use: the cream paper rhythm and the 1180px measure.
6. **Glass and soft depth on interactive pages.** Use: `.cine-glass` (backdrop blur with a solid fallback), glass slider handle and tab bar.

### Rejected and why
- Dark moody whole page (from the reel thumbnails): fights the cream calm and makes contractor sites feel like ads; dark is kept for picture scrims and one band only.
- Synthwave, cyberpunk, Y2K, pixel art, neo-brutalism (CEO style list): fun, but they say "startup", not "trust me with your roof".
- Neumorphism, claymorphism: low contrast, fail AA on cream.
- Scroll-jacking and pinned horizontal scroll: janky on phones, breaks keyboard and reduced motion.
- Particle / shader backgrounds, Three.js, Lottie: outside scripts or big files; not allowed in one offline file.
- Animated gradients and blobs: read as SaaS, not trades.
- Photo-like placeholders: would look like fake work photos. Placeholders are clearly drawn and labeled.

## Hand-off notes for cine-engine
- Import: `cineLook(theme)` gives `{ css, fontsHref, vars }`; `placeholderArt(trade, slotId, label)`; `cineSlots(trade)` (in cine-kit.js) lists every slot with id, kind, label and prompt; `CINE_ORDER` is the CEO's picture order.
- Slot ids: `story-<id>`, `style-<id>`, `before`, `after`. `form.cine.images[slotId]` overrides the drawing.
- 19 trades in the kit. restoration, builder and framing are new (CEO answer 2026-10-21) and still need trades.js entries (owner of trades.js); the kit is ready for them.
