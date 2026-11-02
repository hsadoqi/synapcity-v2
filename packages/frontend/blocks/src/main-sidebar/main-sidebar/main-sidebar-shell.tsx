'use client';

import { useState, type ReactNode } from 'react';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@synapcity/frontend-ui/core/sidebar';
import { MainCombinedSidebar } from './main-combined';
import type { MainSidebarGroup, MainSidebarItem } from '../../types';

export function MainSidebarShell({
  railItems,
  activeRailItemId,
  railLabel = 'Contexts',
  onSelectRailItem,
  panelLabel,
  panelGroups,
  activePanelItemId,
  onSelectPanelItem,
  defaultOpen = true,
  header,
  railHeader,
  railFooter,
  panelHeaderAction,
  panelFooter,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, 'children'> & {
  railItems: MainSidebarItem[];
  activeRailItemId?: string;
  railLabel?: string;
  onSelectRailItem: (item: MainSidebarItem) => void;
  panelLabel: string;
  panelGroups: MainSidebarGroup[];
  activePanelItemId?: string;
  onSelectPanelItem: (item: MainSidebarItem) => void;
  defaultOpen?: boolean;
  header?: ReactNode;
  railHeader?: ReactNode;
  railFooter?: ReactNode;
  panelHeaderAction?: ReactNode;
  panelFooter?: ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      contained
      className="h-full min-h-0 flex-col overflow-hidden"
    >
      {header}
      <div className="relative flex min-h-0 flex-1">
        <MainCombinedSidebar
          {...props}
          railItems={railItems}
          activeRailItemId={activeRailItemId}
          railLabel={railLabel}
          onSelectRailItem={(item) => {
            onSelectRailItem(item);
            setOpen(true);
          }}
          panelLabel={panelLabel}
          panelGroups={panelGroups}
          activePanelItemId={activePanelItemId}
          onSelectPanelItem={onSelectPanelItem}
          railHeader={railHeader}
          railFooter={railFooter}
          panelHeaderAction={panelHeaderAction}
          panelFooter={panelFooter}
        />
        <SidebarInset className="min-w-0">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
