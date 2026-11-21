# ADR-0006: Smart Workout Engine

## Status
Accepted

## Date
2026-11-21

## Context
Module 2 / SPEC §4.1: hard safety filter, Auto-Balance rule, yesterday's memory, time scaling to
10/15/30/45 min ±60 s. CONSTRAINTS §4 requires automated tests for four guarantees.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Could users pick moves themselves? | No: CONSTRAINTS §2 (2-tap launch, no libraries). The engine *is* the product. |
| **Scope** — What is in V1? | Safety filter, Auto-Balance, memory, time scaling, form-check accounting. Explicit warm-up blocks and 3-strike progression are out (ADR-0011): the first move's `voiceIntro` serves as the lead-in. |
| **Dependencies** — Inputs/outputs? | Pure function `generateWorkout({mood, durationMin, recentFocus, library, rng})` → `WorkoutSession`. Inputs from ADR-0004 (library) and ADR-0005 (`recentFocus(sessions, today)`). No React, no storage access, so it is fully unit-testable. Injected seeded RNG (`mulberry32`) makes tests reproducible. |
| **Data model** — Session shape? | `WorkoutSession {mood, durationMin, targetSec, totalSec, primaryFocus, items[]}`; `SessionItem {exercise, round, formCheckSec, workSec, restSec}`. `primaryFocus` = focus with the most work seconds (recovery excluded); this is what the session log stores. |
| **Security & privacy** — Risks? | Safety, not security: the filter is applied twice (at library load and in the engine) so neither layer alone can let a side-lying move through. |
| **Alternatives** — See below. | |

### Resolved ambiguities
1. **"Yesterday"** = the most recent session dated today or yesterday (local). Doing lower body this
   morning must also protect tonight. Sessions older than yesterday are ignored.
2. **Memory rule**: after a `lower-body` session, `slow`/`strong`/`fast` exclude every `lower-body`
   move (prioritising back/arms/cardio, SPEC §4.1). `moody`/`meditative` are exempt (SPEC). If
   exclusion would empty the pool, the unfiltered mood pool is used.
3. **Auto-Balance**: a thigh-trainer move and a banded glute-medius partner form one *atomic unit*,
   so time-filling can never cut a session between them. Partners may come from outside the mood's
   tag list (safety beats mood). No partner available → thigh-trainer moves are dropped.
4. **Time accounting**: total = Σ(form-check + work + rest). The 5-second form check counts toward
   the budget (otherwise 45-min Strong sessions overrun by >60 s). Form checks appear only before the
   **first** set of an exercise. The final move has no trailing rest.
5. **Time scaling**: fill cyclically with whole units while they fit, append the mood's `recovery`
   move (box breathing) as cool-down, then spread leftover seconds over work time (then rest),
   at most +50 % per move. Result: exact target in practice; tests assert ±60 s.
6. **Moody ≠ beginner**: Moody sessions are consecutive rounds of the same flow (e.g. Chandra ×5 →
   Surya ×4 → box breathing in 15 min), never short stretch sequences.

## Decision
Implement as above in `src/engine/` (`generateWorkout.ts`, `memory.ts`, `random.ts`).

## Consequences
- `generateWorkout.test.ts` covers CONSTRAINTS §4 over 200 randomized generations plus every
  mood × duration × recent-focus combination: zero side-lying, 100 % Auto-Balance, ±60 s, no
  back-to-back lower body. Plus: library-only, form-check placement, reproducibility, missing-partner
  and unsafe-input cases.
- Adding a mood or exercise needs no engine change, only data.

## Alternatives Considered
### Fixed hand-written templates per mood × duration (20 templates)
- Pros: Fully predictable.
- Cons: No memory adaptation, repetitive, every library change means editing templates.
- Rejected because: memory and variety are core requirements.

### Constraint solver / ILP for exact timing
- Pros: Optimal packing.
- Cons: Heavy dependency for a problem greedy filling + stretching already solves exactly.
- Rejected because: unnecessary complexity.
