import { SkipLinkButton } from '@synapcity/frontend-ui/core/skip-link';
import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';
import { SidebarShell } from '../sidebar-shell';
import {
  RootSidebar,
  type RootSidebarContent,
} from '../sidebar-shell/root-sidebar';
import React from 'react';
import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import type { RootBreadcrumb } from '../header-breadcrumbs';

type ShellProps = {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Optional content for the authenticated shell's session-local utility panel. */
  globalPanel?: React.ReactNode;
  /** The path to the current page, shown in the header once someone is signed in. */
  breadcrumbs?: RootBreadcrumb[];
  /**
   * What the signed-in sidebar lists: its header (such as a context switcher
   * and search) and its sections. The shell adds the Settings link and theme
   * toggle for small screens. Without it the sidebar has no sections.
   */
  sidebar?: RootSidebarContent;
};

const NO_SIDEBAR_CONTENT: RootSidebarContent = { groups: [] };

const ShellContent = ({ children }: { children: React.ReactNode }) => (
  <>
    <RootContent>{children}</RootContent>
    <RootFooter />
  </>
);

export function PublicShell({ children, headerActions }: ShellProps) {
  return (
    <div
      data-slot="public-shell"
      className="flex min-h-svh flex-1 flex-col z-0"
    >
      <SkipLinkButton />
      <RootHeader actions={headerActions} />
      <div className="flex flex-1 flex-col">
        <ShellContent>{children}</ShellContent>
      </div>
    </div>
  );
}

export function AuthenticatedShell({
  children,
  headerActions,
  account,
  globalPanel,
  breadcrumbs,
  sidebar = NO_SIDEBAR_CONTENT,
}: ShellProps & { account: AccountLinks }) {
  return (
    <div
      data-slot="authenticated-shell"
      className="flex h-svh flex-1 flex-col z-0"
    >
      <SkipLinkButton />
      <SidebarShell
        header={
          <RootHeader
            account={account}
            actions={headerActions}
            breadcrumbs={breadcrumbs}
          />
        }
        sidebar={
          <RootSidebar
            header={sidebar.header}
            groups={sidebar.groups}
            footer={sidebar.footer}
          />
        }
        globalPanel={globalPanel}
      >
        {/* No footer: a copyright line has no work to do inside the tool. */}
        <RootContent>{children}</RootContent>
      </SidebarShell>
    </div>
  );
}

export default function RootShell({
  children,
  headerActions,
  account,
  globalPanel,
  breadcrumbs,
  sidebar,
}: ShellProps & {
  /** Present when someone is signed in; the app supplies where they lead. */
  account?: AccountLinks | null;
}) {
  return account ? (
    <AuthenticatedShell
      account={account}
      headerActions={headerActions}
      globalPanel={globalPanel}
      breadcrumbs={breadcrumbs}
      sidebar={sidebar}
    >
      {children}
    </AuthenticatedShell>
  ) : (
    <PublicShell headerActions={headerActions}>{children}</PublicShell>
  );
}
