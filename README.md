# Berea Case File

A static, one-phone mystery for two players. It starts with a drink at Fat Head's
in Middleburg Heights and continues at a few nearby real places. **Everything
outside this README, `docs/improvement-review.md`, and the preparation screen
may contain spoilers.** If you're one of the players, don't browse the repo.

## Status (2026-11-12, v2 overhaul)

- The case and puzzles were rebuilt so real places are the primary way to solve
  the location clues. Every location clue still has a "Can't access this clue"
  backup, and every puzzle has three hints and a full reveal.
- New case-file visual design with light and dark modes. Fonts are bundled, so
  it looks the same offline.
- Tested in an emulated phone browser: the whole case played end to end in light
  and dark, including the offline download and offline relaunch.
- 2026-11-12 end-to-end audit (v2.2): real-world quotes rechecked against the
  official sources. Several directions, a street name and a walking distance were
  corrected. A few story/logic inconsistencies were fixed, and updating an
  already-installed copy was tested.
- **Not yet done:** testing on a real iPhone Home Screen install of v2, any
  physical visit to the route, and timing with real players. The real-world
  details come from official online sources; no one has walked the route.

If the iPhone already has the game installed, open the installed app with a
connection, tap **Check again for updates**, wait for **Ready offline**, then
close the app completely and reopen it. Progress from any earlier v2 version is
kept. (Progress from the original v1 case isn't carried over.)

## Play

Open <https://arutt99.github.io/BereaHunt/> in Safari, Add to Home Screen, open
the installed app, tap **Download for offline play**, and wait for **Ready
offline**. Open the case only when you're together at the start.

## Develop

No runtime dependencies or build tooling beyond Python 3 and Node 20.

```sh
npm run serve                      # http://localhost:8000
npm run build                      # rebuild content + offline inventory after edits
npm test                           # engine/content unit tests (spoilers in output on failure)
node tests/playthrough.cjs [dir]   # full emulated playthrough (needs Playwright + Chromium)
```

- `site/` is the deployable app. `scripts/app.js` holds the UI, `scripts/engine.js`
  the rules, and `content/adventure.json` the built case. Answers are stored as
  salted hashes.
- The case is authored in `docs/development-spoilers/v2/case-source.json`
  (spoilers), and `scripts/build_case.py` builds it into `site/content/adventure.json`.
- `scripts/build_content_inventory.py` hashes every deployable file for the
  verified offline package (`content/offline-resources.json`).
- GitHub Pages publishes `site/` from `main` (`.github/workflows/pages.yml`).
  After deploy, `verify-deployment.yml` plays the live site end to end.

Client-side files can always be inspected; the app hides spoilers during normal
play but can't keep a determined source-reader out.
