'use client';

import { useSyncExternalStore } from 'react';

const query = '(prefers-color-scheme: dark)';

// Every browser has matchMedia; a stripped-down environment (a test runner
// between stubs, an embedded webview) may not. Without it the hook reports light
// and listens to nothing, rather than throwing while the preview mounts.
const canMatch = () => typeof window.matchMedia === 'function';

function subscribe(onChange: () => void) {
  if (!canMatch()) return () => {};
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/**
 * Whether the device asks for dark, kept current as it changes. The server has
 * no device to ask, so it renders light and the client corrects it on hydration.
 */
export function usePrefersDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => canMatch() && window.matchMedia(query).matches,
    () => false,
  );
}
