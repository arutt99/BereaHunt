# DEVELOPMENT SPOILERS — phase 7 testing and refinement

**2026-11-11. Phase 7 remains Blocked by required physical-iPhone validation.**
Base: fetched `origin/main` **1667fad** (merged phase 6). Delivery branch:
`codex/phase-7-testing`. These are author/software checks, not independent
player feedback, a physical walkthrough or live-host results.

## Execution environment and commands

Linux; Python **3.12.14**, Node **24.22.1**, Python Playwright **1.62.0**,
Chromium **156.0.8078.79** at `/usr/bin/chromium`. Local temporary static copies
use `/BereaHunt/` and gzip-compressed responses. The sandbox disallowed loopback
socket creation; approved outer commands run the server/browser. No external
service supplies a core game input.

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

The two browser scripts accept `--engine webkit`; no WebKit result is claimed.
Official Playwright WebKit **26.5**, build **2336**, was absent. Installation into
`/tmp/berea-playwright` failed with HTTP 403 **Domain forbidden** at both
`cdn.playwright.dev` and `playwright.download.prss.microsoft.com`, including
the installer's fallback URLs. This is an enforced download-policy blocker,
not a Safari failure. No policy or credential was changed to bypass it.

There is no attached physical iPhone. Device model, iOS build, actual Safari,
installed standalone lifecycle and Safari/standalone storage-context behavior
are **not tested**. Linux WebKit, even if available, would not close that gate.

## Executed checks

The fetched base passed all existing checks before changes: eight Node runtime
tests (all 256 solve/reveal combinations and typed variants); eleven Python
regressions; 1,024 design paths/eighteen invalid design mutations; 65,536 content
paths/thirty invalid corpus mutations and the eight actual-input solution models.
The original Chromium browser suite also passed both complete paths, full offline
browser-process shutdown/reopen, drafts, hints/references/reveals, initial download
interruption, failed/compatible/incompatible updates, durable version pinning,
cache eviction/repair, corrupt saves, confirmed/cancelled restart, unavailable
and quota storage. These were actually rerun in this task, not inherited passes.

**Final candidate: all commands above pass again.** Eight Node and eleven Python
regressions, both validators' full self-tests and the complete 64-resource inventory
pass after the application changes. No new blocking application failure remains
from the executed software matrix. The spoiler-free coverage map is in
`docs/testing/test-plan.md`; do not use this detailed record as player prep.

The full browser suite passes the actual normal path and fully assisted offline
path again, including all 24 hints, cancellation/confirmation, working drafts,
final atomic pair, retained optional full explanation and all eighteen records.
It fully shuts down and reopens a persistent browser process offline, restores
draft/hint and finishes. Failed/incompatible/compatible updates, old client pins,
missing late cached evidence, offline repair/retry, exact save preservation,
corrupt/incompatible bytes, unrelated storage, unavailable saving and quota retry
all pass. No uncaught page errors. The neutral preparation screenshot at
`/tmp/berea-phase7-preparation.png` was actually inspected at 390 × 844 and is not
committed; no gameplay screenshots were exposed or committed.

Additional `test_release.py` passes in **59.1 seconds of automated execution**:

- Every objective at 320 × 844, 390 × 844 and 844 × 390 with 18px and 36px root
  text. No viewport-wide overflow; tables scroll within their own regions.
  Visible controls/summaries are at least 48px high (47px tolerance), form controls
  are named, IDs unique and reduced-motion button transitions disabled.
- Every still-locked E00–E17 / P01–P08 view URL at each stage: no new grants,
  future dialogs or chapter titles. Existing granted records remain reviewable.
- Every empty and wrong answer type preserves the exact save/draft and focuses
  feedback; typed variants and malformed times are also covered by runtime/full
  browser checks. Compare, grid build/reset/undo and new hints retain useful focus.
- Required evidence IDs are rendered beside every task. All rendered reference
  figures load/zoom offline; forced image failure retains textual inputs. Unsolved
  reference dialogs and cancelled reveals preserve solving choices and gates.
- Close/reopen fully offline during objectives, findings, both destinations and
  both travel modes. Both optional external map popups are unavailable/blocked
  without losing the case; both no-visit routes work without a GPS or visit claim.
  The first full path and these unvisited stages start after an offline page
  relaunch, not solely in an already-loaded tab.
- Real storage events block a stale second window; re-reading restores the newer
  draft. A same-byte-length changed late solution body is rejected by its hash,
  preserving the old package and exact save. A changed real worker installs and
  waits while clients remain open; a valid package downloads without moving the
  current client; close/reopen activates the new worker and compatible package,
  retaining progress through another offline relaunch.

