# ADR-0010: Post-workout pulse check and Afterglow tracker

## Status
Accepted

## Date
2026-11-21

## Context
SPEC §3.4, Module 4, architecture-and-scope.md V1: 1-tap "How did that feel?" (Easy | Just Right |
Too Hard) and a streak/afterglow screen. CONSTRAINTS §2: no calories, no weight, no guilt for missed days.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Collect ratings if progression is V2? | Yes: storing them now means V2's 3-strike rule (ADR-0011) has history from day one. Cost is one tap. |
| **Scope** — | Rating is per **session** in V1 (one question, one tap). Afterglow shows: current streak (consecutive days with ≥ 1 session, counted up to today or yesterday so an unfinished today doesn't reset it), total sessions, sessions in the last 7 days, and a celebratory line that treats every mood equally. |
| **Dependencies** — | ADR-0005 (`appendSession`, `rateSession`). |
| **Data model** — | Session is appended with `rating: null` the moment it finishes (so closing the app at the pulse check still counts the workout), then `rateSession(completedAt, rating)`. Stats derived on read; nothing extra stored. |
| **Security & privacy** — | Local only (ADR-0005). |
| **Alternatives** — Per-exercise ratings; skip the check | See below. |

## Decision
`PulseCheckScreen` → `AfterglowScreen`; pure `afterglowStats(sessions, today)` in `src/domain/afterglow.ts`.
No negative copy: a broken streak is simply not mentioned.

## Consequences
- Unit tests for streak edge cases (gap days, multiple sessions per day, today not yet done).

## Alternatives Considered
### Per-exercise ratings
- Pros: Finer-grained progression later.
- Cons: Many taps after every session; violates the 1-tap promise.
- Rejected because: V1 promise is one tap; revisit with ADR-0011's V2 progression.
