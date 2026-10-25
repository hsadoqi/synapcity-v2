# Synapcity — Spaces, Libraries, Dashboards, and Shared Contracts

**Date:** 2026-10-25  
**Status:** Exploratory; not an approved schema or implementation plan  
**Source:** Product-design conversation with Hanaa

This packet preserves the emerging product vision while separating **confirmed product intentions**, **recommended interpretations**, and **open architectural decisions**. It does not supersede existing Synapcity ADRs, glossary, or phase scopes. Review conflicts before promoting any proposal to canonical status.

## Reading order

1. [01 — Product and information architecture](01-product-information-architecture.md): Spaces, Home, Libraries, dashboards, and user journeys.
2. [02 — Persistence and relationship options](02-entity-relationship-model.md): database strategies for Library membership, ownership and deletion, with a registry-table design kept only as a labeled alternative. Persistence only; it is not about the `Entity` UI abstraction (see 05).
3. [03 — Reusable views and widgets](03-reusable-views-and-widgets.md): linked versus copied views, placements, and scope.
4. [04 — Decisions, risks, and investigation agenda](04-decisions-and-open-questions.md): confirmed preferences, unresolved questions (UI contracts and persistence identity are separate questions), suggested proofs, terminology status against `docs/glossary.md`, and the items not yet reconciled with accepted decisions.
5. [05 — Shared UI contracts and capabilities](05-shared-ui-contracts-and-capabilities.md): **owner clarification and required agent handoff** on what `Entity` was intended to mean.

## Executive synthesis

Synapcity is evolving from a primarily document-oriented app toward **a system for organizing and relating independently identifiable resources across working contexts**. Spaces supply context; Libraries organize resources; dashboards compose views; shared TypeScript contracts and capabilities (provisionally called `Entity`, see 05) let different kinds of resource take part in shared UI without coupling their models. Home is the one global/root Space, while all other Spaces are its direct children; arbitrary nested Spaces are intentionally excluded.

Synapcity's Entity concept is primarily about composable TypeScript contracts and reusable UI/application capabilities. Different domain objects should be usable by shared components without requiring common persistence, inheritance, or lifecycle semantics. Do not infer a universal database Entity model from this requirement.

The user explicitly favors **one canonical document shared across Libraries**, **one Library per Space**, **dashboards as tabs within a Space**, **cross-Space widgets anywhere**, **rich Library assets including uploads/downloads**, and **a choice between linked and independent copies of reusable widgets/views**.

**Important clarification:** The owner's original `Entity` idea concerns **reusable TypeScript-level contracts and UI/application capabilities for heterogeneous domain objects**, not a universal persistence table. Read document 05 before interpreting document 02, which is now only a separate database option study.

## Status vocabulary

- **Agreed direction:** Explicit preference expressed in conversation; not yet a formally approved engineering contract.
- **Recommendation:** Architectural interpretation proposed during discussion, awaiting evaluation.
- **Open:** Requires a product decision or technical validation.

## Suggested repository placement

Place these files under `docs/exploratory/space-library-entity-model/`, then add an entry to `docs/exploratory/index.md`. Preserve existing canonical documents; treat this packet as input to governance reconciliation, not an overwrite.

Current location: `docs/discovery/product-relationship-exploration/`. The `docs/exploratory/` path above does not exist at this commit, so the placement above is a suggestion that has not been carried out.
