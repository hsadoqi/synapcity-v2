# Dashboard canvas package (PR 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@synapcity/features-dashboards` with the prototype's dashboard canvas, saved in the browser behind a storage port, and visible in Storybook.

**Architecture:** One `zustand` store per canvas runs every change through `domain-dashboards` and `domain-prototypes`. A `DashboardStorage` port (async) loads and saves; `browserDashboardStorage` fills it with validated, owner-scoped `localStorage`. Widgets live in `src/frontend/widgets/` and take props only, so they can move to their own package later.

**Tech Stack:** React 19.3, `react-grid-layout` 2.3.0, `zustand` 5.0.16, Zod 4, Base UI shadcn components from `@synapcity/frontend-ui`, Vitest (jsdom), Storybook 10.

**Spec:** [docs/superpowers/specs/2026-10-24-features-dashboards-canvas-design.md](../specs/2026-10-24-features-dashboards-canvas-design.md). PR 2 (the `apps/web` route and the e2e test) gets its own plan.

**Reference implementation (evidence, not authority):** `/Users/hanaasadoqi/Desktop/synapcity-responsive-grid/apps/web/src/features/dashboard/` and `context-panel/panels/widgets-panel.tsx`. Read the matching prototype file before each UI task; port behaviour and markup, not its classes or stores.

## Global Constraints

- New third-party dependencies, exact pins: `react-grid-layout` `2.3.0`, `zustand` `5.0.16` (both approved). Nothing else third-party; no `radix-ui`.
- Package `@synapcity/features-dashboards` at `packages/features/dashboards`, entries `./contracts`, `./frontend`, `./styles.css`; no root entry, no `./server`.
- `./contracts` imports only domain packages. Nothing in `src/frontend/widgets/` imports `src/frontend/components/`, the store, `react-grid-layout` or `zustand`.
- Colours: semantic classes only (`bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`). No palette classes, no hand-written `dark:` colours, no bracket values, no static `style={{}}`, no `!important`, `cn()` from `@synapcity/frontend-ui/lib/utils`, `gap-*` not `space-*`, `size-*` not `w-* h-*`.
- shadcn components from `@synapcity/frontend-ui/core/<name>`; use variants before `className`, and `className` on them for layout only.
- Storage keys: `synapcity.dashboard.<ownerId>.<dashboardId>.v1`, `synapcity.records.<ownerId>.v1`; invalid values copied to `<key>.invalid`.
- Save batching: 400 ms after the last change; flush on `pagehide` and on `visibilitychange` to hidden; flush on unmount.
- Every component folder has `name.tsx`, `name.stories.tsx`, `name.test.tsx`, `index.ts`. Stories run in `apps/storybook` with the a11y addon.
- No Claude attribution in commits. Conventional commit subjects.

## Review Focus

- **Saved data that no longer parses** (an older shape, a hand edit, a truncated write): the canvas opens fresh and the bad value survives under `.invalid` (Task 4).
- **`localStorage` that throws** (Safari private mode, quota, blocked cookies): no exception reaches React, `onError` fires, the canvas keeps working in memory (Task 4).
- **A widget whose record is missing** (records key cleared, or a record never saved): the widget renders `WidgetUnavailable`, never crashes (Task 6).
- **Layouts per breakpoint stay separate**: editing at `md` leaves the saved `lg` and `sm` layouts unchanged, and the grid's echo of the layout it was given on mount does not count as a change or trigger a save (Tasks 8 and 10).
- **Closing the tab inside the 400 ms window**: the pending save is flushed on `pagehide` (Task 4).

---

### Task 1: Saved-data schemas in the domain packages

**Files:**

- Create: `packages/domain/dashboards/src/schemas/composition.ts`, `packages/domain/dashboards/src/schemas/composition.test.ts`, `packages/domain/dashboards/src/schemas/index.ts`
- Create: `packages/domain/prototypes/src/schemas/prototype-records-table.ts`, `packages/domain/prototypes/src/schemas/prototype-records-table.test.ts`
- Modify: `packages/domain/dashboards/src/index.ts`, `packages/domain/dashboards/package.json` (add `zod` `^4.6.7`, `@synapcity/domain-prototypes` already present), `packages/domain/prototypes/src/schemas/index.ts`, `packages/domain/prototypes/src/index.ts`, both READMEs' public-interface tables

**Interfaces:**

