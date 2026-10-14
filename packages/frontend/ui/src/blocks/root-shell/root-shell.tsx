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
      <RootContent>{children}</RootContent>
      <RootFooter />
    </>
  );

  // The skip link comes first in the DOM so it is the first Tab stop, ahead
  // of the header and sidebar. It is position: fixed, so this costs no layout.
  if (userId) {
    return (
      <>
        <SkipLinkButton />
        <SidebarShell
          header={<RootHeader userId={userId} actions={headerActions} />}
          userId={userId}
        >
          {content}
        </SidebarShell>
      </>
    );
  }

  // Pages position themselves (the home page centers, auth sits near the top),
  // so this column only stacks header, content and footer.
  return (
    <div className="flex flex-col flex-1">
      <SkipLinkButton />
      <RootHeader userId={userId} actions={headerActions} />
      <div className="flex flex-1 flex-col">{content}</div>
    </div>
  );
}
