# Phase 6 readiness

Spoiler-free handoff, **2026-11-11**. **Phase 6 — Complete.**

The application now runs the authored adventure from introduction to ending.
It includes mobile navigation, evidence review and image inspection, all phone
working aids, typed answers, immediate progressive hints, separate unsolved
references and confirmed reveals, safe travel/reference continuation, automatic
saving and a confirmed restart. No practical requirement or case content changed.

Complete downloads verify every required local resource, including later chapters,
tools, hints, references, images and ending. Updates stage separately, preserve
the previous complete compatible version on failure, and keep an open case pinned
to one package. Corrupt/unavailable storage and incomplete caches produce visible
recovery instructions without silently resetting progress.

## Delivered and checked

- Complete native HTML/CSS/JavaScript `site/`, Home Screen manifest/neutral icons
  and preparation instructions. No runtime framework, backend, account, key,
  paid service, audio or essential third-party request.
- [README](../README.md) with actual local run/validation commands, updated
  [authoring guide](content/authoring-guide.md), complete application inventory
  and separate concealed implementation/test records.
- Eight runtime regression tests, including all 256 solve/reveal progressions,
  answer variants, legal state/travel gates, drafts, restoration, incompatible
  saves, storage failure/retry and concurrent-window protection.
- Existing eleven content tests, design/content self-tests and exact resource
  inventory checks pass; original story, research and factual classifications
  are preserved.
- Chromium browser tests run the full normal path and full offline assisted
  path, exercise all eight answer/aid controls, close/reopen during play, relaunch
  after a full browser-process shutdown and finish offline. Interrupted download
  retry, failed/incompatible/compatible updates, pinned versions, cache eviction
  detection/repair, corrupt saves, restart and storage failures are covered.
- Browser tests use the `/BereaHunt/` project subpath, compressed static files,
  a 390 × 844 touch/reduced-motion viewport and narrow/desktop geometry checks.
  Keyboard submission, labeled native controls, focus feedback and enlarged
  image inspection work; the neutral preparation screen was visually inspected.
  Detailed case-bearing evidence remains in development records.

## Boundaries and next phase

This is an **application completion verdict**, not a release verdict. Actual
physical iPhone Safari/Home Screen installation, standalone lifecycle and
storage-context behavior remain phase 7 checks. Linux Chromium viewport testing
does not establish them. No physical walkthrough, independent player playtest,
measured three-hour experience or live GitHub Pages deployment is claimed.

Source dates, estimates and future-condition uncertainty remain unchanged. The
exact outing date and iPhone/iOS version are still unknown. Neither player needs
to inspect clues or solutions in advance. No new approval or player scouting is
pending. Phase 7 should perform its full refinement/device/experience matrix;
phase 8 handles actual deployment. No default-branch merge is included here.

Delivery branch: `codex/phase-6-application`, based on fetched main `f9aa141`.
Implementation artifact commit: `6f0b065ec6911ef0271eb7763daf55b76042fc26`.
The following documentation commit records this exact hash in the
[phase handoff](../BUILD_PLAN.md); both belong to the same delivery branch.
