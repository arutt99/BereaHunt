# Phase 7 readiness

Spoiler-free, **2026-11-11**. **Phase 7 — Blocked on required actual-device
validation.** Software testing and refinement can be delivered without declaring
an untested iPhone release candidate complete. Phase 8 is not yet eligible.

The [test plan](test-plan.md) defines the repeatable matrix and actual-device
protocol. The case, route, answers, fact classifications and confirmed outing
requirements are unchanged. Neither intended player needs to inspect the mystery.

## Delivered refinement

Source/explanation expanders now have larger tap targets. Evidence comparison,
grid generation and working-area undo/reset retain useful keyboard focus after
redrawing. Requesting a hint focuses the newly displayed hint. Application
package version is **1.0.1**; content/state compatibility is preserved.

The existing full normal/assisted regression suite now supports either Chromium
or WebKit. A separate release matrix covers every objective, locked view URLs,
incorrect typed answers, relevant evidence, image failures, optional map failure,
stage-by-stage closure, responsive text, focus and worker updates. Concealed
results and a separate field/access review are retained for later sessions.

## Coverage and limits

| Area | Current evidence / limitation |
| --- | --- |
| Content, reasoning and state | Content/design self-tests, eleven Python regressions and eight Node tests pass again on the final candidate, including all modeled normal/assistance paths and answer variants |
| Normal and assisted application | Both full paths, all aids, hints/references/reveals, complete offline browser-process relaunch, persistence/restart and download/update/cache faults pass in local Chromium |
| Additional release matrix | Every objective at three layout sizes and doubled text; all locked view URLs, empty/wrong typed answers, focus/controls, enlarged/failed images, maps, multi-stage offline closure, live window conflicts, same-size content-hash mismatch and waiting-worker upgrades pass. No uncaught page errors |
| Visual review | Neutral 390 × 844 preparation screen inspected; no future case/destination information. Layout/text/zoom checks support readability; no actual outdoor sunlight or physical-device legibility trial |
| Environment | Linux, Python 3.12.14, Node 24.22.1, Python Playwright and Chromium 156.0.8078.79; local `/BereaHunt/` subpath, compressed static resources |
| Actual iPhone Safari/Home Screen | **Required blocker D01:** no physical iPhone attached; model/iOS unknown. Installation, standalone closure/relaunch, background lifecycle and Safari/installed storage separation have not run |
| Supporting WebKit | Not run. Official WebKit 26.5 (Playwright build 2336) installation failed: environment policy returned HTTP 403 `Domain forbidden` for both official download hosts. This is separate from D01 and would not replace it |
| Field/access | Desk reconciliation against existing 2026-11-11 research; no new source retrieval, physical walk/drive, live map routing or current sign inspection. Essential inputs remain supplied Verified documentary references; current posted restrictions and conditions control |
| Experience and pacing | Author reasoning/narrative review; no independent tester, human difficulty/sunlight trial or measured three-hour outing. The 180-minute budget and interaction proportion remain authored estimates |
| Deployment/release | No Pages configuration, live deployment or final release verdict performed; those remain phases 8–9 |

Only D01 currently blocks phase 7's required device completion check; optional
independent testing and field visits have not been invented as new approval or
scouting gates. No software test certifies future weather, access or storage
retention. A date-specific access/conditions refresh can be recommended if the
outing date becomes known; none is scheduled.

## Resume and delivery

Run the remaining device protocol on an available physical iPhone through a
secure test origin, record the exact context, and fix/rerun any resulting failures.
Keep test solutions away from both intended players. Update this verdict and
the build tracker only when the required check has actually passed; do not infer
it from emulation or proceed to another phase under this request.

Delivery branch: `codex/phase-7-testing`, based on fetched main `1667fad`.
The [build-plan handoff](../../BUILD_PLAN.md) records the scoped delivery revision.
