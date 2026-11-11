# Phase 7 test plan

**Final status:** phase 9 is Complete with a ready verdict. This repeatable
protocol remains the test reference; current evidence and practical limits are
in [readiness](readiness.md). The full software/browser matrix was rerun for
the final audit; expanded actual-device scenarios below remain unreported.

Spoiler-free, **2026-11-11**. Applies to the phase 6 application on fetched
`origin/main` **1667fad**, with phase 7 corrections on `codex/phase-7-testing`.
**Current acceptance, 2026-11-11:** the user confirms the spoiler-free iPhone
preparation/Home Screen/download/offline-reopen check works and directs us to
advance. That reported check is accepted for phase 7 advancement; do not ask
the players to repeat it. The expanded device protocol below records additional
coverage, not observations inferred from that confirmation or another player
assignment. Model/iOS and expanded lifecycle/update results remain unspecified.

Detailed case-bearing observations belong exclusively under
`docs/development-spoilers/testing/`. Neither player needs to preview the case.

## Repeatable software checks

From the repository root:

```sh
python3 scripts/build_content_inventory.py --check
python3 scripts/validate_design.py --self-test
python3 scripts/validate_content.py --self-test
python3 -m unittest discover -s tests -v
npm test
python3 -u scripts/test_browser.py --chromium /usr/bin/chromium
python3 -u scripts/test_release.py --chromium /usr/bin/chromium
git diff --check
```

Python 3.10+ and Node 20+ suffice for non-browser checks. Browser checks require
Python Playwright and a browser, plus permission to run a loopback server. They
serve temporary copies at `/BereaHunt/`; update/corruption fixtures do not edit the
working corpus. The release suite blocks optional external requests. Test output
uses neutral objective IDs; never publish gameplay screenshots or case-bearing
failure snapshots. The full-path suite's optional preparation screenshot is safe.

Both browser suites accept `--engine webkit` to repeat supporting engine tests
when the official Playwright WebKit browser and Linux dependencies are available.
An unavailable engine is a failed setup, not a skipped pass. Linux WebKit is
supporting evidence; it cannot establish iPhone Safari or Home Screen behavior.

| ID | Check | Expected result / evidence |
| --- | --- | --- |
| T01 | Content/design and real fact references | Only eligible Verified documentary inputs; correct gates, local resources, full reasoning and unique finite solutions; source/fiction separation |
| T02 | Correct, incorrect, empty, malformed and equivalent answers | Complete typed contracts; unlimited retries; no partial-field correctness oracle, unintended grant or draft loss |
| T03 | Full normal play | All controls usable, destinations confirmed before travel, safe-stop gate, eighteen collected records and concise ending; optional full explanation |
| T04 | Full assistance-heavy play | All hints in order without delay, cancellable explained reveals, identical progression and ending |
| T05 | Inaccessible-location and image failure | Unsolved references remain distinct from reveal; no GPS, visit assertion, missing image, staff or external network dependency |
| T06 | Sequential unlocking and direct view URLs | All locked records/findings remain closed; future titles/destinations/citations stay concealed, including accessible names |
| T07 | Evidence and phone-only work | Required earlier records automatically surfaced; case file remains reviewable; all aids have native/tap controls, drafts and undo/reset where appropriate |
| T08 | Save and closure | Drafts/assistance/ending restored after reload and closure at objective, finding, destination and travel stages; actual browser-process shutdown/reopen offline |
| T09 | Restart and persistence failures | Cancel preserves bytes; confirmed restart touches only the case key; corrupt/incompatible/unavailable/quota storage and concurrent windows produce truthful recoverable notices |
| T10 | Complete offline readiness | Verify every required resource, including unvisited chapters, all assistance and ending; no start after incomplete initial download |
| T11 | Interrupted/failed/content-mismatched updates | Retry works; prior complete package and exact progress survive; incompatible packages refused; cached missing/changed files invalidate readiness |
| T12 | Worker and package version lifecycle | An open page remains pinned; changed worker waits, complete compatible package is adopted on reopen, saved progress survives offline relaunch |
| T13 | Optional maps and sources | Only unlocked destinations linked; written directions remain local; unavailable external map cannot replace the case or prevent reference continuation |
| T14 | Mobile usability | Every objective at narrow/portrait/landscape widths and doubled text; bounded table scrolling, named large controls, useful focus, reduced motion, enlarged image/text equivalents |
| T15 | Puzzle/narrative review and timing | Trace all actual inputs and alternatives; reliable concise testimony, final synthesis supported before submission, assistance coherent. Distinguish automation duration from unmeasured human solving/driving |
| T16 | Critical-fact and access review | Reconcile delivered content with existing dated evidence, route estimates and restrictions; unsupported physical details remain optional/excluded, no invented field or source refresh |
| D01 | Actual iPhone Safari and installed Home Screen | User-reported preparation/install/download/offline-reopen pass accepted for advancement; expanded protocol below is not fully observed |

Execution status, exact environment and limitations are in
[readiness](readiness.md). The user has accepted the reported device check for advancement; retain the exact coverage limits.

## Expanded actual-device protocol

Use a physical iPhone and this candidate through a secure test origin. Record
model, iOS version/build, Safari version where exposed, candidate revision,
origin/base path and dates. No such device is attached to the current Linux
environment. Do not assign either player an advance case/solution inspection.
If an independent tester becomes available, provide concealed test material
separately. No helper or testing appointment is assumed.

1. Inspect neutral Safari preparation and Add to Home Screen installation. Verify
   icon/title, standalone launch, viewport/safe-area behavior and usable controls.
2. Establish Safari and installed-context download/save behavior explicitly;
   do not assume shared storage. Download in the installed context and verify
   complete readiness there before beginning.
3. In each relevant context, interrupt preparation, retry, enter drafts/assistance,
   close the app and reopen. In the installed app turn connectivity off, fully
   close/relaunch and finish a complete path including later tools/references.
   An already-loaded tab or a simulated standalone flag does not satisfy this.
4. Exercise both full play paths and safe no-visit continuation without exposing
   the case to intended players. Check keyboard, image zoom, comfortable taps,
   outdoors-oriented legibility, focus and return from an optional map.
5. Test compatible/failed package and waiting-worker updates, saving through
   background/foreground transitions, and truthful recovery from removed files.
   Do not clear a genuine player's progress to manufacture a test.
6. Preserve exact observations/failures, fix any defects and rerun affected checks.
   Record an expanded scenario as passed only with actual observations. D01
   advancement is already resolved by the accepted user check; this does not
   mark every scenario above as performed. Actual Pages-origin smoke is phase 8;
   phase 9's completed experience verdict is recorded in readiness.
