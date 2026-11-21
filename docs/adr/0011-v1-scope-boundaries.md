# ADR-0011: V1 scope boundaries — defer progressive overload, music ducking, form GIFs

## Status
Accepted

## Date
2026-11-21

## Context
The product docs disagree on V1 scope:
- SPEC §4.3 lists the 3-Strike Progressive Overload Engine as a functional requirement, while
  `modules.md` and `architecture-and-scope.md` defer automatic progression and the 1-year dashboard to V2.
- `modules.md` lists Background Music Ducking under Module 3 and V2; `architecture-and-scope.md` defers it.
- Form-check visuals: `modules.md` puts looping GIFs in V2; `architecture-and-scope.md` keeps
  "text/illustration 5-second form-check cards" in V1.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Does V1 need progression? | No acceptance criterion depends on it; ratings are captured now (ADR-0010) so it can be added without losing history. |
| **Scope** — What exactly is deferred? | 3-Strike progression (tempo → volume → load tiers), equipment-upgrade prompts, 1-year dashboard, music ducking (no web API exists to duck other apps' audio; OS default handling applies), looping GIFs, accounts/cloud sync, native builds. |
| **Dependencies** — | Future V2 ADRs will build on ADR-0005's log (likely migrating to IndexedDB). |
| **Data model** — | No change in V1. |
| **Security & privacy** — | Deferring accounts/sync keeps all data on-device. |
| **Alternatives** — Build a minimal progression now? | Rejected: would need per-exercise ratings (conflicts with 1-tap, ADR-0010) and tier data the exercise schema lacks. |

## Decision
V1 = check-in, engine, voice player with text form-check cards, whitelisted video toggle, pulse check,
Afterglow. Everything listed above waits for V2 ADRs. SPEC §4.3 is annotated "V2 — see ADR-0011".

## Consequences
- The architecture-and-scope.md MVP list is the source of truth for V1.
