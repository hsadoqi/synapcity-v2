import { SkipLinkButton } from '../../components/skip-link';
import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';
import { SidebarShell } from '../sidebar-shell/sidebar-shell';
import React from 'react';
import type { AccountLinks } from '../../lib/account-links';

type ShellProps = {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
};

const ShellContent = ({ children }: { children: React.ReactNode }) => (
  <>
    <RootContent>{children}</RootContent>
    <RootFooter />
  </>
);

export function PublicShell({ children, headerActions }: ShellProps) {
  return (
    <div data-slot="public-shell" className="flex min-h-svh flex-1 flex-col">
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
}: ShellProps & { account: AccountLinks }) {
  return (
    <div data-slot="authenticated-shell" className="flex min-h-svh flex-1">
      <SkipLinkButton />
      <SidebarShell
        header={<RootHeader account={account} actions={headerActions} />}
        account={account}
      >
        <ShellContent>{children}</ShellContent>
      </SidebarShell>
    </div>
  );
}

export default function RootShell({
  children,
  headerActions,
  account,
}: ShellProps & {
  /** Present when someone is signed in; the app supplies where they lead. */
  account?: AccountLinks | null;
}) {
  return account ? (
    <AuthenticatedShell account={account} headerActions={headerActions}>
      {children}
    </AuthenticatedShell>
  ) : (
    <PublicShell headerActions={headerActions}>{children}</PublicShell>
  );
}
