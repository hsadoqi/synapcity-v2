import { fixtureModeEnabled } from '../access/dev-fixture';
import { createClient } from '../supabase/server';

import { fixtureSpaceSource } from '../demo/space-source';
import {
  serverSpaceSource,
  type SpaceSource,
} from '@synapcity/features-spaces/server';

/**
 * The source for this request: the development fixtures in fixture mode (no
 * session, so no request client is built), otherwise Supabase through the
 * request's own client. This is the only place Space data reads fixture mode.
 */
export async function getSpaceSource(): Promise<SpaceSource> {
  if (fixtureModeEnabled()) return fixtureSpaceSource();
  return serverSpaceSource(await createClient());
}
