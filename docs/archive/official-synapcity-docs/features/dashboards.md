# Dashboards

Dashboards are configurable composition surfaces for linked information.

They allow users to assemble views from widgets and documents without turning the dashboard into a source of truth.

---

## User goals

- Create a calm composition surface.
- Arrange widgets visually.
- Surface relevant documents without duplicating them.
- Switch between calm viewing and structured editing.
- Customize layout across breakpoints.
- Apply or inherit a dashboard theme assignment.

---

## Core interactions

- create dashboard
- rename dashboard
- add widget
- remove widget
- configure widget
- drag and resize widgets
- switch breakpoint preview
- toggle view/edit mode
- save or reset layout
- edit dashboard theme assignment

---

## Rules

- Dashboard owns layout and widget instances.
- Dashboard does not own document content.
- Widget config should reference source documents by ID when needed.
- View mode should be visually quiet.
- Edit mode may reveal builder controls.
- Projects, references, resources, and runbooks should not be assumed as V0 dashboard sources.

See [Dashboard System](../architecture/dashboard-system.md).
