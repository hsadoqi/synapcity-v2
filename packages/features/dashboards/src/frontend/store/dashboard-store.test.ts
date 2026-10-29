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
});
