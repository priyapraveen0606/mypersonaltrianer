# CONSTRAINTS.md — Hard Guardrails for AI Development Agents

These rules are **non-negotiable**. Any generated code, UI, or workout logic that violates these constraints must be rejected and refactored.

---

## 1. Physiotherapy & Safety Constraints (Zero Exceptions)
* **NEVER include side-lying exercises:** The workout engine MUST hard-filter out any exercise with `position: "side-lying"` or `itBandSafe: false`. No side-lying clamshells, side leg lifts, or lateral hip-compression moves may ever be added to the database or generated in a session.
* **MANDATORY Auto-Balance Rule:** If the workout engine selects any exercise using `equipment: "thigh-trainer"` (inner-thigh/adductor focus), it MUST automatically pair it in the same session with at least one `targetMuscle: "glute-medius"` exercise using `equipment: "resistance-band"` (standing or supine/on-the-back).
* **DO NOT hallucinate exercises:** The app MUST ONLY pull exercises from the vetted `exercises.json` dataset. Never dynamically generate or invent unvetted workout moves at runtime.

---

## 2. UX & Interaction Constraints
* **2-Tap Launch Rule:** The home screen MUST NOT contain workout libraries, browse feeds, articles, or multi-step forms. The user must be able to start a workout in exactly 2 selections (Mood + Time) + 1 Start tap.
* **Voice-First, Hands-Free Execution:** Once a session starts, the user MUST be able to complete the entire workout without looking at or touching the phone. All transitions, rep counts, tempo cues, and rest timers MUST be spoken via TTS.
* **Voice-First with Whitelisted Video Mode:** _(supersedes "No Long Videos" — see [ADR-0009](../adr/0009-whitelisted-video-mode.md))_ Do NOT pull random or unvetted YouTube videos. However, if an exercise in `exercises.json` includes a user-whitelisted `videoUrl` (such as `chandra-namaskar`), display a simple toggle button on the player: **"Voice Guide" (default) | "Play My Video"**, which embeds that specific YouTube link cleanly. Other visuals are limited to a 5-second form-check card (max 2 short posture cues) shown *only* before exercises where `requiresFormCheck: true`.
* **No Diet/Calorie Culture:** NEVER display calorie burn estimates, weight-loss countdowns, or guilt-inducing "missed day" warnings. Track only consistency streaks, total sessions, and the "Afterglow" completion state.
* **Moody ≠ Beginner:** Never treat the `Moody` state as low-stamina. `Moody` MUST generate auto-pilot, zero-thinking flows (e.g., scaled bodyweight conditioning or *Surya/Chandra Namaskar*) rather than overly basic 2-minute stretches.

---

## 3. Technical & Architecture Constraints (V1 MVP)
* **Local-Only Persistence:** Use `localStorage` (or `IndexedDB`) for workout logs, yesterday's memory, and 3-Strike progression tracking. DO NOT add authentication, user accounts, or a backend database in V1.
* **Zero Paid APIs:** Voice coaching MUST use the native browser Web Speech API (`window.speechSynthesis`). Do not integrate paid TTS APIs (e.g., ElevenLabs, OpenAI TTS) in V1.
* **Screen Wake Lock:** The workout player MUST acquire `navigator.wakeLock.request('screen')` when active and release it on pause/completion, with graceful fallback if unsupported.
* **Mobile-First Mat Ergonomics:** All interactive buttons on the Home and Player screens MUST have a minimum touch target of `48x48px` with high-contrast text readable from 1.5 meters away (floor/mat distance).
* **Offline-First PWA:** The app MUST work completely offline after the initial load (all exercise data and UI assets bundled locally).

---

## 4. Verification & Testing Constraints
* **Mandatory Unit Tests for the Workout Engine:** Before marking the engine complete, write automated unit tests verifying:
  1. `0` side-lying exercises are ever returned across 100 randomized mood/time generations.
  2. `100%` of sessions containing `thigh-trainer` also contain a `glute-medius` resistance-band exercise.
  3. Total generated duration is always within `±60 seconds` of the requested `10`, `15`, `30`, or `45` minutes.
  4. Yesterday's `lower-body` log prevents back-to-back heavy lower-body sessions on the next day.