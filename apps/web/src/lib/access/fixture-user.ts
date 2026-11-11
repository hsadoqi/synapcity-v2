import type { CurrentUser } from '@synapcity/domain-identity';
import { currentUserFromClaims } from '@synapcity/server-supabase';

import { fixtureClaims } from './dev-fixture';

/**
 * The development fixture identity as the interface shows it. Kept apart from
 * `dev-fixture.ts`, which the proxy imports, because the claims mapper comes
 * from the guarded `@synapcity/server-supabase` root.
 */
export function fixtureUser(): CurrentUser {
  return { ...currentUserFromClaims(fixtureClaims), fixture: true };
}
