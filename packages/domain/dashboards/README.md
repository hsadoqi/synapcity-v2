# @synapcity/domain-dashboards

Owns: dashboard composition. The widgets a dashboard shows, where they sit at each breakpoint, its display settings, and the pure operations that change them.

Runtime: portable TypeScript; its one third-party runtime dependency is `zod`, for the saved-data contract. Depends on [`domain-grids`](../grids/README.md) for layout math and, through a recorded provisional bridge, on [`domain-prototypes`](../prototypes/README.md) for the records the record-backed widgets point at. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

Source: the `dashboard-core` dashboard module of the responsive-grid prototype.

## What this package does not decide

- **The dashboard record.** Name, owner and timestamps belong to the ADR-0013 dashboard record, whose contract joins this package in Milestone 8 (owner decision, 2026-10-24). `DashboardComposition` is only `{ settings, widgets, layouts }`, so its operations take no `now` and touch no timestamps; the caller updates the record when it saves.
- **Where compositions are stored.** Nothing here reads or writes storage. `dashboardCompositionSchema` is the contract a saved composition must meet. The browser adapter in `features-dashboards` stores it locally; server storage is [ADR-0016](../../../docs/architecture/decisions/0016-dashboard-composition-storage.md) (Slice 4). `parsePersistableComposition` is what the server checks before it stores one: the contract with no keys it does not define (`unknown-keys`, at any depth), only the link widgets (`LINK_WIDGET_TYPES`: Pinned, Last opened, Spaces), every widget active (no hidden or archived status is persisted), and the 64 KB cap. `moveWidgetInOrder` reorders by reading order and repacks one breakpoint.
- **The widget source model.** `PRODUCT.md` leaves it open. These widgets use the prototype's answer: a record-backed widget points at one prototype record through `source`, and a query widget (calendar, feed) describes what to select.
- **A widget registry.** The ownership map adopts none. `WIDGET_SIZES` is layout data, not a registry; the add-widget palette and its labels are feature copy.

## Public interface

`@synapcity/domain-dashboards` (root entry):

| Export                                                                                                                | Meaning                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Widget`, `WidgetType`, `StatWidget` … `FeedWidget`, `AgendaWidget`, `WidgetStatus`, `WidgetHighlight`, `WidgetPatch` | Widget instances. `title` is the view's label, independent of the record's name. Optional `locked` (fixed in place), `pinned` (surfaced outside the dashboard, no layout effect; nothing reads it yet) and `resizable`; optional so compositions saved before them still parse. `locked` and `pinned` are working names |
| `DashboardComposition`, `DashboardSettings`, `DEFAULT_SETTINGS`                                                       | Widgets, per-breakpoint layouts and settings (columns 1–4, card radius, widget titles)                                                                                                                                                                                                                                  |
| `WIDGET_SIZES`                                                                                                        | Default and minimum size of each widget type per breakpoint                                                                                                                                                                                                                                                             |
| `createWidget`                                                                                                        | A new widget and, for record-backed types, its new record                                                                                                                                                                                                                                                               |
| `addWidget`, `removeWidget`, `duplicateWidget`, `updateWidget`, `setWidgetStatus`                                     | Widget changes. Only an active widget gets a layout entry, and an id already on the dashboard is ignored. Removing a widget leaves its record; a duplicate is a second view of the same record                                                                                                                          |
| `activeWidgets`, `widgetsWithStatus`                                                                                  | Widgets by status; hidden and archived widgets have no layout entry                                                                                                                                                                                                                                                     |
| `createComposition`, `duplicateComposition`, `updateSettings`, `layoutsForWidgets`                                    | New, copied (fresh widget ids, same records) and re-packed compositions                                                                                                                                                                                                                                                 |
| `applyLayoutChange`, `gridLayoutFor`                                                                                  | Store a layout the grid reported for one breakpoint; build the render layout of the active widgets: a `locked` widget is static, a `resizable: false` one keeps its size                                                                                                                                                |
| `dashboardCompositionSchema`                                                                                          | Zod contract for a saved composition: settings within their allowed values, widgets with a source of the right kind or a query, a layout for each breakpoint                                                                                                                                                            |

## Validation and versions

- **Writes** refuse keys the contract does not define, at every depth: `parsePersistableComposition` parses with a strict variant built from the same definitions as `dashboardCompositionSchema` (`compositionSchema('strict')`), so the two differ only in unknown keys whatever transforms or defaults the definitions gain. Before 2026-11-11 the write dropped them and stored the rest.
- **Reads** (`dashboardCompositionSchema`, in the server read and the browser adapter) stay tolerant: missing optional fields parse, so older documents load, and unknown keys are dropped. Invalid known fields fail the read.
- **Versions**: the server read refuses a `schema_version` it does not support before parsing (`server-data`); the browser adapter has no version and is used in development fixture mode only.
- The hand-written types carry the contract's documentation; two-way type tests in `composition-schema.test.ts` keep them equal to the schema.

## Structure

Capability files under `src/` (workspace conventions, domain packages), dependencies running one way:

- `widget-base.ts`: the fields every widget has, the data-free (query and link) widgets, and `objectFor`, which builds each object `strip` or `strict`.
- `prototype-widgets.ts`: the record-backed widgets (provisional bridge, below).
- `widgets.ts`: the `Widget` union, its schema, `WidgetType`, `WidgetPatch`, `WIDGET_SIZES`, `LINK_WIDGET_TYPES` and `createWidgetId`.
- `composition.ts`: the composition types and schema, `createComposition` and every composition and widget operation.
- `persistence.ts`: the write boundary, `parsePersistableComposition`.
- `create-widget.ts`: `createWidget` (provisional bridge, below).

## Provisional bridge to domain-prototypes

|                   |                                                                                                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source            | `prototype-widgets.ts` (the record reference `entityRefSchema`, `EntityRef`) and `create-widget.ts` (`newRecord`, `putRecord`, `PrototypeRecords`, `RecordContext`)                                                    |
| Target            | `@synapcity/domain-prototypes`, provisional and outside the glossary                                                                                                                                                   |
| Consumers         | `features-dashboards` (the canvas creates and shows record-backed widgets) and stories; stable composition code (`widget-base`, `widgets`, `composition`, `persistence`) does not import prototypes                    |
| Owner             | dashboards                                                                                                                                                                                                             |
| Risk              | a change to the prototype record kinds changes which widgets parse; compositions saved in the browser hold record-backed widgets, so they stay in the `Widget` union. The server never stores them (link widgets only) |
| Removal condition | the widget source model that PRODUCT.md leaves open is decided; until then neither the source model nor these widgets are final                                                                                        |

Widget ids come from dashboards' own `createWidgetId` (since 2026-11-11), not from the prototype record ids.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside each unit.

## Persistence contract (S1)

`createComposition()` is the default composition of every Dashboard: the database creates it, at revision 1, with each new Dashboard (migration `composition_initialization`). The literal in that migration and this function must stay equal; a unit test in `apps/web` compares them, and changing either needs a new migration. `parsePersistableComposition` is the application contract (no undefined keys at any depth: `unknown-keys`; link widgets only, active widgets only, 64 KiB of compact JSON, and no U+0000 or unpaired surrogate in any string or key: `invalid-text`); the database holds only a 128 KiB text backstop. See [ADR-0016](../../../docs/architecture/decisions/0016-dashboard-composition-storage.md) (Amendment 1) and [ADR-0018](../../../docs/architecture/decisions/0018-revision-capture.md).

`neededLinkKinds(composition)` says which kinds of record the link widgets list, so the host reads only those.
