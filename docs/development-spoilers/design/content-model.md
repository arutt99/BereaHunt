# DEVELOPMENT SPOILERS — content model and state contract

Phase 4 design, **2026-11-11**, for one static adventure. This specifies the
phase 5 dataset and phase 6 engine; it does not create a CMS, backend or app.
The [blueprint](blueprint.json) is a development-only, executable design record,
not a completed runtime dataset. Keep it and the research outside `site/`.

## Versioned records and references

Use native JSON records, UTF-8 text and original SVG/document art, with explicit
IDs. Required references must resolve locally and cannot use network fetches.

| Record | Required fields and types | Validation |
| --- | --- | --- |
| Adventure | `id:string`, `schemaVersion:integer`, `contentVersion:string`, `stateCompatibility:integer`, `initialPuzzleId:string`, `chapterIds:string[]`, `assetManifest:string` | One adventure; unique IDs; root exists; base-path-safe relative manifest |
| Chapter | `id`, `order:integer`, `publicLabel`, `unlockedTitle`, `locationId`, `puzzleIds:string[]`, `prerequisitePuzzleIds:string[]` | Contiguous order; each puzzle belongs once; normal locked UI uses only neutral public label |
| Location | `id`, `name`, `addressOrOperatorDescription`, `navigationFactIds:string[]`, `arrivalInstructions`, `optionalMapUrl`, `walkingPlan`, `restrictions`, `referenceActionLabel` | Factual navigation links to Verified documentary access/location records; pin is not a surveyed standing point; no arrival-proof requirement |
| Evidence | `id`, `kind`, `title`, `classification`, `bodyBlocks`, `factIds:string[]`, `assetIds:string[]`, `textEquivalent`, `grantEvent`, `supportsFrom:string[]` | Classification is `fictional`, `authored_reference`, or `mixed_separated`; mixed records separate attributed facts from invented dossier text visibly in authoring; every source already granted before a conclusion |
| Puzzle | `id`, `chapterId`, `prerequisitePuzzleIds`, `entryEvidenceIds`, `requiredEvidenceIds`, `surfacedEvidenceIds`, `prompt`, `answerType`, `solutionRef`, `workingAid`, `hintIds[3]`, `referenceEvidenceIds`, `revealId`, `rewardEvidenceIds`, `nextPuzzleId`, `targetMinutes`, `testingStatus` | No missing/cyclic gate; all required prior evidence automatically surfaced; three hints; complete reference/reveal; positive 5–10-minute design target |
| Solution | `puzzleId`, typed `canonical`, `acceptedAliases`, `normalizationProfile`, `reasoningSteps`, `alternativeEliminations`, `hintText[3]`, `revealExplanation` | Separate from presentation; no arbitrary fuzzy/substrings; entire mapping/final pair checked atomically |
| Asset | `id`, `relativePath`, `mimeType`, `byteLength`, `sha256`, `classification`, `factIds`, `sourceCredit`, `permittedUse`, `textEquivalentRef` | Required asset exists and is readable offline; sizes/hashes computed from actual phase 5 files; no invented hashes, copied unlicensed imagery or hotlinks |
| Offline manifest | `adventureId`, `contentVersion`, `schemaVersion`, `stateCompatibility`, `resources:[{path,sha256,byteLength,required}]` | Includes later evidence, engine/tool code, styles, icons, fonts if any, references, hints, reveals and ending; external map/search URLs are explicitly excluded |

`bodyBlocks` allow short paragraphs, accessible tables, labeled source/reference
cards, original figures and buttons opening a readable enlarged view. No audio
block, streaming media, remote font or indispensable inline third-party iframe.
Metadata must not contain HTML executed as code. Long explanations are optional
expandable blocks after completion, never necessary instruction hidden behind
decorative art. All specialist knowledge is supplied locally.

### Proposed phase 5 layout

```text
site/content/
  adventure.json                 # neutral metadata and chapter/puzzle relationships
  chapters/ch00.json ... ch04.json
  evidence/e00.json ... e17.json # player-visible documents, gated by state
  puzzles/p01.json ... p08.json
  solutions/p01.json ... p08.json
  sources.json                   # concise citations for factual references
  offline-resources.json         # complete actual resource list, hashes, sizes
site/assets/
  references/r02.svg ... r05.svg # original conceptual references, readable text also supplied
  documents/d01.svg ... d08.svg  # optional original fictional art, not sole source of text
```

These are authoring targets, not files claimed to exist yet. Phase 5 must deliver
the actual complete corpus and inventory. Do not add empty placeholder assets.
Use neutral asset paths and cache/download progress text; filenames/notifications
must not announce the case solution or future destination.

