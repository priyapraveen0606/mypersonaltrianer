# ADR-0014: Rest-end chime and guided Chandra Namaskar

## Status
Accepted

## Date
2026-11-22

## Context
The player already times rest and work steps and uses browser speech synthesis, but it has no
audible rest-completion signal or pose-by-pose Chandra Namaskar guidance. The product owner asked
for a sound at the end of rest and audio guidance for the supplied Chandra Namaskar sequence.
ADR-0008 defines the voice-first player; ADR-0009 defines the whitelisted video mode.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Is this needed for V1, or can it be deferred or dropped? | The product owner explicitly requested both additions to the existing V1 player. |
| **Scope** — What is the smallest version that meets the acceptance criteria? What is explicitly out? | Play one short chime when a rest ends naturally; do not chime on skip, pause, or mute. Speak the supplied Chandra sequence as brief cues, scheduled proportionally over its work duration. No user-configurable sound, volume, or cue editor. |
| **Dependencies** — What does it depend on (ADRs, libraries, browser APIs) and what depends on it? | Extends ADR-0008's player and Web Speech API; uses the built-in Web Audio API with no package or external service. No other feature depends on it. |
| **Data model** — What data does it read/write, in what shape, and where is it stored? | Add optional `voiceSteps: string[]` to the bundled exercise definition and its TypeScript type. No workout or user data is persisted. |
| **Security & privacy** — What user data, untrusted input, or external origins are involved? | No user data, network requests, or new external origins. Chime audio is synthesized locally by Web Audio. |
| **Alternatives** — What else could satisfy the need? (Summarised below.) | Speech-only rest completion; fixed cue timings; remote audio assets. These are rejected in favor of a concise local chime and duration-proportional speech cues. |

No product-owner open questions. Cue wording follows the supplied sequence, with concise spoken
phrases to fit the existing move duration.

## Decision
Initialize a local Web Audio context from the workout-start gesture. At the end of a naturally
completed, unmuted rest, play one brief synthesized chime. Preserve the existing spoken next-step
cue. Add the Chandra pose prompts to `exercises.json` and schedule them proportionally through its
work step; its opening cue gives the standing-start instruction. Repeat the guidance on each
round. Existing mute control silences both speech and chime.

## Consequences
- Rest completion is easier to notice without watching the timer.
- Chandra Namaskar provides the supplied breath-led sequence at different work durations.
- Browsers without Web Audio continue to provide the existing spoken guidance.
- Verify cue scheduling, natural rest completion versus skip, mute behavior, and the sound
  oscillator with unit tests; run the repository's typecheck, lint, and unit tests.

## Alternatives Considered
### Spoken cue only at rest completion
- Pros: Reuses the existing speech API.
- Cons: Does not provide the distinct sound requested.
- Rejected because: The user explicitly requested an end sound.

### Fixed cue timestamps
- Pros: Simple to configure and test.
- Cons: The engine can stretch exercise durations.
- Rejected because: It would bunch prompts together or leave long silent gaps at other durations.

### Bundled or remote chime asset
- Pros: Could provide a richer sound.
- Cons: Adds an asset/dependency or an external request.
- Rejected because: A short synthesized tone meets the need locally and offline.
