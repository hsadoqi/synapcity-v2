import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import { fixtureSpaceSource } from './fixture-space-source';
import { serverSpaceSource } from './server-space-source';
import type { SpaceSource } from './space-source';

export type { SetPinnedOutcome, SpaceSource } from './space-source';
export { serverSpaceSource };

/**
 * The source for this request: the development fixtures in fixture mode (no
 * session, so no request client is built), otherwise Supabase through the
 * request's own client. This is the only place Space data reads fixture mode.
 */
export async function getSpaceSource(): Promise<SpaceSource> {
  if (fixtureModeEnabled()) return fixtureSpaceSource();
  return serverSpaceSource(await createClient());
}
