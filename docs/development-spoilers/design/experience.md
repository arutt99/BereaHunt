# DEVELOPMENT SPOILERS — one-phone experience architecture

Phase 4 design, **2026-11-11**. Preserve one shared iPhone, phone-only cooperation,
outdoor readability, no audio, a roughly three-hour core outing and both players'
surprise. No device/browser UI has been implemented or tested in this phase.

## Preparation and installation

The preparation screen can name the already-known Fat Head's customer start,
approximate duration/walking expectations, suitable clothing/charged phone and
the need to complete preparation with connectivity. No case title, suspects,
future stops, chapter subtitles, document thumbnails or answer-bearing images.
Use a neutral public label such as “Berea investigation.”

Sequence:

1. In Safari, show concise Add to Home Screen instructions and a neutral icon.
   Explain that the installed context must be used for download and play.
2. Open the installed app. Show “Download complete adventure” and size/progress
   for the whole package; use neutral resource counts, not evidence names.
3. Confirm all required resources are local, then perform an offline availability
   check/relaunch instruction. “Preparation incomplete” retains the current
   complete version; no fake readiness when only the shell is cached.
4. Show “Ready offline” for the verified installed context/version. The actual
   outing begins only when the players choose Start at their planned visit.

If the investigation was started in another context, explain where progress may
exist and allow returning there. Do not promise synchronized storage, export a
manual save, silently reset, or require starting over just to install.

## Primary stopped investigation screen

```text
Investigation                              Saved / visible save issue
Chapter 2 of 5                             Case file

[current objective, 1–3 short sentences]

Relevant evidence                         [two readable cards]
[openable text/document]                   [compare / enlarge]

[phone working aid, when needed]
[answer field(s), correct input labels]
[Check answer / Record finding]

[Hint 1]   [Can't access this clue]   [Reveal answer]
```

Automatically surface the listed evidence for the current puzzle, including
previously earned records; keep the task visible while comparing. Two adults
discuss the same view, rather than using separate secret screens. Avoid a maze
of modal documents: one expanded reference or a simple Compare view can show
the relevant pair; return preserves answer/board state and scroll position.

Ordinary prose blocks target about 40–90 words each; the current objective and
core inputs should be readable without long scrolling. These are authoring
targets to check in phase 5, not completed word-count tests. Large document
art is optional because all necessary content also exists as legible text.

### Visual treatment selected under delegation

Use a restrained charcoal/ivory case file: page background `#121B22`, surface
`#1D2A34`, body `#F4F0E5`, secondary text `#CED6DA`, accent `#EAC46A`.
Use a system sans-serif stack; numbers and IDs use system monospace where useful.
Body text starts at 18px with 1.5 line height; controls at least 48px high with
comfortable gaps, visible focus and full-width primary actions on narrow screens.
Final contrast is measured in phase 6; these colors are a specification, not a
claim that every rendered component is already accessible.

Use subtle file dividers, source/date labels and consistent evidence badges.
No red-string clutter, decorative noise under text, handwriting-only vital
content, faux illegibility, audio, remote fonts or complex transition effects.
An optional 120–180ms fade respects reduced motion and never delays controls.
No answer/revelation appears in notification text, document filename or a locked
chapter's accessible label.

## Three compact working aids

- **P02 causal board:** three large cards, move up/down buttons plus optional
  drag; a separate test/profile selector. Undo/reset preserve original inputs.
  No correct-position highlights until a valid full submission or reveal.
- **P04 reconciliation board:** Before/After tabs or a compact comparison table;
  tap-select the two retained serials. Immutable original keys remain visible;
  no actual geographic map or invented quarry survey. No dependence on precise
  gesture alignment, small image corners, color alone or paper notes.
- **P07 roster:** four labeled rows with name/badge selects, or chips with a
  native-select alternative. Keep the four concise constraints visible nearby;
  entire-map validation avoids a correctness oracle.

The P03 grid is a locally generated working reference with protocol and alphabet;
players can fill or inspect it without long text entry. No specialist search is
needed. All working aids and their code must be part of the offline package.

Manipulation is budgeted at 6 + 8 + 4 = **18 of 72 solving minutes**, around 25%;
remaining solving time is document examination/discussion. This is an experiential
estimate, not a strict gesture/time quota or a measured player result.

