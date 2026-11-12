# DEVELOPMENT SPOILERS — v2 overhaul: route, research, design, testing

Recorded 2026-11-12. Supersedes everything in `../archive-v1/`. Neither intended
player should read this file. Authoring source with plaintext answers:
[case-source.json](case-source.json); build with `python3 scripts/build_case.py`.

## Why v2

The v1 case put every real-world observation behind optional reference
documents. It ran five of eight puzzles at a single picnic stop, and it told a
bureaucratic records story. v2 makes real, publicly readable features the
*primary* path. Every location clue still has a complete "Can't access this clue"
reference.

## Route (3 stops after the start)

| Ch | Place | Arrive (est.) | Physical use | Walk (car→stop→car) |
|----|-------|---------------|--------------|---------------------|
| 1 | Fat Head's, 17450 Engle Lake Dr (customer drink visit) | 15:00 | none (phone only) | none |
| 2 | Berea Falls Scenic Overlook, Metroparks pin 41.378044,-81.866079, Berea Falls Trailhead lot | ~15:50 | watch the falls from the deck (P3) | ~0.1 mi (published "80-yard" approach, provisional) |
| 3 | North end of Coe Lake Park, Seminary St S of E. Bridge St: marker 16-18 (41.3654154,-81.8516549), then marker 82-18 at NW corner Seminary & Church St (41.3672041,-81.8515956) | ~16:25 | read marker 16-18 side B (P5); read marker 82-18 (P6) | ~0.15 mi from Seminary St parking; ~0.3 mi from the City Hall lot (11 Berea Commons). Map estimates, not walked |
| 4 | Anywhere seated (no travel) | ~16:55 | none | none |

Drive estimates: Fat Head's to the falls is about 3–4 mi, about 10–15 min. The
falls to downtown is about 1.2 mi, about 5 min. Both are map-based. The earlier
v1 research (archive) covers the falls lot and Metroparks hours.

**Time budget (planning estimate, not measured):** Ch1 25–35 min (with drinks),
drive 15, Ch2 20–25, drive 8, Ch3 30–35 (walk included), Ch4 15–20, plus
transitions and ending. That totals about 2h20–2h45 of core play. Pauses extend it.

**Daylight:** In January, Cleveland sunset is roughly 17:05–17:35. Outdoor work
should finish by about 16:45 in early January. The markers are in a lit downtown
area, but legibility at dusk is not verified, and the fallback covers it.

## Verified facts used

| ID | Fact (exact use) | Source (reviewed 2026-11-12) | Status |
|----|------------------|------------------------------|--------|
| R1 | Marker 16-18 full text (both sides). Side B: photograph looks north to E. Bridge St; "The photographer stood approximately where you are standing."; Nokes quote, "The Big Quarry," 1895. Location "S of E. Bridge Street at the northern part of Coe Lake Park", 41.3654154,-81.8516549. | remarkableohio.org/marker/16-18-… (Ohio History Connection) | Text **Verified** (official registry). Presence: photographed 2007-11-03 (Chris Light, Wikimedia, EXIF), and HMDB lists a further photo set dated **2026-02-28** (Craig Doda), seen via search-result summary only because HMDB blocks automated fetches. **Provisionally Verified** for current legibility, with a full-text fallback. |
| R2 | Marker 82-18: organized June 9, 1855 (seven members, abolitionists); sanctuary 1869; 100-foot spire added 1954. NW corner of Seminary & Church St. The plate reads "18-82" (registry alert). | remarkableohio.org/marker/82-18-… | Text **Verified**. Presence: 2007 photo (HMDB/Wikimedia), Remarkable Ohio photos uploaded 2022-08, Waymarking visit logs to 2021-05-01. Building now associated with the BW Conservatory (Waymarking). **Provisionally Verified**, full-text fallback. |
| R3 | Marker 20-18 sentences: 1847 transfer "designated it by deed as a public promenade"; pump and trough "on the southeast angle … until 1924". | remarkableohio.org/marker/20-18-… | Text **Verified**. Used as Helen's *copied* transcription. Visiting is optional (~600 ft west). |
| R4 | Coin toss 1836; Sheldon chose Berea over "Tabor (Mount Tabor)"; Baldwin called heads. | cityofberea.org/326/History | **Verified** (documentary, quoted) |
| R5 | Falls geology paragraph (sandstone over soft shale; shale erodes, sandstone undermined and breaks off). | clevelandmetroparks.com …/berea-falls-scenic-overlook | **Verified** (documentary, quoted). The on-site observation is general (water over a rock edge); no specific feature is asserted. |
| R6 | Wallace Lake: former quarries flooded in 1941, two quarries joined. | clevelandmetroparks.com …/wallace-lake | **Verified** (documentary; P2 card only, not visited) |
| R7 | Downtown free street parking and city lots; municipal parking behind City Hall, 11 Berea Commons. | cityofberea.org/322/Working-Here; cityofberea.org/573/Parking | **Verified** (general provision). Specific space availability is a planning assumption (D13). |
| R8 | City park rules prohibit games in public parking lots (v1 F073). | v1 research S13 | Honored: players are told not to play in the lot. |
| R9 | Falls overlook dedication plaque (Kiwanis Club of Cleveland). | Wikimedia 2013 photo | **Not used** (year unreadable, old photo). |

