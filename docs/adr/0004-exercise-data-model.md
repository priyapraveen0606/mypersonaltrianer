# ADR-0004: Exercise data model and vetted library

## Status
Accepted

## Date
2026-11-21

## Context
SPEC §5 and `build-readiness.md` define an exercise JSON schema; CONSTRAINTS §1 forbids side-lying moves
and runtime-invented exercises. The starter `exercises.json` (now `src/data/exercises.json`) has 24 entries.
`video-preferences.md` adds an optional `videoUrl` and asks for it on `chandra-namaskar`.
SPEC §4.1 names the unsafe flag `itBandRisk: true`; CONSTRAINTS and the data use `itBandSafe: false`.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Do we need runtime validation if the JSON is bundled? | Yes. The JSON is hand-edited; a typo (e.g. `"side lying"`, a missing field) must never reach the engine. Validation is cheap and doubles as the safety net for CONSTRAINTS §1. |
| **Scope** — 30–40 exercises (architecture-and-scope.md) vs the 24 supplied? | Ship the 24 vetted entries. CONSTRAINTS §1 forbids inventing moves, and safety vetting is the product owner's call. The engine is written to work with any library size. |
| **Dependencies** — Schema library (zod etc.)? | No; a ~40-line hand-written validator over string-literal unions in `src/domain/types.ts` keeps the runtime dependency count at React only. |
| **Data model** — Canonical fields? | Exactly the fields in the supplied JSON (`id, name, moods, equipment, primaryFocus, targetMuscle, position, itBandSafe, requiresFormCheck, formCue, defaultDurationSec, defaultRestSec, tempo, voiceIntro`) plus optional `videoUrl`. `itBandSafe` is canonical; SPEC's `itBandRisk` is treated as a naming slip and not added. `primaryFocus` is one of `full-body-flow, lower-body, upper-body-back, cardio, recovery`. |
| **Security & privacy** — Untrusted input? | `videoUrl` ends up in an iframe `src`; only `https` YouTube watch/youtu.be URLs with an 11-char id are accepted and rewritten to `youtube-nocookie.com/embed/…` (ADR-0009). Everything else is rejected at load. |
| **Alternatives** — Store exercises in IndexedDB, or fetch remotely? | See below. |

**Open questions for the product owner** (interim decision in brackets):
1. Add the remaining 6–16 vetted exercises to reach 30–40? [ship with 24]
2. Is `https://www.youtube.com/watch?v=oROcJnaw0NU` the right Chandra Namaskar video? [use it, as `video-preferences.md` suggests]

## Decision
- `src/data/exercises.json` is the only exercise source, bundled into the app (and precached by the SW).
- `loadLibrary()` validates every entry and **drops** any that is malformed, duplicated, side-lying, or
  `itBandSafe: false`, so the hard safety filter applies even before the engine runs.
- `chandra-namaskar` gets the whitelisted `videoUrl` from `video-preferences.md`.

## Consequences
- Tests assert: every bundled entry is valid; no side-lying/unsafe entries; ids unique; at least one
  banded glute-medius move exists (needed by the auto-balance rule, ADR-0006).
- Adding an exercise = edit the JSON; a bad edit fails CI rather than shipping.

## Alternatives Considered
### Remote exercise catalogue
- Pros: Update without redeploying.
- Cons: Breaks offline-first, adds a backend.
- Rejected because: out of V1 scope (ADR-0003/ADR-0005).

### Generate exercises with an LLM at runtime
- Rejected because: CONSTRAINTS §1 "DO NOT hallucinate exercises".
