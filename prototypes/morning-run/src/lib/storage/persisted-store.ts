import { useSyncExternalStore } from 'react';
import type { z } from 'zod';

const VERSION = 1;

export type PersistedStore<T> = {
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (next: T | ((current: T) => T)) => void;
  /** Forget the in-memory copy so the next read goes back to storage. */
  invalidate: () => void;
};

type Options<T> = { key: string; schema: z.ZodType<T>; fallback: T };

/**
 * A small external store over localStorage for `useSyncExternalStore`. Values are versioned,
 * validated on the way in, and fall back to a default when storage is empty, blocked or corrupt.
 * Everything stays in this browser: nothing is sent anywhere.
 */
export function createPersistedStore<T>({
  key,
  schema,
  fallback,
}: Options<T>): PersistedStore<T> {
  let cache: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as { v?: number; data?: unknown };
      if (parsed.v !== VERSION) return fallback;
      const result = schema.safeParse(parsed.data);
      return result.success ? result.data : fallback;
    } catch {
      return fallback;
    }
  };

  const notify = () => listeners.forEach((l) => l());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key && event.key !== null) return;
    loaded = false;
    notify();
  };

  // Plain functions, not methods: `set` is handed out on its own (`const [, set] = useStore(...)`).
  const getSnapshot = (): T => {
    if (typeof window === 'undefined') return fallback;
    if (!loaded) {
      cache = read();
      loaded = true;
    }
    return cache;
  };

  const subscribe = (listener: () => void) => {
    if (listeners.size === 0 && typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage);
    }
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    };
  };

  const set = (next: T | ((current: T) => T)) => {
    const current = getSnapshot();
    const value =
      typeof next === 'function' ? (next as (c: T) => T)(current) : next;
    cache = value;
    loaded = true;
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify({ v: VERSION, data: value }),
      );
    } catch {
      // Storage can be full or blocked (private windows). The in-memory copy still works.
    }
    notify();
  };

  const invalidate = () => {
    loaded = false;
    notify();
  };

  return {
    getSnapshot,
    getServerSnapshot: () => fallback,
    subscribe,
    set,
    invalidate,
  };
}

export function useStore<T>(
  store: PersistedStore<T>,
): readonly [T, PersistedStore<T>['set']] {
  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return [value, store.set] as const;
}
