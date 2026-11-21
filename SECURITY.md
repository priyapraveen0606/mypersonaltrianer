# Security Policy

## Supported versions
Only the latest commit on `main` is supported.

## Reporting a vulnerability
Please **do not open a public issue**. Use GitHub's private
[Report a vulnerability](../../security/advisories/new) form on this repository's **Security** tab.

Include the affected file or URL, steps to reproduce, and the impact you expect.
You should get a reply within 7 days.

## Scope
The app is a static, offline-first PWA with no backend and no accounts (ADR-0005).
Workout history stays in the browser's `localStorage` and is never sent anywhere.
The only third-party origin is the opt-in YouTube embed on `youtube-nocookie.com` (ADR-0009).
Security controls are recorded in [ADR-0013](docs/adr/0013-security-hardening-for-public-release.md).
