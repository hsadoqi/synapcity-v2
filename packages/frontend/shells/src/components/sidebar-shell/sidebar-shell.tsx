import {
  SidebarInset,
  SidebarProvider,
} from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { GlobalPanelShell } from '../root-shell/global-panel';

/**
 * The signed-in frame: a sidebar beside the page, collapsed to start, with the
 * header and global panel above and beside the page. The caller supplies the
 * sidebar, so the frame never decides what it lists.
 */
export const SidebarShell = ({
  header,
  sidebar,
  children,
  globalPanel,
}: {
  header: React.ReactNode | null;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  globalPanel?: React.ReactNode;
}) => {
  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={false}
        className="h-svh w-full max-w-screen"
      >
        {sidebar}
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
      </SidebarProvider>
    </TooltipProvider>
  );
};
