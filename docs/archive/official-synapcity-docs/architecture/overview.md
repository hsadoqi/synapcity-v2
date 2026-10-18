# Architecture Overview

Synapcity V0 is a modular document-and-dashboard application built around reusable systems rather than isolated feature screens.

The rebuild intentionally starts narrower than the full long-term product idea. V0 should prove the core surfaces first: documents, the document editor, dashboards, widgets, and scoped theming. Broader organization concepts such as workspaces, projects, references, resources, and runbooks are deferred until the core interaction model is working.

---

## Core Architectural Idea

Synapcity V0 should not become a large taxonomy before it has usable surfaces.

It should first establish:

```text
Documents
  ↓
Document Editor
  ↓
Dashboard Widgets
  ↓
Dashboard Composition
  ↓
Scoped Theme Application
```

Relationships exist in V0 only where they support this core loop, such as a dashboard widget surfacing a document.

---

## V0 First-Class Objects

Strict V0 domain objects:

- `Document`
- `Dashboard`
- `WidgetDefinition`
- `WidgetInstance`
- `ThemeRecord`
- `ThemeAssignment`
- `Relationship`, only where needed for document/dashboard linking

Not V0 first-class route objects:

- `Workspace`
- `Project`
- `Reference`
- `Resource`
- `Runbook`

These may return later as organization models, document sections, widgets, metadata panels, or full domain features.

---

## System Layers

```text
Presentation
  React components, routes, layouts, pages, visual composition

Application
  Hooks, stores, commands, route sync, orchestration

Domain
  Document rules, dashboard rules, widget contracts, theme assignments

Infrastructure
  registries, theme engine, editor plugins, widget platform

Persistence
  Prisma, PostgreSQL, migrations, seed data
```

Each layer may depend downward. Layers should not reach upward.

---

## Dependency Rules

Allowed:

```text
UI → hooks → stores/services → repositories → Prisma
```

Avoid:

```text
UI → Prisma
feature A → feature B internals
shared package → app route
component → business rule
widget → dashboard implementation details
```

---

## Product Design Guardrails

- calm over clever
- structure over density
- composition over analytics
- personalization without visual noise
- knowledge surfaces over app chrome
- documents before ontology
- organization later, once the core surfaces work

---

## Extension Philosophy

Adding functionality should usually mean adding a file and registering it.

Examples:

- new widget
- new command
- new editor plugin
- new modal
- new dashboard panel
- new theme editor section

If adding a new item requires editing a large switch statement, the system probably needs a registry.

---

## Architectural Themes

### Separation of ownership

A dashboard may display a document, but it should not own document content.

### Explicit relationships, only when useful

V0 should model meaningful links explicitly, but it should not invent a broad relationship graph before the product needs it.

### Composable interfaces

Workspace-like experiences should be assembled from widgets, panels, cards, editors, and rails.

### Runtime customization

Theme customization should be handled through runtime palette variables and scoped roots, not hardcoded variants.

### Sustainable flexibility

Synapcity should support future organization models without locking V0 into a premature ontology.