One release-harness defect was isolated and corrected: repeatedly resizing an
interacting Chromium mobile page retained visual-viewport zoom (1.375 scale,
82px offset), distorting automated pointer coordinates despite nonoverlapping DOM
targets. Fresh layout-only pages now receive their size **before** navigation and
close after each probe, leaving the gameplay page unchanged. This is a harness
correction, not an application fix or a pass for physical orientation lifecycle.
Earlier harness selector/popup-event assertions were corrected against actual
DOM behavior. Case-bearing Playwright failure snapshots are suppressed; failures
report neutral checks/line numbers. No force-click workaround was used.

## Defects and refinement

| ID | Severity | Finding / correction | Verification |
| --- | --- | --- | --- |
| P7-01 | Moderate usability | Unstyled source/explanation summary controls had roughly one line of tap height. Give every summary a minimum 48px height and padding, retaining the existing larger document headers | Target geometry regression includes every visible summary at every objective |
| P7-02 | Moderate accessibility | Compare/grid-build/undo/reset redraw removed the focused button; inspected code lacked stable IDs. Add stable IDs so existing focus-preserving redraw can restore them | Keyboard-focus assertions for compare, grid generation, reset and undo; no answer/content change |
| P7-03 | Moderate accessibility | Showing a hint scrolled it into view but left focus on the removed control/body. Give hint items programmatic focus and focus the newest hint | Focus assertion after each objective's first hint; reduced motion remains respected |
| D01 | Blocking required coverage | No actual iPhone Safari/Home Screen installation/lifecycle/storage/offline-relaunch evidence | Open; precise physical-device protocol in the spoiler-free test plan |
| W01 | Supporting coverage unavailable | Official Linux WebKit install denied by environment policy | Open limitation; no pass and no implication that an engine test replaces D01 |

Application version is **1.0.1**, inventory rebuilt from actual bytes. Adventure
contentVersion/stateCompatibility, story, sources, fact statuses, answers and route
are unchanged. Updates remain compatible with existing saves. No new service,
framework or deployment was introduced.

Final bootstrap SHA-256:
`c83285ab01dcc99af507d7f82aad35e3da7c585999142ff90ead9baabf8ada1e`.
Its 64 required resources total **203,192 decoded bytes**, excluding the
self-hash-excluded bootstrap. Documentation/link checks pass (49 local links),
the public handoff scan is neutral, and the case corpus/source/research bytes
were compared with fetched base main and remain unchanged.

## Puzzle and narrative desk review

Reviewed the actual P01–P08 prompts, surfaced inputs, solution files and E17
against the earlier blueprint/content review and rerun finite solvers:

- **P01:** fixed LC17/H0 plus exact completed receipt joins uniquely ends at R1;
  LC71's R9 is a different job, not an equally valid alternative.
- **P02:** source-supported causal order and the fictional three-profile bench
  comparison justify both halves. Real erosion is an analogy, not a physical
  forensic claim. A correct order alone cannot complete the full answer.
- **P03:** the foundation keyword, I/J convention, row filling and row/column
  operation are supplied. The cipher has literal plaintext; reference selectors
  motivate the next public approach. F021/S08 naming citations cannot shortcut it.
- **P04:** owner/type/batch filtering retains both immutable serials through the
  descriptive merge. The real quarry reference does not define invented geometry
  or imply that labels erase original identities. Both ineligible records fail
  explicit criteria; one correct serial alone is incomplete.
- **P05:** the serial-linked signed modern commission defeats the unsupported
  salvage proposal. Reliable records stay reliable; the proposal is explicitly a
  claim under examination. Material history does not date the specific object.
- **P06:** one four-minute-fast clock corrects both readings to the interval
  after 15:02 and by 15:10. No arbitrary exact-minute inference or live timer.
- **P07:** concise certified records and one-to-one constraints produce exactly
  one full badge roster. No liar, name stereotype or field-by-field answer oracle.
- **P08:** all six required findings are surfaced before submission; payload,
  receiver, corrected window, both permissions and badge identity jointly isolate
  Quinn/O43. The later courier handoff cannot explain the first diversion. All
  closed-case assumptions precede the final answer; E17 introduces no rescuing
  confession or essential missing clue.

