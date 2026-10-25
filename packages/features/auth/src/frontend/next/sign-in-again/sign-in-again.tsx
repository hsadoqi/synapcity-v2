'use client';

import { usePathname } from 'next/navigation';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

/**
 * A way back in for a form whose session has gone. Signing in returns to the
 * page the person was on; the sign-in page checks that destination.
 */
export function SignInAgain({
  signInHref,
}: {
  signInHref: (returnTo: string) => string;
}) {
  const here = usePathname() ?? '/';

  return (
    <LinkButton
      href={signInHref(here)}
      variant="link"
      size="sm"
      className="self-start"
    >
      Sign in again
    </LinkButton>
  );
}
