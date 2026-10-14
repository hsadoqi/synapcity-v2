import type { AccountLinks } from '../../lib/account-links';
import { SidebarInset } from '../../components/ui/sidebar';
import { RootSidebar } from './root-sidebar';
import { SidebarProviders } from './sidebar-providers';

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
      {/* The provider is viewport-height, so the header stays put and only the
          work surface below it scrolls. min-w-0 lets wide content shrink
          instead of pushing the inset past the viewport. */}
      <SidebarInset className="min-w-0">
        {header}
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProviders>
  );
};
