import {
  dashboardCompositionSchema,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import { loadComposition } from '@synapcity/server-data';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

/**
 * A dashboard's stored composition and the revision it was read at (at least 1:
 * the database creates it with the Dashboard). Fixture mode has none (null at
 * revision 0): the browser adapter keeps its own.
 */
export type LoadedComposition = {
  composition: DashboardComposition | null;
  revision: number;
};

/**
 * One dashboard's composition, read on the server for the page. Row-level
 * security scopes the read to the session. A missing row, or a stored document
 * that fails the composition contract, throws instead of reading as empty:
 * showing an empty dashboard would invite a save that overwrites the real one.
 * Development fixture mode has no database; the page uses browser storage there.
 */
export async function getDashboardComposition(
  dashboardId: string,
): Promise<LoadedComposition> {
  if (fixtureModeEnabled()) return { composition: null, revision: 0 };

  const stored = await loadComposition(await createClient(), dashboardId);
  // Null only for an id that is not a uuid, which is not a dashboard.
  if (!stored) throw new Error(`Dashboard ${dashboardId} has no composition`);

  const parsed = dashboardCompositionSchema.safeParse(stored.composition);
  // Neither the document nor the validation issues are put in the message.
  if (!parsed.success) {
    throw new Error(
      `Stored composition of dashboard ${dashboardId} is invalid`,
    );
  }
  return { composition: parsed.data, revision: stored.revision };
}
