import * as React from 'react';

const SECOND = 1000;

// Whole seconds, so the value is stable between ticks and a render that reads
// it twice sees the same number.
const readClock = () => Math.floor(Date.now() / SECOND) * SECOND;

let clock = readClock();
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

// Each tick is aimed at the next second boundary, so the displayed second never
// repeats or skips the way a fixed interval started mid-second would.
function schedule() {
  timer = setTimeout(
    () => {
      clock = readClock();
      listeners.forEach((listener) => listener());
      schedule();
    },
    SECOND - (Date.now() % SECOND),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    clock = readClock();
    schedule();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
}

function getSnapshot() {
  // Nobody is subscribed, so nothing has kept `clock` fresh.
  return listeners.size === 0 ? readClock() : clock;
}

/** The server clock would disagree with the browser's, so the server has no time. */
function getServerSnapshot() {
  return null;
}

/**
 * The current time in milliseconds, rounded down to the second and refreshed
 * every second. One timer serves every caller and runs only while something is
 * mounted. It is `null` on the server and during hydration, so rendered markup
 * never depends on the server's clock.
 */
export function useNow(): number | null {
  return React.useSyncExternalStore<number | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
