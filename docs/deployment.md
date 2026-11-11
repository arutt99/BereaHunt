# GitHub Pages deployment

Spoiler-free, **2026-11-11**. The deployed release candidate is available at
[the game](https://arutt99.github.io/BereaHunt/). **Phase 8 — Complete.** Phase 9's final experience verdict
is separate from publication. Neither player needs to preview the case.

## Published candidate and evidence

- Source revision: `7c3d785368ed12d3642addc41a5f693dc2049991` (merged main).
- Application version **1.0.1**; content version **1.0.0**; state compatibility **1**.
- Production [run 43044731665](https://github.com/arutt99/BereaHunt/actions/runs/43044731665)
  completed on 2026-11-11. **Validate and package game** (job 130605558312) and
  **Publish game** (job 130605668771), including actual Pages deployment, succeeded.
- The user confirms their iPhone preparation/Home Screen/download/closed-app
  offline-reopening check works and directs advancement. This is user-reported
  device coverage; exact model/iOS and expanded device scenarios are unspecified.
- Actual-origin automated smoke: **Pass**, [run 43051242904](https://github.com/arutt99/BereaHunt/actions/runs/43051242904),
  job **130628678526**, using verification revision `6af7be9`, Python 3.12.16
  and Chrome 156.0.8078.79 on Ubuntu 24.04.5. All 65 files match the source
  revision above; the complete browser protocol below passes with no uncaught
  page errors. Bootstrap SHA-256: `c83285ab01dcc99af507d7f82aad35e3da7c585999142ff90ead9baabf8ada1e`.
  Workspace requests receive proxy HTTP 403; this actual live evidence comes
  from the GitHub-hosted runner, separately from local fixture checks.
  No gameplay screenshots or solution-bearing logs were uploaded.

## Install and prepare

Open the game URL in iPhone Safari, use **Share → Add to Home Screen**, and open
that icon. Choose **Download complete adventure** and wait for **Ready offline**.
Installation and complete download preserve the surprise; keep **Start the
investigation** for play. The already-reported user check is accepted; these are
standing installation instructions, not a request to repeat it.

Use the same installed context throughout. Safari and Home Screen saves/downloads
may be separate. Progress saves automatically; ordinary pauses have no timer.
Offline play includes later content, all phone tools, references, hints, reveals
and the ending. Optional maps and source links may need connectivity. Only use
controls while safely stopped. Device data removal/eviction can remove files or
progress; repairs require connectivity and cannot recover removed saves.

## Repeatable publishing and verification

Pages **Source** is **GitHub Actions**. The existing
[publishing workflow](../.github/workflows/pages.yml) validates the app, uploads
only the contents of `site/`, and deploys only a main-branch push/manual run.
Do not publish the repository root or `docs/`; the final URL is `/BereaHunt/`,
not `/BereaHunt/site/`. Successful production configuration/deployment is now
observed; the prior README issue is historical.

For a reviewed application/content change:

1. Fetch current main and use a feature branch. Preserve IDs/state compatibility
   unless implementing an explicit migration. Bump application/content versions
   as appropriate; see [authoring](content/authoring-guide.md).
2. After reviewing `site/` changes, run `python3 scripts/build_content_inventory.py`.
   Run its `--check`, both design/content `--self-test` validators, Python unittest
   discovery, `npm test`, both browser suites and `git diff --check` as documented
   in [README](../README.md). Commit and push the scoped branch; open a PR.
3. After authorized merge to main, wait for **Deploy game to Pages** to finish.
   Use its **Run workflow → main** option to retry publication after a repaired
   setup. A PR's validation/artifact upload alone does not deploy.
4. **Verify live Pages game** automatically follows a successful main publishing
   run after its workflow is merged. It can also be run manually from Actions.
   A verification PR runs against a separately checked-out main snapshot rather
   than pretending its unmerged app is deployed. The expected SHA appears in
   **Record expected revision**. Avoid merging another release during a smoke run;
   if live/main change concurrently, rerun against the completed deployment.

The live check reads all 65 expected files and compares actual response bytes,
checks MIME types/internal-file exclusion and the `/BereaHunt/` worker scope,
then uses disposable browser profiles for full normal/assisted offline paths,
save/restart, gated views, optional-map failure and safe no-visit continuation.
It tests failed and same-version verified package checks, then fully shuts down
and relaunches Chromium offline to finish the case. It never alters production
content or uses a player's browser profile. Changed-version packages, incompatible
updates and waiting-worker upgrades are exercised in the existing isolated local
fixtures; a same-version live check does not establish a production upgrade.

With Python Playwright/Chromium installed and permitted network access, run the
same check locally against an exact expected deployed checkout:

```sh
python3 scripts/test_browser.py --chromium /usr/bin/chromium \
  --live-url https://arutt99.github.io/BereaHunt/ \
  --expected-site /absolute/path/to/expected-checkout/site
```

## Updates and rollback

An installed app stays pinned to its verified complete package. To adopt reviewed
changes, use **Offline & install → Check for a complete update → Use verified
update**. The final button appears only when a different complete package is
available; a same-version check reports that the package is up to date. Failed
updates preserve the prior complete package and exact save. Service-worker code
updates wait for existing app windows to close. Never clear player data or force
worker activation to publish an update.

For a bad release, revert the specific application commit on a feature branch,
review/rebuild its resource inventory, run the same checks and obtain the normal
merge before Pages republishes it. Verify the resulting deployed SHA and live
smoke again. Coordinate compatibility/version metadata; code rollback is not a
save migration. Prepared clients deliberately retain a verified package until
they check/adopt an update, so an ordinary reload is not proof of replacement.
No destructive production rollback was performed as a test.

## Hosting and verification limits

Hash URLs (`#evidence/ID`, `#puzzle/ID`) use the root app document and the same
unlock gates; arbitrary server paths are not application routes. All resources
use the project base path. Only the 64 inventoried app resources and their
bootstrap are published. Author research/design/solutions documents, developer
scripts/tests, repository metadata and credentials are excluded. Runtime solution
JSON necessarily remains inspectable in this static download; UI gating protects
normal play, not deliberate source inspection.

Core play uses no backend, account, API key or paid service. Browser automation
is Chromium evidence, not an iPhone or route walkthrough. The user's device
check remains separately attributed; no independent playtest, measured outing,
new field/source check or final phase 9 verdict is implied. Access research dates,
route/pacing estimates and unknown outing date retain their documented limits.
