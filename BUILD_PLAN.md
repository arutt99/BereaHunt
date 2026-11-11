# Mystery Adventure — Build Plan

This is the spoiler-free execution plan for [the project instructions](mystery_adventure_project_instructions.md). It preserves the nine phases in section 12 and turns each into a bounded implementation request. The project instructions remain the requirements authority. The discovery interview is already recorded there; phase 1 formalizes that handoff rather than repeating the interview. Creative choices are delegated to ChatGPT within the confirmed brief.

## How to use this plan

Say **“Implement phase 1”**, then **“Implement phase 2”**, and so on. Each request means: read the source instructions and current project records, carry out that phase, validate its deliverables, update this plan's progress record, and report the result. Stop after the requested phase.

- Inspect/fetch the current relevant base branch before starting. Reuse completed work and preserve existing decisions, newer remote requirements, and unrelated user changes.
- Complete the phase's tasks and completion checks, including its documentation and relevant tests. A proposed outline alone does not complete a phase.
- Prerequisites must be satisfied before dependent work proceeds. If a requested phase is premature, explain the specific missing prerequisite rather than silently doing other phases.
- Independently choose the case, characters, eligible locations, chapter structure, puzzles, final-answer format, and detailed visual treatment within the confirmed brief. Ask only about genuinely material practical conflicts or unresolved constraints, without exposing spoilers. Do not seek approval of story options, shortlists, clues, or solutions.
- Preserve the confirmed outing: one shared iPhone/Home Screen app; Berea and its immediate border areas; open the first clue during the planned customer drink visit at the already-known Fat Head's start; roughly three hours from around 3 p.m. local time in January–May 2027; roughly a quarter mile total per car-to-stop-to-car walk; subsequent stops use free access/parking with no additional required purchases/business entry or scheduled breaks; no printing, writing materials or audio.
- Core play, including later chapters, assistance, and reference evidence, must work offline after a confirmed complete download and offline relaunch. Treat external maps and optional searches separately.
- Keep both players unspoiled. Routine updates, branch/commit names, screenshots, preparation screens, and handoffs must conceal future destinations, story developments, and answers. Put detailed research, route plans, design, and test evidence in clearly labeled development-spoiler records.
- If research, on-site confirmation, account access, or another external dependency prevents completion, preserve the useful work, mark the phase **Blocked**, and identify the exact remaining action. Do not invent a result or mark the phase complete.
- At the end of a phase, give a spoiler-free report of the files changed, practical decisions, verification coverage, remaining uncertainties, and next phase. Keep concrete spoiler-bearing evidence in the separate development records so later sessions can resume.
- Deliver each phase on a descriptively named feature branch: validate the scoped changes, commit them, and push the branch to GitHub before reporting completion. Reuse that branch for follow-ups to the same task. Include the branch and commit in the handoff; if pushing is blocked, identify the blocker explicitly. Merge into the default branch only when requested.
- Requesting one phase does not authorize unrelated features, paid services, or changes to previously selected requirements. Routine implementation choices within the phase can proceed without repeated confirmation.

The early phases produce research and design artifacts. Application implementation begins in phase 6. Phase 6 has ordered work packages below, but **“Implement phase 6” means the whole phase**.

## Progress tracker

Allowed statuses: **Not started**, **In progress**, **Blocked**, **Complete**. Mark Complete only when every completion check is satisfied; retain evidence links in the final column.

| Phase | Deliverable | Prerequisite | Status | Completion evidence / blocker |
| --- | --- | --- | --- | --- |
| 1 | Requirements handoff and decision record | Existing discovery brief | Complete | Interview was already complete; [requirements](docs/requirements.md) and [practical decisions](docs/decisions.md) now preserve its handoff (2026-11-11). |
| 2 | Researched location shortlist | Phase 1 | Complete | Conditional shortlist, 28 remote sources plus user clarification, 34 classified claim/plan records and asset-rights review; see [spoiler-free research readiness](docs/research-readiness.md) (2026-11-11). |
| 3 | Verified clue inventory and feasible route | Phase 2 | Blocked | Starting arrangement resolved: planned customer drink visit and first clue at the known venue. Later parking arrangements and usable walking/driving measurements remain unresolved (B02–B04). [Coverage and remaining actions](docs/research-readiness.md) (2026-11-11). |
| 4 | Coherent story and puzzle architecture | Phase 3 | Not started | — |
| 5 | Complete, validated adventure content | Phase 4 | Not started | — |
| 6 | Working mobile game application | Phase 5 | Not started | — |
| 7 | Tested and refined release candidate | Phase 6 | Not started | — |
| 8 | Working GitHub Pages deployment | Phase 7 | Not started | — |
| 9 | Final experience audit and release verdict | Phase 8 | Not started | — |

