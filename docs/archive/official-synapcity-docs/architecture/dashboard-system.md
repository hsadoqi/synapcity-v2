# Dashboard System

Dashboards are calm composition surfaces for linked information.

A dashboard is not a data store. It is a lens over documents, widgets, and future content sources.

---

## Principle

> Dashboards surface information; they do not own it.

In V0, dashboards may display documents through widgets, but documents remain owned by the document system.

---

## V0 responsibilities

The dashboard system owns:

- dashboard metadata
- layout configuration
- widget placement
- responsive breakpoint layouts
- edit/view mode
- dashboard-level theme assignment
- widget instance persistence

The dashboard system does not own:

- document content
- editor state
- theme records
- future workspace/project/resource/runbook models
- global organization rules

---

## Page model

A dashboard show page should feel like a composition surface.

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: breadcrumb, title, mode, breakpoint, actions         │
├──────────────┬──────────────────────────────┬───────────────┤
│ Widget       │                              │ Context Rail   │
│ Palette      │        Canvas/Grid           │ Inspector      │
│              │                              │ Links/Theme    │
└──────────────┴──────────────────────────────┴───────────────┘
```

### View Mode

View mode should be calm.

- no drag handles
- no loud chrome
- no grid overlays
- minimal controls
- information-first presentation

### Edit Mode

Edit mode may expose the builder interface.

- widget palette
- layout handles
- breakpoint controls
- inspector panel
- save/reset actions
- drop zones

---

## V0 entities

```ts
type Dashboard = {
  id: string
  title: string
  slug: string
  description?: string | null
  version: number
  createdAt: string
  updatedAt: string
}
```

```ts
type WidgetInstance = {
  id: string
  dashboardId: string
  widgetType: string
  title?: string | null
  config: Record<string, unknown>
  sourceType?: 'document' | null
  sourceId?: string | null
  createdAt: string
  updatedAt: string
}
```

```ts
type DashboardLayout = {
  dashboardId: string
  breakpoint: 'lg' | 'md' | 'sm' | 'xs'
  items: DashboardLayoutItem[]
}
```

---

## State boundaries

Persisted:

- dashboard title
- dashboard description
- widget instances
- widget config
- saved layouts
- dashboard theme assignment

UI-only:

- selected widget
- current breakpoint preview
- active inspector tab
- palette open/closed
- drag preview state
- unsaved layout draft

---

## V0 widgets

Start with a small widget set:

- Document Card
- Document List
- Text/Markdown Block
- Quick Links
- Placeholder/Debug Widget

Do not add project/reference/resource/runbook widgets until those concepts are intentionally introduced.

---

## Implementation rules

- Use widget registry metadata to render widgets.
- Keep layout state separate from widget data.
- Keep view mode visually restrained.
- Do not let dashboard widgets mutate source data without going through the source feature's public API.
- Use stable Zustand selectors for grid state to avoid snapshot loops.
- Treat breakpoint layouts as first-class persisted configuration.
