# ADR-0009: Agent operational layer

**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

P1-05 (`hsadoqi/synapcity#6`) asks for operational infrastructure for AI-assisted work instead of more policy. Phase 0 policy exists (`AGENTS.md`, `docs/engineering/ai-development.md`) and the repository now has real commands. Much of this session's work followed the same steps repeatedly, which shows which workflows are worth writing down.

## Decision

1. **`.agents/` directory** holds the agent lifecycle, a minimal task scope template, and eight short workflows: repository investigation, implementation planning, scoped execution, verification, architecture review, documentation consistency, dependency and boundary review, and preservation and destructive-change review. They contain no new policy; they apply existing authority to this repository's real commands.
2. **`AGENTS.md`** links to them (section 7b) and states two working rules: merge only after CI is green and the human authorizes it, and never put a GitHub closing keyword near an issue reference.
3. **The task scope** is a plain-text template filled in before execution and pasted into the pull request or issue. It is guardrails by convention, not a schema or tool.
4. **Documentation consistency is executable:** `pnpm docs:check` (`scripts/check-docs.ts`) verifies the ADR index matches the ADR files and that relative links and backticked `docs/` paths resolve. It runs in `pnpm verify`, CI, and the pre-push hook.

## Scope

Governs the `.agents/` assets, the task scope template, and the docs check.

## What this does NOT decide

- A tool-specific configuration (for example Claude Code skills or hooks). `.agents/` is tool-neutral markdown.
- A machine-enforced task scope (a schema or a check that files touched stay in scope).
- Any AI product feature (`PRODUCT.md`, deferred).

## Unresolved

- Whether a task scope should become machine-checked once there are enough real tasks to show which parts matter.
- Which further workflows earn formalizing. The set should change with use, not grow by default.

## Governance boundary

Adding or removing a workflow is a normal reviewed change. Changing an approval boundary or authority rule is not made here; that stays with `AGENTS.md` section 5 and requires the founder.

## Integration expectations

Workflows reference existing documents and commands and must be updated when those change. `pnpm docs:check` covers links inside `.agents/`.

## Verification expectations

Per `docs/engineering/definition-of-done.md`. The docs check is covered by tests that build broken documentation trees (self-consistent checks) and passes on the real repository. The workflows themselves are prose; their accuracy is checked by use and by the docs check for links only.

## Reconsideration conditions

Revisit when repeated use shows a workflow is wrong, unused, or missing, or when a specific tool needs its own integration.
