import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { createPersistedStore } from './persisted-store';

const schema = z.object({ n: z.number() });

describe('createPersistedStore', () => {
  it('falls back when storage is empty or corrupt', () => {
    const store = createPersistedStore({
      key: 't:corrupt',
      schema,
      fallback: { n: 0 },
    });
    expect(store.getSnapshot()).toEqual({ n: 0 });

    window.localStorage.setItem('t:bad', '{not json');
    const bad = createPersistedStore({
      key: 't:bad',
      schema,
      fallback: { n: 1 },
    });
    expect(bad.getSnapshot()).toEqual({ n: 1 });

    window.localStorage.setItem(
      't:shape',
      JSON.stringify({ v: 1, data: { n: 'x' } }),
    );
    const shape = createPersistedStore({
      key: 't:shape',
      schema,
      fallback: { n: 2 },
    });
    expect(shape.getSnapshot()).toEqual({ n: 2 });
  });

  it('ignores data from another version', () => {
    window.localStorage.setItem(
      't:ver',
      JSON.stringify({ v: 99, data: { n: 5 } }),
    );
    const store = createPersistedStore({
      key: 't:ver',
      schema,
      fallback: { n: 0 },
    });
    expect(store.getSnapshot()).toEqual({ n: 0 });
  });

  it('persists, notifies and accepts updater functions', () => {
    const store = createPersistedStore({
      key: 't:set',
      schema,
      fallback: { n: 0 },
    });
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.set({ n: 1 });
    store.set((c) => ({ n: c.n + 1 }));
    expect(store.getSnapshot()).toEqual({ n: 2 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(JSON.parse(window.localStorage.getItem('t:set')!)).toEqual({
      v: 1,
      data: { n: 2 },
    });
    off();
  });

  it('re-reads when another tab writes', () => {
    const store = createPersistedStore({
      key: 't:tab',
      schema,
      fallback: { n: 0 },
    });
    const listener = vi.fn();
    const off = store.subscribe(listener);
    store.getSnapshot();
    window.localStorage.setItem(
      't:tab',
      JSON.stringify({ v: 1, data: { n: 9 } }),
    );
    window.dispatchEvent(new StorageEvent('storage', { key: 't:tab' }));
    expect(listener).toHaveBeenCalled();
    expect(store.getSnapshot()).toEqual({ n: 9 });
    off();
  });
});

describe('createPersistedStore as used by components', () => {
  it('works when set is handed out on its own, as useStore does', () => {
    const store = createPersistedStore({
      key: 't:detached',
      schema,
      fallback: { n: 0 },
    });
    const { set } = store;
    set({ n: 3 });
    set((c) => ({ n: c.n + 1 }));
    expect(store.getSnapshot()).toEqual({ n: 4 });
  });

  it('keeps working when storage throws', () => {
    const store = createPersistedStore({
      key: 't:blocked',
      schema,
      fallback: { n: 0 },
    });
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota');
      });
    store.set({ n: 7 });
    expect(store.getSnapshot()).toEqual({ n: 7 });
    spy.mockRestore();
  });
});
