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
    saveComposition: vi.fn<DashboardStorage['saveComposition']>(async () => {}),
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

  it('saves once, 400 ms after the last of several changes', async () => {
    const { store, storage } = setup();
    store.getState().addWidget('stat');
    vi.advanceTimersByTime(300);
    store.getState().addWidget('notes');
    vi.advanceTimersByTime(399);
    expect(storage.saveComposition).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    expect(storage.saveComposition).toHaveBeenCalledWith(
      'dash-1',
      store.getState().composition,
      0,
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

  it('saves at once when the tab is hidden, and does not rely on pagehide', async () => {
    const { store, storage, win, doc } = setup();
    store.getState().addWidget('stat');
    win.dispatchEvent(new Event('pagehide'));
    await vi.advanceTimersByTimeAsync(0);
    expect(storage.saveComposition).not.toHaveBeenCalled();
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
  });

  it('flushes on disconnect and stops listening', async () => {
    const { store, storage, win, disconnect } = setup();
    store.getState().addWidget('stat');
    disconnect();
    await Promise.resolve();
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
    store.getState().addWidget('notes');
    win.dispatchEvent(new Event('beforeunload', { cancelable: true }));
    vi.advanceTimersByTime(1000);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
  });

  it('saves records before the composition, so a widget is never saved without its record', async () => {
    const { store, storage } = setup();
    const order: string[] = [];
    storage.saveRecords.mockImplementation(
      async () => void order.push('records'),
    );
    storage.saveComposition.mockImplementation(
      async () => void order.push('composition'),
    );
    store.getState().addWidget('stat');
    await vi.advanceTimersByTimeAsync(400);
    expect(order).toEqual(['records', 'composition']);
  });

  it('keeps failed writes dirty and retries them once without another edit', async () => {
    const { store, storage } = setup();
    storage.saveRecords.mockRejectedValueOnce(new Error('quota exceeded'));
    const report = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.getState().addWidget('stat');
    await vi.advanceTimersByTimeAsync(400);

    expect(storage.saveRecords).toHaveBeenCalledTimes(1);
    expect(storage.saveComposition).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith(
      'Saving the dashboard failed.',
      expect.any(Error),
    );

    await vi.advanceTimersByTimeAsync(400);
    expect(storage.saveRecords).toHaveBeenCalledTimes(2);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);
  });

  it('retries a write that fails during disconnect', async () => {
    const { store, storage, disconnect } = setup();
    storage.saveComposition.mockRejectedValueOnce(
      new Error('temporary failure'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    store.getState().addWidget('notes');

    disconnect();
    await vi.advanceTimersByTimeAsync(0);
    expect(storage.saveComposition).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(400);
    expect(storage.saveComposition).toHaveBeenCalledTimes(2);
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

  describe('save status', () => {
    it('is saved until a change, unsaved while it waits, saving, then saved only after the storage confirms', async () => {
      const { store, storage } = setup();
      let confirm = () => {};
      storage.saveComposition.mockImplementation(
        () =>
          new Promise((resolve) => {
            confirm = () => resolve({ ok: true, revision: 1 });
          }),
      );
      expect(store.getState().saveStatus).toBe('saved');

      store.getState().addWidget('stat');
      expect(store.getState().saveStatus).toBe('unsaved');

      await vi.advanceTimersByTimeAsync(400);
      expect(store.getState().saveStatus).toBe('saving');

      confirm();
      await vi.advanceTimersByTimeAsync(0);
      expect(store.getState().saveStatus).toBe('saved');
    });

    it('bases each save on the revision the last one returned', async () => {
      const { store, storage } = setup();
      storage.saveComposition
        .mockResolvedValueOnce({ ok: true, revision: 5 })
        .mockResolvedValueOnce({ ok: true, revision: 6 });
      store.getState().addWidget('stat');
      await vi.advanceTimersByTimeAsync(400);
      store.getState().addWidget('notes');
      await vi.advanceTimersByTimeAsync(400);
      expect(storage.saveComposition.mock.calls.map((call) => call[2])).toEqual(
        [0, 5],
      );
    });

    it('starts from the revision it was given', async () => {
      const store = createDashboardStore({
        composition: createComposition(),
        records: emptyRecords(),
        ownerId: '11111111-1111-4111-8111-111111111111',
        breakpoint: 'lg',
      });
      const saveComposition = vi.fn(async () => ({ ok: true, revision: 8 }));
      connectSaves(
        store,
        { load: vi.fn(), saveComposition, saveRecords: vi.fn() } as never,
        'dash-1',
        { baseRevision: 7 },
      );
      store.getState().addWidget('stat');
      await vi.advanceTimersByTimeAsync(400);
      expect(saveComposition).toHaveBeenCalledWith(
        'dash-1',
        expect.anything(),
        7,
      );
    });

    it('retries a failure once, then reports it as failed with the host message, and Retry asks again', async () => {
      const { store, storage } = setup();
      storage.saveComposition.mockResolvedValue({
        ok: false,
        reason: 'failed',
        message: 'Sign in again to save your changes.',
      });
      store.getState().addWidget('stat');

      await vi.advanceTimersByTimeAsync(400);
      expect(store.getState().saveStatus).toBe('unsaved');
      await vi.advanceTimersByTimeAsync(400);
      expect(storage.saveComposition).toHaveBeenCalledTimes(2);
      expect(store.getState().saveStatus).toBe('failed');
      expect(store.getState().saveMessage).toBe(
        'Sign in again to save your changes.',
      );
      await vi.advanceTimersByTimeAsync(5000);
      expect(storage.saveComposition).toHaveBeenCalledTimes(2);

      storage.saveComposition.mockResolvedValue({
        ok: true,
        revision: 1,
      });
      store.getState().requestSave();
      await vi.advanceTimersByTimeAsync(0);
      expect(storage.saveComposition).toHaveBeenCalledTimes(3);
      expect(store.getState().saveStatus).toBe('saved');
    });

    it('treats a rejection as a failure', async () => {
      const { store, storage } = setup();
      storage.saveComposition.mockRejectedValue(new Error('offline'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      store.getState().addWidget('stat');
      await vi.advanceTimersByTimeAsync(800);
      expect(store.getState().saveStatus).toBe('failed');
    });

    it('stops saving after a conflict, so newer work is never overwritten', async () => {
      const { store, storage } = setup();
      storage.saveComposition.mockResolvedValue({
        ok: false,
        reason: 'conflict',
      });
      store.getState().addWidget('stat');
      await vi.advanceTimersByTimeAsync(400);
      expect(store.getState().saveStatus).toBe('conflict');

      store.getState().addWidget('notes');
      store.getState().requestSave();
      await vi.advanceTimersByTimeAsync(5000);
      expect(storage.saveComposition).toHaveBeenCalledTimes(1);
      expect(store.getState().saveStatus).toBe('conflict');
    });

    it('saves a change made while a save is in flight afterwards', async () => {
      const { store, storage } = setup();
      let confirm = () => {};
      storage.saveComposition.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            confirm = () => resolve({ ok: true, revision: 1 });
          }),
      );
      storage.saveComposition.mockResolvedValue({
        ok: true,
        revision: 2,
      });
      store.getState().addWidget('stat');
      await vi.advanceTimersByTimeAsync(400);
      store.getState().addWidget('notes');
      confirm();
      await vi.advanceTimersByTimeAsync(0);
      expect(store.getState().saveStatus).toBe('unsaved');
      await vi.advanceTimersByTimeAsync(400);
      expect(storage.saveComposition).toHaveBeenCalledTimes(2);
      expect(store.getState().saveStatus).toBe('saved');
    });
  });

  describe('leaving the page', () => {
    it('asks before unloading while a change is unsaved, and not otherwise', async () => {
      const { store, win } = setup();
      const ask = () => {
        const event = new Event('beforeunload', { cancelable: true });
        win.dispatchEvent(event);
        return event.defaultPrevented;
      };
      expect(ask()).toBe(false);
      store.getState().addWidget('stat');
      expect(ask()).toBe(true);
      await vi.advanceTimersByTimeAsync(400);
      expect(ask()).toBe(false);
    });
  });
});
