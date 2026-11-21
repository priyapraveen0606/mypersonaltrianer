6. Technical Architecture (MVP)
Framework: React / Next.js (App Router) or Vite + React (TypeScript).

Styling: Tailwind CSS (mobile-first, high-contrast, large tap targets for floor/mat use).

PWA Support: manifest.json + basic service worker for "Add to Home Screen" and offline exercise data.

State & Persistence: Local browser storage (localStorage or IndexedDB) — no backend database required for V1.

APIs: Web Speech API (TTS) + Screen Wake Lock API.

7. MVP Scope Boundaries
In Scope (Version 1)
2-Tap Mood & Time check-in screen.

Local JSON library of 30–40 vetted, IT-band-safe exercises.

Smart Workout Engine (Safety filter, Auto-Balance rule, Yesterday's memory, Time scaling).

Voice-first workout player with timer, rep/tempo cues, and Play/Pause/Skip.

Text/illustration 5-second form-check cards for weighted/banded moves.

Post-workout 1-tap pulse check + local streak/afterglow tracker.

Out of Scope (Deferred to Version 2)
User accounts, authentication, or cloud sync.

Custom video hosting or streaming.

Native iOS/Android App Store builds.

Native background music ducking (rely on OS default audio handling in V1).

Detailed 1-year analytics dashboards.

8. Acceptance Criteria
Zero Side-Lying Guarantee: No generated workout ever includes a side-lying exercise across any mood or duration.

Auto-Balance Guarantee: Every generated workout containing the thigh-trainer also contains a glute-medius resistance-band exercise.

Time Accuracy: A 10, 15, 30, or 45-minute selection generates a session whose total active + rest time falls within ±60 seconds of the target.

Hands-Free Flow: A user can complete an entire 15-minute Moody (Surya Namaskar) session without touching or looking at the screen after tapping "Start."

Memory Persistence: Refreshing the app or returning the next day accurately recalls yesterday's primary muscle focus and adjusts today's recommendation.