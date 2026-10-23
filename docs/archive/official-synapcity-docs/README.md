# Synapcity Documentation

Synapcity V0 is a calm composition system for **documents**, **dashboards**, **widgets**, and **scoped theming**.

The rebuild intentionally avoids deciding the full organization model too early. Concepts like workspaces, projects, references, resources, and runbooks may become important later, but they are not V0 first-class routes or required domain objects.

The first version should answer a smaller set of questions:

> Can documents be created and edited? Can dashboards compose widgets? Can widgets surface documents without owning them? Can scoped themes apply cleanly without making the interface noisy?

This documentation treats Synapcity as an internal engineering project. It explains the system boundaries, design principles, V0 responsibilities, theme architecture, and implementation conventions that keep the application understandable as it grows.

---

## V0 Product Scope

### First-class V0 systems

- Documents
- Document editor
- Dashboards
- Widgets
- Theme records and theme assignments
- Minimal relationships for document/dashboard linking
- App shell and shared UI primitives

### Deliberately deferred

- Workspaces as a domain model
- Projects as first-class routes
- References as first-class routes
- Resources as first-class routes
- Runbooks as first-class routes
- Permissions, membership, and collaboration
- Search as a fully built platform system

Deferred does not mean rejected. It means Synapcity should first prove the core interaction model before locking in organizational taxonomy.

---

## Documentation Map

### Start Here

| Document | Purpose |
| --- | --- |
| [Architecture Overview](./architecture/overview.md) | High-level V0 system model, layers, and rules. |
| [Layering](./architecture/layering.md) | What belongs in presentation, application, domain, infrastructure, and persistence. |
| [Dependency Rules](./architecture/dependency-rules.md) | What may import what, and what should never cross boundaries. |
| [Glossary](./glossary.md) | Shared vocabulary for documents, widgets, dashboards, scopes, and relationships. |
| [Roadmap](./roadmap.md) | V0 implementation sequence with deferred organization models. |
| [Handbook](./handbook.md) | Coding standards, documentation rules, testing expectations, and review checklist. |

### Core Systems

| System | Document |
| --- | --- |
| Dashboard composition | [Dashboard System](./architecture/dashboard-system.md) |
| Widget platform | [Widget System](./architecture/widget-system.md) |
| Document editor | [Editor System](./architecture/editor-system.md) |
| State boundaries | [State Management](./architecture/state-management.md) |
| Document/dashboard relationships | [Relationship Model](./architecture/relationship-model.md) |
| Persistence model | [Data Model](./architecture/data-model.md) |
| Search and command discovery | [Search System](./architecture/search-system.md) |
| Routing and page composition | [Routing](./architecture/routing.md) |
| Theming | [Theme Engine](./theme/README.md) |

### Feature Areas

| Feature | Document |
| --- | --- |
| Documents | [Documents](./features/documents.md) |
| Dashboards | [Dashboards](./features/dashboards.md) |
| Future organization models | [Future Organization Models](./features/future-organization-models.md) |

### Guides

| Guide | Purpose |
| --- | --- |
| [Create a Feature](./guides/create-feature.md) | Add a future domain feature without breaking boundaries. |
| [Create a Widget](./guides/create-widget.md) | Add a dashboard widget through registry-driven composition. |
| [Create a Store](./guides/create-store.md) | Add Zustand state with clear ownership and stable selectors. |
| [Create a Theme Scope](./guides/create-theme-scope.md) | Add scoped theming to a V0 surface. |
| [Testing](./guides/testing.md) | Test strategy by layer. |

### Architectural Decisions

| ADR | Decision |
| --- | --- |
| [ADR-001](./adr/ADR-001-relational-relationships.md) | Model relationships relationally before introducing graph storage. |
| [ADR-002](./adr/ADR-002-dashboards-as-views.md) | Treat dashboards as views over documents, not data owners. |
| [ADR-003](./adr/ADR-003-widget-registry.md) | Use a widget registry instead of dashboard switch statements. |
| [ADR-004](./adr/ADR-004-zustand-state-boundaries.md) | Separate UI state, editor state, layout state, theme state, and persisted data. |
| [ADR-005](./adr/ADR-005-runtime-theme-engine.md) | Use a runtime palette theme engine with globals.css semantic mappings. |

---

## Product Principles

### 1. Start with surfaces, not ontology

V0 should build the surfaces users actually touch: documents, dashboards, widgets, and themes. The broader organizational model can emerge after those surfaces work.

### 2. Documents are the main content object

A document is the durable, rich editable content object in V0. The word “note” is intentionally reserved for future lightweight use cases such as annotations, quick notes, margin notes, or comment-adjacent fragments.

### 3. Dashboards surface information; they do not own it

Dashboards are calm composition surfaces. They may display documents through widgets, but the document system remains the source of truth for document content.

### 4. Interfaces should be composable

Synapcity should prefer reusable panels, widgets, cards, editors, rails, and registries over one-off screens.

### 5. Themes should be expressive but structurally neutral

Users can customize color and eventually shape/type scale, but the product should still feel like Synapcity: calm, editorial, structured, and information-first.

### 6. Flexibility must remain explainable

The goal is not maximum abstraction. The goal is sustainable flexibility: systems that can grow without becoming impossible to reason about.

---

## High-Level V0 Model

```text
                    Synapcity V0
┌─────────────────────────────────────────────────────────────┐
│                  Product Surfaces                           │
│  Documents • Dashboards • Theme Settings                    │
├─────────────────────────────────────────────────────────────┤
│                  Composition Systems                        │
│  Widgets • Document Editor • Context Rails • Commands       │
├─────────────────────────────────────────────────────────────┤
│                  Application Infrastructure                 │
│  Theme • Navigation • Settings • State • Registry           │
├─────────────────────────────────────────────────────────────┤
│                  Domain Model                               │
│  Document • Dashboard • WidgetInstance • Relationship       │
├─────────────────────────────────────────────────────────────┤
│                  Persistence                                │
│  PostgreSQL • Prisma • Migrations • Seeds                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Suggested Repository Shape

```text
synapcity/
├── apps/
│   └── web/
├── packages/
│   ├── ui/
│   ├── theme/
│   ├── editor/
│   ├── widgets/
│   ├── dashboard/
│   ├── command/
│   └── shared/
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── features/
│   ├── guides/
│   └── theme/
└── tooling/
```

The exact repository can change, but the boundary rule should remain stable:

> Product routes compose systems. Systems expose APIs. Features own domain behavior. Shared packages do not import feature internals.
