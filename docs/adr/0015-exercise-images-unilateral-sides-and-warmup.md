# ADR-0015: Exercise images, pose-by-pose salutations, unilateral sides, warm-up and cool-down

## Status
Accepted

## Date
2026-11-28

## Context
The product owner asked for four related player/engine changes: an image for every move, an image
per announced pose in Surya and Chandra Namaskar, left/right handling for one-sided moves, and a
warm-up and cool-down in every session (Fast / Bonkers had neither). CONSTRAINTS §3 requires every
asset to be bundled for offline use. ADR-0004 defines the exercise schema, ADR-0006 the engine (it
left warm-up blocks out of V1), ADR-0008 the voice cues (text-only form-check cards) and ADR-0014
the guided Chandra `voiceSteps`. This ADR amends those four where they conflict.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Is this needed for V1, or can it be deferred or dropped? | Explicitly requested by the product owner. One-sided moves currently say "switch sides" with no time split, and Fast sessions start cold, so both are correctness/safety fixes, not polish. |
| **Scope** — What is the smallest version that meets the acceptance criteria? What is explicitly out? | In: optional `imageKey`, structured `voiceSteps`, optional `unilateral`, a `warmup` primary focus, placeholder SVG stick figures. Out: real artwork, animated GIFs (still V2, ADR-0011), per-side images, user-configurable warm-up length. |
| **Dependencies** — What does it depend on (ADRs, libraries, browser APIs) and what depends on it? | No new packages. Images are static files under `public/images/exercises/`, precached by the existing Workbox `**/*.svg` glob. Session-log memory (ADR-0005) is unaffected: warm-up and recovery are excluded from the dominant focus. |
| **Data model** — What data does it read/write, in what shape, and where is it stored? | `Exercise.imageKey?: string` (slug), `Exercise.voiceSteps?: { cue, imageKey }[]` (replaces `string[]`), `Exercise.unilateral?: boolean`, `PrimaryFocus` gains `'warmup'`. `SessionItem.side?: 'right' \| 'left'`. All bundled in `exercises.json`; nothing new is persisted. |
| **Security & privacy** — What user data, untrusted input, or external origins are involved? | No user data or new origins; images are same-origin, already allowed by `img-src 'self'` (ADR-0013). `imageKey` is validated as a lowercase slug so a bad edit cannot build a path outside the image folder. |
| **Alternatives** — What else could satisfy the need? (Summarised below.) | Remote/CDN images, a separate `phase` field, one full-length set per side. Rejected below. |

No product-owner open questions. Interim decision: images are simple placeholder SVGs, shared where
moves hold the same pose (e.g. both glute bridges, both 1 kg hinge moves), until real assets exist.

## Decision
1. **Images.** Each exercise has an `imageKey`; the player shows `/images/exercises/<imageKey>.svg`
   above the move name during `form-check` and `work` steps (not during rest or video mode). A unit
   test asserts every referenced key has a bundled file.
2. **Pose-by-pose salutations.** `voiceSteps` become `{ cue, imageKey }[]`. Chandra keeps its 14
   cues; Surya gains an 11-step sequence. Cue timing is unchanged (ADR-0014). While a guided work
   step runs, the player shows the image of the most recently announced pose, and the move's own
   image before the first pose cue.
3. **Unilateral moves.** `unilateral: true` moves (supported hip extension, banded hip abduction,
   bird-dog, figure-4 stretch, lateral wall push) are emitted as two consecutive items, right then
   left, splitting `defaultDurationSec` (right gets the odd second). The right set has no rest and
   carries the form check; the left set carries the move's rest. Time-filling still costs the move
   as one unit, so the ±60 s guarantee is unchanged. The screen shows "Right side"/"Left side"; the
   voice says "<name>, right side", cues "Next up: switch to your left side." and opens the left set
   with "Left side. <name>. Begin."
4. **Warm-up and cool-down.** New `warmup` moves (gentle march, ankle/knee/hip circles, arm circles)
   and a standing chest-opener cool-down for Fast/Strong; box breathing also covers Slow, so every
   mood has both. Like the existing cool-down reservation, the engine reserves time up front for a
   warm-up block: warm-up moves in library order while they fit 10 % of the session (always at
   least one). Warm-up and recovery are excluded from the main block and from the session's
   dominant focus.

## Consequences
- Every session now starts with a warm-up and ends with a cool-down; Fast always begins with the
  gentle march and ends with the standing stretch.
- One-sided moves get equal time per side; the session has more items ("Move N of M" grows).
- Placeholder art must later be replaced file-for-file; keys stay stable.
- Verified by unit tests for validation, bundled images, warm-up/cool-down placement, right/left
  splitting, side cues, pose images, and the PlayerScreen image/side labels, plus the existing
  Playwright BVT, regression and accessibility suites.

## Alternatives Considered
### Remote or CDN-hosted images
- Pros: No repository weight.
- Cons: Breaks offline use and needs a CSP change.
- Rejected because: CONSTRAINTS §3 requires bundled assets.

### A separate `phase` field instead of `primaryFocus: 'warmup'`
- Pros: Keeps focus and phase orthogonal.
- Cons: A second field that every engine filter must check; no move is both warm-up and main work.
- Rejected because: `recovery` already works this way for cool-downs; mirroring it is simpler.

### One full-length set per side
- Pros: More volume per side.
- Cons: Doubles the cost of unilateral moves and changes session balance.
- Rejected because: The request was to split the existing duration in half per side.
