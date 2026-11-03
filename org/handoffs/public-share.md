# Handoff: make the maker publicly shareable (Opus)
Problem (CEO screenshot): the Artifact Share menu refuses public sharing: "This version couldn't be reviewed for public sharing ... use JPEG, PNG, GIF, or WebP for any images, MP4 or WebM for video, MP3 or WAV for audio."
Our maker page (built sitemaker/maker.html / maker-publish.html) and the generated preview contain SVG images (img src="data:image/svg+xml..." placeholder drawings, maybe CSS url() SVGs and favicon). Do:
1. Find every non-allowed media reference in the built maker page AND in every page it generates (all looks/trades): data:image/svg+xml in img/src/srcset/CSS url(), .svg files, any other format.
2. Replace them: placeholder drawings -> pre-rendered WebP (render once at build time from the SVG, e.g. with Playwright screenshot or sharp if available; keep small, <=60 KB each) or pure CSS; icons drawn as inline <svg> elements in HTML are fine ONLY if the reviewer accepts them; to be safe convert icon <img> SVGs to inline <svg> or CSS. Favicon: PNG.
3. Keep the downloaded/hosted sites identical in look; npm run test:sitemaker green from a fresh clone; hosting tests (cd hosting && npm test) green.
4. Report in org/inbox/chief.md: what changed, sizes, head sha. The chief republishes and tries Public.
Before you stop: set your BATON row done, commit, push.
