import {
  addWidget,
  applyLayoutChange,
  createWidget,
  duplicateWidget,
  gridLayoutFor,
  moveWidgetInOrder,
  removeWidget,
  setWidgetStatus,
  updateSettings,
  updateWidget,
  type DashboardComposition,
  type DashboardSettings,
  type Widget,
  type WidgetPatch,
  type WidgetStatus,
  type WidgetType,
} from '@synapcity/domain-dashboards';
import {
  columnsFor,
  layoutsEqual,
  type Breakpoint,
  type LayoutItem,
} from '@synapcity/domain-grids';
import {
  addEvent,
  addTask,
  toggleHabitDay,
  toggleTask,
  updateGoal,
  updateMetricValue,
  updateNoteBody,
  type PrototypeRecords,
  type RecordContext,
} from '@synapcity/domain-prototypes';
import { createStore, type StoreApi } from 'zustand/vanilla';

import { nudgeLayoutItem, type LayoutDelta } from './keyboard-move';

/** Where the save stands (Slice 4). Shown, never saved. */
export type SaveStatus =
  /** Everything on screen is stored. */
  | 'saved'
  /** A change is waiting for the debounce. */
  | 'unsaved'
  | 'saving'
  /** The save failed (after one automatic retry); Retry asks again. */
  | 'failed'
  /** The stored composition moved on; nothing is saved until the page reloads. */
  | 'conflict';

/** The widget the last removal took out, kept so Undo can put it back. */
export type RemovedWidget = {
  widget: Widget;
  /** Where it sat among the widgets, so Undo puts it back in the same place. */
  index: number;
  /** Its placement at each breakpoint it had one. */
  placements: Partial<Record<Breakpoint, LayoutItem>>;
  widgetId: string;
  title: string;
  /** The widget to focus after removing: the next in reading order, else the previous. */
  focusAfter: string | null;
};

type DashboardState = {
  composition: DashboardComposition;
  records: PrototypeRecords;
  /** Which saved layout is shown and edited. View state, not saved. */
  breakpoint: Breakpoint;
  /** Set once the person picks a layout in the toolbar; the canvas width then stops choosing. */
  breakpointLocked: boolean;
  /** Whether widgets can be dragged, resized and configured. View state, not saved. */
  editMode: boolean;
  /**
   * Shown, never changed: edit mode stays off and every change to the
   * composition or records is ignored, so nothing looks saved that is not.
   */
  readOnly: boolean;
  /** The widget selected for keyboard move or resize. View state, not saved. */
  selectedWidgetId: string | null;
  saveStatus: SaveStatus;
  /** Why the save failed, when the host said. */
  saveMessage: string | null;
  /** Bumped by Retry; the save scheduler watches it. */
  saveRequests: number;
  /** What a screen reader hears after a move, resize, reorder, add or remove. */
  announcement: string;
  /** Set by a removal and cleared by the next change or by Undo. */
  removed: RemovedWidget | null;
};

type GoalPatch = { current?: number; target?: number };

type DashboardActions = {
  /** Follows the canvas width; ignored once the person has chosen a layout. */
  setBreakpoint(bp: Breakpoint): void;
  /** The person picked a layout to preview; it stays until reload. */
  chooseBreakpoint(bp: Breakpoint): void;
  toggleEditMode(): void;
  selectWidget(id: string | null): void;
  nudgeWidget(id: string, delta: LayoutDelta): void;
  addWidget(type: WidgetType): void;
  updateWidget(id: string, patch: WidgetPatch): void;
  duplicateWidget(id: string): void;
  setWidgetStatus(id: string, status: WidgetStatus): void;
  removeWidget(id: string): void;
  /** Puts back the widget the last removal took out. */
  undoRemove(): void;
  /** Forgets the removal, so Undo is no longer offered. */
  clearRemoved(): void;
  /** Moves a widget one place earlier or later in reading order. */
  moveWidgetInOrder(id: string, direction: -1 | 1): void;
  setSaveStatus(status: SaveStatus, message?: string | null): void;
  /** Asks the save scheduler to save again now (Retry). */
  requestSave(): void;
  applyLayoutChange(bp: Breakpoint, items: LayoutItem[]): void;
  updateSettings(patch: Partial<DashboardSettings>): void;
  toggleTask(taskId: string): void;
  addTask(projectId: string, name: string): void;
  addEvent(name: string, startsAt: string): void;
  toggleHabitDay(habitId: string, day: string): void;
  updateNoteBody(noteId: string, body: string): void;
  updateMetricValue(metricId: string, value: number): void;
  updateGoal(goalId: string, patch: GoalPatch): void;
};

