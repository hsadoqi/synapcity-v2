# Dashboard and Widget MVP

**Status:** Superseded (2026-10-27). After the [review](2026-10-27-dashboard-widgets-mvp-review.md) and the owner's decisions, this design is split into [spec A: Dashboard page and composition persistence](2026-10-27-dashboard-page-composition-design.md) and [spec B: widget data and functional widgets](2026-10-27-dashboard-widget-data-design.md). The text below is kept unchanged for lineage; where it conflicts with spec A, spec B or [ADR-0016](../../architecture/decisions/0016-dashboard-composition-storage.md), they govern. Previous status: Proposed (2026-10-27). Needs the owner's decisions in section 6 before any schema change.
**Date:** 2026-10-27
**Requested by:** Repository owner, who moved Dashboards and Widgets ahead of Documents and Quick Capture without removing either.
**Governing:** `PRODUCT.md` (Dashboards and Widgets; open decision "widget lifecycle and source/input model"), `docs/glossary.md` (Dashboard, Widget: adopted concepts, strong working terms), [ADR-0013](../../architecture/decisions/0013-document-and-dashboard-persistence.md) (the `dashboards` record and its routes), [ADR-0010](../../architecture/decisions/0010-preference-persistence.md) (the JSON-document-per-row precedent), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md).

## 1. What exists

| Layer        | What is there                                                                                                                                                                                                                                                                                                                           | State                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Record       | `public.dashboards` (ADR-0013): name, description, icon, tags, pin, last viewed; owner-only RLS for select, insert, update, delete                                                                                                                                                                                                      | Real, persisted; created from Quick Create since `feat/create-records` |
| Routes       | `dashboardPathFor` → `/[userId]/home/dashboards/[dashboardId]` (ADR-0013 item 9)                                                                                                                                                                                                                                                        | Path decided; no page                                                  |
| Domain       | `@synapcity/domain-dashboards`: `DashboardComposition` = settings + widgets + one layout per breakpoint, a strict zod schema (unique ids, layouts reference widgets, integer placements, every breakpoint present), `createWidget`, `addWidget`, size presets per type. `@synapcity/domain-grids`: breakpoints, packing, layout entries | Tested, unpersisted                                                    |
| Feature      | `@synapcity/features-dashboards`: `DashboardWorkspace({ dashboardId, ownerId, storage })` with canvas, `react-grid-layout` 2.3.0 grid (already installed), widgets panel, breakpoint toolbar, Zustand store, debounced `save-scheduler`, empty and skeleton states, eight widget bodies                                                 | Works in Storybook against browser storage only; no app consumer       |
| Storage seam | `DashboardStorage`: `load(dashboardId)` → `{ composition, records }`, `saveComposition(dashboardId, composition)`, `saveRecords(records)`. "The browser adapter today, a server adapter later."                                                                                                                                         | Only `browserDashboardStorage` (localStorage)                          |
| Widget data  | Five types read `@synapcity/domain-prototypes` records (stat→metric, progress→goal, habit→habit, notes→note, tasks→project and task); calendar and agenda read events; feed reads activity                                                                                                                                              | Provisional kinds: no tables, not product-approved                     |
| Keyboard     | Arrow keys move a focused widget, Shift+arrows resize it (`aria-keyshortcuts` on each item)                                                                                                                                                                                                                                             | Exists                                                                 |

So the interactive surface is largely built and tested. What is missing is a page, a server storage adapter and somewhere to keep the data.

## 2. MVP scope

A signed-in person opens one of their Dashboards, adds widgets from the panel, arranges and resizes them (pointer or keyboard), uses them, and finds everything as they left it on another browser.

Included:

1. **Dashboard page** at the ADR-0013 route, with loading (the existing skeleton), empty (the existing empty state, with "Add a widget"), not-found (not theirs, or gone: `notFound()`, as Spaces do) and error states.
2. **Add, remove, move, resize** widgets, through the existing workspace. Keyboard parity is already there; the MVP adds a check for it in the e2e test.
3. **Responsive layout** for the three existing breakpoints, with the toolbar's preview.
4. **Persistence** of the composition per Dashboard, and of widget data per owner (section 3).
5. **Four widgets**, each usable end to end: Task list, Agenda, Goal tracker, Habit tracker (decision D3).
6. **Save feedback**: never "saved" before the server confirms (product principle 16); a failed save says so and retries, using `save-scheduler`.
7. Index cards and the sidebar link to the page (`itemHref` for dashboards stops being null).

Excluded now, planned later: widgets over Spaces, Documents or captures; sharing; templates; a widget SDK or registry beyond the existing union; real-time sync between tabs.

## 3. Architecture

### 3.1 Widget identity and configuration

| Option                                                                                                           | For                                                                                                              | Against                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **(a) Keep the existing discriminated union** (`Widget` by `type`, base fields plus a typed `source` or `query`) | Already validated, rendered and tested; TypeScript checks every type's fields; adding a type is one union member | Adding a type is a code change (intended)                                                               |
| (b) Generic `{ type: string, config: unknown }` with per-type schemas in a registry                              | Open to plugins                                                                                                  | A registry the glossary warns against ("do not infer a registry, plugin system"); loses static checking |

**Recommended: (a).**

### 3.2 Type registration and rendering

The existing `widget-catalog` (a typed list) and the `widget-body` switch over `type` already do this. No registry, no dynamic import. A new type adds a union member, a catalog row, a body and its schema. **Unchanged.**

### 3.3 Layout persistence and responsive behaviour

