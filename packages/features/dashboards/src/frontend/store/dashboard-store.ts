import {
  addWidget,
  applyLayoutChange,
  createWidget,
  duplicateWidget,
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
import type { Breakpoint, LayoutItem } from '@synapcity/domain-grids';
import {
  toggleHabitDay,
  toggleTask,
  updateNoteBody,
  type PrototypeRecords,
  type RecordContext,
} from '@synapcity/domain-prototypes';
import { createStore, type StoreApi } from 'zustand/vanilla';

export type DashboardState = {
  composition: DashboardComposition;
  records: PrototypeRecords;
  /** Which saved layout is shown and edited. View state, not saved. */
  breakpoint: Breakpoint;
  /** Whether widgets can be dragged, resized and configured. View state, not saved. */
  editMode: boolean;
};

export type DashboardActions = {
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
      setBreakpoint: (bp) => set({ breakpoint: bp }),
      toggleEditMode: () => set((s) => ({ editMode: !s.editMode })),
      addWidget: (type) => {
        const created = createWidget(type, get().records, context());
        set({
          records: created.records,
          composition: addWidget(get().composition, created.widget),
        });
      },
      updateWidget: (id, patch) => compose((c) => updateWidget(c, id, patch)),
      duplicateWidget: (id) => compose((c) => duplicateWidget(c, id)),
      setWidgetStatus: (id, status) =>
        compose((c) => setWidgetStatus(c, id, status)),
      removeWidget: (id) => compose((c) => removeWidget(c, id)),
      applyLayoutChange: (bp, items) =>
        compose((c) => applyLayoutChange(c, bp, items)),
      updateSettings: (patch) => compose((c) => updateSettings(c, patch)),
      toggleTask: (taskId) => record((r) => toggleTask(r, taskId, context())),
      toggleHabitDay: (habitId, day) =>
        record((r) => toggleHabitDay(r, habitId, day, now())),
      updateNoteBody: (noteId, body) =>
        record((r) => updateNoteBody(r, noteId, body, now())),
    };
  });
}