## Assistance, closure and wrong-answer flows

Show hints immediately, one at a time, retaining earlier hints. A concise
confirmation separates answer reveal from ordinary help. Reveal explains each
reasoning step and offers Continue; the ending and evidence grants are identical
to an unassisted solve. No scores, penalties, artificial wait, attempt count,
forced loss state or requirement to solve the finale unaided.

“Can't access this clue” opens the **complete unsolved reference evidence**.
It does not quietly show a solution, fill a board or move chapters. For this
reference-led design the certified factual material is already available as
primary input; the action brings it forward and explains that exploration may
be skipped. An unavailable image has a complete text equivalent. Reveal works
even if every reference asset fails, once the complete text package is present.

Empty entry requests an answer; malformed times explain the input format without
showing the correct values. Wrong complete answers give neutral recheck guidance
and keep drafts. P08 validates actor/order together, with no indication of which
field was right. Announce feedback accessibly and move focus sensibly, avoiding
involuntary screen-reader rereads of the entire case file.

## Safe travel and visit confirmation

After P01 and P03, show the exact verified operator destination, written public
approach, optional map action, current source date and practical restrictions.
Confirm the deduction **before** asking players to travel. Hide the full route
and future destination names. Maps may require connectivity; offline written
instructions and reference continuation remain available.

Travel mode says to stop safely before using evidence or answering. No puzzle
is assigned during driving or a street crossing. On the next stop screen,
players acknowledge a safe stationary position; no GPS arrival test or geofence.
The reference route remains available if the destination is closed, full, unsafe
or inconvenient. Never send them to a shoulder, water, ice, railway land,
restricted lot, business staff or a substitute private property.

L01's normal short designated overlook approach is optional. L05 is the nearby
ordinary public recreation setting, with optional bounded exploration and no
mandatory shore/bridge/table viewpoint. Use the source-reviewed staging in the
feasibility record. The municipal parking-area game stage is removed. If no
lawful safe comfortable position is available, resume elsewhere; no special
parking permission or guaranteed sheltered/illuminated seat is implied.

## Single pacing budget

| Portion | Minutes | Placement |
| --- | --- | --- |
| Substantial puzzle targets | 72 | P01 6; P02 10; P03 9; P04 10; P05 9; P06 9; P07 10; P08 9 |
| Travel | 30 | 20 after P01, 10 after P03 |
| Optional short walking/observation | 20 | 10 at L01, 10 on arrival at L05; shorten/skip if unsafe |
| Opening, evidence reading, transitions | 35 | 9 opening; 4 for each of four later chapters; 10 across two travel/arrival confirmations |
| Concise ending | 8 | After P08; full explanation optional |
| Discussion/traffic/solving contingency | 15 | Flexible; not a pause or delay imposed by the app |
| **Core total** | **180** | Starting drinks/personal pauses can extend elapsed time |

Illustration from 15:00: opening/P01 to about 15:15; first drive to 15:35;
L01 optional observation and P02/P03/transitions to about 16:10; second drive
to 16:20; L05 optional exploration to about 16:30; later reference-led chapters
and ending from a permitted stationary position. Buffers are flexible, never
a reason to rush. This example is approximate; the category budget is the
source of truth. No measured drive/solve/reading duration is asserted.

Keep the conservative 16:30 winter observation cutoff. Later arrivals, unsafe
paths, poor light and cold all justify switching to references earlier. The
clock does not block assistance or turn the narrative into a timed race. No
after-dark nature search, required outdoor wait or seasonal concession.

## Resume, case-file review and ending

Resume offers the saved current objective plus relevant evidence, not a summary
that exposes later chapters. Case-file navigation shows granted records and
completed explanations. Back/forward or device relaunch never unlocks future
content, duplicates a reward or discards the current board draft.

Restart is in a secondary menu with explicit confirmation. It resets only this
adventure's investigation; a compatible complete offline package can remain.
Storage issues are visible and truthful. Do not promise that iOS can never evict
data or that Safari/standalone persistence has been tested before actual testing.

The final screen has two short fields, a deliberate Record finding action, then
a concise reveal. Full explanation is an optional expansion citing the collected
documents. Assisted completion reaches the same end, without criticism or a
required score. The completed case remains reviewable. Nothing is sent to a
third party. No required drive back to the known start is added.
