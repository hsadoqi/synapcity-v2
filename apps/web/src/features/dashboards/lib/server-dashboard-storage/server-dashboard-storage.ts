import type { DashboardComposition } from '@synapcity/domain-dashboards';
import type {
  DashboardStorage,
  SaveOutcome,
} from '@synapcity/features-dashboards/contracts';

/**
 * The server adapter for a dashboard canvas. The page already read the
 * composition and its revision on the server, so `load` hands back that
 * snapshot (a Reload is the page asking the server again, which gives this
 * a new snapshot). `save` is the Server Action. Records are not stored here:
 * the link widgets own no data.
 */
export function serverDashboardStorage({
  composition,
  revision,
  save,
}: {
  composition: DashboardComposition | null;
  revision: number;
  save: (
    dashboardId: string,
    composition: DashboardComposition,
    baseRevision: number,
  ) => Promise<SaveOutcome>;
}): DashboardStorage {
  return {
    load: async () => ({ composition, records: null, revision }),
    saveComposition: async (dashboardId, next, baseRevision) => {
      try {
        return await save(dashboardId, next, baseRevision);
      } catch {
        // A Server Action rejects when the network does: not saved, and said so.
        return { ok: false, reason: 'failed' };
      }
    },
    saveRecords: async () => {},
  };
}
