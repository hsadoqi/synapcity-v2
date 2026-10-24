'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const ClockContext = createContext<() => number>(() => Date.now());

/** Sets the clock widgets read, so a story or test can fix the time. Defaults to `Date.now`. */
export function ClockProvider({
  now,
  children,
}: {
  now: () => number;
  children: ReactNode;
}) {
  return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>;
}

/**
 * The current time from the nearest `ClockProvider`, refreshed every
 * `intervalMs`. `null` starts no clock, for widgets that do not show the time.
 */
export function useNow(intervalMs: number | null): number {
  const clock = useContext(ClockContext);
  const [now, setNow] = useState(clock);
  useEffect(() => {
    if (intervalMs === null) return;
    const id = setInterval(() => setNow(clock()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, clock]);
  return now;
}
