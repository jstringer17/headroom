# Picture library

Built-in pictures per trade. The maker uses them **by default** when that trade is picked. Nothing to upload.

## Layout

```
sitemaker/library/<tradeKey>/<slotId>.webp     (also .jpg or .png)
```

- `<tradeKey>` is the key in `src/trades.js` (`fencing`, `roofing`, `pressure`, `hvac`, `restoration`, `builder`, `framing`, ...).
- `<slotId>` is the picture spot's id in `src/cine-kit.js` (story step ids, style ids, `before`, `after`).
  All 158 pictures with their Higgsfield prompts are in `org/art/higgsfield-kit.md`.
- A spot without a file keeps its labeled drawing. A trade without a folder keeps drawings everywhere.

## Adding pictures in bulk

Save the pictures as `<trade>-<slot>.jpg` (or `.png`, `.webp`), for example `roofing-old.jpg`,
`fencing-stakes.png`, `hvac-cold.jpg`. Put them in one folder, then:

```
node sitemaker/ingest.mjs path/to/folder            # sort them into the library
node sitemaker/ingest.mjs path/to/folder --dry-run  # only show what would happen
node sitemaker/ingest.mjs path/to/folder --force    # replace pictures that are already there
```

What it does:

- resizes to 1600 px wide and writes WebP of about 250 KB (uses `sharp` if installed, else `ffmpeg`, else Python with Pillow, else copies the file as it is);
- rejects unknown trade or slot names and lists the valid ones; the other files are still processed (exit code 2 if anything was rejected);
- warns about pictures that are not 16:9 or are over 2 MB;
- never replaces a picture that is already in the library unless `--force`;
- prints a table per trade: pictures in the library now and which slots are still missing.

Then rebuild and test: `node sitemaker/build.mjs && npm run test:sitemaker`.

## How the maker gets the pictures

`maker.html` always carries an index of the library (names and sizes). The pictures themselves travel one of two ways:

1. **Embedded** (default while the whole library is 6 MB or less): `node sitemaker/build.mjs` writes them into `maker.html` as base64. Works from a plain file, no extra files to publish.
2. **Separate files** (needed once the library is bigger, up to 158 pictures is about 40 MB): `node sitemaker/build.mjs --lazy --out maker-publish.html` writes a small page. The pictures are published as files next to it and the maker fetches a trade's pictures by relative URL (`library/<trade>/<slot>.webp`) the moment that trade is picked. If a fetch fails the maker says so and keeps the labeled drawings.

In both cases Preview and Download use the pictures as data URIs, so the **downloaded site is always one file**.

## Publishing with separate files

```
node sitemaker/publish-plan.mjs            # human summary and the exact mapping
node sitemaker/publish-plan.mjs --json     # same as JSON (also saved in sitemaker/test-out/publish-plan.json)
```

Run it from the repo root. It prints the build command, the page to publish (`sitemaker/maker-publish.html`)
and the Artifact `files` map `{ "library/<trade>/<slot>.webp": "sitemaker/library/<trade>/<slot>.webp", ... }`.
Pass that map as `files` with the page as `file_path`. Limits: 255 files and 64 MB per publish, 511 files
and 256 MB per artifact version (158 pictures of about 250 KB fit in one publish; the script warns if not).

## In the maker

For a trade with library pictures the form shows "Use the library pictures for this trade" (on by default)
and each spot shows its picture labelled "Library picture" with Replace and Remove. An upload or a pasted
link in a spot wins over the library picture, and so does the Hero picture box for the hero. Unticking the
box or removing a spot brings back the labeled drawing. Honest labels still apply: a photo that does not
show the style a row names is tagged "Sample photo" and job words stay neutral.

## Tests

`node sitemaker/test-library.mjs` (part of `npm run test:sitemaker`): builds a lazy page, serves it over http,
drives the real maker (pictures fetched only when a trade with files is picked, inlined into Preview and
Download, checkbox and fallbacks), runs the ingest script on generated pictures (rejects, warnings, no
overwrite, `--force`, `--dry-run`) and checks the publish plan.
