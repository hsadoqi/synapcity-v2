import { PublicShell } from '@synapcity/frontend-shells';

import { AuthStatus } from '@/features/auth/components/auth-status';

/**
 * The shell for pages anyone may open, signed in or not: the landing page and
 * the privacy notice. It adds no session check. Someone signed in gets the
 * account menu in the header instead of the sign-in buttons.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PublicShell headerActions={<AuthStatus variant="header" />}>
      {children}
    </PublicShell>
  );
}
