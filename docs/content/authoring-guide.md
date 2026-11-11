# Content authoring guide

Spoiler-free, 2026-11-11. Phase 5 supplies the complete authored corpus for this
one adventure. The mobile application is phase 6. This guide contains no case,
destination, clue or solution details; opening the dataset itself will spoil play.

## Files and boundaries

| Path | Purpose |
| --- | --- |
| `site/content/adventure.json` | Versioned package index, relationships, travel gates and contracts |
| `site/content/preparation.json` | Independently loadable, spoiler-free installation/practical copy |
| `site/content/chapters/` | Five gated chapter introductions, titles and transitions |
| `site/content/evidence/` | Eighteen documents/findings, including concise ending and optional explanation |
| `site/content/puzzles/` | Eight prompts, evidence dependencies, working aids and feedback |
| `site/content/solutions/` | Separate typed answers/aliases, three hints, reasoning and confirmed reveals |
| `site/content/locations.json` | Written arrivals, optional map URLs, short-walk scope and restrictions |
| `site/content/sources.json` | Narrow factual citations copied from the recorded research |
| `site/content/assets.json` | Four original reference diagrams, credits, text equivalents, sizes/hashes |
| `site/content/offline-resources.json` | Inventory of every actual deployable content/asset file |
| `site/assets/references/` | Original local SVGs, with accessible titles/descriptions |
| `scripts/` and `tests/` | Development-time checks; never part of the deployed artifact |

Detailed design, research, answers and review findings remain separately labeled
under `docs/development-spoilers/`. Do not put those records, private messages,
the full research ledger, tests or authoring scripts in `site/`. The content
contains no personal player information, remote images, fonts, audio or runtime
service dependency. Optional navigation/citation URLs do not supply core inputs.

Index/solution refs are relative to `site/content/`; asset `relativePath` and
offline resource `path` are relative to `site/`. Keep these conventions when
loading under a GitHub Pages project subpath.

## Editing a record

Keep IDs stable. Chapter order is zero-based; public labels are neutral. The
chapter's real title/introduction, evidence text and its setting become visible
only at their declared gates. `grantEvent` distinguishes puzzle entry from
completion. Correct and revealed completions must grant identical rewards.
`supportsFrom` identifies prior evidence needed to justify a conclusion.

Evidence `bodyBlocks` support these text-first types:

- `paragraph`: `text`, optional `title`.
- `table`: `title`, `columns` with `key`/`label`, and `rows` keyed by those columns.
- `instructions`: `title`, readable `steps`, and any declarative protocol `data`.
- `figure`: `assetId` and complete readable `caption`.
- `optional_section`: `title` and `paragraphs`, used only after completion.

Each block has a local `id`, `classification` and `factIds`. Fiction uses
`fictional`; factual paraphrases/figures use `authored_reference`. A document
containing both uses `mixed_separated`, with its blocks visibly labeled. Do not
present invented exhibits as a real archival record, surveyed map or current sign.
Factual citations are not blanket verification of present physical conditions.

The document's `factIds`/`assetIds` are the union of its blocks' references.
`textEquivalent` contains every essential paragraph, instruction, table cell
and figure caption in reading order. When editing blocks, import `equivalent`
from `validate_content` after adding `scripts/` to Python's import path, then
set `record['textEquivalent'] = equivalent(record['bodyBlocks'])` and serialize
the record as UTF-8 JSON with a final newline.
The validator requires exact agreement so a stale accessible fallback cannot
silently omit a changed clue. Do not maintain a separate image-only answer.
Ordinary core paragraphs are limited to 100 words; optional full explanations
can be longer. Keep labels concise and source rows legible as text.

Do not add or promote a real-world dependency without the research evidence and
its proper classification. Essential factual inputs must be Verified and
explicitly eligible in the concealed fact inventory, available in the current
surfaced evidence. Physical observation remains optional in this design.
Navigation claims need Verified documentary support independently of puzzle facts.
Confirmed player plans are not operator access guarantees or public quotations.

## Answers, assistance and working aids

Presentation records point to `solutionRef`; they contain no canonical answer,
solution explanation or accepted-answer list. Solutions declare `answerType`,
`canonical`, `acceptedAliases`, `normalizationProfile`, `reasoningSteps`,
`alternativeEliminations`, three identified `hints`, and an identified `reveal`
with explanation and continuation. Use full justified reasoning, not just an
announced answer. Do not add waiting, score penalties or assistance lockouts.

