import type { AccountLinks } from '@synapcity/frontend-ui/lib/account-links';
import { SidebarInset } from '@synapcity/frontend-ui/core/sidebar';
import { RootSidebar } from '@synapcity/frontend-ui/blocks/sidebar-shell/root-sidebar';
import { SidebarProviders } from '@synapcity/frontend-ui/blocks/sidebar-shell/sidebar-providers';
import { GlobalPanelShell } from '@synapcity/frontend-ui/blocks/root-shell/global-panel';

export const SidebarShell = ({
  header,
  account,
  children,
  globalPanel,
}: {
  header: React.ReactNode | null;
  account: AccountLinks;
  children: React.ReactNode;
  globalPanel?: React.ReactNode;
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
        <GlobalPanelShell header={header} panel={globalPanel}>
          {children}
        </GlobalPanelShell>
      </SidebarInset>
    </SidebarProviders>
  );
};
