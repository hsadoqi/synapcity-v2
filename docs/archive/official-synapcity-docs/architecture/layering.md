# Layering

Layering keeps Synapcity understandable as more documents, widgets, dashboards, and theme scopes are added.

---

## Presentation Layer

The presentation layer renders UI.

Responsibilities:

- pages
- layouts
- route components
- visual components
- empty states
- loading states
- error states
- responsive layout composition

Should not contain:

- database access
- business rules
- persistence logic
- cross-feature orchestration
- raw theme generation

Examples:

```text
app/documents/[documentId]/page.tsx
app/dashboards/[dashboardId]/page.tsx
modules/documents/components/document-editor-shell.tsx
modules/dashboards/components/dashboard-grid.tsx
```

---

## Application Layer

The application layer coordinates behavior between UI and domain systems.

Responsibilities:

- hooks
- route sync
- stores
- command handlers
- optimistic UI behavior
- user preference orchestration
- widget configuration updates

Examples:

```text
useDocumentRouteSync()
useDashboardRouteSync()
useDashboardGridStore()
useCommandMenuStore()
useThemeScope()
```

---

## Domain Layer

The domain layer owns feature meaning.

V0 examples:

```text
Document
Dashboard
WidgetInstance
ThemeRecord
ThemeAssignment
Relationship
```

Deferred examples:

```text
Workspace
Project
Reference
Resource
Runbook
```

---

## Infrastructure Layer

The infrastructure layer provides reusable technical systems.

Responsibilities:

- registries
- theme engine
- editor plugin system
- widget platform
- search adapters, future
- persistence adapters
- command infrastructure

Infrastructure should be reusable across features.

---

## Persistence Layer

The persistence layer stores durable data.

Responsibilities:

- Prisma schema
- database constraints
- migrations
- repositories
- seed data
- data access functions

Rules:

- UI should never import Prisma.
- Repositories should hide query details from components.
- Database models should not be shaped around one screen.