## Project records and recommended structure

Create these files as their phases require them; this plan does not create empty deliverables or claim the work is already done.

```text
docs/
  requirements.md                  # Confirmed requirements and practical constraints
  decisions.md                     # Spoiler-free practical decisions and open constraints
  content/
    authoring-guide.md              # Editing instructions, without case details
  testing/
    test-plan.md                    # Spoiler-free check matrix
    readiness.md                    # Spoiler-free coverage, limitations, and verdict
  development-spoilers/             # Clearly labeled; not routine player reading
    decisions.md                    # Delegated design choices and rationale
    research/
      locations.md                  # Candidate records and shortlist
      facts.json                    # Fact IDs, evidence, verification status
      verification.md               # Review results and unresolved physical checks
      route.md                      # Route, access, pacing, contingencies
    design/
      story-and-puzzles.md           # Mystery, chapters, dependencies, puzzle specs
      content-model.md               # Data fields, references, validation rules
      experience.md                  # Mobile flows and visual treatment
    content-review.md               # Puzzle, narrative, and factual review
    testing/
      results.md                     # Actual checks, environments, findings, fixes
      field-review.md                # What was actually checked on site, or remains open
      final-audit.md                 # Detailed supporting audit evidence
  deployment.md                    # GitHub Pages setup, updates, rollback, known limits
site/                               # Only deployable static application and assets
  index.html
  manifest.webmanifest
  service-worker.js
  assets/
  styles/
  scripts/
  content/                         # Structured adventure data and separate solution data
scripts/                            # Development-time content validation/build utilities
tests/                              # Meaningful engine and browser regression coverage
```

**Recommended technical baseline:** static HTML, CSS, native JavaScript modules, structured JSON content, a web app manifest, and a service worker for complete offline availability. Use no runtime framework or backend unless a concrete benefit justifies one. Keep authoring/research files outside the deployed `site/` artifact. Choose exact tooling in phase 6, reusing phase 5 validation work. Deliver this one adventure first; do not build a multi-adventure platform, CMS, accounts, synchronization, or manual save transfer. GitHub Pages, reliable local persistence, complete offline play/relaunch, Home Screen support, and no paid service/API dependency for core play are confirmed requirements.

### Records that must survive between phases

- **Decisions:** item, status (confirmed/recommended/open or delegated design choice), selected value or options, source/user decision/date, reason, and affected artifacts. Separate practical decisions from spoiler-bearing delegated choices and factual uncertainty.
- **Location records:** stable ID, name, address/coordinates, exact public viewpoint, current legibility, access restrictions, arrival-time hours/daylight, free parking permissions, usable car-to-stop-to-car walking distance, permanent features/history, source images and reuse rights, seasonal/change risks, sources/review dates, puzzle opportunities, safety/accessibility, actual on-site checks, outstanding questions, fallback options.
- **Fact records:** stable ID, precise claim, location ID, source URLs and supporting evidence, image capture/publication dates separately from review dates, verification classification, confirmed viewpoint/availability, uncertainty, and any physical check still needed. Historical existence does not establish present visibility.
- **Puzzle records:** stable ID, chapter/location, objective, observations and fact IDs, clue, solution/variants, justification of every reasoning step and plausible alternatives, three hints, separate reference-evidence and reveal behavior, rewards/unlocks, narrative purpose, difficulty/target time, automatically surfaced prior evidence, interaction/working aids, offline assets, and testing status.

Use the source classifications exactly: **Verified**, **Provisionally Verified**, **Unverified**, **Rejected**. Automated checks can enforce records and references; they cannot establish that a physical claim is true.

## Phase 1 — Discovery and requirements

**Outcome:** a durable handoff of the already-confirmed discovery brief, ready for research without re-interviewing the players.

**Tasks**

