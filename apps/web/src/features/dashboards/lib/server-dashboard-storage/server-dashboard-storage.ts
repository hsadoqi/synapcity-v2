import type { DashboardComposition } from '@synapcity/domain-dashboards';
import type {
  DashboardStorage,
  SaveOutcome,
} from '@synapcity/features-dashboards/contracts';

/**
 * The server adapter for a dashboard canvas: `save` is the Server Action.
 * The page reads the composition and its revision on the server and hands
 * them to the provider as its `snapshot` (a Reload is the page asking the
 * server again, which gives a new snapshot), so there is nothing to load in
 * the browser and `load` refuses. Holding no page data keeps the adapter one
 * object across page refreshes: a new storage would replace the store with an
 * edit still waiting to be saved. Records are not stored here: the link
 * widgets own no data.
 */
export function serverDashboardStorage({
  save,
}: {
  save: (
    dashboardId: string,
    composition: DashboardComposition,
    baseRevision: number,
  ) => Promise<SaveOutcome>;
}): DashboardStorage {
  return {
    load: async () => {
      throw new Error(
        'The server adapter has nothing to load: the page supplies the dashboard as the snapshot.',
      );
    },
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
