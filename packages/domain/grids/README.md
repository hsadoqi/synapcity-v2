# @synapcity/domain-grids

Owns: responsive grid layout math. Breakpoints, grid metrics, and the pure functions that pack, place, collapse and merge items on a column grid. It knows nothing about widgets or records: callers pass each item's size.

Runtime: portable TypeScript with no runtime dependencies. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

Source: the `dashboard-core` layout module of the responsive-grid prototype. React Grid Layout is the confirmed layout direction (`PRODUCT.md`); `GridItem` is the shape it receives.

## Public interface

`@synapcity/domain-grids` (root entry):

| Export                                          | Meaning                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Breakpoint`, `BREAKPOINTS`                     | `lg`, `md`, `sm`                                                                                                                                                                                                                                                                           |
| `resolveBreakpoint`                             | The breakpoint a viewport width opens in: below 640 px `sm`, below 1024 px `md`, otherwise `lg`                                                                                                                                                                                            |
| `columnsFor`                                    | Columns at a breakpoint: the desktop count, one fewer on tablet, one on mobile                                                                                                                                                                                                             |
| `GRID`, `minGridWidth`                          | Row height, margin and minimum column width in px; the narrowest grid that keeps every column at its minimum                                                                                                                                                                               |
| `LayoutItem`, `BreakpointLayouts`               | Stored placement in grid units, per breakpoint. Constraints are derived, not stored                                                                                                                                                                                                        |
| `ItemSize`, `BreakpointSizes`                   | An item's default and minimum size, at one breakpoint or all three                                                                                                                                                                                                                         |
| `packLayout`, `layoutsForItems`, `emptyLayouts` | Left-to-right row packing for an initial layout                                                                                                                                                                                                                                            |
| `appendLayoutEntry`, `removeLayoutEntry`        | Add an item below everything at every breakpoint (never twice), or remove it from all of them                                                                                                                                                                                              |
| `toGridLayout`, `GridItem`, `COLLAPSED_ROWS`    | The render layout for one breakpoint: appends missing items, holds widths between the item's minimum and the columns, shrinks collapsed items without losing height. An item marked `fixed` is `static` (not dragged or resized; others move around it); `resizable: false` keeps its size |
| `mergeLayoutChange`, `layoutsEqual`             | Fold a reported layout back into storage, keeping collapsed items' stored height; compare two layouts                                                                                                                                                                                      |

## Structure

Kept as it is (reviewed 2026-11-11 against the domain capability rules): `types/` and one folder per layout rule under `utils/` (`breakpoints`, `grid-metrics`, `grid-layout`, `layout-entries`, `pack-layout`, and the private `bottom-of`). The package is small, correct and acyclic, has no schemas whose types could sit beside them, and each folder is one rule with its tests. Its one-line folder indexes are the only cost; flattening them would be churn for uniformity alone, so the package moves to capability files when real work next touches it.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside each unit.
