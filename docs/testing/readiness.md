# Testing and deployment readiness

Spoiler-free, **2026-11-11**. **Phase 7 — Complete with user-accepted device
coverage. Phase 8 — In progress.** The user confirms the spoiler-free iPhone
preparation/install/complete-download/closed-app offline-reopen check works and
explicitly directs advancement. That check is recorded as a **user-reported pass**,
not a test performed by the assistant. It closes the former D01 advancement gate.
Exact model/iOS and the expanded physical-device gameplay/update/storage matrix
were not supplied; no full device protocol or independent playtest is inferred.

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
| Actual iPhone Safari/Home Screen | **User-reported pass, accepted for advancement:** preparation, Home Screen installation, complete download and closed-app offline reopening work. No device attached to the assistant; model/iOS unspecified. Broader background/update/storage-context and full-path device observations were not supplied |
| Supporting WebKit | Not run. Official WebKit 26.5 (Playwright build 2336) installation failed: environment policy returned HTTP 403 `Domain forbidden` for both official download hosts. This is separate from D01 and would not replace it |
| Field/access | Desk reconciliation against existing 2026-11-11 research; no new source retrieval, physical walk/drive, live map routing or current sign inspection. Essential inputs remain supplied Verified documentary references; current posted restrictions and conditions control |
| Experience and pacing | Author reasoning/narrative review; no independent tester, human difficulty/sunlight trial or measured three-hour outing. The 180-minute budget and interaction proportion remain authored estimates |
| Deployment/release | Publishing fix merged in `7c3d785`; production [run 43044731665](https://github.com/arutt99/BereaHunt/actions/runs/43044731665) successfully validated, packaged and published. Live smoke is being verified in phase 8; see [deployment](../deployment.md). Phase 9 remains outstanding |

The former D01 advancement blocker is resolved by the user's explicit acceptance
of their device check ([D14](../decisions.md)). Expanded device tests, optional
independent testing and field visits are not silently converted into passes.
No repeat player check or advance case inspection is pending. No software test
certifies future weather, access or storage retention. A date-specific access
review remains appropriate if the outing date becomes known; none is scheduled.

## Phase 8 verification

The current deployed candidate is main `7c3d785368ed12d3642addc41a5f693dc2049991`,
application **1.0.1**, content **1.0.0**, state compatibility **1**.
GitHub confirms that both production validation/package and publication jobs
succeeded. The workspace proxy rejects the live host with HTTP 403, so a
read-only GitHub Actions browser check verifies the actual origin independently.
The check uses isolated profiles; it cannot affect a player's installed save.

The deployment protocol compares all 65 published file bytes to a main-branch
snapshot, checks MIME types and exclusion of internal files, service-worker scope,
normal and assistance-heavy offline paths, references, hints, safe no-visit
continuation, optional-map failure, saves/restart, failed and same-version
verified package checks, and full browser-process offline reopening through the
ending. A changed-version/worker upgrade remains covered by the local phase 7
fixtures; production is not mutated to manufacture an update.

See [deployment](../deployment.md) for the live-check result and repeatable
publishing/update/rollback instructions. Phase 9 is the next experience audit
once phase 8's live check passes. No final release verdict is claimed here.