- Translate the current source brief into a concise requirements checklist with links to the authoritative sections. Preserve confirmed constraints, delegated choices, research needs, and genuinely open practical decisions.
- Record the selected geography/start, one shared car and iPhone, duration and walking limits, seasonal/daylight constraints, spending/entry restrictions, personal pauses, phone-only materials, and no audio.
- Record the grounded detective/case-file direction, fair 5–10 minute puzzle targets, readily available assistance without penalties or delays, approximate 75% evidence/25% interactive mix, and brief final submission plus optional full explanation.
- Record mandatory Home Screen installation, complete offline download/readiness/relaunch, local progress, separate reference-evidence/reveal actions, and spoiler protection.
- List remaining practical unknowns such as exact date, device/iOS version, and optional independent app testing. None implies an assumed helper, scheduled recheck, or commitment to a particular release day. Ask only if a missing constraint actually blocks the next work.

**Deliverables:** `docs/requirements.md`, `docs/decisions.md`; initial success criteria and practical constraints in the requirements brief.

**Completion checks**

- Requirements match the existing discovery brief; no repeated interview, invented new restrictions, or requests to approve delegated story/route choices are introduced.
- Every remaining item is identified as a practical decision, research task, or delegated design task. Geography, device arrangement, offline support, and tone are already established.
- The handoff is spoiler-free and gives phase 2 enough scope without requiring an exact play date or an uncommitted tester.

**Source:** sections 1–3, 7, 9, 12–14.

## Phase 2 — Location research

**Outcome:** a documented shortlist with factual support and clearly identified unknowns.

**Tasks**

- Research the selected starting arrangements and candidates in Berea/immediate border areas using municipal/park sources, historical organizations, official businesses, recent imagery, and credible local reporting. The players have clarified an ordinary customer drink visit at the known start; no separate noncustomer lot-opening permission is required. This does not imply business participation in the game.
- Populate location and fact records, including exact sources, evidence dates, public viewpoints, access, relevant physical details, and change risks. Cross-check important claims independently where possible.
- Separate historical facts from current physical observations. List any information that cannot be established online.
- Independently shortlist candidates for reliable puzzle potential, historical/nature interest, compact route fit, free access/parking, short round-trip walks, arrival-time hours/daylight, and reference-evidence alternatives. Do not show future destinations to either player or invent features/participation.
- Identify usable image/reference assets and their source/licensing constraints; do not assume an online photograph can be redistributed.

**Deliverables:** `docs/development-spoilers/research/locations.md`, `facts.json`, and preliminary questions in `verification.md`; a spoiler-free readiness update.

**Completion checks**

- Every shortlisted location has the required record fields; unknowns are explicit rather than filled with guesses.
- Proposed physical observations reference evidence and carry a verification classification.
- The shortlist explains inclusion/rejection and remains within the selected scope. Research supports puzzle opportunities without committing to unsupported story details.

**Source:** sections 3–4, 9–10, 12.

## Phase 3 — Verification and feasibility

**Outcome:** a concealed feasible route within the confirmed brief and dependable facts around which puzzles can be designed.

**Tasks**

- Audit each candidate observation for exactness, current visibility from the intended public viewpoint, access, safety, and durability. Resolve conflicting sources and classify remaining uncertainty honestly.
- Plan around no on-site helper. Where online evidence is inadequate, seek stronger evidence, replace the dependency, or redesign around verified in-app reference evidence with the physical observation optional. Verify access separately if directing players to the stop. Record real physical checks only if performed; do not ask either player to inspect clues in advance.
- Exclude unverified, provisional, and rejected facts from essential puzzle dependencies. Replace weak candidates or narrow the design; seek a user decision if the selected scope must change.
- Develop a route from the planned starting customer drink visit with fewer worthwhile stops, limited driving, free permitted parking/access at subsequent stops, and roughly a quarter mile total per usable car-to-stop-to-car walk. Budget roughly three hours including travel/puzzles from around 3 p.m. America/New_York in January–May 2027, accounting for late-stage daylight/hours and seasonal/weather risks. No additional scheduled meals/breaks or required return to the start. Cite distances, estimates, and assumptions.
- Assign every viable location-dependent puzzle opportunity a feasible fallback and identify any unresolved prerequisites.

**Deliverables:** updated fact/location records; `docs/development-spoilers/research/verification.md` and `route.md`; spoiler-free coverage/conflict report.

