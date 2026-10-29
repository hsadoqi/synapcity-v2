import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { buttonVariants } from '@synapcity/frontend-ui/core/button';

import { DeleteAccountCard } from '@synapcity/features-auth/frontend';
import { confirmAccountDeletion } from './actions';
import { MessagePage } from '@synapcity/frontend-shells';
import { getVerifiedClaims } from '@/features/auth/server';
import { hasRecentLinkSignInNow } from '@synapcity/features-auth/contracts';
import { settingsPathFor } from '@/lib/routing/user-paths';

export const metadata: Metadata = { title: 'Delete your account' };

// Depends on the session and the clock, so never prerendered or cached.
export const dynamic = 'force-dynamic';

/**
 * Where the link in the deletion email lands. It shows a button and deletes
 * nothing by itself. It also shows the button only to a session that signed in
 * by that link a moment ago: any other way here is told to ask again, and even
 * if this check were bypassed, the deletion itself checks the same again.
 */
export default async function DeleteAccountPage() {
  const claims = await getVerifiedClaims();
  if (!claims) redirect('/auth/login');

  const settingsHref = settingsPathFor(claims.sub);
  const fresh = hasRecentLinkSignInNow(claims.amr);

  if (!fresh) {
    return (
      <MessagePage
        title="Ask for a new link"
        description="This page works only right after you open the link we emailed you. Nothing was deleted."
      >
        <Link
          href={settingsHref}
          className={buttonVariants({ variant: 'outline' })}
        >
          Back to settings
        </Link>
      </MessagePage>
    );
  }

  return (
    <DeleteAccountCard
      confirmAccountDeletion={confirmAccountDeletion}
      email={typeof claims.email === 'string' ? claims.email : null}
      settingsHref={settingsHref}
    />
  );
}
