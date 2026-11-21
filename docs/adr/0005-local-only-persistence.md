# ADR-0005: Local-only persistence of the session log

## Status
Accepted

## Date
2026-11-21

## Context
Yesterday's memory (ADR-0006), the pulse check and the Afterglow tracker (ADR-0010) need workout history.
CONSTRAINTS §3: `localStorage` or `IndexedDB`, no accounts or backend in V1. The product docs give an
example log entry (`docs/product/session-log.example.json`).

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Could we skip history in V1? | No. Two acceptance criteria (Memory Persistence; streak tracker) depend on it. |
| **Scope** — What is stored? | One entry per completed session. No per-set telemetry, no health metrics, no body weight. |
| **Dependencies** — localStorage or IndexedDB? | `localStorage`: synchronous, available everywhere, and the data is tiny (~200 B/session; 730 sessions ≈ 150 KB, far below the ~5 MB quota). IndexedDB is warranted only if V2 progression tracking grows the data. |
| **Data model** — Shape? | The example entry plus `completedAt` (epoch ms, orders several sessions on one day) and `rating: null` until the pulse check: `{date, completedAt, mood, durationMin, primaryFocus, exercisesCompleted, rating}`. Stored as a JSON array under the versioned key `mpt:sessions:v1`; capped at the 730 most recent sessions (2 years). `date` is the **local** calendar date so "yesterday" matches the user's day. |
| **Security & privacy** — Health data? | Workout history is mildly sensitive. It never leaves the device: no network, no analytics, no third-party scripts. Reads are defensive: corrupt JSON or entries failing the type guard are ignored rather than crashing the app (data can be edited via devtools or by a future version). Clearing site data deletes everything; this is documented, not hidden. |
| **Alternatives** — Cloud sync? | Out of V1 scope (architecture-and-scope.md). |

## Decision
`src/storage/sessionLog.ts` owns the key, the type guard, `loadSessions`, `appendSession` and
`rateSession`. All writes are wrapped so a full or blocked storage (private mode) degrades to
"history not saved" instead of an exception. A schema change bumps the key suffix (`v2`) with a migration.

## Consequences
- History is per-browser/per-device; switching phones loses streaks (accepted for V1).
- Tests cover round-trip (reload survival), rating update, corrupt-data tolerance and the size cap.

## Alternatives Considered
### IndexedDB
- Pros: Async, larger quota, structured queries.
- Cons: More code for a ~150 KB dataset.
- Rejected because: not needed until V2.

### Backend + accounts
- Rejected because: CONSTRAINTS §3 forbids it in V1.