- Produces: `dashboardCompositionSchema: z.ZodType<DashboardComposition>` from `@synapcity/domain-dashboards`; `prototypeRecordsSchema: z.ZodType<PrototypeRecords>` from `@synapcity/domain-prototypes`.

- [ ] **Step 1: Write the failing tests**

`composition.test.ts`:

- `it('accepts a composition built by the domain functions')`: build with `createComposition()`, `createWidget` for all seven types and `addWidget`; `expect(dashboardCompositionSchema.parse(c)).toEqual(c)`.
- `it('rejects settings outside their allowed values')`: `columns: 5` and `cardRadius: 10` fail `safeParse`.
- `it('rejects a record-backed widget without a matching source kind')`: a `stat` widget with `source: { kind: 'goal', id: 'x' }` fails.
- `it('rejects a layout missing a breakpoint')`: `layouts: { lg: [], md: [] }` fails.
- `it('rejects negative or non-integer placements')`: `{ i: 'a', x: -1, y: 0, w: 1, h: 1 }` and `w: 1.5` fail.

`prototype-records-table.test.ts`:

- `it('accepts every table empty')`: `prototypeRecordsSchema.parse(emptyRecords())` equals `emptyRecords()`.
- `it('rejects a table with an invalid record')`: a `habit` table holding `{ completedDays: ['monday'] }` plus base fields fails.
- `it('rejects a record stored under another id')`: table key `'a'` holding a record with `id: 'b'` fails.

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter @synapcity/domain-dashboards --filter @synapcity/domain-prototypes test`
Expected: FAIL, the schemas are not exported.

- [ ] **Step 3: Implement the schemas**

`dashboardCompositionSchema` mirrors `types/composition.ts` and `types/widget.ts`: settings `columns` literal union 1–4, `cardRadius` 4 | 8 | 12 | 16, `showWidgetTitles` boolean; widgets a discriminated union on `type` whose `source` uses `entityRefSchema` narrowed to the kind in `widget.ts` (`stat`→`metric`, `progress`→`goal`, `habit`→`habit`, `notes`→`note`, `tasks`→`project`), `calendar` `query: { range: 'week' }`, `feed` `query: { limit: int 1–50 }`; `layouts` a strict object with `lg`, `md`, `sm`, each an array of `{ i: string min 1, x, y: int ≥ 0, w, h: int ≥ 1 }`. Annotate it `satisfies z.ZodType<DashboardComposition>` so it cannot drift from the types. `prototypeRecordsSchema` is a strict object with one key per `PROTOTYPE_RECORD_KINDS` entry, each `z.record(z.string(), prototypeRecordSchemas[kind])` refined so every key equals its record's `id`.

- [ ] **Step 4: Run the tests and the package checks**

Run: `pnpm --filter @synapcity/domain-dashboards --filter @synapcity/domain-prototypes run --parallel test && pnpm turbo run lint check-types --filter=@synapcity/domain-dashboards --filter=@synapcity/domain-prototypes`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: add saved-data schemas for dashboard compositions and prototype records"`

---

### Task 2: Package scaffold, contracts and display utilities

**Files:**

- Create in `packages/features/dashboards/`: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `README.md`
- Create: `src/contracts/index.ts`, `src/contracts/types/dashboard-storage.ts`
- Create: `src/frontend/index.ts`, `src/frontend/utils/{widget-catalog,weekdays,relative-time,device-frame}/` (each `name.ts`, `name.test.ts`, `index.ts`), `src/frontend/hooks/use-now/{use-now.ts,use-now.test.ts,index.ts}`
- Modify: root `vitest.config.ts` (add `'packages/features/dashboards'`), `docs/architecture/workspace-conventions.md` (the `features-dashboards` row: "Dashboard canvas (provisional, 2026-10-24) and, in M8, browsing" with First code "Canvas (exists, provisional); browsing M8")

**Interfaces:**

- Produces (`./contracts`):

  ```ts
  type DashboardSnapshot = {
    composition: DashboardComposition | null;
    records: PrototypeRecords | null;
  };
  type DashboardStorage = {
    load(dashboardId: string): Promise<DashboardSnapshot>;
    saveComposition(
      dashboardId: string,
      composition: DashboardComposition,
    ): Promise<void>;
    saveRecords(records: PrototypeRecords): Promise<void>;
  };
  type DashboardStorageError = {
    kind: 'read' | 'write' | 'invalid';
    key: string;
    cause: unknown;
  };
  ```