**Completion checks**

- There is a feasible route and sufficient **Verified** observations for the intended experience. Remaining uncertainty cannot be essential to completion.
- Research never equates an old image or a past historical feature with confirmed present-day access.
- Route estimates state their assumptions; no fabricated distances/hours/permissions or unsafe investigation stages remain.
- Unconfirmed essential dependencies have been replaced or redesigned; a fallback alone does not verify them. Unperformed field testing remains labeled unperformed. Any unresolved critical dependency blocks readiness without exposing the clue.

**Source:** sections 3–4, 9–12.

## Phase 4 — Narrative and puzzle architecture

**Outcome:** a complete design blueprint grounded in the verified setting.

**Tasks**

- Independently choose the case, characters, chapter/stop structure, puzzle mechanics, detailed case-file treatment, and brief final-answer format within the confirmed brief. Keep all spoiler-bearing choices out of routine updates.
- Design the grounded present-day mystery with historical connections, its true timeline, motivations, revelations, and final deduction. Show how earlier evidence supports the ending and twists. Do not rely on lying/unreliable testimony, supernatural resolution, obscure remembered details, or long reading exercises.
- Map chapters, destinations, puzzles, evidence, and unlock dependencies. Vary observation, document analysis, testimony, ciphers, and deduction; avoid repetitive counting/date-entry tasks.
- Specify each puzzle's fair reasoning steps, legitimate inputs, plausible alternative answers, solution, hints/reveal, narrative purpose, fact references, rewards, and reference fallback. Target 5–10 minutes per substantial puzzle, with useful assistance readily available and no forced delay or timer. Include occasional destination deductions, confirming the exact verified destination before travel.
- Define the content schema and state transitions, including locked content, completed puzzles, collected evidence, assistance use, and final completion.
- Sketch mobile flows for spoiler-free preparation/install/download readiness, current objective and relevant unlocked evidence together, safe navigation, phone-based working aids/interactive controls, separate reference/reveal actions, resume/restart, and brief final submit/reveal/optional explanation. Target the approximate 75% evidence/25% hands-on mix with no audio, printing, or required notes.

**Deliverables:** `docs/development-spoilers/design/story-and-puzzles.md`, `content-model.md`, `experience.md`; separate delegated-design decision record.

**Completion checks**

- The dependency map has no cycles, missing prerequisites, unreachable chapters, premature revelations, or evidence needed before it becomes available.
- Every essential real-world observation points to a Verified fact. Fictional material is clearly distinguished in authoring records.
- Every substantial puzzle has an escalating hint plan, explained reveal, and a way to continue. Every physical dependency has a fallback.
- Delegated design choices are complete without requesting player approval. Relevant evidence is surfaced automatically; the final challenge combines earlier discoveries through a brief submission with a concise reveal and optional full explanation.

**Source:** sections 2, 4–10, 12–14.

## Phase 5 — Game content development

**Outcome:** a complete adventure dataset, ready for the application to consume.

**Tasks**

- Write final player-facing introduction, chapters, destination instructions, transitions, evidence/documents, testimony, feedback, ending, and practical guidance.
- Finish each puzzle's prompt, accepted variants, fully justified explanation, three hints, reveal, rewards, and narrative-preserving reference evidence. Reference evidence must let players keep solving; opening it must not reveal the answer. Include necessary decoding references/working aids so Googling remains optional.
- Prepare licensed/original assets and accessible descriptions. Use verified reference images only where their accuracy and reuse rights are established; another supported fallback may be used instead.
- Store content as structured data under `site/content/`, following the phase 4 model. Separate solutions/validation rules from presentation and document that client-side answers remain inspectable.
- Review the complete adventure in development records: trace normal and assistance/reference paths; audit fair reasoning, reliable testimony, concise reading, evidence surfacing, pacing, ending coherence, ambiguity, and accidental spoilers. The player experience must not require paper or printing.
- Write the authoring guide and validate IDs, references, required fields, fact eligibility, hint completeness, and progression reachability with development-time tooling.

**Deliverables:** complete `site/content/` dataset and local assets, including an inventory of all required offline resources; validation tooling; spoiler-free `docs/content/authoring-guide.md`; `docs/development-spoilers/content-review.md`; updated design/research records.