Development normalization lives in `scripts/content_answers.py`. It handles
Unicode normalization, case/space/punctuation, explicit ID variants, unordered
pairs, ordered bounds, complete mappings and an atomic brief final answer.
It uses exact normalized aliases, never substrings or fuzzy acceptance. A
negated answer must remain wrong. Time parsing preserves meaningful colons,
12/24-hour distinctions and interval bounds. Add regression cases for any
new equivalent; revise a genuinely ambiguous clue before adding broad aliases.
The phase 6 runtime implementation must pass the same contracts and test cases;
these Python checks are not browser answer-entry coverage.

`referenceEvidenceIds` supplies already-granted complete **unsolved** inputs.
It must not contain a reward, future evidence or a completed arrangement.
“Can't access this clue” never requires travel, GPS, an image or network, and
never completes a puzzle. Keep confirmed answer reveal separate. After reveal,
grant the same evidence/successor as a correct answer, preserving the explanation.

Working aids contain source block references in `EvidenceID#blockID` form,
instructions, control names and unsolved initial state. Their data describes
causal-card movement, a fillable decoding grid, before/after record joins,
short time fields and a four-row roster. Move buttons/native selects must
provide non-drag equivalents. Original keys must survive an alias merge. No
paper notes, tiny drag targets, per-field correctness oracle or prefilled solution.
Phase 6 implements the controls; phase 5 supplies their complete inputs/configuration.

## Packaging and validation

From the repository root, Python 3.10+ and its standard library are sufficient:

```sh
python3 scripts/build_content_inventory.py
python3 scripts/build_content_inventory.py --check
python3 scripts/validate_design.py --self-test
python3 scripts/validate_content.py --self-test
python3 -m unittest discover -s tests -v
git diff --check
```

Rebuild the inventory after reviewing any `site/` change. It computes actual
UTF-8 byte lengths and SHA-256 hashes, including locked later files and solutions;
`--check` never writes. Do not hand-enter hashes. The asset registry is computed
first so its hash in the manifest matches its final bytes. The manifest is a
bootstrap fetched separately: it lists every other deployable file and explicitly
excludes its own impossible self-hash. Hashes detect incomplete/mismatched local
packages; they do not provide authentication against a malicious static host.

The current `inventoryScope` is `phase_5_content` and `applicationImplemented`
is false. All authored content/assets are local and inventoried; this is not a
service worker or an app-ready/offline claim. Phase 6 must extend the inventory
to its actual shell, scripts, working-aid code, styles, manifest and icons,
change the scope, and implement complete version-atomic download/relaunch/update
checks. Update the phase-specific file allowlist in the validator accordingly.
Never show “Ready offline” on the strength of this development inventory alone.

Increment `contentVersion` for released content changes. Preserve
`stateCompatibility` for edits that retain ID/progression meaning; incompatible
progression changes need a deliberate migration/recovery plan. Keep a compatible
complete version and its save during failed updates. No silent restart.

The validator checks the actual corpus, not only a second set of design fixtures:
fields, IDs, grants, fact eligibility, source citations, hints, aid references,
finite solutions from authored tables, all assistance paths, asset safety and
the inventory. Its invalid-mutation checks and contract regressions cover
ambiguity, answer parsing and missing/corrupt later resources. Output is spoiler-free.
It cannot verify an outdoor feature, reading enjoyment, real solve duration,
iPhone behavior, browser storage or service-worker readiness.

## Renderer and disclosure handoff

Treat all content as data; render text safely without evaluating HTML. The app
must apply state gates to titles, documents, assets, alt text, map URLs and
citations. In particular, `sources.json` is an internal citation registry: show
only citations attached to currently granted records, never an early full-source
list or route preview. Its `citationPolicy` also requires each fact/source's
`displayAfterPuzzleId` gate: until that puzzle is completed, withhold the whole
claim/title/URL and use `lockedCitationLabel`. A source title can otherwise
disclose an as-yet-unconfirmed destination even when the clue itself is anonymized.
Cache notifications use neutral counts, not filenames or
evidence titles. Preparation loads its own copy without opening the dossier.

