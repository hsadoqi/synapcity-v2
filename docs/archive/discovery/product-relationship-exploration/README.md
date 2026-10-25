# Synapcity — Spaces, Libraries, Dashboards, and Entities

**Date:** 2026-10-25  
**Status:** Exploratory; not an approved schema or implementation plan  
**Source:** Product-design conversation with Hanaa

This packet preserves the emerging product vision while separating **confirmed product intentions**, **recommended interpretations**, and **open architectural decisions**. It does not supersede existing Synapcity ADRs, glossary, or phase scopes. Review conflicts before promoting any proposal to canonical status.

## Reading order

1. [01 — Product and information architecture](01-product-information-architecture.md): Spaces, Home, Libraries, dashboards, and user journeys.
2. [02 — Entity and relationship architecture](02-entity-relationship-model.md): shared identity, concrete domain models, relationships, and ownership.
3. [03 — Reusable views and widgets](03-reusable-views-and-widgets.md): linked versus copied views, placements, and scope.
4. [04 — Decisions, risks, and investigation agenda](04-decisions-and-open-questions.md): confirmed preferences, unresolved questions, suggested proofs, and migration impact.

## Executive synthesis

Synapcity is evolving from a primarily document-oriented app toward **a system for organizing and relating independently identifiable resources across working contexts**. Spaces supply context; Libraries organize resources; dashboards compose views; a candidate `Entity` layer may supply common identity and relationship capabilities. Home is the one global/root Space, while all other Spaces are its direct children; arbitrary nested Spaces are intentionally excluded.

The user explicitly favors **one canonical document shared across Libraries**, **one Library per Space**, **dashboards as tabs within a Space**, **cross-Space widgets anywhere**, **rich Library assets including uploads/downloads**, and **a choice between linked and independent copies of reusable widgets/views**.

## Status vocabulary

- **Agreed direction:** Explicit preference expressed in conversation; not yet a formally approved engineering contract.
- **Recommendation:** Architectural interpretation proposed during discussion, awaiting evaluation.
- **Open:** Requires a product decision or technical validation.

## Suggested repository placement

Place these files under `docs/exploratory/space-library-entity-model/`, then add an entry to `docs/exploratory/index.md`. Preserve existing canonical documents; treat this packet as input to governance reconciliation, not an overwrite.