**Completion checks**

- All chapters and puzzles are fully authored; no essential placeholder prose, missing evidence, unresolved solutions, or fallback gaps remain.
- Content validation passes. Fact records substantiate all essential observations; a validation pass is not described as physical verification.
- Manual solution reviews establish that clues are sufficient, answers follow logically, hints escalate, and the ending works on both play paths.
- All mandatory story, interactive code, evidence, hints, reveals, and reference assets can be downloaded locally. Content and presentation remain separate without expanding into a general-purpose authoring platform.

**Source:** sections 3–6, 8–12.

## Phase 6 — Application development

**Outcome:** a complete iPhone Home Screen game using the authored adventure, ready for offline play after a confirmed initial download.

Implement these work packages in order. Keep the application usable as each is integrated.

1. **Static foundation and content loading.** Establish the lightweight toolchain, local instructions, responsive shell, relative paths, content loader, and clear errors. Add Home Screen metadata, manifest/icons, and spoiler-free install/preparation instructions. Avoid paid services, secrets, or a runtime backend.
2. **Progression and answers.** Implement deterministic chapter/objective state, text/appropriate short-choice answers and variants, reasonable capitalization/punctuation/whitespace normalization, useful incorrect feedback, unlimited attempts, and correct transitions. Avoid accepting materially wrong answers. Hide locked story/evidence and future destinations in normal navigation/direct view URLs. Include deliberate brief final-submit, concise reveal, and optional full explanation.
3. **Evidence and navigation.** Show the current task with automatically surfaced relevant unlocked evidence, case-file revisits, readable/enlargeable images, phone-based tools and comfortable interactive controls. Conceal the full route; confirm an exact verified destination and arrival instructions after destination deductions. Keep written access/address instructions offline; external maps are optional. Distinguish travel from safe stopped investigation.
4. **Assistance and physical fallbacks.** Add player-requested progressive hints without delays, scoring, or time penalties. Provide an easy-to-find Can't access this clue action that supplies verified reference evidence without solving the puzzle. Keep Reveal Answer separate and deliberate, with full reasoning, continued availability, and progression/evidence equivalent to solving. No GPS/proof of arrival/physical visit is required to use the fallback.
5. **Persistence and recovery.** Save chapter, solved puzzles, evidence, assistance use, and content/schema versions automatically. Restore across reloads, closure, personal pauses, and updates. Handle unavailable storage and malformed/incompatible saves truthfully without silent data loss or arbitrary unlocks; confirm restarts. Encourage starting play in the installed app, verify Safari and standalone storage separately, and do not promise context sharing or recovery after device data removal.
6. **Complete offline download and updates.** Use a service worker/cache strategy covering the entire mandatory adventure, including locked chapters, images, interactive code, hints, reveals, and reference evidence. Clearly confirm complete offline readiness; handle interrupted downloads/retries. Preserve a complete compatible version and its save during failed/interrupted updates; do not mix content versions or reset an active case. Support offline launch after app closure and full completion without essential third-party requests.
7. **Experience integration.** Apply a restrained detective case-file treatment, concise documents, outdoor readability, feedback, and restrained transitions. Support labels, keyboard/focus, contrast, touch targets, reduced motion, and image inspection. No audio or timed pressure. Keep optional external-service failures clear without interrupting offline core play.

**Deliverables:** complete `site/` application; development scripts/configuration as needed; meaningful state/validation/persistence tests; repository `README.md` with actual run/validation commands; updated authoring and experience documentation.

**Completion checks**

- The real adventure runs locally from introduction to ending; solving, hinting, revealing, and fallback paths all preserve progression and story coherence.
- The complete download/readiness check, interrupted-download recovery, offline reload/relaunch, and compatible cache/content updates work without losing progress. Actual iPhone Home Screen validation is separately recorded in phase 7, not inferred from local browser tests.
- Reopening/reloading restores progress including hints/reveals; confirmed restart clears the intended save; corrupt/unavailable storage produces recoverable, truthful behavior. Separate reference/reveal paths remain distinct.
- Normal UI/navigation cannot expose locked story/evidence or solutions in error messages. Document the limits of secrecy on a static host.
- Application and content validation checks pass, with results recorded. Use automated tests for consequential state logic and regressions rather than tests that merely repeat implementation.
- No core feature is an empty demo or disconnected screen. The engine remains maintainable and focused on this adventure, with no accounts/sync/general-purpose platform scope.

