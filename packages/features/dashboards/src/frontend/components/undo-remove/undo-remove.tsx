'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Undo2Icon } from 'lucide-react';
import { useEffect } from 'react';

import { useDashboardStore } from '../../store';

/** How long Undo stays offered after a removal. */
export const UNDO_WINDOW_MS = 8000;

/**
 * Offers to put back the widget the last removal took out, for a short time
 * or until the next change. Removing deletes the widget; this is the only way
 * back, so it is a real button in the toolbar rather than a toast that
 * focus can miss.
 */
export function UndoRemove() {
  const removed = useDashboardStore((s) => s.removed);
  const undoRemove = useDashboardStore((s) => s.undoRemove);
  const clearRemoved = useDashboardStore((s) => s.clearRemoved);

  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(clearRemoved, UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [removed, clearRemoved]);

  if (!removed) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      aria-label={`Undo remove ${removed.title}`}
      onClick={undoRemove}
    >
      <Undo2Icon aria-hidden="true" />
      Undo remove
    </Button>
  );
}