- Produces (utils, internal): `WIDGET_CATALOG: readonly { type: WidgetType; label: string; Icon: LucideIcon }[]`; `WEEKDAY_INITIAL`, `WEEKDAY_SHORT`, `WEEKDAY_NAME` (`readonly string[]` of 7); `relativeTime(fromIso: string, now: number): string`; `DEVICE_FRAME_WIDTH: Record<Breakpoint, number | null>`; `useNow(intervalMs: number): number`.

- [ ] **Step 1: Scaffold the package**

Copy `packages/features/spaces`' `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts` (drop the `server-only` alias) and `vitest.setup.ts` (keep the `matchMedia` stub; add a `ResizeObserver` stub with no-op `observe`, `unobserve`, `disconnect` when `window.ResizeObserver` is missing). `package.json`: name `@synapcity/features-dashboards`, `exports` `{"./contracts": "./src/contracts/index.ts", "./frontend": "./src/frontend/index.ts", "./styles.css": "./src/styles.css"}`, `sideEffects: ["*.css"]`, scripts as in `features-spaces`; dependencies `@synapcity/domain-dashboards`, `@synapcity/domain-grids`, `@synapcity/domain-prototypes`, `@synapcity/frontend-ui` (all `workspace:*`), `lucide-react` `^1.55.0`, `react` `19.3.0`, `react-grid-layout` `2.3.0`, `zod` `^4.6.7`, `zustand` `5.0.16`; devDependencies as `features-spaces` (minus server ones) plus `@synapcity/dev-fixtures`, `@testing-library/user-event` at the version `apps/web` pins. Create an empty `src/styles.css` (filled in Task 8). Run `pnpm install`.

- [ ] **Step 2: Write the failing utility tests**

- `widget-catalog.test.ts`: labels in order equal `['Stat card', 'Task list', 'Recent activity', 'Schedule', 'Notes', 'Habit tracker', 'Goal tracker']`; types cover every `WidgetType` exactly once.
- `weekdays.test.ts`: `WEEKDAY_INITIAL` equals `['M','T','W','T','F','S','S']`; `WEEKDAY_SHORT[0]` is `'Mon'`; `WEEKDAY_NAME[6]` is `'Sunday'`.
- `relative-time.test.ts` with `now = Date.parse('2026-10-24T12:00:00Z')`: `it.each` of minutes-ago → label: 0 → `'Just now'`, a future time → `'Just now'`, 1 → `'1 min ago'`, 12 → `'12 min ago'`, 59 → `'59 min ago'`, 180 → `'3 hr ago'`, 2 days → `'2 d ago'`.
- `device-frame.test.ts`: equals `{ lg: null, md: 834, sm: 390 }`.
- `use-now.test.ts` with fake timers: returns `Date.now()` initially, updates after `intervalMs`, clears its interval on unmount.

- [ ] **Step 3: Run them to see them fail**

Run: `pnpm --filter @synapcity/features-dashboards test`
Expected: FAIL, modules missing.

- [ ] **Step 4: Implement the utilities and the contracts types**

Icons: `FlameIcon` stat, `ListChecksIcon` tasks, `ActivityIcon` feed, `CalendarIcon` calendar, `FileTextIcon` notes, `RepeatIcon` habit, `TargetIcon` progress. `relativeTime` ports the prototype's rule (minutes rounded; `< 60` minutes, hours rounded `< 24`, else days rounded) on `Date.parse(fromIso)`. `src/frontend/index.ts` exports nothing yet beyond what later tasks add.

- [ ] **Step 5: Write the README**

Follow `features-spaces/README.md`'s sections: Owns (the dashboard canvas; provisional), entries table, What the host supplies (`ownerId`, `dashboardId`, a `DashboardStorage`, the stylesheet import), Rules (the widgets-folder rule from Global Constraints; no `next`; stories use in-memory storage), Scripts. Link the spec.

- [ ] **Step 6: Run tests, lint, types, Knip and boundaries**