Facts F011,F021,F031,F032,F043,F050 may support essential authored references
because their precise documentary claims are Verified and eligible. No physical
fact currently has essential eligibility. F010,F013,F070–F072 support navigation
or planning within their documented limits. F073 is a restriction to obey,
not a puzzle answer. Numbers in fictional logs/serials are clearly fictional.

## Typed answer contracts

| Type | Puzzles | Semantics |
| --- | --- | --- |
| `reference_id` | P01 | Match the terminal chain reference and explicit ID aliases; normalize internal dash/space in that ID only |
| `sequence_and_text` | P02 | Three distinct process IDs in the valid causal order plus an accepted mechanism phrase; both required; never mark individual mechanism fields correct on a wrong full response |
| `text` | P03,P05 | NFKC, casefold, trim/collapse spaces, word-boundary-preserving punctuation normalization, then explicit aliases; decoded ciphertext is a literal answer, not a guessed synonym |
| `unordered_id_pair` | P04 | Exactly two distinct serial IDs, ignoring order; no extra serial, partial substring or duplicate |
| `time_bounds` | P06 | Parse two valid times into minutes; 24-hour or explicitly marked PM, shared trailing PM supported; compare exact ordered bounds; lower is open, upper inclusive |
| `bijection` | P07 | Exactly four unique names paired one-to-one with four badge IDs; compare the entire mapping; keyboard/native selects equivalent to chips |
| `final_pair` | P08 | Actor alias + order ID in two labeled fields; deliberate submit; entire pair checked together; generic wrong feedback, never a per-field oracle |

Punctuation normalization may treat `support-withdrawal` as `support withdrawal`;
it must not accept “not support withdrawal.” Do not delete all punctuation before
parsing a time pair. Distinguish letter O in order O43 from unrelated identifiers;
numeric `43` is accepted only in the explicitly labeled order field. Short actor
alias `Quinn` is allowed because it uniquely names one actor in this case.
No first-name assumption is generalized to other future content.

## Persistent investigation state

```text
schemaVersion, adventureId, contentVersion, stateCompatibility
currentPuzzleId, currentChapterId
completedPuzzleIds[]
evidenceIds[]
hintLevelByPuzzle{}               # 0..3
referenceUsedPuzzleIds[]
revealedPuzzleIds[]
workingAidDraftByPuzzle{}         # reversible arrangement/selection, not correctness
confirmedTravelLegIds[]
endingViewed, fullExplanationViewed
updatedAt                        # diagnostic only; no gameplay clock
```

Local persistence uses an adventure-specific key. Derive progress/unlocks from
validated completion IDs; do not trust an arbitrary supplied chapter number or
URL. Evidence is granted by entry/completion events, not by rendering a route
or opening a direct file link. State cannot guarantee secrecy from source-file
inspection on GitHub Pages; normal interface gating is the supported protection.

Validate restored IDs and versions. Retain compatible progress when content
updates; do not silently reset for a cosmetic content version. Reject unsupported
state versions visibly with a return to the last valid version/recovery option.
If storage is absent, blocked, full or corrupt, explain the actual persistence
problem and keep current in-memory progress usable. Never report “Saved” after
a failed write. Do not clear unrelated browser storage or assume Safari and
installed Home Screen storage share the same investigation.

## Events and transitions

| Event | Preconditions | State/evidence effects | Explicit non-effects |
| --- | --- | --- | --- |
| `begin` | Correct installed context; complete local package verified, or explicit preparation still shown | Enter P01, grant E00/E01 | Does not reveal the route or begin a timer |
| `enterPuzzle(id)` | Every prerequisite completed; any new destination confirmed and safe stopped state acknowledged | Grant only this puzzle's entry evidence; surface relevant unlocked evidence | Does not grant completion rewards or later entry packs |
| `submitWrong` | Current unlocked puzzle; nonempty typed payload | Preserve working draft; readable generic feedback | No evidence, unlock, penalty, delay or correctness leakage |
| `showHint` | Current/revisitable unlocked puzzle | Increment hint level to max 3, persist | No automatic answer/reward or waiting requirement |
| `openReference` | Unlocked puzzle | Show complete legitimate input pack; record reference use | No completed arrangement, decoded message, reward or visit assertion |
| `completeCorrect` | Full answer contract passes | Add puzzle ID and its reward evidence exactly once; enable next objective | Does not punish assistance or erase drafts/evidence |
| `confirmReveal` | Unlocked puzzle, explicit confirmation | Show full explanation; record reveal; perform identical completion grants | No different ending or permanent lockout |
| `confirmDestination` | Previous deduction complete; operator destination and written access visible | Record travel confirmation; show optional external map and next objective | No GPS check; no puzzle while moving; no full itinerary preview |
| `revisit` | Previously unlocked chapter/evidence | Show saved records and relevant explanation if completed | No relocking or duplicate grant |
| `finalSubmit` | P08 unlocked; two nonempty fields; deliberate action | Correct/reveal grants E17 and ending; full explanation remains optional | No external report, email or public accusation |
| `restartConfirm` | Restart offered with clear loss explanation | Reset only this adventure's investigation, retaining compatible downloaded package | No implicit reset from back navigation or unrelated cache deletion |

