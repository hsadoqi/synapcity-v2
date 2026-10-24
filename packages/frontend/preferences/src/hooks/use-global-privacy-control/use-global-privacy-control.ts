'use client';

import { useSyncExternalStore } from 'react';

function readGlobalPrivacyControl() {
  // Not in the DOM types yet; browsers without it leave it undefined.
  const { globalPrivacyControl } = navigator as Navigator & {
    globalPrivacyControl?: boolean;
  };
  return globalPrivacyControl === true;
}

// The signal is fixed for the life of the page; there is no change event.
const subscribe = () => () => {};

/** Whether the browser sends Global Privacy Control. False on the server. */
export function useGlobalPrivacyControl() {
  return useSyncExternalStore(subscribe, readGlobalPrivacyControl, () => false);
}
