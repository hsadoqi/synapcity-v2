# Guide: Create a Store

Use Zustand stores for shared UI state with clear ownership. Do not use stores for content persistence or editor internals.

## Strict implementation checklist

### 1. Confirm the state is UI state

Before creating a store, confirm the state is:

- shared across multiple components
- feature-scoped rather than global
- not persisted content data
- not editor document state
- not a derived projection of database state

If it can stay local, keep it local.

### 2. Name the store by ownership

Good:

```ts
useDashboardBuilderUiStore
useThemeEditorStore
useCommandMenuStore
```

Bad:

```ts
useAppStore
useGlobalStore
useEverythingStore
```

### 3. Keep the store shape focused

```ts
type DashboardBuilderUiState = {
  selectedWidgetId: string | null
  activeBreakpoint: 'lg' | 'md' | 'sm' | 'xs'
  isInspectorOpen: boolean
  setSelectedWidgetId: (id: string | null) => void
  setActiveBreakpoint: (breakpoint: 'lg' | 'md' | 'sm' | 'xs') => void
  setInspectorOpen: (open: boolean) => void
  reset: () => void
}
```

### 4. Keep persistence separate

A store may hold draft or temporary UI state, but persistence should be handled by services/repositories.

Examples:

- acceptable in store: inspector open, selected widget, drag preview state
- not acceptable in store: saved dashboard layout, document content, relationship records

### 5. Use stable selectors

Avoid returning new objects from selectors.

```ts
const EMPTY_LAYOUTS = {}

const layout = useDashboardBuilderUiStore(
  (state) => state.layoutsByDashboard[dashboardId] ?? EMPTY_LAYOUTS
)
```

### 6. Add reset or cleanup behavior

Route-scoped and feature-scoped stores should provide a reset path so state is cleared when the feature unmounts or the route changes.

## Store checklist

- [ ] State owner is clear.
- [ ] State is UI state, not durable content.
- [ ] Store does not contain JSX.
- [ ] Store does not import Prisma or repositories directly.
- [ ] Selectors return stable references.
- [ ] Persisted data is not duplicated in the store.
- [ ] Cleanup/reset behavior exists where needed.

## Future exploration

- store composition patterns for larger feature surfaces
- selector factories for complex layout views

## Open questions

- Should route-scoped state be URL-backed for all primary objects in V1?
