# Architecture foundation overview

**Status:** Canonical navigation index

Start with `docs/architecture/principles.md` — the responsibility and ownership principles that govern all architecture work.

Technical directions and their scoped governance live in `docs/architecture/decisions/` as ADRs. The ADR index (`docs/architecture/decisions/README.md`) lists every current ADR with its status, and a candidate list of decisions that remain open. Read an ADR's own "Unresolved" section before assuming a question is settled.

The ADRs in `docs/archive/architecture/decisions/` describe the previous implementation. They are evidence, not authority (`docs/engineering/preservation-policy.md`).

- [Workspace conventions](workspace-conventions.md) — how the current workspaces are laid out, named and built (ADR-0001).
- [Package creation checklist](package-creation-checklist.md) — what to answer before adding a package.

`docs/architecture/designs/` is for proposed designs. It is currently empty. A design there is a review artifact, not governing architecture, until its stated approval and ADR requirements are met.

This foundation deliberately does not select database technology, API style, product route design, or state-management libraries. Those are decided one at a time as real requirements justify them (see `docs/product/mvp.md`). The technology table in the root `README.md` states direction, not decision.

Non-authoritative future possibilities and revisit triggers live in [`docs/discovery/`](../discovery/README.md). Discovery entries are evidence, not requirements or accepted ADRs.
