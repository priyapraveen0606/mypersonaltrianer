# ADR-0001: Challenge-first ADR process (POD model)

## Status
Accepted

## Date
2026-11-21

## Context
The repository started with product documents only (`docs/product/`): a SPEC, a CONSTRAINTS file,
a module breakdown, an architecture/scope note, and a starter `exercises.json`. Those documents were
drafted in separate passes and disagree in places (e.g. "never embed YouTube" vs. a whitelisted video
toggle; progressive overload listed both as a V1 functional requirement and as V2). Code written
straight from them would encode whichever version the implementer happened to read.

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Why a formal process for a single-user app? | The app enforces physiotherapy safety rules (IT band). Silent drift between docs and code is the main risk, and ADRs are the cheapest guard. |
| **Scope** — Which decisions need an ADR? | Every feature module, every dependency/stack choice, every data model, and every resolution of a conflict between product docs. Bug fixes and copy changes do not. |
| **Dependencies** — What does the process rely on? | The `documentation-and-adrs` skill from agent-skills (ADR-0002) for format and lifecycle. |
| **Data model** — Where do ADRs live and how are they named? | `docs/adr/NNNN-kebab-title.md`, zero-padded and sequential, never renumbered. `docs/adr/template.md` is the template; `docs/adr/README.md` is the index. |
| **Security & privacy** — Anything sensitive? | ADRs must not contain personal health data beyond what is already in the product docs. |
| **Alternatives** — Could the SPEC alone suffice? | See below. |

## Decision
- Every feature starts as a **Draft** ADR copied from `docs/adr/template.md`.
- The **Challenge** table (necessity, scope, dependencies, data model, security/privacy, alternatives)
  is filled in first. Questions that need the product owner are listed with the interim decision taken.
- Only when every challenge question has a resolution is the ADR marked **Accepted**; only then is code written.
- ADRs are committed in the same commit/PR as the code they describe.
- Decisions are never edited away: a changed decision gets a new ADR that marks the old one
  `Superseded by ADR-XXXX`.
- When an ADR resolves a conflict in `docs/product/`, the product doc is updated in the same change
  and points back at the ADR.

## Consequences
- Every engine rule and UI constraint is traceable to an ADR and a test.
- Slightly more writing per feature; acceptable for a small codebase.
- Reviewers check: ADR exists, status is Accepted, Challenge is fully resolved, README index updated.

## Alternatives Considered
### SPEC-only development
- Pros: Less paperwork.
- Cons: The SPEC records *what*, not *why*, and already contradicts CONSTRAINTS.
- Rejected because: contradictions would be resolved implicitly in code.

### Lightweight ADRs without a Challenge section (classic Nygard format)
- Pros: Shorter.
- Cons: Nothing forces necessity/privacy questions before code.
- Rejected because: the POD model explicitly requires challenging each feature first.
