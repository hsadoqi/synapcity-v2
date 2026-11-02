# S10: Read Efficiency and Degraded State

**Status:** Proposed. Implementation-ready; no blocking decisions. No migration.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S10
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) INV-4 (fail visibly)
**Branch:** `feat/s10-read-efficiency`

## A. Identity and scope

- **Capability:**
  - Dashboard link widgets load only the kinds of items they display.
  - When one source fails, its widgets say so and the others still render.
  - Item pages read their record once per request.
- **Problem:**
  - RS-04: `get-link-items` over-fetches, and `Promise.allSettled` turns a failed source into an empty list.
  - RS-05: page and metadata read the same record twice.
- **Exists:**
  - `apps/web/src/features/dashboards/server/get-link-items/get-link-items.ts`;
  - `features-dashboards` `widget-states` and the link and query widget bodies;
  - `findRecord` and `findSpace` called from both `generateMetadata` and the page.
- **In scope:** kind derivation from the composition, a degraded state per source, and request-scoped `cache()`.
- **Out of scope:** pagination (S11).
- **Dependencies:** none.

## B. Data model

No migration. Reads only.

## C. Contracts

- `neededLinkKinds(composition: DashboardComposition): Set<'spaces' | 'documents' | 'dashboards'>`, a pure function in `domain-dashboards` next to `LINK_WIDGET_TYPES`.
- The link items result becomes `Record<kind, { ok: true; items } | { ok: false }>`.
- The widget config context gains `degraded: boolean` per widget.

## D. Integration

- `get-link-items.ts` fetches only `neededLinkKinds`, and returns per-kind outcomes. Failures are logged with `logFailure`.
- `apps/web/src/lib/records/records.ts` and `apps/web/src/lib/spaces` export `findRecordCached = cache(...)` and `findSpaceCached`, which `generateMetadata` and the page both use. `cache` is React's request-scoped memoization, verified against the installed React and Next 16.4.3 docs at implementation (AGENTS §7a).

## E. Fixtures

Composition fixtures with no link widgets, with one kind, and with all kinds.

## F. UI

A degraded widget shows the existing widget-state component's error variant ("Couldn't load these items"), with a Retry that refreshes the route. There are no new components. A story covers the degraded state, with axe.

## G. Verification

| Check               | Test                                                                    |
| ------------------- | ----------------------------------------------------------------------- |
| Unit                | `neededLinkKinds`; the per-kind mapping when one fetch rejects          |
| Component and Story | degraded widget with axe                                                |
| Query count         | a test with a counting fake client: one record read per page render     |
| E2E (fixture mode)  | existing `dashboard-edit.e2e.ts` and `resource-views.e2e.ts` still pass |
| Repository          | `pnpm verify`                                                           |

## H. Completion

- **IC:** all of the above.
- **RC:** deployed; production smoke opening a Dashboard with link widgets.

## I. Risks

A cached read must not be shared across requests or users. React `cache` is per request; the test asserts that.
