'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BreadcrumbRootShell } from '@synapcity/frontend-shells';

import { appSidebar } from '@/components/app-sidebar';
import { accountLinksFor } from '@/lib/routing/user-paths';

/**
 * The app's root shell. A client component because the sidebar follows the
 * page: it is rebuilt from the breadcrumb trail and the current path, which
 * the server layout above every page cannot see.
 */
export function AppShell({
  userId,
  headerActions,
  children,
}: {
  /** The signed-in user's id, or null when no one is signed in. */
  userId: string | null;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <BreadcrumbRootShell
      account={userId ? accountLinksFor(userId) : null}
      headerActions={headerActions}
      sidebar={
        userId ? (trail) => appSidebar(userId, trail, pathname) : undefined
      }
    >
      {children}
    </BreadcrumbRootShell>
  );
}
