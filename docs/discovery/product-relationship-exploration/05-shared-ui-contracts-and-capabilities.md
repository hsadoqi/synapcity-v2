# Synapcity: Shared UI Contracts and Capabilities — Agent Handoff

**Date:** 2026-10-25  
**Status:** Owner intent clarified; exploratory implementation details  
**Audience:** AI coding agents, reviewers, and future architectural discussions

> **Read this before proposing an `Entity` database table, inheritance hierarchy, universal resource engine, or cross-domain persistence migration.** None of those is implied by the owner's use of the word `Entity`.

## 1. Owner intent, in plain language

Synapcity contains different domain objects—documents, dashboards, files, links, tasks, and potentially more—that may need to **look, render, and behave alike in some UI contexts**. The owner wants reusable components and operations to consume consistent, narrowly scoped contracts without knowing the full schema or behavior of each underlying object.

Examples include:

- A shared header or shell rendering a title, icon, status, and available actions for different object kinds.
- Library list/grid items presenting native documents, uploaded files, and external links through consistent UI primitives.
- A global pinned-items or recent-items surface rendering mixed object types.
- Document and widget shells sharing selected visual/interaction conventions without forcing them into one component or domain type.
- A context menu exposing the same _kind of operation_ (e.g., pin, archive, duplicate) wherever that capability is supported, while retaining type-specific policy and implementation.

**Core principle:** Make heterogeneous objects interoperable at UI/application boundaries through composition, adapters, and capability contracts. Preserve independent domain models and ownership boundaries.

## 2. What `Entity` means here—and does not mean

The owner's original concept of `Entity` was a **TypeScript-level common contract** for useful shared attributes/functionality, not a database superclass or common row. This name is provisional and may eventually be replaced with a more precise name such as `Identifiable` or `UiResource` where appropriate.

It does **not** imply:

- An `entities` PostgreSQL table, globally shared primary-key registry, or single foreign-key target.
- That every domain model is relationally connected or inherits the same lifecycle.
- A generic EAV/property-bag schema, universal CRUD service, or object-oriented base class.
- That all objects support every action.
- That React components execute domain mutations directly or enforce authorization.

Database modeling, membership, sharing, ownership, and referential integrity are **separate decisions**. A shared TypeScript interface does not solve cross-table foreign keys, and no one should present it as though it does.

## 3. Three kinds of reuse

| Level                                   | Desired reuse                                                                                        | Boundary                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **UI contracts**                        | Minimum normalized data a component needs (identity, display label, icon, status, available actions) | UI must not depend on concrete domain-table shapes                                     |
| **Application capabilities/operations** | Consistent invocation and results for actions such as pin/unpin, archive, share, duplicate           | Operation implementation, permissions, side effects, and persistence remain type-aware |
| **Presentation primitives**             | Shells, headers, action menus, empty/loading states, interactions, accessibility patterns            | Do not conflate visual similarity with identical domain semantics                      |

Composition can be applied at each level independently. No inheritance relationship is needed between `Entity`, `WidgetShell`, `DocumentShell`, and persistence tables.

## 4. Illustrative TypeScript design (not an approved API)

Prefer small capability contracts and boundary-specific view models over a bloated universal interface.

```ts
type ResourceRef =
  | { kind: 'document'; id: string }
  | { kind: 'dashboard'; id: string }
  | { kind: 'file'; id: string }
  | { kind: 'web-link'; id: string };

interface DisplayItem {
  ref: ResourceRef;
  label: string;
  icon?: string;
  description?: string;
}

type ItemAction = 'open' | 'pin' | 'unpin' | 'archive' | 'duplicate';

interface ActionDescriptor {
  id: ItemAction;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface ItemPresentation {
  item: DisplayItem;
  actions: readonly ActionDescriptor[];
}

interface ItemHeaderProps {
  presentation: ItemPresentation;
  onAction: (action: ItemAction, target: ResourceRef) => void;
}
```

In this example:

