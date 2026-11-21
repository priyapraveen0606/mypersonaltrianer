# ADR-0012: PR quality gates — Dependabot, accessibility, Playwright BVT + regression

## Status
Accepted

## Date
2026-11-21

## Context
The only automated check is `ci.yml` (lint → typecheck → unit tests → build). CONSTRAINTS §2–§3
make accessibility-adjacent rules (48×48 px touch targets, high contrast, hands-free voice flow,
wake lock, offline-first) non-negotiable, but nothing verifies them in a real browser. There are
no deployment environments, so every gate must run in the PR pipeline against a local build.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Is this needed for V1? | Yes. Unit tests run in jsdom, which cannot check service-worker offline reloads, real layout (touch targets), colour contrast or wake-lock wiring. Dependency updates also need a safe, low-noise path. |
| **Scope** — Smallest version? | One Chromium mobile project (Pixel 7). BVT = 5 smoke tests; regression = 5 flows; axe on 5 screens. No cross-browser matrix, no visual snapshots, no deploy. |
| **Dependencies** — What do we add? | Dev only: `@playwright/test`/`playwright`/`playwright-core` 1.64.1 (pinned to one version so `@axe-core/playwright`'s peer dedupes), `@axe-core/playwright` 4.14, `eslint` 9 (jsx-a11y does not support ESLint 10 yet), `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks` (the source already carries `react-hooks/exhaustive-deps` directives, which ESLint rejects unless the rule exists), `typescript-eslint` (parser only). |
| **Data model** — Data touched? | None at runtime. Tests write to the browser's `localStorage` in a throwaway context. |
| **Security & privacy** — Risks? | Workflows run on `pull_request` with `contents: read`, no secrets and `npm ci --ignore-scripts`, so Dependabot and fork PRs are safe. `npm audit` adds one moderate dev-only advisory (`minimatch` via `typescript-eslint`, the same one already reported via `workbox-build`); it only globs our own files at lint time. |
| **Alternatives** — Others? | See below. |

## Decision
- `.github/dependabot.yml`: weekly `npm` and `github-actions` version updates for `/`, minor+patch
  grouped per ecosystem (`applies-to: version-updates`), so security updates still open at once, one per advisory.
- `npm run lint` = `oxlint src && eslint src`; ESLint runs only `jsx-a11y` (strict) and the two classic
  React hooks rules.
- `playwright.config.ts` builds the app and serves `dist/` with `vite preview` on port 4173, so the real
  service worker is under test. Tests stub `navigator.wakeLock` and `speechSynthesis` with recorders
  and seed `Math.random` for reproducible workouts (`tests/support/app.ts`); timer flows use Playwright's clock.
- `accessibility.yml` (job `accessibility`): lint, then `tests/a11y.spec.ts` — zero serious/critical axe
  (WCAG 2.x A/AA) violations on Home, Player (playing/paused), form-check card, pulse check, Afterglow.
- `playwright.yml`: `playwright-bvt` (`@bvt`) then `playwright-regression` (`@regression`, `needs:` BVT).
  The HTML report is uploaded as an artifact on failure.
- Scripts: `test:bvt`, `test:regression`, `test:a11y`, `test:e2e`; `typecheck` also checks `tests/` via `tsconfig.e2e.json`.

## Consequences
- Every PR to `main` (including Dependabot's) runs lint + a11y, BVT, then regression, next to the existing `ci.yml`.
- Making these checks blocking needs repo admin settings: required status checks `accessibility`,
  `playwright-bvt`, `playwright-regression` on `main`, plus Dependabot alerts and security updates enabled.
- Adding a screen means adding it to `tests/a11y.spec.ts` and the BVT touch-target test.

## Alternatives Considered
### oxlint's built-in jsx-a11y rules only
- Pros: No ESLint toolchain.
- Cons: Partial port of the rule set; the request names `eslint-plugin-jsx-a11y`.
- Rejected because: the reference plugin is the stricter, maintained source of truth; oxlint stays for general linting.

### Lighthouse CI / pa11y
- Pros: Page-level scores.
- Cons: Cannot drive the app into the player and form-check states, which only exist after taps.
- Rejected because: axe through Playwright reuses the same navigation helpers as BVT/regression.

### Run tests against `vite dev`
- Pros: Faster start.
- Cons: No service worker, so offline behaviour is untestable.
- Rejected because: offline-first is a hard constraint.