| Option                                                                                                                                                                                    | For                                                                                                                                                                                                         | Against                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **(a) The whole composition as one JSON document on the Dashboard row** (`dashboards.composition jsonb`, `composition_version`), validated by `dashboardCompositionSchema` on every write | One read, one write; the schema's cross-field rules (layouts reference widgets) hold as a unit; same shape as `user_preferences` (ADR-0010) with a size check; RLS and ownership come from the existing row | The whole document is rewritten on each save (small: tens of widgets); no row-level history         |
| (b) A `dashboard_widgets` table plus a placements table per breakpoint                                                                                                                    | Per-widget writes                                                                                                                                                                                           | Several writes per drag; the cross-field invariants move into SQL or are lost; joins for every load |
| (c) A separate `dashboard_compositions` table keyed by dashboard                                                                                                                          | Keeps the record row lean                                                                                                                                                                                   | A second row to create and keep in step, with no gain: lists already select named columns           |

**Recommended: (a).** Saves stay debounced (`save-scheduler`), last write wins. With one person and one tab that is correct; two tabs on one Dashboard can overwrite each other. That is accepted for the MVP and noted.

### 3.4 Widget data and ownership

This is the open product question ("widget lifecycle and source/input model") and decision D1.

| Option                                                                                                                                                                                                                                                                  | For                                                                                                                                                                                                                                | Against                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **(a) One owner-level JSON document of the provisional records** (`widget_data`: user id, `records jsonb`, `schema_version`), exactly what `DashboardStorage.saveRecords` already models; shared by all the owner's Dashboards, owned by the person, not by a Dashboard | All widget code is reused as is; the Dashboard owns only layout and instance configuration, as `PRODUCT.md` requires; the provisional kinds stay out of the table namespace, so promoting one later is a migration of one document | Durable storage of kinds that are not product-approved (labelled provisional); no queries across records |
| (b) Widget content inside each widget's configuration                                                                                                                                                                                                                   | No new table                                                                                                                                                                                                                       | A Dashboard would own content, against `PRODUCT.md`; the same tasks could not appear on two Dashboards   |
| (c) A table per kind (tasks, goals, habits, events)                                                                                                                                                                                                                     | Queryable                                                                                                                                                                                                                          | Makes four provisional kinds product records at once; far larger                                         |

**Recommended: (a).**

### 3.5 Data access and authorization

- `server-data` gains `dashboards/`: `loadDashboard(client, id)` (record and composition), `saveComposition(client, id, composition)`, `loadWidgetData(client)`, `saveWidgetData(client, records)`. Reads follow R6 (throw with operation and code); writes return outcomes with `ProviderFailure`.
- `apps/web` Server Actions validate with the domain schemas, verify the caller (`getCallerIdentity`, ADR-0006), and log failures with `logFailure`.
- A `serverDashboardStorage` adapter in `apps/web` implements `DashboardStorage` over those actions. The feature package does not change its contract.
- RLS: the composition is on the owner's own row (existing policies plus a column grant); `widget_data` has owner-only policies on the `user_preferences` pattern.

### 3.6 State synchronization

The workspace's Zustand store stays the client source of truth while the page is open; `save-scheduler` debounces writes; the server is read once per page load. No optimistic merge or real-time channel.

### 3.7 Initial widget types (D3)

Recommended: **Task list, Agenda, Goal tracker, Habit tracker**. Each is interactive and creates its own data in place. Left out for now: **Notes** ("Note" is a semantically contaminated term in the glossary; it can return under an approved name), **Feed** (needs an activity source), **Stat** and **Calendar** (add once the first four hold).

## 4. Phased plan

| Phase    | Slice                                                                                                                                                                            | Verification                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 (done) | Create Dashboards (and Spaces, documents) from Quick Create                                                                                                                      | Unit and DOM tests; `pnpm verify`                                                                                                                                                            |
| 1        | Migration (D2), `server-data/dashboards`, Server Actions, `serverDashboardStorage`; the page with loading, empty, not-found and error states; index cards and sidebar link to it | SQL test: another user cannot read or write a composition; unit tests for actions and adapter; e2e: create a Dashboard, open it, see the empty state                                         |
| 2        | The four widgets with `widget_data`; save feedback and retry                                                                                                                     | e2e: add a Task list, add a task, move the widget with the keyboard, reload, everything is there; a forced save failure shows the error and retries; axe-checked stories for the page states |
| 3        | Responsive and portfolio polish: breakpoint check at three widths, focus order, reduced motion, a starter layout on first open (optional)                                        | e2e at three viewport widths; manual keyboard-only and screen-reader pass                                                                                                                    |

## 5. Revised near-term roadmap

1. **Creation** (done on `feat/create-records`), then: rename, and add a document or dashboard to a Space from the Space page (no schema change).
2. **Dashboards and Widgets**, phases 1 to 3 above.
3. **Documents**: the Document page and a Lexical editor (needs the body storage ADR and the Lexical dependency, as in `first-slice.md`).
4. **Quick Capture** (`first-slice.md`), in the existing Global Panel.
5. Later integrations: widgets over Spaces, Documents and captures; capture outcomes onto a Dashboard.

## 6. Decisions for the owner

- **D1. Widget data ownership** (section 3.4; resolves part of the open source/input model). Recommended: (a), an owner-level document of provisional records.
- **D2. Schema change.** `dashboards.composition jsonb` and `composition_version`, with an object check, a size check (proposed 64 KB) and an update column grant; a `widget_data` table on the `user_preferences` pattern. Recommended: yes, as specified.
- **D3. First widget set** (section 3.7). Recommended: Task list, Agenda, Goal tracker, Habit tracker.

Delegated: routes (already ADR-0013), the adapter and action design, debounce timing, error copy, test layout, and any other choice that changes no schema, dependency or product term.
