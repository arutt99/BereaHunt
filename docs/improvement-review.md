# Improvement review (spoiler-free)

> **Update 2026-11-12:** These recommendations were acted on in the v2 overhaul. See the README status section. Remaining: real-iPhone recheck, a physical walkthrough and real player timing.

Reviewed 2026-11-11. Written for an intended player. It names no story details,
destinations past the known start, clues or answers. The reviewer read the
spoiler records so this assessment could be made. Neither player should read them.

## Overall verdict

The app runs and its offline/save setup looks solid. The *game* falls short of
the brief's main goals. The README's "ready" verdict comes from automated checks
and document audits. No person has played it.

## Highest-impact problems

1. **The real world is optional.** Every puzzle can be solved from the
   reference material in the app. Physical observation is always marked
   optional. You could play the whole thing at a kitchen table. This fails
   "physical locations should be integral" and "make familiar places feel
   mysterious." The cause: being cautious about verification led to taking
   location dependencies out instead of verifying a few good ones well.
2. **Too much of the outing is spent sitting in one place.** Most of the puzzles
   happen at one stationary spot after travel ends. The pacing feels like doing
   paperwork in a park, not an outdoor investigation.
3. **The story is dry.** The case leans on matching records and IDs rather than
   people, motives and a sense of place. The brief asked for possible
   conspiracy, restrained eeriness and history that matters. There is little
   hook, no real turn in understanding, and local history appears only as
   background.
4. **Several puzzles are too easy or too mechanical.** Some read like
   reading-comprehension or lookup tasks. They aren't "aha" deductions, and the
   final answer mostly fills itself in from earlier steps. The brief's Exit-style
   target (layered, satisfying insights) isn't met.
5. **Immersion breaks.** Nearly every document carries a "fictional case
   record" label and legal-style disclaimers. Instructions are over-hedged. The
   look is a generic dark app theme, not a case file.
6. **Process overhead.** A large share of the repo is self-audit documentation
   and validators of documents. That effort went into paperwork instead of play
   quality.

## Recommended improvements

- **Rebuild around 3–4 real, verified physical "aha" moments.** Pick features
  verifiable from recent dated imagery and official sources: inscriptions,
  plaques, monument dates/symbols, distinctive architecture. Make each one the
  key to a puzzle, and keep the reference image only as the "can't access"
  fallback. Spread puzzles across stops so each stop has its own discovery.
- **Rewrite the case as a human mystery tied to local history.** Use a small
  cast with motives, one real historical thread that matters to the solution,
  and a mid-game reveal that reframes earlier evidence. Keep this within the
  brief: no unreliable witnesses, short texts.
- **Raise puzzle depth and variety.** Use multi-step deductions that combine
  evidence from different stops, one or two well-signposted hidden messages,
  and a final deduction that takes real synthesis rather than lookup.
- **Fix the 3 p.m. winter daylight problem in the design.** Put the outdoor
  observation stops early. Keep after-dusk work indoors-safe or car-safe.
- **Restyle as a case file.** Use paper/folder textures with high-contrast
  text, stamped headers, an evidence board, and chapter transitions. Remove the
  per-block "fictional" labels and put one disclaimer in the preparation screen.
- **Cut wording and docs.** Use shorter player text, fewer caveats, and one
  concise spoiler record per area.
- **Get a real playtest.** You can't judge puzzle quality without spoiling
  yourself, so recruit one non-player to play it remotely, or at least have a
  separate reviewer stress-test fairness. A physical check of chosen features
  remains the main open risk.

## Protecting your own surprise

- Don't browse this repository on GitHub. File names, commit history and
  `docs/development-spoilers/` reveal content. The public `site/content/` files
  also contain everything.
- Limit future progress reports to practical, spoiler-free notes, as here.
