import { AppShell } from '@/components/app-shell';
import { AuthStatus } from '@/features/auth/components/auth-status';
import { getCurrentUser } from '@/features/auth/server';
import { requireSignedIn } from '@/lib/access/require-signed-in';
import { getSidebarRecords } from '@/lib/sidebar-records/get-sidebar-records';

/**
 * Everything in this route group needs a signed-in user. The group adds no URL
 * segment, so `(protected)/[userId]/home` is served at `/<userId>/home`.
 *
 * It also owns the workspace shell (sidebar, command palette, quick create),
 * which public and auth pages do not use. The group is not the security
 * mechanism: the check below is a backstop, and each page still verifies its
 * own access.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSignedIn();

  const [user, records] = await Promise.all([
    getCurrentUser(),
    getSidebarRecords(),
  ]);

  return (
    <AppShell
      userId={user?.id ?? null}
      headerActions={<AuthStatus variant="header" />}
      sidebarFooter={<AuthStatus variant="sidebar" />}
      records={records}
    >
      {children}
    </AppShell>
  );
}
