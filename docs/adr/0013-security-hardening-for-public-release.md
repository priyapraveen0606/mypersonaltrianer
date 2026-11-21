# ADR-0013: Security hardening for the public release

## Status
Accepted

## Date
2026-11-21

## Context
The repository is public and is about to be shared widely. A review found no secrets in history,
no runtime `npm audit` findings and least-privilege CI (ADR-0012), but three gaps remain:
the built page has no Content-Security-Policy, the YouTube iframe (ADR-0009) is unsandboxed, and
there is no vulnerability-reporting policy or licence, so outside researchers have no channel and
re-use rights are undefined. CodeQL runs through GitHub's default setup, which produced no analysis for
any Dependabot PR (#6–#15), so their CodeQL check reports "configurations present on `refs/heads/main`
were not found" and cannot say whether the PR adds alerts.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Is this needed for V1? | Yes. Wide sharing invites scanners and forks. A CSP is the last line of defence against injected script; a sandbox stops an embed from navigating the app; `SECURITY.md` gives a private reporting path; a licence is a precondition for reuse. |
| **Scope** — Smallest version? | Build-time CSP `<meta>`, a referrer `<meta>`, `sandbox` on the one iframe, `SECURITY.md`, MIT `LICENSE`. Out: HTTP response headers (`frame-ancestors`, HSTS), because there is no hosting yet; they belong with a future deployment ADR. |
| **Dependencies** — What do we add? | No new packages. `.github/workflows/codeql.yml` uses `github/codeql-action` v4 (GitHub-maintained). A small inline Vite plugin (`apply: 'build'`) injects the policy because the dev server's React Refresh inline script would violate it. Depends on ADR-0009's single embed origin. |
| **Data model** — Data touched? | None. |
| **Security & privacy** — Risks? | The policy allows only `'self'` plus `https://www.youtube-nocookie.com` for frames and `data:` images. `connect-src 'self'` means a future network feature must update this ADR's policy deliberately. `sandbox` keeps `allow-scripts allow-same-origin` (required by the YouTube player; safe because the origin is cross-origin) but drops top-navigation and forms. The CodeQL job gets `security-events: write` only, scoped to that job. |
| **Alternatives** — Others? | See below. |

## Decision
- `vite.config.ts` defines `CONTENT_SECURITY_POLICY` and a build-only plugin that inserts it right after
  `<meta charset>`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-src https://www.youtube-nocookie.com;
  object-src 'none'; base-uri 'self'; form-action 'none'`.
- `index.html` sets `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- The video iframe gets `sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"`.
- `.github/workflows/codeql.yml` (advanced setup) analyses `actions` and `javascript-typescript` with
  `build-mode: none` on pushes to `main`, every PR to `main` (including Dependabot's) and weekly, using the
  same `/language:<lang>` categories as default setup.
- `SECURITY.md` asks for private reports via GitHub's "Report a vulnerability" form; `LICENSE` is MIT
  and `package.json` declares `"license": "MIT"`.

## Consequences
- Verified by `src/screens/PlayerScreen.test.tsx` (sandbox tokens) and `tests/bvt/security.spec.ts`
  (policy present in the production build; a full Moody workout plus video mode raises zero
  `securitypolicyviolation` events).
- Any new origin, inline script or inline style must change the policy in a new ADR.
- GitHub rejects advanced-setup uploads while default setup is on: an admin must switch CodeQL to
  advanced setup (Settings → Advanced Security → CodeQL analysis) before `codeql.yml` can upload.
- Repo-admin follow-ups (not code): enable private vulnerability reporting, secret scanning with push
  protection, Dependabot alerts, and branch protection on `main`.
- When the app is hosted, send the same policy as an HTTP header and add `frame-ancestors 'none'`.

## Alternatives Considered
### CSP as an HTTP header only
- Pros: Supports `frame-ancestors` and reporting.
- Cons: There is no host to set headers yet.
- Rejected because: the `<meta>` policy protects every copy of the build today; a header can be added on deploy.

### Static `<meta>` in `index.html`
- Pros: No plugin.
- Cons: Breaks `npm run dev` (React Refresh injects an inline script).
- Rejected because: development must keep working without `'unsafe-inline'`.

### Keep CodeQL default setup
- Pros: Zero maintenance.
- Cons: No analysis on Dependabot PRs, so dependency bumps merge without a CodeQL comparison.
- Rejected because: Dependabot opens most PRs in this repo (ADR-0012).

### No sandbox, rely on CSP `frame-src`
- Pros: Fewer attributes.
- Cons: `frame-src` limits which origin loads, not what that page may do to the top window.
- Rejected because: the sandbox is free and removes top-navigation.
