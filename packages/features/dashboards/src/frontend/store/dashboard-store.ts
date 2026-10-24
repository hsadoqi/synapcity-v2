import {
  addWidget,
  applyLayoutChange,
  createWidget,
  duplicateWidget,
  gridLayoutFor,
  removeWidget,
  setWidgetStatus,
  updateSettings,
  updateWidget,
  type DashboardComposition,
  type DashboardSettings,
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

type DashboardState = {
  composition: DashboardComposition;
  records: PrototypeRecords;
  /** Which saved layout is shown and edited. View state, not saved. */
  breakpoint: Breakpoint;
  /** Whether widgets can be dragged, resized and configured. View state, not saved. */
  editMode: boolean;
  /** The widget selected for keyboard move or resize. View state, not saved. */
  selectedWidgetId: string | null;
};

type GoalPatch = { current?: number; target?: number };

type DashboardActions = {
  setBreakpoint(bp: Breakpoint): void;
  toggleEditMode(): void;
  selectWidget(id: string | null): void;
  nudgeWidget(id: string, delta: LayoutDelta): void;
  addWidget(type: WidgetType): void;
  updateWidget(id: string, patch: WidgetPatch): void;
  duplicateWidget(id: string): void;
  setWidgetStatus(id: string, status: WidgetStatus): void;
  removeWidget(id: string): void;
  applyLayoutChange(bp: Breakpoint, items: LayoutItem[]): void;
  updateSettings(patch: Partial<DashboardSettings>): void;
  toggleTask(taskId: string): void;
  addTask(projectId: string, name: string): void;
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
  /** The clock, for tests and stories; defaults to `Date.now`. */
  now?: () => number;
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
  now = Date.now,
}: DashboardStoreInit): StoreApi<DashboardStore> {
  return createStore<DashboardStore>()((set, get) => {
    const context = (): RecordContext => ({ ownerId, now: now() });
    const compose = (fn: (c: DashboardComposition) => DashboardComposition) => {
      const next = fn(get().composition);
      if (next !== get().composition) set({ composition: next });
    };
    const record = (fn: (r: PrototypeRecords) => PrototypeRecords) => {
      const next = fn(get().records);
      if (next !== get().records) set({ records: next });
    };

    return {
      composition,
      records,
      breakpoint,
      editMode: false,
      selectedWidgetId: null,
      setBreakpoint: (bp) => set({ breakpoint: bp }),
      toggleEditMode: () =>
        set((s) => ({
          editMode: !s.editMode,
          selectedWidgetId: null,
        })),
      selectWidget: (id) => set({ selectedWidgetId: id }),
      nudgeWidget: (id, delta) =>
        compose((c) => {
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
        }),
      addWidget: (type) => {
        const created = createWidget(type, get().records, context());
        set({
          records: created.records,
          composition: addWidget(get().composition, created.widget),
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
        compose((c) => removeWidget(c, id));
        if (get().selectedWidgetId === id) set({ selectedWidgetId: null });
      },
      applyLayoutChange: (bp, items) =>
        compose((c) => applyLayoutChange(c, bp, items)),
      updateSettings: (patch) => compose((c) => updateSettings(c, patch)),
      toggleTask: (taskId) => record((r) => toggleTask(r, taskId, context())),
      addTask: (projectId, name) =>
        record((r) => addTask(r, projectId, name, context())),
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