**Source:** sections 6–8, 11–14.

## Phase 7 — Testing and refinement

**Outcome:** a release candidate backed by software, puzzle, narrative, and factual review evidence.

**Tasks**

- Execute a test matrix covering correct/incorrect/variant answers, hint order, reveals, fallbacks, sequential unlocking, evidence access, saved/resumed play, restart, storage failures, locked view URLs, maps, and completion.
- Test complete normal and assistance-heavy playthroughs, including closing/reopening during different stages and inaccessible-location scenarios. Fix failures and rerun the affected checks.
- Test outdoor-oriented layouts, focus, image legibility, comfortable interactive controls, reduced motion, and no-print/no-notes play. Audit full reasoning, reliable testimony, automatically surfaced evidence, concise ending, and estimated versus measured timing.
- Test complete offline download, explicit readiness, interrupted downloads, cache/content update failures, later chapters, assistance/reference paths, and a full offline relaunch/completion. An already-loaded tab alone does not satisfy the requirement.
- Prioritize iPhone Safari and actual installed Home Screen behavior, including standalone launch, closure/reopening, and storage-context differences. WebKit emulation is supporting evidence, not proof of an actual iPhone test. Record exact devices/iOS/browsers and outstanding device checks.
- Conduct puzzle/narrative and critical-fact/access reviews. Use independent app feedback or a physical walkthrough only if available, never as an assumed future fix for essential gaps. Replace/redesign unsupported dependencies rather than asking either player to inspect clues in advance. Fallbacks protect day-of changes, not inadequate verification.
- Track defects by severity and preserve open risks, test limitations, and factual uncertainties. Never claim physical or device tests that were not performed.

**Deliverables:** spoiler-free `docs/testing/test-plan.md` and `readiness.md`; detailed `docs/development-spoilers/testing/results.md` and `field-review.md`; regression tests and corrected application/content/research artifacts.

**Completion checks**

- No known blocking progression failures, essential unverified facts, unsafe directions, missing fallbacks, or unintended normal-play spoilers remain.
- Both full play paths finish coherently; every physical fallback works; fixes have appropriate regression checks.
- iPhone Safari/Home Screen, storage, complete offline play/relaunch, cache updates, and field-review coverage are stated precisely. A required check that could not run is a recorded blocker, not a pass; do not claim actual-device validation from emulation.
- Remaining nonblocking limitations are explicit and compatible with the requirements.

**Source:** sections 3–11, 14.

## Phase 8 — GitHub Pages deployment

**Outcome:** a tested deployment of the release candidate and a repeatable publishing process.

**Tasks**

- Inspect the repository's existing GitHub setup and choose a suitable Pages deployment method. Configure a minimal workflow/artifact if needed; deploy only static application files, not research/author solution documents or development secrets.
- Test the application under the repository's project subpath. Use relative/subpath-compatible routes and asset URLs; account for Pages' handling of direct URLs and refreshes.
- Configure/publish with available authorized repository access. If a GitHub setting or credential is unavailable, finish the configuration/docs and record the exact external step; distinguish deployment-ready from actually deployed.
- Smoke-test the live URL and installed experience: assets, progression, persistence/restart, maps, assistance, distinct reference/reveal paths, spoiler concealment, and completion. Confirm complete offline download, service worker scope, offline relaunch, and cache/content update behavior at the actual Pages base path.
- Document setup, publish/update commands, content validation, rollback/redeployment, storage limitations, static answer visibility, and the deployed revision/URL.

**Deliverables:** working Pages configuration; spoiler-free `docs/deployment.md` and README/install instructions; detailed live smoke-test evidence in `docs/development-spoilers/testing/results.md` and coverage in `docs/testing/readiness.md`.

**Completion checks**

- The actual GitHub Pages URL loads and works under its real base path; deployment success and smoke tests are recorded rather than assumed from a local build.
- An update and rollback procedure exists; the deployed artifact excludes internal authoring/research records and unnecessary files. Client-side solution data remains inherently inspectable.
- No core gameplay requires a backend, API key, or paid service.
- The deployment is a release candidate awaiting phase 9's experience verdict; publishing alone does not establish that the experience is complete.