Transitions should be atomic from the player's perspective: completion is
durable before showing the next stage. Repeated taps, reload during completion,
or revisiting a reveal must not duplicate grants or regress progress. Reference,
reveal and correct paths are semantically identical after their assistance flags.

## Complete offline preparation and version changes

Install/open the Home Screen app **before** downloading or starting the outing.
In that context, download and verify the entire version's required resources,
not only visited chapters. Check counts, actual byte availability and hashes;
load references/tool code as part of the same package. Do not show “Ready offline”
on service-worker registration alone. Relaunch offline and verify the complete
local version before relying on readiness; phase 6 must implement an explicit
local readiness check and phase 7 must test real device behavior.

Stage updates in a separate version cache. Keep the previous complete compatible
version and its progress until the replacement passes. An interrupted download
stays “Preparation incomplete”; it neither discards the old version nor pretends
that missing later evidence can be fetched offline. No force-refresh reset.
If iOS evicts local data, detect missing resources and return to preparation;
do not promise immunity from browser/OS storage eviction.

The external navigation action is explicitly optional and may require network.
Written destination/access/reference material stays local. A dead map URL or
disabled network does not block entering a reference route or completing the
case from a lawful safe position. No accounts, transfer/export flow, synchronized
phone, backend, runtime keys, audio or paid service is introduced.

## Architecture validation boundary

`python3 scripts/validate_design.py --self-test` checks the development blueprint,
source eligibility, source-state preservation, chronological dependency grants,
all modeled correct/reveal/reference paths, finite puzzle solutions and negative
mutations. It prints spoiler-free counts. Detailed results stay in the separate
testing record. It does not execute a browser, simulate service-worker caching,
measure enjoyment, inspect real signs, certify actual walks or validate iOS.
Those claims remain unavailable until the later tests actually happen.

## Phase 5 implementation alignment — 2026-11-11

The proposed layout above is now authored under `site/content/`, with additional
`locations.json`, `preparation.json` and `assets.json` indexes. IDs and gates are
preserved. Evidence blocks are explicitly typed `paragraph`, `table`,
`instructions`, `figure` or post-completion `optional_section`; every block has
its own fact/fiction classification and local ID. Working aids use
`EvidenceID#blockID` references to the actual displayed inputs.

E05 is now correctly `mixed_separated`, with F021 attributed separately from the
fictional cipher. P03 requires/surfaces E03 alongside E04/E05, making its original
A02/F011 input directly available. Both changes are reflected in the blueprint;
no answer, route or narrative gate changed. Reference packs explicitly reopen
all needed already-granted inputs, including the six findings for P08.

Hints and reveals are identified objects within the separate solution file;
`hintIds`, `revealId` and `solutionRef` resolve there. The solution's `reveal`
contains its explanation/continuation; correct/reveal reward lists agree. The
asset registry has computed sizes/hashes and block-level text-equivalent refs.

The offline manifest bootstrap explicitly excludes its own self-hash, inventories
every other actual `site/` file, and declares `inventoryScope: phase_5_content`
and `applicationImplemented: false`. Phase 6 must extend this to actual shell,
styles, icons and interactive code before app readiness. There is no claim of
an installed/cache-tested game in phase 5. The original blueprint's
`runtime_content_complete: false` describes its frozen phase-4 artifact type;
it is not the readiness status of the separately delivered phase-5 dataset.

Development answer parsing and corpus integrity checks live in `scripts/`, with
regressions in `tests/`. They are not deployed engine code. See the spoiler-free
[authoring guide](../../content/authoring-guide.md) for exact commands, block
editing, state/versioning and renderer gating, including source-citation gating.

The source registry's `citationPolicy` requires the current granted fact set and
each fact/source's `displayAfterPuzzleId`. F021/S08's complete citation waits
until P03 completes; its real destination name must not shortcut the anonymized
selector. Show `lockedCitationLabel` until then. The authored E05 reference
already supplies all unsolved factual inputs without that naming citation.
