import { AuthPageShell, PublicShell } from '@synapcity/frontend-shells';

import { AuthStatus } from '@/features/auth/components/auth-status';

/**
 * The shared presentation of the sign-in and account-flow pages: the public
 * shell with one centred column. The group is presentation only. Whether a
 * page wants a guest or a session is decided by the page itself (the login
 * form sends a signed-in visitor on, `welcome` and `update-password` need a
 * session), so this layout checks nothing. Each page sets its own title.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <PublicShell headerActions={<AuthStatus variant="header" />}>
      <AuthPageShell>{children}</AuthPageShell>
    </PublicShell>
  );
}
