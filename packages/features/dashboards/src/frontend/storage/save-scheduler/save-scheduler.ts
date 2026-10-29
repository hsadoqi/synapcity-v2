import type { StoreApi } from 'zustand/vanilla';

import type { DashboardStorage, SaveOutcome } from '../../../contracts';
import type { DashboardStore } from '../../store';

type Listens = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

type SaveTarget = {
  window: Listens;
  document: Listens & { visibilityState: DocumentVisibilityState };
};

export type ConnectSavesOptions = {
  /** Debounce after the last change. @default 400 */
  delayMs?: number;
  /** The revision the composition was read at. @default 0 */
  baseRevision?: number;
  target?: SaveTarget;
};

/** What an adapter's answer means: resolving with nothing is a save, rejecting a failure. */
async function save(
  storage: DashboardStorage,
  dashboardId: string,
  composition: Parameters<DashboardStorage['saveComposition']>[1],
  baseRevision: number,
): Promise<SaveOutcome> {
  try {
    const outcome = await storage.saveComposition(
      dashboardId,
      composition,
      baseRevision,
    );
    return outcome ?? { ok: true, revision: baseRevision + 1 };
  } catch (cause) {
    console.error('Saving the dashboard failed.', cause);
    return { ok: false, reason: 'failed' };
  }
}

/**
 * Saves a canvas's composition and records 400 ms after their last change,
 * and at once when the tab is hidden. View state (breakpoint, edit mode) is
 * never saved. It keeps the store's `saveStatus` honest: `saved` only after
 * the storage confirms; a failed save gets one automatic retry, then waits as
 * `failed` for the person's Retry; a `conflict` stops saving for good, since
 * writing on would overwrite newer work. While anything is unsaved, closing
 * the page asks first (`beforeunload`): an async save cannot be trusted to
 * finish after the page is gone.
 */
export function connectSaves(
  store: StoreApi<DashboardStore>,
  storage: DashboardStorage,
  dashboardId: string,
  { delayMs = 400, baseRevision = 0, target }: ConnectSavesOptions = {},
): () => void {
  const { window: win, document: doc } = target ?? { window, document };
  let revision = baseRevision;
  let compositionVersion = 0;
  let savedCompositionVersion = 0;
  let recordsVersion = 0;
  let savedRecordsVersion = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flushing: Promise<void> | undefined;
  let automaticRetryAvailable = true;
  let stopped = false;

  const status = store.getState().setSaveStatus;
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
    if (flushing || stopped) return;
    clearTimeout(timer);
    timer = undefined;
    if (!hasDirtyState()) return;

    const { composition, records } = store.getState();
    const compositionToSave = compositionVersion;
    const recordsToSave = recordsVersion;
    let failed = false;
    let message: string | null = null;
    status('saving');

    flushing = (async () => {
      try {
        // Records first: a widget saved before its record could point at nothing.
        if (recordsToSave > savedRecordsVersion) {
          try {
            await storage.saveRecords(records);
            savedRecordsVersion = recordsToSave;
          } catch (cause) {
            console.error('Saving the dashboard failed.', cause);
            failed = true;
          }
        }
        if (!failed && compositionToSave > savedCompositionVersion) {
          const outcome = await save(
            storage,
            dashboardId,
            composition,
            revision,
          );
          if (outcome.ok) {
            revision = outcome.revision;
            savedCompositionVersion = compositionToSave;
          } else if (outcome.reason === 'conflict') {
            stopped = true;
            clearTimeout(timer);
            timer = undefined;
            status('conflict');
            return;
          } else {
            failed = true;
            message = outcome.message ?? null;
          }
        }
      } finally {
        flushing = undefined;
      }

      if (!hasDirtyState()) {
        status('saved');
        return;
      }
      const changedWhileSaving =
        compositionVersion > compositionToSave ||
        recordsVersion > recordsToSave;
      if (!failed || changedWhileSaving) {
        status('unsaved');
        schedule();
      } else if (automaticRetryAvailable) {
        automaticRetryAvailable = false;
        status('unsaved');
        schedule();
      } else {
        status('failed', message);
      }
    })();
  }

  const unsubscribe = store.subscribe((state, prev) => {
    if (state.saveRequests !== prev.saveRequests) {
      // Retry: a fresh chance, no debounce.
      automaticRetryAvailable = false;
      flush();
    }
    const composition = state.composition !== prev.composition;
    const records = state.records !== prev.records;
    if (!composition && !records) return;
    if (composition) compositionVersion += 1;
    if (records) recordsVersion += 1;
    automaticRetryAvailable = true;
    if (!stopped) {
      status('unsaved');
      schedule();
    }
  });

  const onHidden = () => {
    if (doc.visibilityState === 'hidden') flush();
  };
  const onBeforeUnload = (event: Event) => {
    if (!hasDirtyState() && !flushing) return;
    event.preventDefault();
    // Some browsers only ask when a return value is set.
    Object.assign(event, { returnValue: '' });
  };
  doc.addEventListener('visibilitychange', onHidden);
  win.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    flush();
    unsubscribe();
    doc.removeEventListener('visibilitychange', onHidden);
    win.removeEventListener('beforeunload', onBeforeUnload);
  };
}