Normal and all-reveal paths receive identical rewards/ending. Full reveals explain
the supported operation and alternatives; references preserve unsolved inputs.
The ending restores identity/ownership and resolves the false provenance without
implicating real staff, requiring an actual report or imposing an essay. Prior
evidence is surfaced rather than relying on memory. Three working boards, native
selects, an editable local cipher grid and draft/undo support phone-only play.
No new ambiguous alternative or unsupported essential input was found in this
author review; this is not an independent difficulty/enjoyment test.

## Pacing and reading audit

Actual corpus counts using the validator's plain-text equivalent and a
word-boundary count: **2,203 unique core evidence words**, **134 chapter-introduction
words**, **222 prompt words**. Core ending is **100 words** (74-word resolution
plus 26-word close), with the full-case explanation separately optional. Longest
ordinary evidence paragraph is **74 words**. Counts exclude optional explanations,
assistance, practical arrival copy and UI; evidence may be revisited, so these are
not total words seen or a promise of reading speed.

The same 180-minute budget reconciles: 72 puzzle + 30 travel + 20 optional
observation + 35 opening/reading/transitions + 8 ending + 15 contingency. Puzzle
targets 6/10/9/10/9/9/10/9 minutes total 72, and manipulation allocation 18/72 is
25%. Automated test execution is measured separately in suite output and is not
human solve/reading time. No independent player, timed drive/walk, three-hour
outing or sunlight/device legibility trial occurred. These are explicit
nonblocking experience uncertainties, not fabricated observations.

## Factual and release boundaries

See [field review](field-review.md): the six Verified documentary dependencies,
operator navigation pins, access restrictions, authored walk/drive estimates,
winter cutoff and every safe no-visit continuation were reconciled. No new
source retrieval or physical check occurred, and none of the original research
was upgraded. Unknown outing date, future conditions and ordinary-space
availability retain their stated limits. No player reconnaissance/helper is
presumed. Only the physical-device protocol can close D01.

**Verdict:** scoped refinement/testing work is deliverable; phase 7 is **Blocked**,
not Complete, until required actual-device checks pass. Phase 8 deployment and
phase 9 final experience verdict are outside this request. No merge to main.

## Subsequent reported Pages landing-page fix — 2026-11-11

The user supplied a screenshot of the repository README being rendered at the
root Pages URL. Fetched main `c8824db`; feature branch
`codex/pages-publishing-fix`. No root app index or prior Pages workflow exists.
A preliminary official static Actions workflow now uploads only `site` contents
after existing application checks, and can deploy only from main. Exact settings
and outstanding merge/live checks are in the spoiler-free `docs/pages-setup.md`.

Local YAML/shell/permission/gate checks and exact 65-file artifact pass. The same
eight Node/eleven Python tests and content/design/inventory checks pass again.
A tar copy of the actual upload path was extracted as `/BereaHunt/` for a local
Chromium smoke: neutral preparation, verified complete download, correct project
worker scope, closed-page offline relaunch and readiness all pass, zero page
errors. App/case/research bytes and package hash are unchanged. An initial
artifact-check assertion mistakenly treated the app's runtime `scripts/` as
development scripts; it was corrected to compare the artifact's exact resource
set with the manifest, rather than excluding required engine code.

Settings API: `Forbidden`. Live Pages read: HTTP 403 at the outbound proxy.
No setting changed, main merge, successful Actions deployment, live corrected
response or new iPhone evidence is claimed. Phase 7 stays Blocked; this limited
test-origin publishing repair is not a completed phase 8 or release verdict.

Actual GitHub PR workflow run **43044360719** for implementation **6275bf1**
completed its validation/package/upload job successfully; the publish job was
skipped as designed. PR **#9** is open and mergeable with no default-branch merge
performed. This is CI/artifact evidence, not a production deployment or live game
check. The subsequent documentation revision records the observed CI result.

## Subsequent actual-device user report — 2026-11-11

User: “iphone works. Save works. Even after closure and relaunch.” This provides
user-reported iPhone function, saving and restored progress after closure/relaunch.
It is not an assistant-observed execution. No device/iOS, URL/revision, browser
versus standalone context, connectivity state, full path or update coverage was
specified. In particular, do not silently classify this as offline installed-app
relaunch or complete device validation. D01 is now partially covered rather than
wholly untested; the remaining phase 7 gate stays open pending precise coverage.
Ask whether this was the installed Home Screen app with connectivity off and,
if handy, model/iOS; no player clue preview or repetition of the passed save check.

Fetched main `7c3d785` confirms PR #9 has since merged; that supersedes the prior
open-PR handoff above. No live deployment result is inferred solely from that
merge. Follow-up records use `codex/phase-7-testing` synchronized to current main;
no app/content/research bytes or practical requirements changed.
