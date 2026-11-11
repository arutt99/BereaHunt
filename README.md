# Berea investigation

A static, one-phone cooperative adventure. Preparation is spoiler-free; the case
and later destinations stay concealed during normal play. The authored content,
research and development records contain spoilers: neither intended player needs
to preview them.

Phase 7 adds release testing and usability refinements. It remains **blocked on
required actual iPhone Safari/Home Screen validation**, with no released or
deployed experience claimed. See [testing readiness](docs/testing/readiness.md)
and the spoiler-free [test plan](docs/testing/test-plan.md).

## Run locally

Requires Python 3.10+; there are no runtime dependencies or build step.

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000/`. Use localhost for service-worker support; a phone
accessing a development server by a plain HTTP LAN address is not a secure
context. The eventual static host must use HTTPS. Only `site/` is deployable.
GitHub Pages configuration and live testing belong to phase 8.

## Prepare on iPhone

1. Open the game in Safari, choose **Share → Add to Home Screen**, then open the
   installed icon. Exact menu wording varies by iOS.
2. In that installed context, choose **Download complete adventure**. Wait for
   **Ready offline**, based on checking every required local resource.
3. Close and relaunch the installed app offline in the same context before the
   outing. Begin together during the planned customer drink visit at Fat Head’s.

Safari and the installed app may keep separate progress and downloads. Use the
same context throughout. Progress saves automatically, with visible warnings
if saving fails; pauses have no timer or penalty. Device/browser data removal
or eviction can remove progress or files. The app can repair a download with
connectivity, but cannot recover removed progress. Actual iPhone Safari and
Home Screen validation is a phase 7 check, not established by Linux tests.

Maps and external source links are optional and may need connectivity. Written
arrivals, puzzles, working aids, images/text equivalents, hints, references,
reveals and the ending are local. Use controls only while safely stopped.

## Validate

Node 20+ runs the runtime tests using its built-in test runner; npm installs
nothing. Python checks use only its standard library.

```sh
python3 scripts/build_content_inventory.py --check
python3 scripts/validate_design.py --self-test
python3 scripts/validate_content.py --self-test
python3 -m unittest discover -s tests -v
npm test
git diff --check
```

Rebuild after reviewing any deployable change:

```sh
python3 scripts/build_content_inventory.py
```

The browser suite additionally needs Python Playwright and Chromium already
installed (or installed in a development virtual environment). Run:

```sh
python3 scripts/test_browser.py --chromium /usr/bin/chromium
python3 scripts/test_release.py --chromium /usr/bin/chromium
```

It serves an isolated temporary copy at `/BereaHunt/`, runs real normal and
assisted paths, and injects download/update/cache/storage failures. It never
changes the working application, contacts an external service or prints case
answers. Optional `--preparation-screenshot /tmp/preparation.png` captures only
the neutral preparation screen. A sandbox that blocks local sockets must allow
the local server/browser command. These tests support, and do not replace,
iPhone, independent experience, field and live-host review.

The release suite adds every-objective layout/text/focus checks, all locked view
URLs, image/map failures, stage-by-stage offline reopening, live window conflicts
and worker upgrades. Layout probes use separate pages at 320 × 844, 390 × 844
and 844 × 390, with normal and doubled text; they do not establish actual-device
orientation behavior. Both suites accept `--engine webkit` when that Playwright
browser is installed. The current environment denied its official download;
no WebKit or actual iPhone pass is claimed. Detailed case-bearing evidence stays
outside this README and the deployable site.

## Structure and updates

- `site/`: deployable shell, native JavaScript modules, styles, icons and structured
  content. No framework, backend, account, key, paid service, audio or remote font.
- `scripts/`, `tests/`: inventory/content/runtime/browser checks, never deployed.
- [Authoring guide](docs/content/authoring-guide.md): data editing, versioning and
  disclosure gates. Concealed design/research/test details are separate.

Downloads stage in an isolated cache and verify actual sizes and SHA-256 hashes
before activating. An open app stays pinned to its complete package; **Use
verified update** reopens a verified replacement with compatible progress. Failed
updates retain the previous complete version. Unsupported versions are refused;
malformed/incompatible saves are retained until an explicit confirmed restart.
Restart affects only this adventure's save, retaining its download. Another
window cannot silently overwrite a newer save.

When developing against an existing prepared app, use **Offline & install → Check
for a complete update → Use verified update** to load reviewed changes; an ordinary
reload deliberately keeps the verified version until an update is downloaded.
Changes to the service worker itself wait for existing app windows to close.
Do not force-activate workers or clear users' storage as an update strategy.

Normal UI gates protect surprise, including direct view URLs and source citations.
Static files and cached solutions remain inspectable by deliberate source access;
this app does not provide server-side secrecy. Research, author solutions, tests
and personal data must stay outside the deployed artifact.