Run: `pnpm --filter @synapcity/features-dashboards test && pnpm turbo run lint check-types --filter=@synapcity/features-dashboards && pnpm deps && pnpm boundaries`
Expected: PASS (Knip may report unused exports until Task 10 wires them; if so, finish Task 2's commit and expect them cleared by Task 10).

- [ ] **Step 7: Commit**

`git commit -m "feat: scaffold features-dashboards with the storage contract and display utilities"`

---

### Task 3: The canvas store

**Files:**

- Create: `src/frontend/store/{dashboard-store.ts,dashboard-store.test.ts,dashboard-store-provider.tsx,dashboard-store-provider.test.tsx,index.ts}`

**Interfaces:**

- Consumes: domain functions from `@synapcity/domain-dashboards` (`addWidget`, `createWidget`, `updateWidget`, `duplicateWidget`, `setWidgetStatus`, `removeWidget`, `applyLayoutChange`, `updateSettings`) and `@synapcity/domain-prototypes` (`toggleTask`, `toggleHabitDay`, `updateNoteBody`).
- Produces:

  ```ts
  type DashboardState = {
    composition: DashboardComposition;
    records: PrototypeRecords;
    breakpoint: Breakpoint;
    editMode: boolean;
  };
  type DashboardActions = {
    setBreakpoint(bp: Breakpoint): void;
    toggleEditMode(): void;
    addWidget(type: WidgetType): void;
    updateWidget(id: string, patch: WidgetPatch): void;
    duplicateWidget(id: string): void;
    setWidgetStatus(id: string, status: WidgetStatus): void;
    removeWidget(id: string): void;
    applyLayoutChange(bp: Breakpoint, items: LayoutItem[]): void;
    updateSettings(patch: Partial<DashboardSettings>): void;
    toggleTask(taskId: string): void;
    toggleHabitDay(habitId: string, day: string): void;
    updateNoteBody(noteId: string, body: string): void;
  };
  type DashboardStore = DashboardState & DashboardActions;
  type DashboardStoreInit = {
    composition: DashboardComposition;
    records: PrototypeRecords;
    ownerId: string;
    breakpoint: Breakpoint;
    now?: () => number;
  };
  function createDashboardStore(
    init: DashboardStoreInit,
  ): StoreApi<DashboardStore>;
  function DashboardStoreProvider(props: {
    init: DashboardStoreInit;
    children: ReactNode;
    onStore?: (store: StoreApi<DashboardStore>) => void;
  }): JSX.Element;
  function useDashboardStore<T>(selector: (s: DashboardStore) => T): T;
  ```

- [ ] **Step 1: Write the failing store tests**

With `now = () => Date.parse('2026-10-24T09:00:00Z')` and owner `'11111111-1111-4111-8111-111111111111'`:

- `addWidget('tasks')` adds one widget and its project and task records in one `setState` (subscribe and count calls: exactly 1).
- `applyLayoutChange('md', items)` changes `composition.layouts.md` only; `lg` and `sm` are the same references as before.
- `toggleTask` records an activity whose `occurredAt` is `now()`'s ISO string.
- `setWidgetStatus(id, 'hidden')` removes its layout entries; `'active'` restores them.
- An action on a missing id leaves `getState()` referentially unchanged.
- `setBreakpoint` and `toggleEditMode` change only view state.
- Two stores from the same init do not share state.

Provider test: `useDashboardStore` outside the provider throws `'useDashboardStore must be used within DashboardStoreProvider'`; inside, a selector reads `editMode`; `onStore` receives the store once across re-renders.

- [ ] **Step 2: Run to see them fail**

Run: `pnpm --filter @synapcity/features-dashboards test -- store`
Expected: FAIL.

- [ ] **Step 3: Implement**

`createStore` from `zustand/vanilla`; `RecordContext` is `{ ownerId, now: now() }` per action. Provider per the zustand Next.js guide: `const [store] = useState(() => createDashboardStore(init))`, context, `useStore(store, selector)`; `onStore` called in an effect once.

- [ ] **Step 4: Run tests and checks**

Run: `pnpm --filter @synapcity/features-dashboards test && pnpm turbo run lint check-types --filter=@synapcity/features-dashboards`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: add the per-canvas dashboard store"`

---

### Task 4: Browser storage, save scheduling and in-memory storage

**Files:**

- Create: `src/frontend/storage/browser-dashboard-storage/{browser-dashboard-storage.ts,browser-dashboard-storage.test.ts,index.ts}`
- Create: `src/frontend/storage/save-scheduler/{save-scheduler.ts,save-scheduler.test.ts,index.ts}`
- Create: `src/testing/memory-dashboard-storage.ts` (not exported; for tests and stories)

**Interfaces:**

- Consumes: `DashboardStorage`, `DashboardStorageError` (Task 2); `dashboardCompositionSchema`, `prototypeRecordsSchema` (Task 1); `StoreApi<DashboardStore>` (Task 3).
- Produces:

  ```ts
  function browserDashboardStorage(options: {
    ownerId: string;
    onError?: (e: DashboardStorageError) => void;
    storage?: Storage;
  }): DashboardStorage;
  function connectSaves(
    store: StoreApi<DashboardStore>,
    storage: DashboardStorage,
    dashboardId: string,
    options?: { delayMs?: number; target?: SaveTarget },
  ): () => void; // returns disconnect, which flushes
  type SaveTarget = {
    window: Pick<Window, 'addEventListener' | 'removeEventListener'>;
    document: Pick<
      Document,
      'addEventListener' | 'removeEventListener' | 'visibilityState'
    >;
  };
  function memoryDashboardStorage(
    seed?: Record<string, string>,
  ): DashboardStorage & { raw: Map<string, string> };
  ```

- [ ] **Step 1: Write the failing adapter tests** (a fake `Storage` backed by a `Map`, and one whose `setItem`/`getItem` throw)

- `it('round-trips a composition and records under owner-scoped keys')`: after saves, the map holds exactly `synapcity.dashboard.<owner>.<dash>.v1` and `synapcity.records.<owner>.v1`, and `load` returns equal values.
- `it('returns nulls when nothing is saved')`.
- `it('keeps owners apart')`: owner B's `load` of the same dashboard id returns nulls.
- `it('sets an invalid value aside and reports it')`: seed the composition key with `'{"settings":{}}'`; `load` returns `composition: null`, the map holds the original string under `<key>.invalid`, the original key is untouched until the next save, and `onError` got `{ kind: 'invalid', key }`.
- `it('treats unparseable JSON as invalid')`: seed `'{'`; same outcome.
- `it('reports a throwing storage without throwing')`: `load` resolves nulls with `onError` `kind: 'read'`; `saveComposition` resolves with `kind: 'write'`.

- [ ] **Step 2: Write the failing scheduler tests** (fake timers, an in-memory storage spy, a fake event target)

- Several store changes within 400 ms produce one `saveComposition` and one `saveRecords`, 400 ms after the last change.
- A view-state change (`setBreakpoint`, `toggleEditMode`) schedules nothing.
- A change to records only saves records; a change to the composition only saves the composition.
- Dispatching `pagehide`, or `visibilitychange` with `visibilityState` `'hidden'`, saves the pending change at once.
- The returned disconnect flushes a pending change and removes its listeners.

- [ ] **Step 3: Run to see them fail**

Run: `pnpm --filter @synapcity/features-dashboards test -- storage`
Expected: FAIL.

- [ ] **Step 4: Implement**

The adapter wraps every `Storage` call in try/catch (the prototype's `persistence.ts` wrapper) and validates with `safeParse`. `connectSaves` uses `store.subscribe((s, prev) => …)` comparing `s.composition !== prev.composition` and `s.records !== prev.records`, so the domain functions' immutability decides what changed. Defaults: `delayMs` 400, `target` `{ window, document }`.

- [ ] **Step 5: Run tests and checks**

Run: `pnpm --filter @synapcity/features-dashboards test && pnpm turbo run lint check-types --filter=@synapcity/features-dashboards`
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: save dashboards to validated, owner-scoped browser storage"`

---

### Task 5: Checkbox in `frontend-ui`

**Files:**

- Create: `packages/frontend/ui/src/components/ui/checkbox/{checkbox.tsx,checkbox.stories.tsx,checkbox.test.tsx,index.ts}`

**Interfaces:**

- Produces: `Checkbox` from `@synapcity/frontend-ui/core/checkbox`, shadcn's `base-mira` checkbox on Base UI (`checked`, `onCheckedChange`, `disabled`, `aria-label`).

- [ ] **Step 1: Add it with the shadcn CLI**

Run from the repository root: `pnpm ui:add checkbox`. Move the flat file into `checkbox/checkbox.tsx` with an `index.ts`, as the design system rules require. Remove anything the CLI wrote into `apps/web/src/styles/globals.css`.

- [ ] **Step 2: Write the test and story**

Test: renders a `checkbox` role with its label; clicking calls `onCheckedChange(true)`; `disabled` blocks it. Story: unchecked, checked, disabled, with a `Label`.

- [ ] **Step 3: Run the UI package checks**

Run: `pnpm --filter @synapcity/frontend-ui test && pnpm turbo run lint check-types --filter=@synapcity/frontend-ui`
Expected: PASS, including `package-structure.test.ts`.

- [ ] **Step 4: Commit**

`git commit -m "feat: add the checkbox component"`

---

### Task 6: Widget bodies (props only)

**Files:**

- Create in `src/frontend/widgets/`: `stat-body/`, `progress-body/`, `habit-body/`, `tasks-body/`, `notes-body/`, `calendar-body/`, `feed-body/`, `widget-states/` (`WidgetUnavailable`, `WidgetEmpty`), `widget-body/` (the switch); each with story, test, `index.ts`

**Interfaces:**

- Consumes: display utilities (Task 2), domain selectors (`goalPercent`, `habitWeek`, `tasksForProject`, `eventsThisWeek`, `recentActivity`), `Checkbox` (Task 5).
- Produces:

  ```ts
  type WidgetBodyActions = {
    toggleTask(taskId: string): void;
    toggleHabitDay(habitId: string, day: string): void;
    updateNoteBody(noteId: string, body: string): void;
  };
  function WidgetBody(props: {
    widget: Widget;
    records: PrototypeRecords;
    now: number;
    actions: WidgetBodyActions;
  }): JSX.Element;
  ```

  Each body takes the records it needs plus `now` and the relevant action; `WidgetBody` picks the body by `widget.type` and renders `WidgetUnavailable` when `getRecord(records, widget.source)` is undefined.

- [ ] **Step 1: Write the failing tests** (one file per body)

- Stat: shows `value`, `unit`, `note`. Progress: shows `14 of 24 books` and a progressbar with `aria-valuenow` 58.
- Habit: seven buttons named by `WEEKDAY_NAME` with today suffixed `(today)`, `aria-pressed` for done days, future days disabled, clicking a past day calls `toggleHabitDay(id, dayKey)`; the visible letters are `WEEKDAY_INITIAL` and `aria-hidden`.
- Tasks: lists the project's tasks in `order`, each a labelled `Checkbox`; clicking calls `toggleTask`.
- Notes: a labelled textarea; typing calls `updateNoteBody` with the new body.
- Calendar: this week's events earliest first with `WEEKDAY_SHORT` and local time; none → `WidgetEmpty` "Nothing scheduled this week."
- Feed: up to `query.limit` activities with `relativeTime` inside `<time dateTime>`; none → `WidgetEmpty` "No activity yet."
- `WidgetBody`: a `stat` widget whose metric is missing renders `WidgetUnavailable` with text "This metric is no longer available."

- [ ] **Step 2: Run to see them fail**, then **Step 3: Implement**, porting each prototype body (`widgets/*.tsx`) with semantic classes (done day `bg-primary`, not done `bg-muted`, today `outline outline-ring`).

- [ ] **Step 4: Write the stories**

Each body with the seeded data from `createPrototypeWorkspace(Date.parse('2026-10-23T09:00:00'))` (`@synapcity/dev-fixtures/prototype-workspace`) and a fixed `now`; plus empty and unavailable states.

- [ ] **Step 5: Run tests and checks** (`pnpm --filter @synapcity/features-dashboards test`, lint, types). Expected: PASS.

- [ ] **Step 6: Commit** `git commit -m "feat: add the dashboard widget bodies"`

---

### Task 7: Widget shell (props only)

**Files:**

- Create: `src/frontend/widgets/widget-shell/{widget-shell.tsx,widget-shell.stories.tsx,widget-shell.test.tsx,index.ts}`

**Interfaces:**

- Produces:

  ```ts
  type WidgetShellActions = {
    update(patch: WidgetPatch): void;
    duplicate(): void;
    hide(): void;
    archive(): void;
    remove(): void;
  };
  function WidgetShell(props: {
    widget: Widget;
    settings: DashboardSettings;
    editMode: boolean;
    actions: WidgetShellActions;
    children: ReactNode;
  }): JSX.Element;
  ```

  Root carries `data-slot="widget"` (the grid stylesheet targets it).

- [ ] **Step 1: Write the failing tests**

- Title shows when `settings.showWidgetTitles`; double-click (or the rename item) opens an input labelled "Widget title"; Enter commits a trimmed, changed title through `update({ title })`; Escape cancels; an empty title does not commit.
- The collapse button is named "Collapse widget"/"Expand widget" and calls `update({ collapsed })`; collapsed hides `children`.
- The settings popover (button "Widget settings") offers the three highlights as a radio group ("Accent highlight", "Neutral highlight", "No highlight") and Duplicate, Hide, Archive, Remove; each calls its action.
- `editMode` false hides the settings button.

- [ ] **Step 2: Run to see them fail**, **Step 3: Implement** from `widget-shell.tsx` in the prototype with the installed `Popover`, `Button` variants and `ToggleGroup`; highlight bar `bg-primary` (accent), `bg-muted-foreground` (neutral), none; card radius from `settings.cardRadius` mapped to `rounded-sm` (4), `rounded-md` (8), `rounded-lg` (12), `rounded-xl` (16).

- [ ] **Step 4: Stories**: view, edit, collapsed, each highlight, untitled. **Step 5: Run tests and checks.** **Step 6: Commit** `git commit -m "feat: add the widget shell"`

---

### Task 8: Grid, canvas, breakpoint toolbar, empty state and stylesheet

**Files:**

- Create in `src/frontend/components/`: `dashboard-grid/`, `dashboard-canvas/`, `breakpoint-toolbar/`, `dashboard-empty-state/`, `connected-widget/` (binds a widget to the store: shell actions and body actions); each with story, test, `index.ts`
- Modify: `src/styles.css`

**Interfaces:**

- Consumes: store (Task 3), widgets (Tasks 6–7), `DEVICE_FRAME_WIDTH` (Task 2), `gridLayoutFor`, `layoutsEqual`, `columnsFor`, `GRID`, `minGridWidth`.
- Produces: `DashboardGrid()`, `DashboardCanvas()`, `BreakpointToolbar()`, `DashboardEmptyState()`, `ConnectedWidget({ widgetId })`, all reading the store through `useDashboardStore`.

- [ ] **Step 1: Write the failing tests** (rendered inside `DashboardStoreProvider` seeded from `createPrototypeWorkspace`)

- Grid renders one `[data-slot="widget"]` per active widget; none → `DashboardEmptyState`.
- Grid: calling its `onLayoutChange` with the layout it was given leaves the store's `composition` reference unchanged; with a moved item, only the shown breakpoint's layout changes (assert `lg` and `sm` references unchanged when the store's breakpoint is `md`). Expose the handler for the test through a `handleLayoutChange(store, bp, given, reported)` function exported from the grid folder and covered directly.
- Canvas: at `md` with a measured width above `834 + 80`, shows the label "Tablet · 834px"; at `lg` no frame. (Stub the width hook.)
- Toolbar: a group named "Layout breakpoint" with "Desktop layout", "Tablet layout", "Mobile layout"; choosing one calls `setBreakpoint`.
- `ConnectedWidget`: Hide from the shell removes it from the grid; toggling a task updates the store's records.

- [ ] **Step 2: Run to see them fail**

- [ ] **Step 3: Implement** from `dashboard-grid.tsx` and `dashboard-canvas.tsx`: `ReactGridLayout` with `useContainerWidth({ measureBeforeMount: true })`, `gridConfig { cols, rowHeight: GRID.rowHeight, margin: [GRID.margin, GRID.margin], containerPadding: [0, 0] }`, drag and resize enabled only in edit mode, the drag-cancel selector `"button, input, textarea, select, a, label, [role='checkbox'], [data-no-drag]"`, the `se` resize handle as a plain `<span>` (react-draggable must receive the DOM element). Grid key `${breakpoint}` so it remounts per breakpoint. The device frame's width is the one inline style, `style={{ maxWidth: frameWidth }}`.

`src/styles.css`: `@import 'react-grid-layout/css/styles.css';` then the prototype's skin from `dashboard-grid.css`, rewritten with existing variables: placeholder `background: var(--muted)`, `outline: 1px dashed var(--ring)`, `border-radius: var(--radius-md)`; drag and resize shadow `@apply shadow-md;` (the theme defines no shadow tokens; `@apply` works because hosts import this file into their Tailwind entry); handle colour `var(--muted-foreground)`; the reduced-motion block.

- [ ] **Step 4: Stories**: grid in view and edit mode, each breakpoint in the canvas, empty dashboard.
- [ ] **Step 5: Run tests and checks.** Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat: add the dashboard grid and canvas"`

---

### Task 9: Widgets panel

**Files:**

- Create: `src/frontend/components/widgets-panel/{widgets-panel.tsx,widgets-panel.stories.tsx,widgets-panel.test.tsx,index.ts}`

**Interfaces:**

- Produces: `WidgetsPanel()` reading the store.

- [ ] **Step 1: Write the failing tests**

- A heading "Add to dashboard" and one button per `WIDGET_CATALOG` entry, in order, named by its label; clicking "Task list" adds a `tasks` widget.
- "Hidden" and "Archived" sections list those widgets by title with "Restore"; restoring returns it to the grid.
- Archived widgets also offer "Remove", which opens an `AlertDialog` ("Remove this widget?", description that its record stays); confirming removes it, cancelling does not.
- Empty hidden or archived sections are not rendered.

- [ ] **Step 2: Run to see them fail**, **Step 3: Implement** from the prototype's `widgets-panel.tsx` with the installed `Button` and `AlertDialog`.
- [ ] **Step 4: Stories**: default, with hidden and archived widgets. **Step 5: Run tests and checks.** **Step 6: Commit** `git commit -m "feat: add the widgets panel"`

---

### Task 10: Workspace, skeleton and Storybook wiring

**Files:**

- Create: `src/frontend/components/dashboard-workspace/{dashboard-workspace.tsx,dashboard-workspace-skeleton.tsx,dashboard-workspace.stories.tsx,dashboard-workspace.test.tsx,index.ts}`
- Modify: `src/frontend/index.ts`, `apps/storybook/.storybook/main.ts` (add `'../../../packages/features/dashboards/src/**/*.stories.@(ts|tsx)'`), `apps/storybook/styles/globals.css` (add `@import '@synapcity/features-dashboards/styles.css';` after the UI import, and `@source '../../../packages/features/dashboards/src/';`), `apps/storybook/package.json` (devDependency `@synapcity/features-dashboards: workspace:*`)

**Interfaces:**

- Consumes: everything above.
- Produces (exported from `./frontend`): `DashboardWorkspace(props: { dashboardId: string; ownerId: string; storage: DashboardStorage; now?: () => number; breakpoint?: Breakpoint })`, `DashboardWorkspaceSkeleton()`, `browserDashboardStorage`.

- [ ] **Step 1: Write the failing tests** (with `memoryDashboardStorage`)

- Shows the skeleton (`aria-busy="true"`, "Loading dashboard…") until `load` resolves, then the canvas.
- Nothing saved → the empty state and the palette; saved data → its widgets.
- Changing the layout at `md`, waiting 400 ms (fake timers), unmounting and mounting a new workspace on the same storage shows the changed `md` layout and the original `lg` and `sm` layouts (assert through the store via `onStore` or the grid's rendered `data-grid` attributes).
- The edit toggle is a button "Edit layout" with `aria-pressed`.
- The initial breakpoint is `resolveBreakpoint(window.innerWidth)` unless the `breakpoint` prop is given.

- [ ] **Step 2: Run to see them fail**

- [ ] **Step 3: Implement**: load in an effect, then `DashboardStoreProvider` with `onStore={(s) => connectSaves(s, storage, dashboardId)}` and its disconnect on unmount; header row with the dashboard toolbar (edit toggle, `BreakpointToolbar`), `DashboardCanvas` beside `WidgetsPanel` (panel shown in edit mode; a `TooltipProvider` at the root). Skeleton uses the installed `Skeleton`.

- [ ] **Step 4: Stories** (in-memory storage seeded from `createPrototypeWorkspace`): seeded in view and in edit mode, empty dashboard, and live data where a `useEffect` calls `simulateTick` every 1500 ms against the story's store.

- [ ] **Step 5: Run the full checks**

Run: `pnpm format:check && pnpm turbo run lint check-types && pnpm deps && pnpm boundaries && pnpm test:coverage && pnpm test:storybook && pnpm build`
Expected: PASS. Then open Storybook (`pnpm --filter storybook dev`), drag and resize a widget at each breakpoint in edit mode, and report what was checked by hand.

- [ ] **Step 6: Commit** `git commit -m "feat: add the dashboard workspace and its stories"`

---

## After the tasks

Open PR 1 with the repository template. Title: `feat: add the dashboard canvas package`. PR 2 (route, record read, client host, e2e) gets its own plan from section 4.6 of the spec.
