import { SkipLinkButton } from '../../components/skip-link';
import { RootHeader } from './root-header';
import { RootFooter } from './root-footer';
import { RootContent } from './root-content';
import { SidebarShell } from '../sidebar-shell/sidebar-shell';
import React from 'react';

export default function RootShell({
  children,
  headerActions,
  userId,
}: {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  userId?: string | null;
}) {
  const content = (
    <>
      <SkipLinkButton />
      <RootContent>{children}</RootContent>
      <RootFooter />
    </>
  );

  if (userId) {
    return (
      <SidebarShell
        header={<RootHeader userId={userId} actions={headerActions} />}
      >
        {content}
      </SidebarShell>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <RootHeader userId={userId} actions={headerActions} />
      <div className="flex flex-1 flex-col overflow-hidden items-center justify-center">
        {content}
      </div>
    </div>
  );
}
