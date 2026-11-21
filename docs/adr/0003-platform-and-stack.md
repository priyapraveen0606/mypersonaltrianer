# ADR-0003: Platform and stack — offline-first PWA with Vite, React, TypeScript, Tailwind

## Status
Accepted

## Date
2026-11-21

## Context
`docs/product/architecture-and-scope.md` allows "React / Next.js (App Router) or Vite + React (TypeScript)",
Tailwind, PWA support, local storage, Web Speech API and Screen Wake Lock. CONSTRAINTS §3 requires
offline-first, zero paid APIs, no backend in V1, and 48×48 px touch targets.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Do we need a framework/build at all? | Yes: typed engine logic with unit tests, JSX UI, and a generated service worker. Plain HTML would make the engine tests and PWA precache manual. |
| **Scope** — Next.js or Vite? | Vite + React. The app is a static, client-only SPA with no server rendering, routing, or API routes; Next.js adds a server runtime we would not use. |
| **Dependencies** — What do we add? | Runtime: `react`, `react-dom` only. Dev: `vite`, `@vitejs/plugin-react`, `typescript` (~5.9, long-established), `tailwindcss` + `@tailwindcss/vite`, `vite-plugin-pwa` (Workbox `generateSW`), `vitest` + `jsdom` + Testing Library, `oxlint`. Node 22 LTS (`.nvmrc`). |
| **Data model** — N/A here | Covered by ADR-0004 (exercises) and ADR-0005 (persistence). |
| **Security & privacy** — Risks? | No server, no network calls at runtime except the opt-in whitelisted video (ADR-0009). `npm audit` reports 4 moderate advisories in `glob`/`minimatch` pulled in by `workbox-build`; these run only at build time on our own files, never in the shipped bundle. Re-check on each dependency bump. |
| **Alternatives** — Native app, Next.js, plain JS? | See below. |

## Decision
- Vite + React 19 + TypeScript (strict) SPA, styled with Tailwind CSS v4.
- `vite-plugin-pwa` generates the manifest and a Workbox service worker that precaches all JS, CSS,
  HTML, icons and the bundled `exercises.json`, so the app works fully offline after first load
  (CONSTRAINTS §3 "Offline-First PWA"). Updates auto-apply (`registerType: 'autoUpdate'`).
- Scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `lint`.
- GitHub Actions CI runs lint → typecheck → test → build on PRs and on `main`/`dev`.

## Consequences
- Deployable to any static host; "Add to Home Screen" works on Android/iOS.
- Web Speech API voice quality varies by OS; accepted for V1 (zero paid APIs).
- A Content-Security-Policy should be set as a response header by whatever host is chosen
  (a `<meta>` CSP breaks Vite's dev preamble). Tracked for the hosting decision.

## Alternatives Considered
### Next.js (App Router)
- Pros: Popular, allowed by the architecture note.
- Cons: Server runtime/SSR unused; static export loses most of its features; heavier.
- Rejected because: nothing in V1 needs a server.

### Native iOS/Android
- Pros: Better background audio and music ducking.
- Cons: Store approvals, two codebases; explicitly out of V1 scope.
- Rejected because: architecture-and-scope.md defers native builds to V2.

### TypeScript 7 / Vitest 4
- TypeScript 7 (native port) is very recent; we pin the mature 5.9 line. Vitest 4 failed to resolve
  with npm 10 alongside the other dev deps; Vitest 5 resolves cleanly and supports Vite 8.
