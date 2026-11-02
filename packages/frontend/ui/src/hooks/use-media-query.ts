import { useCallback, useSyncExternalStore } from 'react';

// A test runner between stubs or an embedded webview may lack matchMedia;
// without it the query reports false and nothing is listened to.
const canMatch = () => typeof window.matchMedia === 'function';

/** The server has no viewport or device to ask, so every query is false there. */
const getServerSnapshot = () => false;

/**
 * Whether a media query holds, kept current as it changes. Read as an external
 * store: the server and hydration render false, then the client corrects it
 * without a mismatch, and later changes need no effect that sets state.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!canMatch()) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = () => canMatch() && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
