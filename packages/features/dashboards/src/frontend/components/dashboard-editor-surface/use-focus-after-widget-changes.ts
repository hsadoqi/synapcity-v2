'use client';

import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { StoreApi } from 'zustand/vanilla';

import {
  useDashboardStore,
  useDashboardStoreApi,
  type DashboardStore,
} from '../../store';
import { focusWidget } from '../../utils/focus';

/**
 * Moves focus after the set of widgets changes: to a widget just added or
 * restored, and after a removal to the next widget in reading order, or to the
 * palette when none is left. Nothing moves on the first render, nor when the
 * store is replaced (a Reload is not widgets coming and going).
 *
 * A widget that cannot take focus now (its region is inert behind a panel that
 * covers the canvas) is left alone: focus stays where the person is, and the
 * store's announcement says what happened.
 */
export function useFocusAfterWidgetChanges(openPalette: () => void) {
  const store = useDashboardStoreApi();
  const ids = useDashboardStore(
    useShallow((s) => s.composition.widgets.map((w) => w.id)),
  );
  const removed = useDashboardStore((s) => s.removed);
  const previous = useRef<{
    store: StoreApi<DashboardStore>;
    ids: string[];
  } | null>(null);
  const openPaletteRef = useRef(openPalette);
  useEffect(() => {
    openPaletteRef.current = openPalette;
  });

  useEffect(() => {
    const before = previous.current;
    previous.current = { store, ids };
    if (!before || before.store !== store) return;
    const added = ids.filter((id) => !before.ids.includes(id));
    const gone = before.ids.filter((id) => !ids.includes(id));
    const moveFocus = () => {
      const lastAdded = added[added.length - 1];
      if (lastAdded) {
        focusWidget(lastAdded);
      } else if (gone.length > 0) {
        const next = removed?.focusAfter;
        if (!next || !focusWidget(next)) openPaletteRef.current();
      }
    };
    const frame = requestAnimationFrame(moveFocus);
    // A popover that closed with the removal hands focus back to its trigger,
    // which is gone with the widget, a moment after the frame: look again.
    const retry = setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) {
        moveFocus();
      }
    }, 80);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(retry);
    };
  }, [store, ids, removed]);
}
