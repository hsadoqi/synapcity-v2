'use client';

import { usePathname } from 'next/navigation';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';

/**
 * A way back in for a form whose session has gone. Signing in returns to the
 * page the person was on; the sign-in page checks that destination.
 */
export function SignInAgain() {
  const here = usePathname() ?? '/';

  return (
    <LinkButton
      href={`/auth/login?next=${encodeURIComponent(here)}`}
      variant="link"
      size="sm"
      className="self-start"
    >
      Sign in again
    </LinkButton>
  );
}
