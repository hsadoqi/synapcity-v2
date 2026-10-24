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
 * edit mode) is never saved. A failed write gets one automatic retry.
 */
export function connectSaves(
  store: StoreApi<DashboardStore>,
  storage: DashboardStorage,
  dashboardId: string,
  { delayMs = 400, target }: { delayMs?: number; target?: SaveTarget } = {},
): () => void {
  const { window: win, document: doc } = target ?? { window, document };
  let compositionVersion = 0;
  let savedCompositionVersion = 0;
  let recordsVersion = 0;
  let savedRecordsVersion = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flushing: Promise<void> | undefined;
  let automaticRetryAvailable = true;

  const report = (cause: unknown) =>
    console.error('Saving the dashboard failed.', cause);

  const hasDirtyState = () =>
    compositionVersion > savedCompositionVersion ||
    recordsVersion > savedRecordsVersion;

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      flush();
    }, delayMs);
  }

  function flush() {
    if (flushing) return;
    clearTimeout(timer);
    timer = undefined;
    if (!hasDirtyState()) return;

    const { composition, records } = store.getState();
    const compositionToSave = compositionVersion;
    const recordsToSave = recordsVersion;
    let failed = false;

    flushing = (async () => {
      try {
        // Records first: a widget saved before its record could point at nothing.
        if (recordsToSave > savedRecordsVersion) {
          await storage.saveRecords(records);
          savedRecordsVersion = recordsToSave;
        }
        if (compositionToSave > savedCompositionVersion) {
          await storage.saveComposition(dashboardId, composition);
          savedCompositionVersion = compositionToSave;
        }
      } catch (cause) {
        failed = true;
        report(cause);
      } finally {
        flushing = undefined;
        if (!timer && hasDirtyState()) {
          const changedWhileSaving =
            compositionVersion > compositionToSave ||
            recordsVersion > recordsToSave;
          if (changedWhileSaving) {
            schedule();
          } else if (failed && automaticRetryAvailable) {
            automaticRetryAvailable = false;
            schedule();
          }
        }
      }
    })();
  }

  const unsubscribe = store.subscribe((state, prev) => {
    const composition = state.composition !== prev.composition;
    const records = state.records !== prev.records;
    if (!composition && !records) return;
    if (composition) compositionVersion += 1;
    if (records) recordsVersion += 1;
    automaticRetryAvailable = true;
    schedule();
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
