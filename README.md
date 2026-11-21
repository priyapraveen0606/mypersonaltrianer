# mypersonaltrianer

A mood-adaptive, voice-first home workout coach. Offline-first PWA: pick a mood, pick a time, tap
Start, and follow the voice — no account, no cloud, data stays on your device.

## Decisions (ADR log)

Every architectural and feature decision is recorded as a challenge-first ADR before code is written:
**[docs/adr/README.md](docs/adr/README.md)** (process: [ADR-0001](docs/adr/0001-challenge-first-adr-process.md),
template: [docs/adr/template.md](docs/adr/template.md)).

## Product docs

- [docs/product/SPEC.md](docs/product/SPEC.md) — product spec
- [docs/product/CONSTRAINTS.md](docs/product/CONSTRAINTS.md) — hard constraints and acceptance tests
- [src/data/exercises.json](src/data/exercises.json) — the vetted exercise library
- [docs/product/](docs/product/) — architecture/scope, modules, video preferences

## Develop

Requires Node 22 (`nvm use`).

```bash
git submodule update --init   # agent-skills (optional; copies live in .devin/skills)
npm ci
npm run dev        # http://localhost:5173
npm test           # unit + component tests (Vitest)
npm run lint && npm run typecheck
npm run build      # production PWA in dist/
```

## Agent skills

[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) is a submodule at
`.skills/agent-skills`, registered per its README with `npx skills add ./.skills/agent-skills -s '*' -a devin --copy`
(see [ADR-0002](docs/adr/0002-adopt-agent-skills.md) and [AGENTS.md](AGENTS.md)).
