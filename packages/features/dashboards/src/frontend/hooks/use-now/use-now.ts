'use client';

import { useEffect, useState } from 'react';

/**
 * The current time in epoch milliseconds, refreshed every `intervalMs`.
 * `null` starts no clock, for widgets that do not show the time.
 */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
