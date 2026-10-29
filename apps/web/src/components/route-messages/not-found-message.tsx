import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

import { MessagePage } from '@synapcity/frontend-shells';

/**
 * What a missing page says. Another person's `/<userId>/...` area is a 404 on
 * purpose (see `requireOwner`), so this must say nothing that confirms a page
 * exists, and it must not depend on the session.
 *
 * It carries no shell. Next renders a group's `not-found` inside that group's
 * layout, so a shell here would nest inside the group's own. The root
 * `not-found` wraps it in the public shell for addresses no group matches.
 */
export function NotFoundMessage() {
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
