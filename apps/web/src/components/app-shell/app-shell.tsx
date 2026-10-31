'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { BreadcrumbProvider, CommandPalette } from '@synapcity/frontend-shells';

import { appPaletteGroups, appSidebar } from '../app-sidebar';
import type { CollectionKind } from '../collections';
import { QuickCreateDialog, QuickCreateProvider } from '../quick-create';
import {
  NO_SIDEBAR_RECORDS,
  type SidebarRecords,
} from '../../lib/sidebar-records';
import { accountLinksFor } from '../../lib/routing/user-paths';

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
  // The control that asked to create, so closing the dialog can return focus
  // to it; read in the event handler, before the dialog takes focus.
  const [createOpener, setCreateOpener] = useState<HTMLElement | null>(null);
  const startCreating = (kind: CollectionKind) => {
    setCreateOpener(
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
    );
    setCreating(kind);
  };

  const openPalette = () => {
    setSearch('');
    setPaletteOpen(true);
  };

  return (
    <BreadcrumbProvider
      account={userId ? accountLinksFor(userId) : null}
      headerActions={headerActions}
      sidebar={
        userId
          ? (trail) =>
              appSidebar(userId, trail, pathname, {
                records,
                onOpenPalette: openPalette,
                onCreate: startCreating,
                footer: sidebarFooter,
              })
          : undefined
      }
    >
      <QuickCreateProvider value={startCreating}>
        {children}
      </QuickCreateProvider>
      {userId && (
        <>
          <CommandPalette
            open={paletteOpen}
            onOpenChange={setPaletteOpen}
            groups={appPaletteGroups(userId, records, startCreating)}
            onNavigate={(href) => router.push(href)}
            search={search}
            onSearchChange={setSearch}
          />
          <QuickCreateDialog
            kind={creating}
            returnFocus={createOpener}
            userId={userId}
            onOpenChange={(open) => {
              if (!open) setCreating(null);
            }}
            onCreated={(href) => router.push(href)}
            onUnconfirmed={() => router.refresh()}
          />
        </>
      )}
    </BreadcrumbProvider>
  );
}
