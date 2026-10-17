import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import { SidebarInset } from '@synapcity/frontend-ui/core/sidebar';
import { RootSidebar } from '@synapcity/frontend-ui/blocks/sidebar-shell/root-sidebar';
import { SidebarProviders } from '@synapcity/frontend-ui/blocks/sidebar-shell/sidebar-providers';

export const SidebarShell = ({
  header,
  account,
  children,
}: {
  header: React.ReactNode | null;
  account: AccountLinks;
  children: React.ReactNode;
}) => {
  return (
    <SidebarProviders>
      <RootSidebar settingsHref={account.settingsHref} />
      {/* The provider is exactly viewport-height, so the header stays put and
          only the work surface below it scrolls; the window never does. A page
          that fills the screen instead (settings) opts in through RootContent.
          min-w-0 lets wide content shrink instead of pushing the inset past
          the viewport. */}
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        {header}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProviders>
  );
};
