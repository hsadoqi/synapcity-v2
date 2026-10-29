import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

import { MessagePage, PublicShell } from '@synapcity/frontend-shells';

/**
 * Shown when `notFound()` is called. Another person's `/<userId>/...` area is
 * a 404 on purpose (see `requireOwner`), so this must say nothing that
 * confirms a page exists. Whether it also serves addresses that match no route
 * is not established: Next has a separate `global-not-found` convention for
 * that, and it is not used here.
 *
 * It replaces the page inside the root layout, which has no chrome of its own,
 * so it brings the public shell. The header has no account menu: this page
 * must not depend on the session, so it works wherever it is raised.
 */
export default function NotFound() {
  return (
    <PublicShell>
      <MessagePage
        title="We could not find that page"
        description="The address may be wrong, or the page may have moved."
      >
        <LinkButton href="/" size="lg">
          Go to the home page
        </LinkButton>
      </MessagePage>
    </PublicShell>
  );
}
