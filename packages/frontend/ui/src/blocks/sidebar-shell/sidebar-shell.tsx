import { SidebarInset } from '../../components/ui/sidebar';
import { RootSidebar } from './root-sidebar';
import { SidebarProviders } from './sidebar-providers';

export const SidebarShell = ({
  header,
  userId,
  children,
}: {
  header: React.ReactNode | null;
  userId: string;
  children: React.ReactNode;
}) => {
  return (
    <SidebarProviders>
      {userId && <RootSidebar userId={userId} />}
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
