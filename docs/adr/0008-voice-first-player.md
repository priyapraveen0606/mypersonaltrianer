# ADR-0008: Voice-first player with 5-second form-check cards

## Status
Accepted

## Date
2026-11-21

## Context
Module 3 / SPEC §4.2 / CONSTRAINTS §2–3: the whole session must be completable without touching or
looking at the phone; Web Speech API TTS (rate 0.95), Play/Pause, Skip, Repeat, Mute; tempo counting;
Screen Wake Lock acquired while active and released on pause/finish; 5-second form check before
`requiresFormCheck` moves only. Acceptance: "Hands-Free Flow" for a 15-min Moody session.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Could a plain countdown timer do? | No; hands-free voice is the core acceptance criterion. |
| **Scope** — Which cues? | Step start: move name + `voiceIntro` (first set) or "Round N, name" (later sets); rest: "Rest N seconds"; 5 s before the next move: "Next up: …"; last 3 s of work: "3, 2, 1"; tempo moves (`a-b-c`): "Down/Hold/Up" + counts; `isometric`/`hold`: "Hold… keep breathing" every 10 s; `breath`: box-breathing "Breathe in / Hold / Breathe out / Hold" every 4 s; `flow`/`fast`: encouragement at the halfway point. Form-check card: illustration-free text card (name + `formCue`), auto-advances after 5 s or on "Got it, start". GIFs are V2 (ADR-0011). |
| **Dependencies** — | `window.speechSynthesis`, `navigator.wakeLock` (both feature-detected; the player works silently/without wake lock if missing and says so on screen). ADR-0006 session. |
| **Data model** — | Pure `buildTimeline(session)` → steps `{kind: 'form-check'|'work'|'rest', itemIndex, durationSec}`; pure reducer over `{stepIndex, remainingSec, status, muted}` with actions `tick/pause/resume/skip/toggleMute`; pure `cuesFor(timeline, state)` returns phrases. React only wires a 1 s interval, speech and wake lock. |
| **Security & privacy** — | TTS runs on-device/OS; no audio is recorded; no microphone permission requested. |
| **Alternatives** — Pre-recorded audio, paid TTS? | See below. |

### Resolved ambiguities
- **Skip** jumps to the next *move* (skipping its remaining rest too), not the next step.
- **End early** (available while paused) returns home without logging; only finished sessions count
  toward streaks and memory, so a skipped heavy leg day does not mislead tomorrow's plan.
- **Repeat** re-speaks the current step's opening cue.

## Decision
Implement `src/player/{timeline,reducer,cues}.ts` (pure, unit-tested), `src/voice/speech.ts`
(Web Speech wrapper, rate 0.95, prefers an English voice), `src/hooks/useWakeLock.ts`, and
`PlayerScreen`. Controls are ≥ 64 px.

## Consequences
- Background music ducking is left to the OS (ADR-0011).
- Timer uses a 1 s interval; browsers throttle background tabs, but Wake Lock keeps the screen (and
  tab) in the foreground during a session.

## Alternatives Considered
### Pre-recorded voice clips
- Pros: Consistent voice.
- Cons: Every exercise/round/rest combination needs recording; large offline bundle.
- Rejected because: TTS covers dynamic content at zero cost.
### Paid neural TTS (ElevenLabs, OpenAI)
- Rejected because: CONSTRAINTS §3 "Zero Paid APIs", and it breaks offline use.
