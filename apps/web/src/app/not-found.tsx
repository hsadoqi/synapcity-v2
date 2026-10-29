import { PublicShell } from '@synapcity/frontend-shells';

import { NotFoundMessage } from '@/components/route-messages';

/**
 * Shown for an address no route group matches. Inside a group, that group's own
 * `not-found` is used instead and renders within the group's layout, so this
 * is the only one that brings a shell. The header has no account menu: this
 * page must not depend on the session, so it works wherever it is raised.
 *
 * Whether it also serves addresses that match no route at all is not
 * established: Next has a separate `global-not-found` convention for that, and
 * it is not used here.
 */
export default function NotFound() {
  return (
    <PublicShell>
      <NotFoundMessage />
    </PublicShell>
  );
}
