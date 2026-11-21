# AGENTS.md

Guidance for AI coding agents working in this repository.

## Product sources of truth
- `docs/product/SPEC.md` — functional spec
- `docs/product/CONSTRAINTS.md` — non-negotiable guardrails (safety, UX, tech)
- `src/data/exercises.json` — the only allowed exercise source
- `docs/adr/` — architecture decisions; an ADR overrides the product docs it resolves

## Workflow (ADR-0001, ADR-0002)
Skills from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) are installed in `.devin/skills/`.

1. **Define** — copy `docs/adr/template.md` to the next `docs/adr/NNNN-title.md` with status `Draft`
   (`spec-driven-development`, `documentation-and-adrs`).
2. **Challenge** — resolve every row in the Challenge table (necessity, scope, dependencies,
   data model, security/privacy, alternatives). Unresolved → stay `Draft`, no code.
3. **Accept** — set status `Accepted`, add the ADR to `docs/adr/README.md`.
4. **Build** — `incremental-implementation` + `test-driven-development`. Commit the ADR with its code.
5. **Review/Ship** — `code-review-and-quality`, `security-and-hardening`, `shipping-and-launch`.

## Commands
- `npm ci` — install
- `npm run dev` — dev server
- `npm test` — unit tests (Vitest)
- `npm run lint` / `npm run typecheck`
- `npm run build` — production PWA build

## Boundaries
- Never add exercises that are not in `src/data/exercises.json`, and never add one with
  `position: "side-lying"` or `itBandSafe: false`.
- No backend, accounts, paid APIs, calorie/weight UI in V1 (ADR-0005, ADR-0011).
