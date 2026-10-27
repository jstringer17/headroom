# Picture library

Built-in pictures per trade. `build.mjs` reads this folder and embeds every picture into
`maker.html`, so the maker uses them **by default** when that trade is picked. Nothing to upload.

## Layout

```
sitemaker/library/<tradeKey>/<slotId>.webp     (also .jpg or .png)
```

- `<tradeKey>` is the key in `src/trades.js` (`fencing`, `roofing`, `pressure`, `hvac`, `restoration`, `builder`, `framing`, ...).
- `<slotId>` is the picture spot's id in `src/cine-kit.js` (the story step ids, style ids, `before` and `after`).
  The list per trade, with the Higgsfield prompt for each, is in `org/art/higgsfield-kit.md`.
  Example for fencing: `stakes`, `posts`, `rails`, `done` (story) and `cedar`, `vinyl`, `rail3` (styles), `before`, `after`.
- Any spot without a file keeps its labeled drawing. A trade without a folder keeps drawings everywhere.

## Size

About 1600 px wide and 350 KB or less per picture (WebP quality about 80). `maker.html` carries every
picture as base64 and every downloaded site carries the pictures it uses, so keep the total small.
Resize before copying in, for example with Python and Pillow:

```python
from PIL import Image
im = Image.open("big.png").convert("RGB")
im = im.resize((1600, round(im.height * 1600 / im.width)))
im.save("sitemaker/library/fencing/posts.webp", "WEBP", quality=80, method=6)
```

## Add a trade

1. Make the pictures in Higgsfield from the prompts in `org/art/higgsfield-kit.md`.
2. Name each file after its slot id, put them in `sitemaker/library/<tradeKey>/`.
3. `node sitemaker/build.mjs` and `node sitemaker/test-engine.mjs`.

## In the maker

For a trade with library pictures the form shows a checkbox "Use the library pictures for this trade"
(on by default) and each spot shows its picture labelled "Library picture" with Replace and Remove.
An upload or a pasted link in a spot wins over the library picture. Unticking the box or removing a
spot brings back the labeled drawing. Honest labels still apply: a photo that does not show the style a
row names is tagged "Sample photo" and job words stay neutral.
