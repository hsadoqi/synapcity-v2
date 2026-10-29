import type { DashboardComposition } from '@synapcity/domain-dashboards';
import type { PrototypeRecords } from '@synapcity/domain-prototypes';

/** What was saved for one dashboard: its composition and the owner's records, each null when nothing is saved yet. */
export type DashboardSnapshot = {
  composition: DashboardComposition | null;
  records: PrototypeRecords | null;
  /**
   * The stored revision the composition was read at; 0 (the default) when
   * nothing is saved yet. Adapters without revisions leave it out.
   */
  revision?: number;
};

/**
 * What saving a composition reports. `conflict` means the stored composition
 * moved on since this one was read: nothing was written. `failed` may carry
 * a message for the person (signed out, for one).
 */
export type SaveOutcome =
  | { ok: true; revision: number }
  | { ok: false; reason: 'conflict' }
  | { ok: false; reason: 'failed'; message?: string };

/**
 * Where a dashboard canvas loads and saves. The host supplies it: the browser
 * adapter today, a server adapter later. Records belong to the owner and are
 * shared by all of their dashboards; a composition belongs to one dashboard.
 */
export type DashboardStorage = {
  load(dashboardId: string): Promise<DashboardSnapshot>;
  /**
   * `baseRevision` is the revision the composition was read or last saved at.
   * An adapter that resolves with nothing counts as saved; one that rejects
   * counts as failed.
   */
  saveComposition(
    dashboardId: string,
    composition: DashboardComposition,
    baseRevision: number,
  ): Promise<SaveOutcome | void>;
  saveRecords(records: PrototypeRecords): Promise<void>;
};

/** A storage problem the host may report: unreadable, unwritable, or saved data that failed validation. */
export type DashboardStorageError = {
  kind: 'read' | 'write' | 'invalid';
  key: string;
  cause: unknown;
};
