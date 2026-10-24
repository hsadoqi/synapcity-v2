'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';

import {
  createDashboardStore,
  type DashboardStore,
  type DashboardStoreInit,
} from './dashboard-store';

const DashboardStoreContext = createContext<
  StoreApi<DashboardStore> | undefined
>(undefined);

/**
 * Creates one canvas's store on first render and serves it to the canvas.
 * Never module-level (zustand's Next.js guidance), so two canvases never
 * share state. `onStore` receives the store once, for saving.
 */
export function DashboardStoreProvider({
  init,
  onStore,
  children,
}: {
  init: DashboardStoreInit;
  onStore?: (store: StoreApi<DashboardStore>) => void | (() => void);
  children: ReactNode;
}) {
  const [store] = useState(() => createDashboardStore(init));
  const [connect] = useState(() => onStore);
  useEffect(() => connect?.(store), [connect, store]);
  return (
    <DashboardStoreContext.Provider value={store}>
      {children}
    </DashboardStoreContext.Provider>
  );
}

/** Reads one slice of the canvas's store; re-renders only when that slice changes. */
export function useDashboardStore<T>(
  selector: (state: DashboardStore) => T,
): T {
  const store = useContext(DashboardStoreContext);
  if (!store)
    throw new Error(
      'useDashboardStore must be used within DashboardStoreProvider',
    );
  return useStore(store, selector);
}
