import { LinkButton } from '@synapcity/frontend-ui/components';

import { MessagePage } from '@/components/shells/message-page';

/**
 * Shown when `notFound()` is called. Another person's `/<userId>/...` area is
 * a 404 on purpose (see `requireOwner`), so this must say nothing that
 * confirms a page exists. Whether it also serves addresses that match no route
 * is not established: Next has a separate `global-not-found` convention for
 * that, and it is not used here.
 */
export default function NotFound() {
  return (
    <MessagePage
      title="We could not find that page"
      description="The address may be wrong, or the page may have moved."
    >
      <LinkButton href="/" size="lg">
        Go to the home page
      </LinkButton>
    </MessagePage>
  );
}
