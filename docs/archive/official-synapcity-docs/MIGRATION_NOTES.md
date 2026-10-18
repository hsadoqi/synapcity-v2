# Migration Notes From Original Docs

The original docs started with a broad Synapcity platform framing: notes, workspaces, projects, references, resources, runbooks, dashboards, widgets, relationships, and theming.

This revision narrows the V0 rebuild blueprint.

Major changes:

- renamed the V0 main content object from `Note` to `Document`
- reserved `Note` for future lightweight use cases such as annotations or quick notes
- removed workspaces/projects/references/resources/runbooks as V0 first-class route objects
- added `features/future-organization-models.md` to preserve those concepts without prematurely building them
- updated V0 routes to `/documents`, `/documents/[documentId]`, `/dashboards`, `/dashboards/[dashboardId]`, and theme settings/dev surfaces
- simplified the V0 data model around `Document`, `Dashboard`, `WidgetInstance`, `ThemeRecord`, `ThemeAssignment`, and minimal `Relationship`
- kept the runtime theme contract: persisted OKLCH seeds generate palette variables, while semantic mappings live in `globals.css`

The goal is to build the core surfaces first, then decide organization models later.
