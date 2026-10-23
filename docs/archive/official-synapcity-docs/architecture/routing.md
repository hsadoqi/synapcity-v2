# Routing

Routing should compose product surfaces without becoming the place where feature logic lives.

V0 avoids workspace-first routing. It uses direct document and dashboard routes until the organization model is intentionally chosen.

---

## V0 route inventory

Required:

```text
/                              → app landing or default dashboard
/documents                     → document index
/documents/[documentId]        → document detail + document editor
/dashboards                    → dashboard index
/dashboards/[dashboardId]      → dashboard detail/composition surface
/settings/theme                → theme test/settings surface
```

Optional during development:

```text
/dev/theme                     → isolated theme debugging surface
/dev/widgets                   → widget registry preview
/dev/editor                    → document editor playground
```

Not V0 routes:

```text
/workspaces
/projects
/references
/resources
/runbooks
```

These should remain deferred until the core document/dashboard/widget/theme loop is working.

---

## Route responsibilities

A route may:

- read route params
- load route-level data
- choose page shell
- mount feature client boundary
- provide metadata
- compose providers

A route should not:

- contain large UI trees
- own dashboard grid behavior
- implement editor commands
- mutate stores directly without a feature boundary
- import browser-only code from a server component

---

## Shell types

### App shell

Global navigation, theme provider root, command access, and shared chrome.

### Detail shell

Object-specific detail pages for documents and dashboards.

### Builder shell

Dashboard composition surfaces with edit/view mode, inspector rails, palettes, and overlays.

### Future organization shell

A workspace/project/collection shell may be added later if organization becomes first-class.

---

## Suggested pattern

```text
app/documents/[documentId]/page.tsx
  ↓
DocumentRouteClient
  ↓
DocumentRouteSync
  ↓
DocumentDetailPage
  ↓
DocumentEditor + DocumentContextRail
```

```text
app/dashboards/[dashboardId]/page.tsx
  ↓
DashboardRouteClient
  ↓
DashboardRouteSync
  ↓
DashboardDetailPage
  ↓
DashboardCanvas + WidgetPalette + ContextRail
```

---

## Client/server boundary rules

Server components can:

- read params
- fetch server data
- render static shell pieces
- provide metadata

Client components can:

- use Zustand
- use browser APIs
- handle drag/drop
- run editor code
- manage theme preview state

If a component uses `window`, local storage, drag/drop, editor APIs, or Zustand subscriptions, it belongs behind a client boundary.

---

## Route sync checklist

For every route-scoped client feature:

- [ ] Does it initialize from route params?
- [ ] Does it clean up selected object state on route change?
- [ ] Does it avoid duplicate setup code?
- [ ] Does it avoid creating new selector objects every render?
- [ ] Does it handle missing or invalid IDs?
- [ ] Does it expose a useful loading/empty/error state?

---

## Future exploration

- organization routes such as `/collections`, `/projects`, or `/workspaces`
- nested dashboard/document shells
- saved views
- richer route-level context
