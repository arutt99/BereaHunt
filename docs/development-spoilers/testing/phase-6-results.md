# DEVELOPMENT SPOILERS — phase 6 application results

**2026-11-11.** Actual local execution, not a physical walkthrough, independent
playtest, iPhone test or deployment. Based on fetched merged main `f9aa141`,
containing completed phases 1–5. Branch: `codex/phase-6-application`. No story,
answer, factual classification, source date or practical requirement was changed.

## Implemented application and state

Native modules in `site/scripts/` separate exact typed answers, deterministic
transitions/restoration, phone working aids, persistence, content, worker messages,
safe DOM helpers and rendering. `site/index.html`, `styles/app.css`, the relative
web manifest and neutral original SVG/PNG icons form the shell. No third-party
runtime library, remote asset/font, audio or backend dependency exists.

State schema 1 records a legal completion prefix and mode. Modes are preparation,
objective, finding, destination, travel and ending. Current chapter/puzzle and
evidence are derived from legal entry/completion events; restoration compares
these derived values against the save. The two travel legs require deduction,
destination confirmation and a separate safe-stop acknowledgment; no-visit
reference continuation is equally valid and records no visit/GPS proof.

Atomic completion grants the same rewards for solve/reveal and saves before the
finding screen. The ending grants E17 and leaves all eighteen records available.
Hints clamp at three, references never fill drafts/grant rewards, and revealed
solutions remain in the completed case file. All fields of the final actor/order
pair and all rows of the causal/roster answers are checked together. Repeated
invalid submissions have no delay, penalty, limit or field correctness oracle.

Saved drafts include the causal sequence/mechanism, user-keyed/manual grid,
Before/After view with serial selections, classification, time bounds, full roster
and final pair. Working-area undo history is bounded to twenty states. Controls
use native fields, selects, large move buttons and checkboxes; dragging is never
required. Evidence uses typed text blocks, accessible tables and original figures
with enlargement/zoom and complete visible captions.

Case-file and hash-view routes check grants before rendering titles, figures,
alt text, sources, URLs or explanations. P03's E05/F021/S08 full citation remains
hidden until its completion; the unsolved documentary inputs remain available.
Content is rendered using text nodes, never evaluated as markup. Direct static
source/cache inspection remains inherently possible and is documented publicly.

Persistence uses only `berea-case-01:investigation`. Corrupt/incompatible bytes
are retained and block overwrite until confirmed restart. Unavailable/quota
storage keeps session progress with a truthful warning/retry. Read/write
comparison protects another window's newer save. Compatible content-version
changes retain IDs, progress, drafts and assistance; incompatible schema/state
versions are refused. No accounts, sync, export or removed-data recovery promise.

## Complete package and update behavior

The computed inventory covers 64 required resources plus its self-hash-excluded
bootstrap, including all eight solutions, four local reference diagrams, engine,
aids, styles and icons. Every response's decoded byte length and SHA-256 is checked;
HTTP compression headers are removed when materializing decoded cached bodies.
The manifest fingerprint identifies the complete package. This is integrity and
version consistency, not authentication against a malicious host.

Downloads use isolated staging caches. A completed marker and single active
pointer are committed only after full verification. Failed initial preparation
cannot begin. Failed/incompatible updates retain the existing complete package
and investigation. Durable per-client pins prevent an already-open page from
mixing old code with new content, even across worker lifecycle stops. Explicit
Use verified update/reopen adopts the replacement; old complete caches remain
available. A new service-worker script follows the normal waiting lifecycle and
never force-activates over an open case.

Every controlled navigation and explicit readiness check verifies the complete
local package. A missing/changed later resource invalidates readiness. A neutral
self-contained repair page preserves localStorage, can redownload online and
reopen the case. There is no fallback to random network files within a pinned
package. Offline core requests are local; maps/citation links are optional external
services, visibly labeled, and cannot block reference continuation.

## Executed commands and evidence

Environment: Linux; Node **24.22.1**; Python **3.12** with installed Python
Playwright; Chromium **156.0.8078.79**. No dependencies installed for this task.
The socket sandbox prevented the first local server launch; the authorized outer
command ran Chromium and its loopback server. No external browsing was used to
validate the game or invent source/field/device results.

```sh
python3 scripts/build_content_inventory.py --check
python3 scripts/validate_design.py --self-test
python3 scripts/validate_content.py --self-test
python3 -m unittest discover -s tests -v
npm test
python3 -u scripts/test_browser.py --preparation-screenshot /tmp/berea-preparation.png
git diff --check
```

