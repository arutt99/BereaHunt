# GitHub Pages publishing setup

Spoiler-free, **2026-11-11**. This addresses the reported README landing page
and provides a test origin for the required iPhone checks. It does not mark
phase 7, phase 8 or the final release Complete.

## Cause and fix

The screenshot shows GitHub's rendered repository README at
`https://arutt99.github.io/BereaHunt/`. The game entry point is
`site/index.html`; there is no root application index or earlier Pages workflow.
This is consistent with branch-root publishing, but the exact repository Pages
setting could not be read: the settings API returned `Forbidden`.

The [workflow](../.github/workflows/pages.yml) validates the complete application
and uploads **only the contents of `site/`**, placing its `index.html` directly at
the Pages project root. It does not upload the enclosing `site` directory,
repository README, research, authoring records, tests, development scripts or
`.git` files. The game's own runtime `scripts/` remains in the artifact.
Do not publish the repository root or move development records into the game.

It follows GitHub's [official static Pages workflow](https://github.com/actions/starter-workflows/blob/main/pages/static.yml)
with the artifact path narrowed to `site`, application validation before upload,
and separate read/build and write/deployment permissions. Pull requests validate
and package but cannot publish; only a main-branch push or main-branch manual run
can deploy. In-progress deployments are not cancelled.

## One-time repository setting

1. Open [Settings → Pages](https://github.com/arutt99/BereaHunt/settings/pages).
   Under **Build and deployment → Source**, select **GitHub Actions**.
   Do not choose “Deploy from a branch” with the repository root or `docs/`.
2. Merge the reviewed `codex/pages-publishing-fix` branch into `main`.
   The main-branch push runs **Deploy game to Pages**. No default-branch merge
   or settings change was performed by the assistant.
3. Wait for **Validate and package game** and **Publish game** to succeed in
   [Actions](https://github.com/arutt99/BereaHunt/actions/workflows/pages.yml).
   If the workflow ran before the Source setting was changed, use **Run workflow**
   on **main** after correcting it.
4. Open [the game](https://arutt99.github.io/BereaHunt/). Expect the neutral
   **Prepare the investigation** screen, then **Download complete adventure**.
   Downloading is spoiler-free; keep **Start the investigation** for play.

GitHub's branch-folder picker does not publish an arbitrary `site/` folder;
the Actions artifact is the intended publishing method. A `/BereaHunt/site/`
URL under the old root publication is not the final installation address.
Install from `/BereaHunt/` after the corrected deployment succeeds.

## Verification, updates and limits

The workflow runs the exact inventory, design/content self-tests, Python
regressions and Node runtime tests before upload. No regeneration or mutation of
reviewed app files occurs in CI. The artifact layout is tested locally under
`/BereaHunt/`, including complete preparation and offline reopening. Local proof
does not establish a successful GitHub Actions run or a live Pages response.

Actual local results: YAML/shell and main-only deployment gates pass; the artifact
contains exactly the 64 inventoried application resources plus their bootstrap.
Design/content self-tests, eleven Python tests and eight Node tests pass. A
Chromium smoke test of the extracted artifact reached **Ready offline**, closed
the page and reopened offline with the `/BereaHunt/`-scoped service worker, with
zero page errors. The game, content and package hashes themselves are unchanged.

GitHub also ran the actual PR validation for implementation commit `6275bf1`:
[run 43044360719](https://github.com/arutt99/BereaHunt/actions/runs/43044360719)
successfully validated the app and uploaded the Pages artifact. The production
job was skipped as intended on a pull request. [PR #9](https://github.com/arutt99/BereaHunt/pull/9)
is open; this CI result does not mean the game has been published.

Live reads of this Pages host were blocked in the assistant's environment by
HTTP 403 at the outbound proxy. No live game load, Pages setting change,
deployment, actual iPhone result or completed release is claimed. The user's
screenshot establishes the README response; it does not establish the game or
its installed/offline behavior.

After initial setup, reviewed app changes merged to main redeploy automatically.
For a failed application update, the app retains its compatible complete package
and progress. For a source rollback, revert the specific bad application commit
through a feature branch, validate the resulting inventory, and merge the reviewed
revert; a new deployment publishes it. Avoid force pushes or clearing player data.
Changes to a prepared app appear through **Offline & install → Check for a
complete update → Use verified update**; worker updates wait for open windows to
close. Do not treat an old cached preparation screen as proof of a new deployment.

Actual iPhone checks remain in the [test plan](testing/test-plan.md) and
[readiness record](testing/readiness.md). Full phase 8 additionally needs live
host/scope/offline/update smoke evidence after its prerequisite is satisfied.
