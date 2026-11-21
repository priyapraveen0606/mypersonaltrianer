# ADR-0007: 2-Tap Daily Check-In (Home screen)

## Status
Accepted

## Date
2026-11-21

## Context
Module 1 / SPEC §3.1 / CONSTRAINTS §2 "2-Tap Launch Rule": Mood + Time + Start, nothing else on the
home screen. CONSTRAINTS §3: 48×48 px targets, readable from 1.5 m.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Needed? | Yes, it is the only entry point. |
| **Scope** — What else may appear? | Only: 5 mood buttons, 4 duration buttons, Start, a one-line streak (Afterglow, no guilt copy) and a one-line memory hint ("Yesterday was lower body — today leans on back, arms & cardio") so the adaptation is not mysterious. No library, feed, settings or forms. |
| **Dependencies** — | ADR-0006 engine, ADR-0005 log (memory + streak), ADR-0008 player. |
| **Data model** — Remember last selection? | No pre-selection: the rule is "exactly 2 selections". Nothing new is stored. |
| **Security & privacy** — | None beyond ADR-0005. |
| **Alternatives** — Single "surprise me" button; wizard? | See below. |

## Decision
- Mood and time are radio groups (`role="radiogroup"`, `aria-checked`) of large buttons (≥ 64 px tall,
  ≥ 20 px bold text, high contrast on slate-900). Start stays disabled until both are chosen.
- Start generates the session synchronously (engine is pure and fast) and opens the player; the tap
  also primes speech synthesis so iOS allows later utterances.

## Consequences
- Component test asserts Start is disabled until both selections are made and that the 2+1 taps open the player.

## Alternatives Considered
### Preselect last mood/time (1 tap)
- Rejected because: mood is meant to be a deliberate daily choice; CONSTRAINTS says exactly 2 selections.
### Multi-step wizard
- Rejected because: violates the 2-tap rule.
