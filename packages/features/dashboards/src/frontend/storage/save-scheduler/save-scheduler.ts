import type { StoreApi } from 'zustand/vanilla';

import type { DashboardStorage } from '../../../contracts';
import type { DashboardStore } from '../../store';

type Listens = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

export type SaveTarget = {
  window: Listens;
  document: Listens & { visibilityState: DocumentVisibilityState };
};

/**
 * Saves a canvas's composition and records 400 ms after its last change,
 * and at once when the page is hidden or closed. View state (breakpoint,
 * edit mode) is never saved. Returns a disconnect that flushes first.
 */
export function connectSaves(
  store: StoreApi<DashboardStore>,
  storage: DashboardStorage,
  dashboardId: string,
  { delayMs = 400, target }: { delayMs?: number; target?: SaveTarget } = {},
): () => void {
  const { window: win, document: doc } = target ?? { window, document };
  let compositionDirty = false;
  let recordsDirty = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const report = (cause: unknown) =>
    console.error('Saving the dashboard failed.', cause);

  function flush() {
    clearTimeout(timer);
    timer = undefined;
    const { composition, records } = store.getState();
    if (compositionDirty)
      void storage.saveComposition(dashboardId, composition).catch(report);
    if (recordsDirty) void storage.saveRecords(records).catch(report);
    compositionDirty = false;
    recordsDirty = false;
  }

  const unsubscribe = store.subscribe((state, prev) => {
    const composition = state.composition !== prev.composition;
    const records = state.records !== prev.records;
    if (!composition && !records) return;
    compositionDirty ||= composition;
    recordsDirty ||= records;
    clearTimeout(timer);
    timer = setTimeout(flush, delayMs);
  });

  const onHidden = () => {
    if (doc.visibilityState === 'hidden') flush();
  };
  win.addEventListener('pagehide', flush);
  doc.addEventListener('visibilitychange', onHidden);

  return () => {
    flush();
    unsubscribe();
    win.removeEventListener('pagehide', flush);
    doc.removeEventListener('visibilitychange', onHidden);
  };
}