export type DashboardStore = DashboardState & DashboardActions;

export type DashboardStoreInit = {
  composition: DashboardComposition;
  records: PrototypeRecords;
  ownerId: string;
  breakpoint: Breakpoint;
  /** Keep `breakpoint` whatever the canvas width is. @default false */
  breakpointLocked?: boolean;
  /** The clock, for tests and stories; defaults to `Date.now`. */
  now?: () => number;
  /** Show the dashboard without allowing changes. @default false */
  readOnly?: boolean;
};

/**
 * One canvas's state. Every change goes through a pure function from
 * `domain-dashboards` or `domain-prototypes`; a change that leaves the
 * composition and records as they were does not notify subscribers.
 */
export function createDashboardStore({
  composition,
  records,
  ownerId,
  breakpoint,
  breakpointLocked = false,
  now = Date.now,
  readOnly = false,
}: DashboardStoreInit): StoreApi<DashboardStore> {
  return createStore<DashboardStore>()((set, get) => {
    const context = (): RecordContext => ({ ownerId, now: now() });
    /**
     * Applies a pure change to the composition. A change that happens drops
     * Undo, and `extra` adds view state (an announcement) to the same update.
     */
    const compose = (
      fn: (c: DashboardComposition) => DashboardComposition,
      extra?: (next: DashboardComposition) => Partial<DashboardState>,
    ) => {
      if (readOnly) return;
      const next = fn(get().composition);
      if (next === get().composition) return;
      set({ composition: next, removed: null, ...extra?.(next) });
    };
    const titleOf = (c: DashboardComposition, id: string) =>
      c.widgets.find((w) => w.id === id)?.title ?? 'Widget';
    /** Active widgets at the current breakpoint, in reading order. */
    const readingOrder = (c: DashboardComposition) =>
      [...c.layouts[get().breakpoint]].sort((a, b) => a.y - b.y || a.x - b.x);
    const record = (fn: (r: PrototypeRecords) => PrototypeRecords) => {
      if (readOnly) return;
      const next = fn(get().records);
      if (next !== get().records) set({ records: next });
    };

    return {
      composition,
      records,
      breakpoint,
      editMode: false,
      readOnly,
      selectedWidgetId: null,
      saveStatus: 'saved',
      saveMessage: null,
      saveRequests: 0,
      announcement: '',
      removed: null,
      breakpointLocked,
      setBreakpoint: (bp) => {
        if (!get().breakpointLocked) set({ breakpoint: bp });
      },
      chooseBreakpoint: (bp) => set({ breakpoint: bp, breakpointLocked: true }),
      toggleEditMode: () => {
        if (readOnly) return;
        set((s) => ({ editMode: !s.editMode, selectedWidgetId: null }));
      },
      selectWidget: (id) => set({ selectedWidgetId: id }),
      nudgeWidget: (id, delta) =>
        compose(
          (c) => {
            const bp = get().breakpoint;
            const current = gridLayoutFor(c, bp);
            if (!current.some((item) => item.i === id)) return c;
            const cols = columnsFor(c.settings.columns, bp);
            const next = nudgeLayoutItem(current, id, delta, cols);
            const unchanged = layoutsEqual(
              next,
              current.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
            );
            return unchanged ? c : applyLayoutChange(c, bp, next);
          },
          (next) => {
            const placed = next.layouts[get().breakpoint].find(
              (item) => item.i === id,
            );
            const title = titleOf(next, id);
            const resized = delta.dw !== 0 || delta.dh !== 0;
            return {
              announcement: !placed
                ? ''
                : resized
                  ? `${title} is now ${placed.w} wide, ${placed.h} tall`
                  : `${title} moved to column ${placed.x + 1}, row ${placed.y + 1}`,
            };
          },
        ),
      addWidget: (type) => {
        if (readOnly) return;
        const created = createWidget(type, get().records, context());
        set({
          records: created.records,
          composition: addWidget(get().composition, created.widget),
          removed: null,
          announcement: `${created.widget.title} added`,
        });
      },
      updateWidget: (id, patch) => compose((c) => updateWidget(c, id, patch)),
      duplicateWidget: (id) => compose((c) => duplicateWidget(c, id)),
      setWidgetStatus: (id, status) => {
        compose((c) => setWidgetStatus(c, id, status));
        if (status !== 'active' && get().selectedWidgetId === id) {
          set({ selectedWidgetId: null });
        }
      },
      removeWidget: (id) => {
        const before = get().composition;
        if (readOnly || !before.widgets.some((w) => w.id === id)) return;
        const order = readingOrder(before);
        const at = order.findIndex((item) => item.i === id);
        const neighbour = order[at + 1] ?? order[at - 1];
        const title = titleOf(before, id);
        compose(
          (c) => removeWidget(c, id),
          () => ({
            announcement: `${title} removed`,
            removed: {
              widget: before.widgets.find((w) => w.id === id) as Widget,
              index: before.widgets.findIndex((w) => w.id === id),
              placements: Object.fromEntries(
                (['lg', 'md', 'sm'] as const).flatMap((bp) => {
                  const entry = before.layouts[bp].find((l) => l.i === id);
                  return entry ? [[bp, entry]] : [];
                }),
              ),
              widgetId: id,
              title,
              focusAfter: at >= 0 ? (neighbour?.i ?? null) : null,
            },
          }),
        );
        if (get().selectedWidgetId === id) set({ selectedWidgetId: null });
      },
      undoRemove: () => {
        const { removed } = get();
        if (readOnly || !removed) return;
        // Put back into the composition as it is now, not an older copy, so a
        // layout change made since (the grid compacts after a removal) stays.
        const c = get().composition;
        if (c.widgets.some((w) => w.id === removed.widgetId)) return;
        const widgets = [...c.widgets];
        widgets.splice(removed.index, 0, removed.widget);
        const withEntry = (bp: Breakpoint) => {
          const entry = removed.placements[bp];
          return entry ? [...c.layouts[bp], entry] : c.layouts[bp];
        };
        set({
          composition: {
            ...c,
            widgets,
            layouts: {
              lg: withEntry('lg'),
              md: withEntry('md'),
              sm: withEntry('sm'),
            },
          },
          removed: null,
          announcement: `${removed.title} restored`,
        });
      },
      clearRemoved: () => {
        if (get().removed) set({ removed: null });
      },
      moveWidgetInOrder: (id, direction) =>
        compose(
          (c) => moveWidgetInOrder(c, get().breakpoint, id, direction),
          (next) => {
            const order = readingOrder(next);
            const place = order.findIndex((item) => item.i === id) + 1;
            return {
              announcement: `${titleOf(next, id)} moved ${
                direction < 0 ? 'earlier' : 'later'
              }, position ${place} of ${order.length}`,
            };
          },
        ),
      setSaveStatus: (status, message = null) => {
        const s = get();
        if (s.saveStatus === status && s.saveMessage === message) return;
        set({ saveStatus: status, saveMessage: message });
      },
      requestSave: () => set((s) => ({ saveRequests: s.saveRequests + 1 })),
      // The grid reports a layout right after any widget set change (it
      // compacts); that must not take Undo away.
      applyLayoutChange: (bp, items) =>
        compose(
          (c) => applyLayoutChange(c, bp, items),
          () => ({ removed: get().removed }),
        ),
      updateSettings: (patch) => compose((c) => updateSettings(c, patch)),
      toggleTask: (taskId) => record((r) => toggleTask(r, taskId, context())),
      addTask: (projectId, name) =>
        record((r) => addTask(r, projectId, name, context())),
      addEvent: (name, startsAt) =>
        record((r) => addEvent(r, name, startsAt, context())),
      updateMetricValue: (metricId, value) =>
        record((r) => updateMetricValue(r, metricId, value, now())),
      updateGoal: (goalId, patch) =>
        record((r) => updateGoal(r, goalId, patch, now())),
      toggleHabitDay: (habitId, day) =>
        record((r) => toggleHabitDay(r, habitId, day, now())),
      updateNoteBody: (noteId, body) =>
        record((r) => updateNoteBody(r, noteId, body, now())),
    };
  });
}