**Source:** sections 6–7, 11–12, 14.

## Phase 9 — Final experience audit

**Outcome:** an evidence-based release verdict for the complete deployed experience.

**Tasks**

- Audit the deployed version as a two-adult cooperative experience on one shared iPhone from spoiler-free preparation/Home Screen installation and complete download through offline relaunch, play, and ending. Use available actual-device coverage honestly; do not require either intended player to preview the case as the default test plan.
- Review pacing, route/travel assumptions, puzzle variety, clarity, evidence availability, narrative payoff, assistance, fallbacks, and practical usability together.
- Reconcile final content with the fact inventory, route/access review, decisions, testing results, and known limitations. Identify any time-sensitive facts needing a fresh check before play.
- Check every source success criterion and record its evidence. Make necessary refinements, rerun affected tests, and redeploy fixes when required.
- Record the release revision/URL, actual source/check dates, timing assumptions, and remaining practical limits. Classify the verdict as ready or blocked. Recommend a fresh access/hours check if the play date becomes known; do not imply automatic monitoring, a scheduled check, an available helper, or a committed completion day.

**Deliverables:** spoiler-free `docs/testing/readiness.md` with final verdict; detailed `docs/development-spoilers/testing/final-audit.md`; reconciled records, fixes/deployment if needed, completed tracker when justified.

**Completion checks**

- Players can finish the cohesive mystery through normal solutions or assistance, revisit collected evidence, resume progress, and recover from unavailable real-world clues.
- No critical factual dependency is unverified; no unperformed software/device/field test is represented as completed.
- All required checks and release-blocking issues are resolved. Any remaining untested assumptions are explicitly described and cannot undermine essential safety, factual accuracy, or completion.
- The final audit supplies evidence against the confirmed brief and definition of success: compact free route, short round-trip walks, roughly three-hour pacing, fair connected deductions, phone-only/no-audio play, complete offline relaunch, and a concise satisfying ending. The player-facing verdict preserves both players' surprise.

**Source:** sections 1, 3–6, 9, 11–14.

## Handoff record for every completed or blocked phase

Append a dated entry below when a phase is executed. Update the tracker above as part of the same work.

```text
Phase:
Status:
Date:
Delivered files:
Branch and commit:
User decisions recorded:
Checks performed and evidence:
Open uncertainties / blockers:
Next eligible phase:
```

### 2026-11-11 — Phase 1 handoff repair

- **Phase:** 1 — requirements handoff (prerequisite repair for the requested phases 2–3).
- **Status:** Complete.
- **Date:** 2026-11-11.
- **Delivered files:** `docs/requirements.md`, `docs/decisions.md`.
- **Branch and commit:** `codex/research-feasibility`; artifact commit `41b151ca95cd676e08398125be9a84ac77f44d68`. Tracker/handoff recorded in the following commit on the same branch.
- **User decisions recorded:** preserved the existing completed interview and the user's confirmation of its completion; no new creative approval or requirement change. The previous “Not started” referred to missing handoff files, not incomplete discovery.
- **Checks performed and evidence:** 24 acceptance criteria traced to source sections; review of confirmed constraints, delegated choices and practical unknowns; local Markdown links and public destination-name scan passed.
- **Open uncertainties / blockers:** exact outing date, iPhone/iOS version and independent app tester remain unknown; none blocks research or implies an assumed helper/recheck/deadline.
- **Next eligible phase:** phase 2, executed below.

### 2026-11-11 — Phase 2 location research

- **Phase:** 2 — location research.
- **Status:** Complete.
- **Date:** 2026-11-11.
- **Delivered files:** `docs/development-spoilers/research/locations.md`, `facts.json`, `verification.md`; supporting delegated decisions in `docs/development-spoilers/decisions.md`; spoiler-free `docs/research-readiness.md`.
- **Branch and commit:** `codex/research-feasibility`; artifact commit `41b151ca95cd676e08398125be9a84ac77f44d68`. Tracker/handoff recorded in the following commit on the same branch.
- **User decisions recorded:** existing geographic/start, free/short-walk/seasonal constraints preserved; shortlist chosen under delegated discretion and concealed from routine updates. No permission presumed from a business name.
- **Checks performed and evidence:** five full location records, including selected start and reserve; 28 dated source records and 34 precise fact records (20 Verified documentary claims, 5 Provisionally Verified, 7 Unverified, 2 Rejected); six eligible documentary inputs. Source IDs, location references, classifications, dates, local links and no-essential-unverified-input checks passed. Image capture/publication dates and reuse constraints recorded; retrieval limits distinguished from successful source reads.
- **Open uncertainties / blockers:** current exact physical legibility and access/walking evidence are explicitly unresolved; conditional shortlist is a research deliverable, not an approved itinerary. No field/image-pixel inspection claimed.
- **Next eligible phase:** phase 3 verification, executed below.