No physical walkthrough has occurred. No claim is made about current marker
condition beyond the evidence above.

## Case logic (summary)

Fiction: Helen Marsh, an outside reader for an auction, is found drowned at a
fictional flooded private pit ("Larkmoor"). Lot 112 is a forged 1849 "John
Baldwin" letter, and every person in the case is invented. The forger, Iris
Calloway (conservator), wrote it on genuine old paper using phrases from the
modern markers.

| P | Ch | Mechanic | Inputs | Answer |
|---|----|----------|--------|--------|
| P1 | 1 | Keyword substitution (decoder tool) | Helen's note "name that lost the toss, one word" + R4 | TABOR → "THE LETTER IS A LIE. THE STONE REMEMBERS. BEGIN WHERE THE RIVER BREAKS IT." |
| P2 | 1 | Destination deduction (4 pins) | decoded line + pins (R1, R5, R6, R3) | Berea Falls |
| P3 | 2 | Causal ordering (tap) | on-site view + Helen's sketch; fallback R5 | seep → shale wears → ledge hangs → breaks |
| P4 | 2 | Torn-edge reassembly with decoy | six scraps | Thursday 7:30, Larkmoor pit, meeting "the one person who knows where the paper truly came from" |
| P5 | 3 | Site reading | Helen's last page (Nokes text, unattributed) + marker 16-18 side B | 1895 |
| P6 | 3 | Classify 5 letter lines vs 1849 | markers 16-18, 82-18, Helen's 20-18 copy | contradicted: spire line (1855/1954) and blue-water line (1895). Not contradicted: 1847 promenade, grindstones, pump |
| P7 | 4 | Alibi elimination (multi-select) | ME window 19:15–20:30, drive times, four records | Victor + Iris |
| P8 | 4 | Final single choice | P4 page + bill of sale ("estate details held by seller; not disclosed to buyer") | Iris Calloway |

The twist: Victor carries the obvious motive and survives the alibi step. The
provenance detail, available since Chapter 1, shows that only Iris "knows where
the paper came from." Witnesses never lie. All records are accurate.

Fairness notes:
- P1: MOUNTTABOR produces gibberish in the decoder and gets a near-miss message.
- P6, line "pump": the marker gives an end date (1924) but no start. "Not
  contradicted" is defined in the hint as "nothing rules it out."
- P6, line "Congregational church": the 1954 spire alone rules it out, even if
  some earlier Congregational group had existed.
- P7: Dana's 20:05 badge-out plus 35 min gives 20:40, after 20:30.

## Testing (2026-11-12, this container)

- `npm test`: 6 node tests. Every authored answer is accepted, near-misses
  return their message, the cipher decodes only with the key, progression cannot
  skip and does not leak later grants, and incompatible saves are rejected.
- `node tests/playthrough.cjs`: Chromium with iPhone 13 emulation, in light and
  dark. It runs the offline download and readiness check, then all 8 puzzles
  through the UI with wrong-then-right answers (light run). It covers a hint, a
  reveal (P4), a fallback (P3), a reload mid-game (P5), no later puzzle title or
  ending on screen early, the ending, the case file, a confirmed restart, and an
  offline relaunch. Both passed.
- Not done: a real iPhone, Home Screen install, any physical visit, or timing
  with real players.