- **Eight runtime tests pass.** The exact JS port passes the authored capitalization,
  punctuation, whitespace, fullwidth Unicode and ID aliases; rejects negation,
  substrings, malformed/reversed times, duplicate serials, incomplete/swapped
  maps and wrong final halves. Explicit/shared AM/PM and 24-hour time contracts
  match the development parser. All **256** normal/reveal engine routes reach
  eighteen unique records, with references/hints, save serialization/restoration
  at each stage and both legal travel methods. Invalid state/draft mutations,
  incompatible versions, immutable working values, quota/unavailable storage,
  corrupt-save preservation, confirmed key-scoped restart and cross-window
  conflicts are exercised.
- **Eleven pre-existing Python content tests pass**, alongside the content suite's
  eight authored-input solution models, **65,536** modeled assistance combinations,
  **30** invalid mutations and exact asset/package fingerprints. Phase 4's
  **1,024** modeled paths and **18** rejected mutations remain passing.
- **Browser suite passes on the actual complete application.** It serves an
  isolated copy under `/BereaHunt/`, with gzip-compressed text assets, and injects
  download/update/cache/storage faults. It never changes the working corpus.
  Normal path: P01 ID variant and keyboard submit; P02 full causal board plus
  mechanism; P03 generated/editable grid with naming-citation concealment;
  P04 Before/After immutable-key selection and undo; P05 native choice/text;
  P06 malformed then valid interval; P07 complete native roster; P08 deliberate
  atomic pair. All paths use actual rendered controls, not debug completion hooks.
  Drafts restore after reload at several different objectives. E17's optional
  explanation persists; the final case file retains all evidence/explanations.
- Fully assisted browser path opens all references without new reward/draft
  effects, requests all twenty-four hints, cancels the first reveal without
  completion, then deliberately reveals all eight answers. Both destination
  visits use the safe reference continuation. The browser is offline through
  play; pages are closed/reopened at three stages and after completion. A
  separate **persistent browser profile is fully shut down/reopened offline**,
  restores its draft/hint and reaches E17 without connectivity.
- An initial failure on a late unvisited solution rejects readiness/start;
  retry completes. A failed update retains the exact save and works after
  offline closure/reopen. A compatible 1.0.1 test update leaves the old page
  reading 1.0.0, then uses 1.0.1 only after explicit reopen, retaining draft/hint.
  State compatibility 2 is refused. Removing late E16 from the cache causes
  incomplete readiness and an offline repair page; online repair restores the
  same saved draft. Malformed/incompatible saves remain unchanged until deliberate
  restart; cancel preserves them; unrelated storage survives. Browser-level
  blocked localStorage/quota faults show warnings, permit in-memory progression
  and successfully retry the real in-memory save. Zero uncaught page errors.
- Layout/control geometry checks pass at **390 × 844** touch/reduced-motion,
  **320px** phone width and **1280px** desktop width, with no viewport-wide
  horizontal overflow. Wide evidence tables scroll within their own regions.
  Visible non-checkbox controls are at least 48px high; checkboxes have large
  labeled rows. Keyboard submission, focusable feedback, native controls and
  keyboard image zoom were exercised. The only rendered screenshot exposed for
  visual review is the neutral preparation page; gameplay screenshots are not
  given to players or committed.
- Palette contrast ratios: body/page **15.30:1**, body/surface **12.87:1**,
  muted/surface **9.95:1**, accent/surface **8.79:1**, primary-button text/accent
  **10.45:1**, input border/page **6.84:1**. Focus uses the high-contrast accent;
  CSS animation respects reduced motion. These selected checks are not a full
  accessibility certification or an outdoor sunlight test.

## Findings fixed during implementation

Runtime tests found a null-valued false return in the typed-object guard; it now
returns a boolean consistently. The phase-5 file validator was correctly extended
for application types and skips binary icons while retaining content/integrity
checks. Network timeout now includes full response-body consumption; compressed
responses are cached with decoded-body headers. Working controls retain focus
across rerender and respect immutable draft transitions. Compatible save metadata
is persisted on version adoption. Browser harness waits were corrected for async
submission, hint saving and the native details-toggle event; these were harness
races, not evidence of progression defects. A successful plain-response run
preceded the final compressed-static-host run.

## Phase boundary and verdict

**Phase 6 Complete.** All requested work packages are integrated, the complete
real adventure runs locally through both normal and assistance-heavy endings,
and the required local software/offline/update/recovery checks pass. No known
blocking application defect remains from these checks. Handoff/commands are
publicly spoiler-free; no player approval, route preview or test helper was used.

Phase 7 must still run its complete refinement matrix and actual iPhone
Safari/Home Screen tests, including installed storage-context behavior and iOS
lifecycle/eviction/update behavior. Linux Chromium/persistent-profile execution
cannot establish those. No WebKit, actual device, independent difficulty/timing
playtest, physical route walk/drive, new factual source verification, live Pages
URL or deployment result is claimed. The 180-minute budget remains an authored
estimate. Field/date-specific conditions and the unknown outing date/device
remain as previously recorded. Phase 8 deployment and phase 9 release verdict
are not part of this request.
