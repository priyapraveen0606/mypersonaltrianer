# SPEC.md — Mood-Adaptive, Voice-First Fitness PWA

## 1. Product Overview
A mobile-first Progressive Web App (PWA) that acts as a voice-guided home fitness coach. Instead of rigid workout calendars or long follow-along videos, the app adapts to the user's daily **mood**, **available time**, and **yesterday's workout history**. It is engineered to deliver 1-year gym-equivalent body recomposition (toning thighs/glutes, strengthening the back) while preventing 3-day burnout and strictly protecting against IT band syndrome.

---

## 2. Target User & Equipment Profile
* **Primary Goal:** Sustainable 1-year body recomposition focused on balanced lower-body toning, posterior chain/back strength, improved posture and mobility, and consistent post-workout energy.
* **Baseline Stamina:** High endurance, capable of sustaining high-repetition bodyweight conditioning even on low-energy days.
* **Physical Constraints (Hard Rules):**
  * **IT Band Safe:** Zero side-lying exercises (no side-lying clamshells, side leg lifts, or lateral hip compression).
  * **Hip Balance:** Any session using the inner-thigh trainer must automatically pair it with an outer-glute resistance band exercise (standing or supine/on-the-back).
* **Required Equipment:**
  * Bodyweight / Yoga Mat
  * 1 kg Dumbbells (scalable to 2 kg / 3 kg over 12 months)
  * Thigh Resistance Bands
  * Digital Inner-Thigh / Pelvic Floor Trainer

---

## 3. Core User Flow (The 2-Tap Loop)

1. **Home Screen (Check-In):**
   * User taps **1 Mood**:
     * `Moody` (Auto-Pilot Flow: zero-thinking *Surya/Chandra Namaskar* scaled to time)
     * `Slow & Grounded` (Mobility + slow-tempo Time Under Tension strength)
     * `Fast / Bonkers` (Audio-coached "Walk at Home" cardio intervals)
     * `Strong & Focused` (Targeted sculpting with dumbbells, bands, and inner-thigh trainer)
     * `Meditative` (Breathwork, restorative stretches, back decompression)
   * User taps **1 Duration**: `10 min` | `15 min` | `30 min` | `45 min`.
   * User taps **Start Session**.
2. **Smart Generation:** The engine builds a timed workout sequence based on Mood, Time, Yesterday's Memory, and Safety Rules.
3. **Voice-First Player:**
   * Screen stays awake (Screen Wake Lock API).
   * Voice coach announces the exercise, counts reps/rounds/tempo, manages rest timers, and cues the next move 5 seconds in advance.
   * For weighted or banded moves *only*, a 5-second visual form-check card (GIF/illustration + 2 posture cues) appears before the voice timer begins, with a "Got it / Start" tap or auto-advance.
4. **Post-Workout Pulse Check:**
   * Upon completion, the app logs the session and asks one question: *"How did that feel?"* (`Easy` | `Just Right` | `Too Hard`).
   * Displays a simple "Afterglow" completion screen (streak count + consistency badge, no calorie shaming).

---

## 4. Functional Requirements

### 4.1 Smart Workout Engine
* **Hard Safety Filter:** Exclude any exercise tagged `position: "side-lying"` or `itBandSafe: false` (canonical field, see [ADR-0004](../adr/0004-exercise-data-model.md)).
* **Auto-Balance Rule:** If an exercise with `equipment: "thigh-trainer"` is selected, the engine *must* insert a paired exercise with `equipment: "resistance-band"` and `targetMuscle: "glute-medius"` in the same session.
* **Yesterday's Memory:** Read the most recent completed session from local storage.
  * If yesterday's primary focus was `lower-body`, today's session prioritizes `upper-body`, `back`, or `cardio` (unless the user picks `Moody` or `Meditative` flow).
* **Time-Scaling Logic:** Dynamically adjust round counts, set counts, and rest intervals to fit the exact selected duration (`10`, `15`, `30`, or `45` minutes) within a ±60-second margin.

### 4.2 Voice-First Coach & Player
* **Text-to-Speech (TTS):** Use the browser Web Speech API (`window.speechSynthesis`) with a calm, clear voice rate (configurable, default `0.95x`).
* **Audio Controls:** Play/Pause, Skip Move, Repeat Cue, and Mute/Unmute.
* **Tempo Counting:** For slow-tempo strength moves, voice counts the eccentric/concentric rhythm (e.g., *"Down... 2... 3... Hold... Up... 2"*).
* **Wake Lock:** Automatically request `navigator.wakeLock.request('screen')` during active workouts so the phone never sleeps mid-set.

### 4.3 1-Year Progressive Overload Engine (3-Strike Rule)
> **V2 — deferred by [ADR-0011](../adr/0011-v1-scope-boundaries.md).** V1 stores the per-session rating only ([ADR-0010](../adr/0010-pulse-check-and-afterglow.md)).

* Track the user's post-workout rating (`Easy` | `Just Right` | `Too Hard`) per exercise/category.
* **Progression Trigger:** When an exercise or category is rated `Easy` **3 consecutive times**, automatically promote it to the next tier:
  1. **Tier 1 (Tempo):** Slow down movement speed (increase Time Under Tension).
  2. **Tier 2 (Volume):** Increase reps per set or reduce rest intervals.
  3. **Tier 3 (Load):** Prompt the user to upgrade equipment (e.g., *"Ready for 2 kg dumbbells?"* or *"Switch to a heavier band"*).

---

## 5. Data Models (Local Storage for MVP)

### Exercise Object (`exercises.json`)
```json
{
  "id": "banded-glute-bridge",
  "name": "Banded Glute Bridge",
  "moods": ["slow", "strong"],
  "equipment": ["resistance-band"],
  "targetMuscle": "glute-medius",
  "position": "supine",
  "itBandSafe": true,
  "requiresFormCheck": true,
  "formCue": "Push knees gently outward against the band; squeeze glutes at the top.",
  "defaultDurationSec": 45,
  "defaultRestSec": 15,
  "tempo": "2-1-2",
  "voiceIntro": "Lie on your back with the band above your knees. Feet flat, hip-width apart."
}
```
