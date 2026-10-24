import type { DashboardComposition } from '@synapcity/domain-dashboards';
import type { PrototypeRecords } from '@synapcity/domain-prototypes';

/** What was saved for one dashboard: its composition and the owner's records, each null when nothing is saved yet. */
export type DashboardSnapshot = {
  composition: DashboardComposition | null;
  records: PrototypeRecords | null;
};

/**
 * Where a dashboard canvas loads and saves. The host supplies it: the browser
 * adapter today, a server adapter later. Records belong to the owner and are
 * shared by all of their dashboards; a composition belongs to one dashboard.
 */
export type DashboardStorage = {
  load(dashboardId: string): Promise<DashboardSnapshot>;
  saveComposition(
    dashboardId: string,
    composition: DashboardComposition,
  ): Promise<void>;
  saveRecords(records: PrototypeRecords): Promise<void>;
};

/** A storage problem the host may report: unreadable, unwritable, or saved data that failed validation. */
export type DashboardStorageError = {
  kind: 'read' | 'write' | 'invalid';
  key: string;
  cause: unknown;
};
