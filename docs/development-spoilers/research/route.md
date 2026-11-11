# DEVELOPMENT SPOILERS — feasibility route and timing

Review date: **2026-11-11**. **Conditional route, not approved player directions.**
Phase 3 is **Blocked** until the access and measurement gates in
[`verification.md`](verification.md) close. Do not publish this itinerary or
claim it was driven/walked. No story or solution is committed here.

## Route selection

Proposed order: **L00 → L01 → L02 → L03**, ending downtown without a required
return to L00. L04 is a reserve and is not a concealed extra stop. See
[`locations.md`](locations.md) for exact candidate definitions, restrictions,
coordinates and fact IDs. This keeps the future route in Berea itself, groups
the nature observations before the stationary ending, and avoids the more
uncertain construction-area candidate. L00 is the players' planned customer
drink visit; no additional meal, purchase or scheduled break is introduced.

| Leg | Planning corridor, not turn-by-turn instructions | Distance evidence | Travel allowance |
| --- | --- | --- | --- |
| L00 → L01 | Customer departure from F001's venue address toward the Barrett/Valley Parkway overlook area | Exact exit-to-entrance drivable length **unmeasured** (B04); no fixed game bay required. | **20 min** allocation, not measured/map-provider travel time. |
| L01 → L02 | Valley Parkway corridor between operator destination pins | Haversine separation **1.257 mi** is a lower bound only; drivable route **unmeasured**. | **10 min** allocation. |
| L02 → L03 | Lake area to downtown municipal parking | Haversine separation of lake/park pins **0.433 mi** is a lower bound only; entrance-to-entrance drive **unmeasured**. | **10 min** allocation. |

Pin sources: F010/F020/F030. The outgoing official directions links identify
destinations; live map rendering did not succeed. Straight-line distances use
the haversine formula with Earth radius 3,958.7613 miles and were calculated
locally on the review date. They do **not** establish driving distance, road
access, walking length or duration. No unsupported numeric road mileage or
turn instruction is supplied. Before approval, trace the legal road route
between confirmed entrances, record provider/map date, distance and realistic
time, and reconcile the 40-minute allowance. Do not enter the Albion–W130th
roadworks segment described in F062 as a convenient assumed through-route.

## Car-to-stop-to-car walks

| Stop | Proposed usable arrangement | Full round trip | Gate / current design |
| --- | --- | --- | --- |
| L00 | Open the first clue while having a drink during the planned customer visit. | Ordinary customer approach unmeasured; no extra game-directed exterior walk. | B01 **Resolved** by user clarification; known start, no noncustomer lot opening or fixed game bay. |
| L01 | Defined ordinary visitor bay → approved overlook platform → same bay. | **Not verified.** Old 80-yard hike lead is insufficient. | B02. No water/railway approach. |
| L02 | Defined ordinary visitor bay → nearest approved land-side viewpoint → same bay. | **Unknown** along a usable path. | B02. No full lake circuit, beach/ice entry or invented pier-panel task. |
| L03 | Defined free municipal bay → public sidewalks/crossings → park viewpoint → same bay. | **Unknown** along usable sidewalks. | B02/B03. Default late-winter stage uses documentary evidence, with no after-dark walk. |

**Acceptance:** approximately 0.25 mile **total** (about 402 m) per individual
walk, including parking-lot travel and all detours. The “nearest point” on a
map, an accessible-only bay, a straight-line radius, a destination pin or an
80-yard old description does not establish that. A reference fallback removes
an uncertain puzzle observation; it does not prove the proposed walk is short
or the parking legal. Confirm with a scaled current path trace or suitable
operator evidence before treating the standard outing as approved. If an
approach fails, move the viewpoint closer or substitute a better-supported
candidate under the existing scope; no player clue reconnaissance required.

## Three-hour planning envelope

This is a design budget, **not a measured playthrough or certified drive**.
It assumes eight substantial puzzles averaging eight minutes, discussion on
one phone, short reading, clear legal approaches and ordinary travel. Phase 4
must allocate actual puzzles to the budget; phase 7 must measure them.