This static package necessarily includes inspectable solution files. Separate
solutions and normal interface gating prevent accidental spoilers, not source
inspection. Do not promise secrecy from a player inspecting GitHub or cached
files. Keep routine handoffs, branch/commit descriptions and review screenshots
spoiler-free; neither intended player is the default advance content tester.

## Phase 6 application integration — 2026-11-11

The complete application now lives in `site/`. Native modules separate answer
contracts (`answers.js`), deterministic transitions/restoration (`engine.js`),
working aids (`aids.js`), persistence, local content loading, worker communication
and presentation. No runtime dependency or bundler is needed. The original
corpus, solutions, source dates and factual classifications are unchanged.

The inventory scope is now `complete_application`, with
`applicationImplemented: true`. It covers **every** deployable file except the
explicit self-hash exclusion. This includes shell, modules, styles, icons,
service worker, all later content/solutions and local references. The validator's
file allowlist supports those types and rejects development-file roots/symlinks.
The inventory tool's output alone still does not establish browser readiness:
the app verifies actual cached lengths/hashes before showing Ready offline.

After any `site/` edit, rebuild and check the inventory, run the existing Python
checks, `npm test` (Node 20+) and `python3 scripts/test_browser.py` (Python Playwright
and Chromium). See [README](../../README.md) for actual local run commands. The
browser suite operates on temporary copies, including incompatible/failed updates;
it must not damage the authored corpus or require a player to inspect solutions.

Keep IDs and `stateCompatibility` stable for compatible corrections; bump
`contentVersion` for released content changes. The package ID is the bootstrap
manifest's SHA-256, so code/style/icon edits also create distinct packages even
without a story change. Bump the inventory's `applicationVersion` for released
application changes. Incompatible state/content changes are refused by protocol 1
and need an explicitly designed migration in a future development request.

The worker stages a full replacement, checks every byte, then changes a single
active-package pointer. Existing clients retain a durable version pin, including
when the worker stops. The next verified update/reopen uses the replacement.
Old complete caches are retained for recovery; partial staging caches are never
readiness evidence. A worker-code update waits for old windows to close rather
than force-refreshing an active case. Never delete a save or auto-reset the case
as a cache update. No manual save-transfer feature is introduced.

Restoration validates the completion prefix, derived evidence/current stage,
travel confirmations/safe-stop gates, assistance and drafts. Malformed and
incompatible bytes are left untouched; confirmed restart replaces only this
adventure's key. Unavailable storage/write failures retain in-memory progress and
show a retry warning. A different window's newer save blocks overwriting it.
The engine cannot restore deliberately removed device data or guarantee Safari
and standalone storage sharing.

Player content is rendered as text and typed blocks. Source citations apply both
granted-record scope and each explicit display gate, including titles/URLs.
Only neutral metadata appears during preparation. Hash links of the form
`#evidence/ID` or `#puzzle/ID` check the same grants; they do not unlock anything.
Do not include author-only debugging/reveal shortcuts in the deployed app.

## Phase 7 regression and device gate

Application version 1.0.1 preserves the content/state contract while refining
focus and summary touch targets. After a reviewed deployable edit, run both
`python3 scripts/test_browser.py` and `python3 scripts/test_release.py`, as well
as the inventory, content/design and runtime checks above. Each browser suite
also accepts `--engine webkit` when installed. They use isolated temporary
copies, neutral failure output and no actual-player save or required external
service. Do not publish gameplay failure snapshots.

The [test plan](../testing/test-plan.md) defines the matrix and expanded physical
iPhone protocol. [Readiness](../testing/readiness.md) records the user-accepted
preparation/offline device check and precise current coverage. The former
advancement blocker is resolved; expanded device scenarios are not inferred as
tested. Linux browser geometry, doubled text, engine emulation or a simulated
standalone flag do not establish physical iPhone lifecycle/storage behavior.

## Live deployment verification

See [deployment](../deployment.md) for actual publication evidence, complete
update/rollback instructions and the read-only GitHub Actions live check.
`test_browser.py --live-url https://arutt99.github.io/BereaHunt/` validates actual
response bytes against `--expected-site`, then runs normal/assisted offline
completion and recovery in disposable profiles. Local mutation fixtures remain
the evidence for changed-version/incompatible packages and waiting workers;
never change production content or player data merely to manufacture a test.
