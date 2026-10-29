'use client';

import { useDashboardStore } from '../../store';

/**
 * Speaks the store's announcement ("Pinned moved to column 2, row 1") through
 * one polite live region, so keyboard moves and removals are heard as well
 * as seen. Visually hidden; the region is always in the document so its first
 * message is not lost.
 */
export function LiveAnnouncer() {
  const announcement = useDashboardStore((s) => s.announcement);
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
}
