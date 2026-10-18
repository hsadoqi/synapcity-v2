import { SkipLinkButton } from '@synapcity/frontend-ui/components/skip-link';
import { RootHeader } from '@synapcity/frontend-ui/blocks/root-shell/root-header';
import { RootFooter } from '@synapcity/frontend-ui/blocks/root-shell/root-footer';
import { RootContent } from '@synapcity/frontend-ui/blocks/root-shell/root-content';
import { SidebarShell } from '@synapcity/frontend-ui/blocks/sidebar-shell';
import React from 'react';
import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';

type ShellProps = {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Optional content for the authenticated shell's session-local utility panel. */
  globalPanel?: React.ReactNode;
};

// export default function RootShell({
//   children,
//   headerActions,
//   account,
// }: {
//   children: React.ReactNode;
//   headerActions?: React.ReactNode;
//   /** Present when someone is signed in; the app supplies where they lead. */
//   account?: AccountLinks | null;
// }) {
//   const content = (
//     <>
//       <RootContent>{children}</RootContent>
//       <RootFooter />
//     </>
//   );

//   // The skip link comes first in the DOM so it is the first Tab stop, ahead
//   // of the header and sidebar. It is position: fixed, so this costs no layout.
//   if (account) {
//     return (
//       <>
//         <SkipLinkButton />
//         <SidebarShell
//           header={<RootHeader account={account} actions={headerActions} />}
//           account={account}
//         >
//           {content}
//         </SidebarShell>
//       </>
//     );
//   }

//   // Pages position themselves (the home page centers, auth sits near the top),
//   // so this column only stacks header, content and footer.
//   return (
//     <div className="flex flex-col flex-1">
//       <SkipLinkButton />
//       <RootHeader account={account} actions={headerActions} />
//       <div className="flex flex-1 flex-col">{content}</div>
//     </div>
//   );
// }

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
}: ShellProps & { account: AccountLinks }) {
  return (
    <div
      data-slot="authenticated-shell"
      className="flex min-h-svh flex-1 flex-col z-0"
    >
      <SkipLinkButton />
      <SidebarShell
        header={<RootHeader account={account} actions={headerActions} />}
        account={account}
        globalPanel={globalPanel}
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
  globalPanel,
}: ShellProps & {
  /** Present when someone is signed in; the app supplies where they lead. */
  account?: AccountLinks | null;
}) {
  return account ? (
    <AuthenticatedShell
      account={account}
      headerActions={headerActions}
      globalPanel={globalPanel}
    >
      {children}
    </AuthenticatedShell>
  ) : (
    <PublicShell headerActions={headerActions}>{children}</PublicShell>
  );
}
