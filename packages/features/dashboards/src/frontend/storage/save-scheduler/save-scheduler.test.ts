import { createComposition } from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardStorage } from '../../../contracts';
import {
  SEED_OWNER,
  memoryDashboardStorage,
  seededWorkspace,
} from '../../../testing';
import { createDashboardStore } from '../../store';
import { connectSaves } from './index';

function setup() {
  const store = createDashboardStore({
    composition: createComposition(),
    records: emptyRecords(),
    ownerId: '11111111-1111-4111-8111-111111111111',
    breakpoint: 'lg',
  });
  const storage = {
    load: vi.fn(),
    saveComposition: vi.fn(async () => {}),
    saveRecords: vi.fn(async () => {}),
  } satisfies DashboardStorage;
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible' as DocumentVisibilityState,
  });
  const disconnect = connectSaves(store, storage, 'dash-1', {
    target: { window: win, document: doc },
  });
  return { store, storage, win, doc, disconnect };
}

describe('connectSaves', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves once, 400 ms after the last of several changes', () => {
    const { store, storage } = setup();
    store.getState().addWidget('stat');
    vi.advanceTimersByTime(300);
    store.getState().addWidget('notes');
    vi.advanceTimersByTime(399);
    expect(storage.saveComposition).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    expect(storage.saveComposition).toHaveBeenCalledWith(
      'dash-1',
      store.getState().composition,
    );
    expect(storage.saveRecords).toHaveBeenCalledTimes(1);
  });

  it('does not save view state', () => {
    const { store, storage } = setup();
    store.getState().setBreakpoint('sm');
    store.getState().toggleEditMode();
    vi.advanceTimersByTime(1000);
    expect(storage.saveComposition).not.toHaveBeenCalled();
    expect(storage.saveRecords).not.toHaveBeenCalled();
  });

  it('saves only what changed', () => {
    const { store, storage } = setup();
    store.getState().updateSettings({ columns: 2 });
    vi.advanceTimersByTime(400);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    expect(storage.saveRecords).not.toHaveBeenCalled();
  });

  it('saves at once when the page is hidden or closed', () => {
    const { store, storage, win, doc } = setup();
    store.getState().addWidget('stat');
    win.dispatchEvent(new Event('pagehide'));
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    store.getState().addWidget('notes');
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(storage.saveComposition).toHaveBeenCalledTimes(2);
  });

  it('flushes on disconnect and stops listening', () => {
    const { store, storage, win, disconnect } = setup();
    store.getState().addWidget('stat');
    disconnect();
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    store.getState().addWidget('notes');
    win.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(1000);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
  });

  it('saves records before the composition, so a widget is never saved without its record', () => {
    const { store, storage } = setup();
    const order: string[] = [];
    storage.saveRecords.mockImplementation(
      async () => void order.push('records'),
    );
    storage.saveComposition.mockImplementation(
      async () => void order.push('composition'),
    );
    store.getState().addWidget('stat');
    vi.advanceTimersByTime(400);
    expect(order).toEqual(['records', 'composition']);
  });

  it('saves an edit at one breakpoint and loads the others unchanged', async () => {
    const { composition, records } = seededWorkspace();
    const storage = memoryDashboardStorage(SEED_OWNER);
    const store = createDashboardStore({
      composition,
      records,
      ownerId: SEED_OWNER,
      breakpoint: 'md',
    });
    connectSaves(store, storage, 'dash-1');
    const [first, ...rest] = composition.layouts.md;
    store
      .getState()
      .applyLayoutChange('md', [{ ...first!, x: 1, y: 40 }, ...rest]);
    vi.advanceTimersByTime(400);
    const saved = (await storage.load('dash-1')).composition!;
    expect(saved.layouts.md[0]).toMatchObject({ x: 1, y: 40 });
    expect(saved.layouts.lg).toEqual(composition.layouts.lg);
    expect(saved.layouts.sm).toEqual(composition.layouts.sm);
  });
});
