# Slice 4: dashboard page and composition persistence, implementation plan

**Spec:** [2026-10-27-dashboard-page-composition-design.md](../specs/2026-10-27-dashboard-page-composition-design.md), sections 4 and 8.
**Governing:** [ADR-0016](../../architecture/decisions/0016-dashboard-composition-storage.md) (Accepted 2026-10-29), ADR-0013, ADR-0014, ADR-0006.
**Branch / worktree:** `feat/slice-4-dashboard-composition`, `Projects/worktrees/synapcity/features/slice-4-dashboard-composition`, from `origin/main` at `ab4bcd54`.
**Mode:** implementing, owner-authorized end to end (2026-10-29). Local commits only; no merge, no deploy, no push unless asked.
**Status:** all eight tasks done (2026-10-29). Evidence is in `.agents/task-scope.md`. Differences from the plan: the link-widget rules (`LINK_WIDGET_TYPES`, `parsePersistableComposition`) live in `domain-dashboards` rather than in the app, so `server-data` stays free of the dashboard domain and the app action stays thin; Undo restores the widget into the current composition instead of an older copy, because the grid reports a layout right after any removal.

## Grounding (inspected on `main`)

- Page and read-only canvas exist (slice 3): `apps/web/src/app/[userId]/home/dashboards/[dashboardId]/page.tsx`, `features/dashboards/components/dashboard-view`. `DashboardWorkspace` has `readOnly`, `useElementWidth`, a skeleton and a load-failure alert.
- `features-dashboards`: `DashboardStorage` port (`load`, `saveComposition`, `saveRecords`), `connectSaves` (400 ms debounce, one retry, `pagehide` flush, console-only failure), a Zustand store with no save state.
- `domain-dashboards`: `Widget` union of eight types, strict `dashboardCompositionSchema`, `createWidget`, `WIDGET_SIZES`; `domain-grids`: `packLayout`.
- `server-data`: `findRecord`, `listRecordSummaries`, `listSpaceSummaries`, `recordSpaceView`, `setRecordPinned`; Server Action pattern in `apps/web/src/lib/records` (`getCallerIdentity`, `logFailure`, `fixtureModeEnabled`).
- Supabase: migrations in `supabase/migrations`, regression scripts in `supabase/tests`, generated types in `packages/server/supabase/src/database-types`, CI `db-types` job. A shared local stack named `synapcity` is running for another task; this slice does not start, stop, reset or migrate it.

## Tasks (each is a compilable, committed slice; tests first)

1. **Migration, SQL test, types.** `supabase/migrations/20261029100000_create_dashboard_compositions.sql` (table, object and 64 KB checks, RLS, column grants, insert policy requiring dashboard ownership, `set_updated_at` trigger), `supabase/tests/dashboard-compositions.sql`, regenerated `database.types.ts`. Verified on a disposable `supabase/postgres` container on its own port, including deliberately weakened policy, grant and cascade.
2. **`server-data/dashboards`.** `loadComposition`, `saveComposition` (insert at 1, conditional update, conflict versus failure by a follow-up read), `recordRecordView` generalizing `recordSpaceView`. Unit tests with a fake client.
3. **Domain: query widgets.** `pinned`, `last-opened`, `spaces` in the `Widget` union, schema, `WIDGET_SIZES`, `createWidget`; a `reorderWidgets` helper (reading order and `packLayout`) for Move earlier and later.
4. **Feature package: port, save state, scheduler.** Port gains revision and `SaveOutcome`; store gains `saveStatus`, `announcement`, `undo`; `connectSaves` becomes status-aware (saving, saved, failed, conflict, manual retry, `beforeunload`, hidden-tab flush, no `pagehide`).
5. **Feature package: UI.** Save status in the toolbar, Undo, widget config context (`widgetTypes`, `persistsStatus`), three query widget bodies reading `items`, live region, Move earlier and later, focus management, canvas-width breakpoint in edit mode, empty state button. Stories with axe for every state; unit and DOM tests.
6. **App wiring.** Server Actions (`saveDashboardComposition`, `recordDashboardView`), allowlist and validation, server adapter, `DashboardView` for server and fixture (browser) persistence, page loads composition and items, view recording component, error and conflict mapping.
7. **End to end and docs.** `resource-views` / new `dashboard-edit.e2e.ts` in fixture mode; `.agents/task-scope.md`, domain and feature READMEs, inventory.
8. **Verification.** Focused tests per task, then `pnpm verify`; a real authenticated run against a disposable stack for the server path where feasible; report skips accurately.

## Stop conditions

Stop and report if: a change needs a `domain-dashboards` dependency in `server-data` (boundaries), the shared local stack must be modified, a new dependency is needed, or `pnpm boundaries` rejects a new import edge.

## Not done on purpose

Applying the migration to a shared or hosted database; widget-owned data; renaming dashboards; Document view recording; merging or deploying.
