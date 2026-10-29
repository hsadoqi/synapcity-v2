import {
  createComposition,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import { createDashboardStore, type DashboardStoreInit } from './index';

const NOW = Date.parse('2026-10-24T09:00:00Z');
const init = (
  composition: DashboardComposition = createComposition(),
): DashboardStoreInit => ({
  composition,
  records: emptyRecords(),
  ownerId: '11111111-1111-4111-8111-111111111111',
  breakpoint: 'lg',
  now: () => NOW,
});

describe('createDashboardStore', () => {
  it('adds a widget and its records in one update', () => {
    const store = createDashboardStore(init());
    let updates = 0;
    store.subscribe(() => updates++);
    store.getState().addWidget('tasks');
    const { composition, records } = store.getState();
    expect(updates).toBe(1);
    expect(composition.widgets).toHaveLength(1);
    expect(Object.keys(records.project)).toHaveLength(1);
    expect(Object.keys(records.task)).toHaveLength(1);
  });

  it('changes only the reported breakpoint when the layout changes', () => {
    const store = createDashboardStore(init());
    store.getState().addWidget('stat');
    const before = store.getState().composition.layouts;
    const id = store.getState().composition.widgets[0]!.id;
    store
      .getState()
      .applyLayoutChange('md', [{ i: id, x: 1, y: 2, w: 1, h: 3 }]);
    const after = store.getState().composition.layouts;
    expect(after.md).toEqual([{ i: id, x: 1, y: 2, w: 1, h: 3 }]);
    expect(after.lg).toBe(before.lg);
    expect(after.sm).toBe(before.sm);
  });

  it('records an activity at the current time when a task is completed', () => {
    const store = createDashboardStore(init());
    store.getState().addWidget('tasks');
    const taskId = Object.keys(store.getState().records.task)[0]!;
    store.getState().toggleTask(taskId);
    const [activity] = Object.values(store.getState().records.activity);
    expect(activity?.occurredAt).toBe(new Date(NOW).toISOString());
  });

  it('hides a widget out of the layout and restores it', () => {
    const store = createDashboardStore(init());
    store.getState().addWidget('notes');
    const id = store.getState().composition.widgets[0]!.id;
    store.getState().setWidgetStatus(id, 'hidden');
    expect(
      store.getState().composition.layouts.lg.some((l) => l.i === id),
    ).toBe(false);
    store.getState().setWidgetStatus(id, 'active');
    expect(
      store.getState().composition.layouts.lg.some((l) => l.i === id),
    ).toBe(true);
  });

  it('clears keyboard selection when its widget is hidden or removed', () => {
    const store = createDashboardStore(init());
    store.getState().addWidget('notes');
    const id = store.getState().composition.widgets[0]!.id;

    store.getState().selectWidget(id);
    store.getState().setWidgetStatus(id, 'hidden');
    expect(store.getState().selectedWidgetId).toBeNull();

    store.getState().setWidgetStatus(id, 'active');
    store.getState().selectWidget(id);
    store.getState().removeWidget(id);
    expect(store.getState().selectedWidgetId).toBeNull();
  });

  it('leaves the state untouched for a widget that does not exist', () => {
    const store = createDashboardStore(init());
    const before = store.getState();
    store.getState().updateWidget('missing', { title: 'x' });
    store.getState().removeWidget('missing');
    store.getState().toggleTask('missing');
    expect(store.getState().composition).toBe(before.composition);
    expect(store.getState().records).toBe(before.records);
  });

  it('keeps view state apart from the saved state', () => {
    const store = createDashboardStore(init());
    const { composition, records } = store.getState();
    store.getState().setBreakpoint('sm');
    store.getState().toggleEditMode();
    expect(store.getState()).toMatchObject({
      breakpoint: 'sm',
      editMode: true,
    });
    expect(store.getState().composition).toBe(composition);
    expect(store.getState().records).toBe(records);
  });

  it('gives each store its own state', () => {
    const shared = init();
    const a = createDashboardStore(shared);
    const b = createDashboardStore(shared);
    a.getState().addWidget('stat');
    expect(b.getState().composition.widgets).toHaveLength(0);
  });

  it('adds an event in one update, and ignores a blank name', () => {
    const store = createDashboardStore(init());
    let updates = 0;
    store.subscribe(() => updates++);
    store.getState().addEvent('Standup', '2026-10-24T13:00:00.000Z');
    expect(updates).toBe(1);
    const [event] = Object.values(store.getState().records.event);
    expect(event).toMatchObject({
      name: 'Standup',
      startsAt: '2026-10-24T13:00:00.000Z',
    });

    store.getState().addEvent('   ', '2026-10-24T14:00:00.000Z');
    expect(updates).toBe(1);
    expect(Object.keys(store.getState().records.event)).toHaveLength(1);
  });

  it('read-only, ignores every change and keeps edit mode off', () => {
    const store = createDashboardStore({ ...init(), readOnly: true });
    let updates = 0;
    store.subscribe(() => updates++);
    store.getState().addWidget('tasks');
    store.getState().updateSettings({ columns: 3 });
    store.getState().toggleEditMode();
    expect(updates).toBe(0);
    expect(store.getState().composition.widgets).toHaveLength(0);
    expect(store.getState().editMode).toBe(false);
    expect(store.getState().readOnly).toBe(true);
  });

  describe('removal and Undo', () => {
    function withWidgets() {
      const store = createDashboardStore(init());
      for (const type of ['pinned', 'spaces', 'last-opened'] as const) {
        store.getState().addWidget(type);
      }
      return store;
    }

    it('remembers the removed widget with the one to focus next, and Undo puts it back where it was', () => {
      const store = withWidgets();
      const before = store.getState().composition;
      const [first, second] = before.widgets;

      store.getState().removeWidget(first!.id);

      expect(store.getState().composition.widgets).toHaveLength(2);
      expect(store.getState().removed).toMatchObject({
        widgetId: first!.id,
        title: 'Pinned',
        focusAfter: second!.id,
      });
      expect(store.getState().announcement).toBe('Pinned removed');

      store.getState().undoRemove();

      expect(store.getState().composition.widgets).toEqual(before.widgets);
      // Layout entries are keyed by widget id; their array order carries nothing.
      const byId = (items: { i: string }[]) =>
        [...items].sort((a, b) => a.i.localeCompare(b.i));
      for (const bp of ['lg', 'md', 'sm'] as const) {
        expect(byId(store.getState().composition.layouts[bp])).toEqual(
          byId(before.layouts[bp]),
        );
      }
      expect(store.getState().removed).toBeNull();
      expect(store.getState().announcement).toBe('Pinned restored');
    });

    it('focuses the previous widget when the last one is removed, and none when it was the only one', () => {
      const store = withWidgets();
      const last = store.getState().composition.widgets[2]!;
      store.getState().removeWidget(last.id);
      expect(store.getState().removed?.focusAfter).toBe(
        store.getState().composition.widgets[1]!.id,
      );

      const single = createDashboardStore(init());
      single.getState().addWidget('pinned');
      single
        .getState()
        .removeWidget(single.getState().composition.widgets[0]!.id);
      expect(single.getState().removed?.focusAfter).toBeNull();
    });

    it('keeps Undo through the layout the grid reports after a removal, and restores into what is there now', () => {
      const store = withWidgets();
      const [first, second, third] = store.getState().composition.widgets;
      store.getState().removeWidget(first!.id);
      const remaining = store.getState().composition.layouts.lg;

      // The grid compacts what is left and reports it.
      store.getState().applyLayoutChange(
        'lg',
        remaining.map((item, index) => ({ ...item, x: 0, y: index * 10 })),
      );
      expect(store.getState().removed).not.toBeNull();

      store.getState().undoRemove();

      const { widgets, layouts } = store.getState().composition;
      expect(widgets.map((w) => w.id)).toEqual([
        first!.id,
        second!.id,
        third!.id,
      ]);
      expect(layouts.lg.find((l) => l.i === second!.id)?.y).toBe(0);
      expect(layouts.lg.find((l) => l.i === first!.id)).toBeDefined();
    });

    it('drops Undo with the next change, or when cleared', () => {
      const store = withWidgets();
      store
        .getState()
        .removeWidget(store.getState().composition.widgets[0]!.id);
      store.getState().updateSettings({ columns: 2 });
      expect(store.getState().removed).toBeNull();

      store
        .getState()
        .removeWidget(store.getState().composition.widgets[0]!.id);
      store.getState().clearRemoved();
      store.getState().undoRemove();
      expect(store.getState().composition.widgets).toHaveLength(1);
    });

    it('ignores removal and Undo when read-only', () => {
      const store = createDashboardStore({ ...init(), readOnly: true });
      store.getState().removeWidget('anything');
      store.getState().undoRemove();
      expect(store.getState().removed).toBeNull();
    });
  });

  describe('announcements', () => {
    it('announces where a widget moved and how big it became', () => {
      const store = createDashboardStore(init());
      store.getState().addWidget('pinned');
      const id = store.getState().composition.widgets[0]!.id;
      expect(store.getState().announcement).toBe('Pinned added');

      store.getState().nudgeWidget(id, { dx: 1, dy: 0, dw: 0, dh: 0 });
      expect(store.getState().announcement).toBe(
        'Pinned moved to column 2, row 1',
      );

      store.getState().nudgeWidget(id, { dx: 0, dy: 0, dw: 0, dh: 1 });
      expect(store.getState().announcement).toBe(
        'Pinned is now 1 wide, 5 tall',
      );
    });

    it('leaves the announcement alone when a nudge changes nothing', () => {
      const store = createDashboardStore(init());
      store.getState().addWidget('pinned');
      const id = store.getState().composition.widgets[0]!.id;
      store.getState().nudgeWidget(id, { dx: -1, dy: 0, dw: 0, dh: 0 });
      expect(store.getState().announcement).toBe('Pinned added');
    });

    it('reorders by reading order and announces the new position', () => {
      const store = createDashboardStore(init());
      for (const type of ['pinned', 'spaces', 'last-opened'] as const) {
        store.getState().addWidget(type);
      }
      const third = store.getState().composition.widgets[2]!;

      store.getState().moveWidgetInOrder(third.id, -1);

      expect(store.getState().announcement).toBe(
        'Last opened moved earlier, position 2 of 3',
      );
      const sorted = [...store.getState().composition.layouts.lg].sort(
        (a, b) => a.y - b.y || a.x - b.x,
      );
      expect(sorted[1]!.i).toBe(third.id);
    });
  });

  describe('save state', () => {
    it('starts saved and records status changes once', () => {
      const store = createDashboardStore(init());
      let updates = 0;
      store.subscribe(() => updates++);
      expect(store.getState().saveStatus).toBe('saved');

      store.getState().setSaveStatus('failed', 'Sign in again.');
      store.getState().setSaveStatus('failed', 'Sign in again.');

      expect(updates).toBe(1);
      expect(store.getState()).toMatchObject({
        saveStatus: 'failed',
        saveMessage: 'Sign in again.',
      });
    });

    it('counts save requests', () => {
      const store = createDashboardStore(init());
      store.getState().requestSave();
      store.getState().requestSave();
      expect(store.getState().saveRequests).toBe(2);
    });
  });
});