| Local interval | Allocation | Minutes | Design assumption |
| --- | --- | --- | --- |
| 15:00–15:10 | L00 opening during planned customer drink visit | 10 | Installed, completely downloaded app; first clue opens from the normal customer area. No special bay or game assistance from staff. This is an opening estimate, not a limit on the drink visit. |
| 15:10–15:30 | Travel to L01 | 20 | Safe navigation only; no solving while moving. |
| 15:30–16:00 | L01 | 30 | 10 walking/observation + two 8-minute puzzles + 4 reading/transition; walk first, phone work after returning. |
| 16:00–16:10 | Travel to L02 | 10 | Time allocation awaiting measured route. |
| 16:10–16:40 | L02 | 30 | 10 walking/observation first + two 8-minute puzzles + 4 reading/transition. |
| 16:40–16:50 | Travel to municipal cluster | 10 | Confirm legal bay before interacting. |
| 16:50–18:00 | L03 documentary investigation and ending | 70 | Four 8-minute puzzles, 12 concise evidence reading, 8 ending, 8 buffer; 10 reserved for optional safe-light observation or extra discussion. No essential outdoor task in this interval. |
| **Total** | **Core outing** | **180** | 40 travel + 30 observation/walking allowance + 64 substantial solving + 30 reading/opening + 8 ending + 8 buffer. |

Late-stage parking dwell is approximately 70 minutes; permission/maximum stay
must be verified (B03). The last 10-minute observation allowance is **not** an
after-dark instruction: in January it remains in-app discussion/reference
work. The players' planned starting drink visit is explicit; its length is
flexible, with no extra scheduled game break. Longer time there, pauses, slower
solving, traffic and ice can lengthen elapsed time; assistance is immediate,
not time-gated. The nominal 16:10–16:20 final nature walk gives useful winter
margin, but no fixed schedule justifies rushing or taking an unsafe path.

## Daylight and seasonal audit

NOAA S21's fractional-year/equation-of-time/declination method, zenith 90.833°,
was calculated with Python standard `math`, `datetime` and `zoneinfo`, using
L01's coordinates and `America/New_York`. The calculation used the noon
fractional-year approximation; round to minutes and allow several minutes
of astronomical-model error, plus much larger terrain/weather effects.
These are **planning estimates**, not an observed horizon or weather forecast.

| Representative date | Approximate sunset, local |
| --- | --- |
| 2027-01-01 | 17:07 EST |
| 2027-01-31 | 17:40 EST |
| 2027-02-28 | 18:15 EST |
| 2027-03-01 | 18:16 EST |
| 2027-03-14 | 19:31 EDT |
| 2027-04-01 | 19:51 EDT |
| 2027-05-01 | 20:23 EDT |
| 2027-05-31 | 20:52 EDT |

Planning consequence: an 18:00 ending cannot assume January daylight. Put the
two nature walks first, use a conservative **16:30 winter outdoor cutoff**,
and make the later historic setting's physical observation optional. If late
arrival, cloud cover, ice or unsafe conditions defeat the observation, open
the verified reference without a visit. “Open until 23:00/22:00” does not mean
illuminated, snow-cleared or safe. An exact play date is not necessary to
design for the worst part of the window; refine the estimate if a date becomes
known. No recheck, weather prediction or monitoring has been scheduled.

## Contingencies

| Condition | Required behavior for later design |
| --- | --- |
| Normal starting-venue customer access unavailable | Preserve progress and the selected customer start; use normal venue arrangements without inventing special parking or a replacement stop. B01's noncustomer-parking concern is resolved by the user's clarified plan. |
| Full lot, closed approach, changed feature or poor visibility | No arrival proof needed. Use the same source-backed reference, continue only while legally and safely stopped elsewhere, and preserve the unlocked story. |
| Snow/ice, flood warning, no safe pedestrian access or lost daylight | Skip the outdoor observation; no pressure to investigate. If even travel/stopping is unsuitable, postpone the outing and preserve progress. |
| Reserved space or event | Do not enter it or assume an alternate private lot. Use verified public alternatives only; otherwise references. |
| Personal pause/slower solving | Save and resume without countdown/penalty. After the daylight cutoff use references, not hurried outdoor recovery. |
| Network unavailable | Cached written arrival instructions and references remain accessible; external maps/search may be unavailable. No claim of offline turn-by-turn driving. |

The route is a coherent **candidate** with an explicit three-hour budget and
daylight strategy. Later-stop parking arrangements, usable short routes and drivable
measurement remain essential feasibility evidence, so this file does not
claim the phase 3 completion check has passed.
