# Deep Dive · Krillion archive

An independent trivia game inspired by [Krillion](https://krillion.io). Open either [`Deep-Dive.html`](./Deep-Dive.html) or [`index.html`](./index.html) directly in a modern browser. Both files include the complete game, artwork, font, and bundled dive archive. Stored answers can be played offline; optional AI judging for answers missing from the archive requires an internet connection and a separately deployed Worker.

## Play

- Choose one of the archived daily dives, the number of prompts (1–7), and a timer (5–180 seconds per prompt).
- Score with Krillion's rarity tiers: Plankton (10), Schooler (30), Rare (60), Deep cut (85), and One in a Krillion (100). Each point adds 10 metres.
- Use **Edit Game** or **Import Pack** for custom games. Packs and portable HTML exports remain supported.

## Publish with GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select the branch containing these files and the **/(root)** folder, then save. GitHub Pages will serve [`index.html`](./index.html) as the site homepage; `Deep-Dive.html` remains available as a direct link. The game and its artwork/data are embedded in both pages, so the static site itself needs no build step.

Play history and imported updates are stored in the browser for the published site and do not transfer from a local-file copy or another browser. Export a backup before switching browsers or clearing site data.

## Database and weekly updates

Both HTML files embed the supplied [`krillion-dives.json`](./krillion-dives.json) archive (127 dives) and [`krillion-answers.csv`](./krillion-answers.csv) (27,849 answer records). Those records still provide the official answer examples and scoring anchors. Exact and typo-corrected matches work offline; for other answers, use the optional online AI judge or self-check and choose a tier offline.

To refresh the local copy, open **DATABASE / MY DIVES → IMPORT WEEKLY DATA** and select both refreshed files. The archive is merged and saved in this browser using IndexedDB. Each started dive and every submitted guess—including invalid answers, skips, and timeouts—is also logged locally. When you accept an unlisted answer in offline self-check, it is added to your personal answer memory and can be reused for the same prompt and answer in later dives, even without a connection. You can optionally attach an HTTPS source link; links are labeled player-provided and are not independently verified. These memories are not added to the official archive or treated as verified answers.

Use **SHARE DISCOVERIES** in the database screen to export a small JSON file containing only your player-judged answers and optional source links; **IMPORT DISCOVERIES** merges one of these files into this browser. That makes discoveries easy to move between home and school or share with friends without sharing the full play log. The database screen lists recent remembered answers, lets you remove a single answer (or clear the whole memory), and shows any player-provided source link. **EXPORT FULL BACKUP** still saves the updated archive, play history, and personal answer memory together; **EXPORT ANSWER LOG CSV** creates a spreadsheet-friendly answer log. Keep a backup before clearing browser data. A standalone HTML page cannot write changes back to the original files on disk.

## Optional AI judging for unlisted answers

The static game cannot safely hold an AI provider secret. The optional backend is a Cloudflare Worker. By default it uses Google's `gemma-4-26b-a4b-it` through Workers AI, which Cloudflare currently documents with a free allocation of 10,000 AI Neurons per day. See [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) and the [model details](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/).

1. Create a free Cloudflare account and install a current Node.js version.
2. Check `ALLOWED_ORIGIN` in [`wrangler.toml`](./wrangler.toml) and set it to the exact origin serving the game (the default is `https://kamilgm.github.io`; for GitHub Pages, use `https://username.github.io`, without a path). This is a browser-origin restriction, not authentication.
3. From the repository directory, run `npx wrangler login`, then `npx wrangler deploy`. Cloudflare prints the deployed Worker URL.
4. Open **DATABASE / MY DIVES** in the game. Paste the Worker URL with `/judge` appended (for example, `https://your-worker.your-account.workers.dev/judge`) into **WORKER URL**, then save.

For home deployment with access to Claude Mythos 5.2, store an Anthropic API key on the Worker with `npx wrangler secret put ANTHROPIC_API_KEY` (enter it only at Wrangler's secure prompt; never put it in either HTML file). The Worker then uses Mythos and its web-search tool (up to two searches per answer), and shows citations with accepted answers. Mythos access requires an Anthropic-verified organization and is paid: currently $8 per million input tokens and $40 per million output tokens, plus any applicable search charges. See [Mythos availability and pricing](https://platform.claude.com/docs/en/models/mythos-5-2/overview) and the [web-search tool docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool). Without that secret, the Worker uses the free-allocation Gemma model instead. The Worker also rate-limits requests to about 10 per IP per minute; Cloudflare notes that these limits are approximate, not a hard abuse-prevention guarantee.

The judge receives the prompt, unlisted answer, and a sample of stored tier examples. AI can make mistakes or return “uncertain”; accepted new answers receive an estimated tier. Successful AI judgments and their citations are cached in this browser for later offline play. If the Worker is missing or blocked and an answer has not been AI-judged before, the game offers an offline self-check: the player can accept it and select its tier. Self-checked answers are not independently verified. Exact archived matches continue to work offline. Unlisted prompts and answers are sent through the Worker to Cloudflare AI, or to Anthropic when the Mythos secret is configured; provider keys stay on the Worker and are never placed in the page.

School web filters may block Cloudflare Worker domains. This setup does not bypass those filters; access depends on the school's policy, so ask the school's IT staff whether the service is allowed. The offline self-check remains available when the Worker cannot be reached.

The tier sprites and underwater artwork are embedded from krillion.io and remain the property of their creators. This independent project is not affiliated with Krillion. The pixel font is VT323 by Peter Hull (SIL Open Font License).