### 2026-11-11 — Phase 3 audit and blocked feasibility verdict

- **Phase:** 3 — verification and feasibility.
- **Status:** Blocked; not Complete and not ready for phase 4.
- **Date:** 2026-11-11.
- **Delivered files:** updated `docs/development-spoilers/research/facts.json`, `locations.md`, `verification.md`, `route.md`; `docs/development-spoilers/decisions.md`; spoiler-free `docs/research-readiness.md`.
- **Branch and commit:** `codex/research-feasibility`; artifact commit `41b151ca95cd676e08398125be9a84ac77f44d68`. Tracker/handoff recorded in the following commit on the same branch.
- **User decisions recorded:** no confirmed requirement relaxed. Story and detailed puzzle authoring remain deferred; no request for either player to inspect concealed clues.
- **Checks performed and evidence:** audited proposed physical observations, rejected weak/disputed dependencies, specified documentary redesigns and separate reference/reveal contingencies; zero unverified physical observations approved as essential. Candidate route and 180-minute budget explicitly distinguish travel allocations/straight-line lower bounds from measured driving/walking. Approximate NOAA-based seasonal sunsets and conservative winter observation limits recorded. Record-integrity, public spoiler-name, link and whitespace checks passed. No physical, iPhone, app, deployment or measured playthrough test performed.
- **Open uncertainties / blockers:** at the initial audit, B01 concerned a no-purchase parking-lot opening; the user's subsequent customer-visit clarification resolves and supersedes it (see follow-up below). Remaining: B02 usable ordinary-bay-to-viewpoint round trips; B03 later-stop free-parking restrictions/final dwell; B04 drivable entrance-to-entrance distances/times. These remain critical to the feasible-route completion check; a reference fallback does not verify them.
- **Next eligible phase:** finish phase 3's access/measurement gates, validate the revised evidence and update this tracker. Phase 4 remains Not started until that passes. No future recheck, helper or specific completion date has been arranged.

### Delivery status — 2026-11-11

The initial GitHub push was rejected by automatic approval review over
authorization to disclose potentially private research/spoilers. The user
subsequently authorized pushing the corrected records to the existing
`arutt99/BereaHunt` repository: “After resolving that, you may push.” This is
explicit authorization for the feature-branch delivery, including the existing
research; no further disclosure approval or default-branch merge is requested.

### 2026-11-11 — starting-arrangement clarification and authorized delivery

- **Scope/status:** starting issue B01 Resolved; phase 1/2 Complete; phase 3 still Blocked on unrelated researcher tasks B02–B04.
- **User decision:** visit Fat Head's as customers for a drink, open the first clue there and begin. The starting venue is known and may be disclosed before play; the case and future destinations remain concealed.
- **Correction:** authoritative brief, requirements/decisions, source inventory, location/route audit and readiness records now reflect the planned customer visit. No noncustomer lot permission, fixed game bay, special access or venue relocation is needed; no staff-delivered clue or brewery game participation is assumed. No additional game-required purchases or scheduled breaks are introduced.
- **Evidence:** S29 is the direct user clarification, separate from the 28 remote sources. Current 34 claim/plan records: 22 Verified (including two user-confirmed plans), five Provisionally Verified, five Unverified, two Rejected; six eligible documentary inputs and zero essential physical observations approved.
- **Branch:** continue `codex/research-feasibility`; the correction/delivery commit is the branch revision containing this entry, following `8d30aaa`.
- **Checks:** record/link integrity, Verified-only essential reference eligibility, public destination concealment, corrected starting references and whitespace checks; no new field/device/game tests claimed.
- **Delivery authorization:** user explicitly approved the push after the starting correction. Retain the scoped feature branch; do not merge into main.
