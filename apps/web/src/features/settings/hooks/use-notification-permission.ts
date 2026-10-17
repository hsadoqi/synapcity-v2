'use client';

import { useSyncExternalStore } from 'react';

export type NotificationPermissionState =
  | NotificationPermission
  | 'unsupported';

const isSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window;

// `Notification.requestPermission` has no event of its own, so a request
// tells every subscriber itself.
const listeners = new Set<() => void>();
const notifyAll = () => listeners.forEach((listener) => listener());

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // The Permissions API reports a change made in the browser's site settings
  // while the page is open. Where it is missing, only our own requests update.
  let status: PermissionStatus | undefined;
  let unsubscribed = false;
  navigator.permissions
    ?.query({ name: 'notifications' })
    .then((result) => {
      if (unsubscribed) return;
      status = result;
      status.addEventListener('change', onChange);
    })
    .catch(() => {});
  return () => {
    unsubscribed = true;
    listeners.delete(onChange);
    status?.removeEventListener('change', onChange);
  };
}

const getSnapshot = (): NotificationPermissionState =>
  isSupported() ? Notification.permission : 'unsupported';

/**
 * The browser's permission to show notifications for this site, kept current.
 * The server has no browser to ask, so it renders 'default' and the client
 * corrects it on hydration.
 */
export function useNotificationPermission() {
  const permission = useSyncExternalStore(
    subscribe,
    getSnapshot,
    (): NotificationPermissionState => 'default',
  );
  return { permission, requestPermission };
}

async function requestPermission(): Promise<NotificationPermissionState> {
  if (!isSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  notifyAll();
  return result;
}
