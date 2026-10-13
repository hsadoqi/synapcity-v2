# ADR-0002: React Grid Layout for Dashboards

**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

React Grid Layout (RGL) is the founder-confirmed direction for Dashboard spatial composition — the arrangement of product-defined Widgets within a Dashboard surface. No prior implementation of a widget system, layout persistence, or RGL integration exists to inherit from. Dashboards owning presentation state without becoming a second owner of information they present (`docs/architecture/principles.md` §2) is a separate, already-adopted principle; this ADR is scoped narrowly to the layout technology and does not restate or depend on that principle's own justification.

## Decision

React Grid Layout is the accepted layout substrate for Dashboard spatial composition.

## Scope

This decision governs **only** the choice of drag/resize grid-layout library for arranging Widgets within a Dashboard. It does not decide:

- what a Widget is, its lifecycle, or its source/input model (unresolved — see `docs/architecture/decisions/README.md`'s candidate list);
- whether a `Data Source` abstraction exists (explicitly unresolved hypothesis — see `docs/glossary.md`; do not create `DataSource`/`Source<T>` for architectural symmetry alone);
- Dashboard persistence format, versioning, or migration strategy;
- Dashboard/Widget package topology or state-management approach;
- whether "widget" or an alternate naming is used (unresolved — see `docs/glossary.md`);
- Global Home's relationship to Dashboards (explicitly out of scope — see `docs/product/mvp.md` and `PRODUCT.md`'s "Open product decisions").

## What this does NOT decide

- That any previously explored Dashboard fixture shape, routes, or components are adopted. They are explicitly not — a prior presentation fixture is not a domain model.
- That RGL's specific configuration, breakpoint system, or persisted-layout JSON shape is final. Those are implementation details subordinate to real Widget/persistence requirements that do not yet exist.
- Any accessibility or responsive-design tradeoff RGL may impose. Those must be evaluated explicitly (see Verification expectations below) rather than assumed acceptable because the technology was chosen.

## Unresolved

- Widget identity, lifecycle, and capability model.
- Read vs. write access from a Widget to the canonical information it presents.
- Dashboard layout persistence technology, format, and migration strategy.
- Responsive/mobile layout policy under RGL's grid model.
- Accessibility approach for drag/resize interactions (keyboard operability, screen-reader announcement of layout changes).
- Copy/fork/history behavior for a Dashboard's layout.
- Whether some widgets may legitimately own local canonical information (e.g., a note widget) versus always presenting information owned elsewhere.

## Governance boundary

Changes to the layout-library choice require founder/human product-owner approval. The unresolved items above are separate decisions, made only once real Widget and persistence requirements exist to design against — per `docs/product/mvp.md`'s explicit warning not to select a slice, or an architecture, merely because a package or UI already exists for it.

## Integration expectations

- Per `docs/architecture/principles.md` §2, a Dashboard/Widget built on RGL may own layout, placement, and widget-instance configuration; it must not silently acquire a divergent copy of information a Widget merely presents.
- Per §6, RGL is a presentation-layer/UI concern; it must not leak into domain packages that model canonical information.
- Do not infer a widget registry, plugin system, or "exactly one source per widget" model from RGL's technical shape (glossary guardrail on Widget).

## Verification expectations

Per `docs/engineering/definition-of-done.md`, any Dashboard/RGL work must state explicitly whether layout state is real and persisted or fixture-backed/hardcoded, and must include accessibility verification for drag/resize interactions before being considered done — not merely visually functional.

## Reconsideration conditions

This direction should be revisited if:

- RGL proves inadequate for required accessibility or responsive behavior once real requirements are scoped;
- a licensing, maintenance, or performance concern makes RGL unsuitable at real Widget counts;
- the founder explicitly changes the technical direction.

Any reconsideration must be a new ADR stating the evidence, migration consequences for any persisted Dashboard layouts, and new reconsideration criteria.
