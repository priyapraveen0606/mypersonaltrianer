# ADR-0002: Adopt addyosmani/agent-skills as the development workflow

## Status
Accepted

## Date
2026-11-21

## Context
Development is done largely by AI coding agents. The product docs (`docs/product/build-readiness.md`)
assume the `/spec → /plan → /build → /test → /review → /ship` lifecycle from
[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills).

## Challenge
| Question | Resolution |
|----------|------------|
| **Necessity** — Do we need a third-party skill pack? | It gives agents enforced TDD, ADR, and review workflows for free; writing our own would duplicate it. |
| **Scope** — All 26 skills or a subset? | All, installed project-level. Skills are inert Markdown until an agent activates them. |
| **Dependencies** — How is it pinned and updated? | Git submodule at `.skills/agent-skills` pins the exact upstream commit. Agent-visible copies are installed with the upstream-recommended [skills CLI](https://github.com/vercel-labs/skills) and tracked in `skills-lock.json` (content hashes). |
| **Data model** — Where do agents find them? | `.devin/skills/<name>/SKILL.md` (the CLI's Devin target). Other agents can run the same install with their own `-a <agent>` flag. |
| **Security & privacy** — Risks? | Skills run with full agent permissions. Mitigations: pinned submodule commit, lockfile hashes, copies reviewed in PRs. No secrets involved. |
| **Alternatives** — Vendor a plain copy, or install globally per machine? | See below. |

## Decision
- `git submodule add https://github.com/addyosmani/agent-skills .skills/agent-skills`
- `npx skills add ./.skills/agent-skills -s '*' -a devin -y --copy` → `.devin/skills/` + `skills-lock.json`.
- To update: `git -C .skills/agent-skills pull`, rerun the install command, commit both.
- Agents working in this repo follow `AGENTS.md`, which maps lifecycle phases to skills and requires ADR-0001.

## Consequences
- Fresh clones need `git submodule update --init` to get the upstream source; agents work without it
  because the copies in `.devin/skills/` are committed.
- Two copies of skill text exist (submodule + installed copy); `skills-lock.json` hashes detect drift.

## Alternatives Considered
### Symlinked install (CLI default)
- Pros: Single copy.
- Cons: Links break when the submodule is not initialised (default `git clone`).
- Rejected because: agents would silently lose the skills.

### Global (user-level) install
- Pros: Nothing in the repo.
- Cons: Not reproducible across machines or sessions.
- Rejected because: every contributor/agent must see the same workflow.
