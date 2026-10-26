'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  BreadcrumbRootShell,
  CommandPalette,
} from '@synapcity/frontend-shells';

import {
  appPaletteGroups,
  appSidebar,
  type CollectionKind,
} from '@/components/app-sidebar';
import { QuickCreateDialog } from '@/components/quick-create';
import { NO_SIDEBAR_RECORDS, type SidebarRecords } from '@/lib/sidebar-records';
import { accountLinksFor } from '@/lib/routing/user-paths';

/**
 * The app's root shell. A client component because the sidebar follows the
 * page (it is rebuilt from the breadcrumb trail and the current path, which
 * the server layout cannot see) and owns the command palette and the
 * quick-create dialog it opens.
 */
export function AppShell({
  userId,
  headerActions,
  sidebarFooter,
  records = NO_SIDEBAR_RECORDS,
  children,
}: {
  /** The signed-in user's id, or null when no one is signed in. */
  userId: string | null;
  headerActions?: ReactNode;
  /** The account menu for the sidebar's foot, rendered on the server. */
  sidebarFooter?: ReactNode;
  /** The latest records of each kind, loaded by the layout. */
  records?: SidebarRecords;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<CollectionKind | null>(null);

  const openPalette = (query = '') => {
    setSearch(query);
    setPaletteOpen(true);
  };

  return (
    <BreadcrumbRootShell
      account={userId ? accountLinksFor(userId) : null}
      headerActions={headerActions}
      sidebar={
        userId
          ? (trail) =>
              appSidebar(userId, trail, pathname, {
                records,
                onOpenPalette: () => openPalette(),
                onSearch: openPalette,
                onCreate: setCreating,
                footer: sidebarFooter,
              })
          : undefined
      }
    >
      {children}
      {userId && (
        <>
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            groups={appPaletteGroups(userId, records, setCreating)}
            onNavigate={(href) => router.push(href)}
            search={search}
            onSearchChange={setSearch}
          />
          <QuickCreateDialog
            kind={creating}
            onOpenChange={(open) => {
              if (!open) setCreating(null);
            }}
          />
        </>
      )}
    </BreadcrumbRootShell>
  );
}
