# Deep Dive · Krillion archive

An independent, offline trivia game inspired by [Krillion](https://krillion.io). Open either [`Deep-Dive.html`](./Deep-Dive.html) or [`index.html`](./index.html) directly in a modern browser. Both files include the complete game, artwork, font, and bundled dive archive; no build step, server, or network connection is required to play.

## Play

- Choose one of the archived daily dives, the number of prompts (1–7), and a timer (5–180 seconds per prompt).
- Score with Krillion's rarity tiers: Plankton (10), Schooler (30), Rare (60), Deep cut (85), and One in a Krillion (100). Each point adds 10 metres.
- Use **Edit Game** or **Import Pack** for custom games. Packs and portable HTML exports remain supported.

## Publish with GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select the branch containing these files and the **/(root)** folder, then save. GitHub Pages will serve [`index.html`](./index.html) as the site homepage; `Deep-Dive.html` remains available as a direct link. The game and its artwork/data are embedded in both pages, so no build step, backend, or project-site path configuration is needed.

Play history and imported updates are stored in the browser for the published site and do not transfer from a local-file copy or another browser. Export a backup before switching browsers or clearing site data.

## Database and weekly updates

Both HTML files embed the supplied [`krillion-dives.json`](./krillion-dives.json) archive (127 dives) and [`krillion-answers.csv`](./krillion-answers.csv) (27,849 answer records). The game uses those records to build the archived prompts and answer lists. The JSON's tier totals can be larger than the answer samples present in the CSV; the offline game accepts the answer rows actually included in the CSV, not answers fetched from the live service.

To refresh the local copy, open **DATABASE / MY DIVES → IMPORT WEEKLY DATA** and select both refreshed files. The archive is merged and saved in this browser using IndexedDB. Each started dive and every submitted guess—including invalid answers, skips, and timeouts—is also logged locally. Nothing is uploaded or synced.

Use **EXPORT FULL BACKUP** to save the updated archive and play history as one JSON file, or **EXPORT ANSWER LOG CSV** for a spreadsheet-friendly answer log. Keep a backup before clearing browser data or moving to another device. A standalone HTML page cannot write changes back to the original files on disk.

The tier sprites and underwater artwork are embedded from krillion.io and remain the property of their creators. This independent project is not affiliated with Krillion. The pixel font is VT323 by Peter Hull (SIL Open Font License).
