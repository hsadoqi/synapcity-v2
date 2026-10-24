# Architecture foundation overview

**Status:** Canonical navigation index

Start with the [architecture principles](principles.md), then the [ADR index](decisions/README.md). Read the scope and unresolved sections of the relevant decisions before assuming an adjacent choice is settled.

- [ADR-0014: Multi-app package boundaries](decisions/0014-multi-app-package-boundaries.md) records the accepted category ownership, runtime dependency matrix, package grouping principles, and migration rules.
- [Workspace conventions](workspace-conventions.md) translates the accepted decisions into package placement, naming, runtime, and interface conventions.
- [Package creation checklist](package-creation-checklist.md) records the questions to answer before creating a leaf package.
- [Current-to-target ownership map](reorganization-ownership-map.md) assigns existing implementation families to their selected destinations and names the transitional exceptions. It is not a second progress ledger.
- Umbrella boundary references: [domain](../../packages/domain/README.md), [frontend](../../packages/frontend/README.md), [server](../../packages/server/README.md), [features](../../packages/features/README.md), and [dev](../../packages/dev/README.md).

Web, docs, and Storybook are current apps; desktop and mobile are planned consumers. Their differing runtime needs inform the target now. Most source remains in its existing location. Documentation of the target does not claim that package extraction, native presentation, or automated boundary enforcement is complete.

The [task scope](../../.agents/task-scope.md) records execution scope and handoff. Milestone 1 baseline verification remains separate; Milestone 3 implements package conventions and boundary enforcement before source migrations.

Proposed designs and [discovery material](../discovery/README.md) remain evidence until their approval requirements are met. ADRs in `docs/archive/architecture/decisions/` belong to the previous implementation and are historical evidence under the [preservation policy](../engineering/preservation-policy.md).

These package decisions do not choose new product scope, terminology, schemas, route designs, API transports, state libraries, or deployments. Existing accepted decisions continue within their own scopes.
