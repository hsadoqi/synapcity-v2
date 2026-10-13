# Architecture foundation overview

**Status:** Canonical navigation index

Start with `docs/architecture/principles.md` — the responsibility and ownership principles that govern all architecture work, justified by the Phase 0 evidence synthesis.

Accepted founder-confirmed technical directions and their scoped governance live in `docs/architecture/decisions/` as ADRs. The ADR index (`docs/architecture/decisions/README.md`) also lists candidate ADRs that remain proposed or unresolved.

Proposed phase designs live in `docs/architecture/designs/`. They are review artifacts, not governing architecture, until their stated approval and ADR requirements are satisfied. The current proposal is [Phase 2 — Technical Foundation](designs/phase-02-technical-foundation.md).

For what is and is not architecturally decided at any given time, `docs/architecture/decisions/README.md`'s candidate list and each accepted ADR's own "Unresolved" section are authoritative — check them before assuming a package, schema, route, or storage choice has been made.

This foundation deliberately does not select database technology, API style, product route design, or state-management libraries. Those are later decisions, made one at a time as real requirements justify them (see `docs/product/mvp.md` and the decision register). ADR-0003, ADR-0005, and ADR-0007 fix the workspace, four package categories, and dependency direction. Phase 2 has since added the technical-foundation workspaces `apps/web`, `apps/storybook`, and `packages/ui/core` under ADR-0010 through ADR-0013; these implementation names do not adopt a product capability name or decide the first product slice.

Non-authoritative future possibilities and revisit triggers live in [`docs/discovery/`](../discovery/README.md). Discovery entries are evidence, not requirements or accepted ADRs.
