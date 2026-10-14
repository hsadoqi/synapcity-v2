import { Separator } from '@base-ui/react';
import { SidebarInset, SidebarTrigger } from '../../components/ui/sidebar';
import { RootSidebar } from './root-sidebar';
import { SidebarProviders } from './sidebar-providers';

export const SidebarShell = ({
  header,
  children,
}: {
  header: React.ReactNode | null;
  children: React.ReactNode;
}) => {
  return (
    <SidebarProviders>
      <RootSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col overflow-hidden">
          <SidebarShellHeader>{header}</SidebarShellHeader>
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProviders>
  );
};

export const SidebarShellHeader = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      {children}
    </header>
  );
};
