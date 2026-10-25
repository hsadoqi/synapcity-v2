import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False while rendering on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