1. A document adapter and a dashboard adapter can produce the **same UI-facing contract** from different native models.
2. A header or Library card can render either without importing the concrete document/dashboard model.
3. The event handler calls an application operation; it does not presume `archive(document)` has identical internals to `archive(dashboard)`.
4. The action list is resolved for the specific object, user, and context. **Showing an action is not authorization**; application/server boundaries must enforce it again.
5. `ResourceRef` is a typed application reference, **not evidence of a common database FK**.

These names and fields are examples. Do not copy them into production as canonical contracts without examining existing code and agreeing on actual consumer needs.

## 5. Where the shells fit

`DocumentShell` and `WidgetShell` are evidence of the owner's broader compositional design preference, **not proof that they should derive from one `EntityShell`**.

They can share narrower building blocks—e.g., a header layout, icon/title treatment, overflow actions, loading presentation, keyboard interactions—only where the contract is genuinely stable. Keep shell-specific concerns (editor state, resizing, widget layout, document navigation, accessibility behavior) with the relevant shell.

Two different shells can call the same pin operation or use the same action menu without sharing their full component API.

## 6. Design criteria for an abstraction

Before creating a common contract or component:

1. Identify **at least two concrete consumers or domain objects** that need the same behavior or shape, or explain an imminent proven need.
2. Define the narrowest input/output contract the consumer requires.
3. Specify which parts are shared (presentation, orchestration, or policy) and which remain domain-specific.
4. Place normalization in typed adapters/selectors near the boundary, not as scattered conditional branches throughout generic components.
5. Keep operations behind a consistent application interface while retaining per-type validation, permission checks, and effects.
6. Avoid requiring irrelevant fields, capabilities, lifecycle states, or methods on every object.
7. Verify accessibility and interaction behavior independently; matching appearance does not imply identical semantics.

Favor readable discriminated unions for finite sets of supported object kinds. Introduce registries/plugin-like extension mechanisms only when real extensibility requirements justify them.

## 7. Relationship to the current product exploration

The separate Spaces/Libraries/Dashboards exploration proposes:

- Home as the sole global/root Space; other Spaces directly beneath it.
- One Library per Space, with canonical documents shareable across Library contexts.
- Multiple dashboards per Space rendered as tabs, with Overview as the default.
- Cross-Space data views/widgets permitted on any dashboard.
- Linked and independently copied views as explicit user choices.
- Libraries potentially containing native documents, file uploads, downloaded files, and web links.

Those product goals explain **why mixed-type UI contracts are useful**, but they do not require a universal Entity database table. Conversely, database design must still solve real membership, ownership, cross-type references, and deletion integrity on its own merits.

The companion `02-entity-relationship-model.md` is a **separate persistence option study**, not a statement of what the owner originally meant by `Entity`.

## 8. Agent guidance: do and do not

**Do:**

- Treat `Entity` as the owner's shorthand for reusable shared contracts/capabilities until they explicitly choose a more precise vocabulary.
- Inspect existing `DocumentShell`, `WidgetShell`, domain types, application operations, and package boundaries before proposing integration.
- Propose consumer-driven, strict TypeScript interfaces and adapters with clear ownership.
- Distinguish UI affordances from operation policy and authorization.
- Mark suggested names/interfaces as proposals rather than facts about the current repo.

**Do not:**

- Respond to `Entity` by launching into a universal-table versus polymorphic-FK debate unless persistence is explicitly the topic.
- Assume a single shared database ID namespace.
- Introduce abstract base classes or a universal `EntityService` merely for consistency.
- Put user-specific state such as `isPinned` on all domain records by default.
- Flatten type-specific behavior, storage, or lifecycle into a generic interface.
- Treat reuse of a shell, operation, or UI contract as evidence that domain records must be related.

## 9. Questions for future implementation—not for re-litigating intent

- Which existing UI consumers need normalized display metadata today?
- Which actions truly have common invocation/results, and which require distinct workflows?
- Where should adapters and action resolvers live given Synapcity's package dependency rules?
- Which view-specific states belong to placement versus reusable view configuration?
- Which cross-type database relationships actually require relational integrity, and when are they in scope?

### One-sentence handoff

**Build reusable, capability-aware UI and application contracts for otherwise independent objects; do not infer a common database Entity, universal lifecycle, or inheritance hierarchy from that goal.**
