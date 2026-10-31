'use client';

import type { ReactNode } from 'react';
import { Sidebar } from '@synapcity/frontend-ui/core/sidebar';
import { SidebarIconRail } from '../../sidebar-rail';
import { MainSidebar } from './main-sidebar';
import type { MainSidebarGroup, MainSidebarItem } from '../../types';

export function MainCombinedSidebar({
  railItems,
  activeRailItemId,
  railLabel,
  onSelectRailItem,
  panelLabel,
  panelGroups,
  activePanelItemId,
  onSelectPanelItem,
  railHeader,
  railFooter,
  panelHeaderAction,
  panelFooter,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, 'children'> & {
  railItems: MainSidebarItem[];
  activeRailItemId?: string;
  railLabel: string;
  onSelectRailItem: (item: MainSidebarItem) => void;
  panelLabel: string;
  panelGroups: MainSidebarGroup[];
  activePanelItemId?: string;
  onSelectPanelItem: (item: MainSidebarItem) => void;
  railHeader?: ReactNode;
  railFooter?: ReactNode;
  panelHeaderAction?: ReactNode;
  panelFooter?: ReactNode;
}) {
  return (
    <Sidebar
      collapsible="icon"
      className="min-h-0 overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <SidebarIconRail
        items={railItems}
        activeItemId={activeRailItemId}
        label={railLabel}
        onSelectItem={onSelectRailItem}
        header={railHeader}
        footer={railFooter}
      />
      <MainSidebar
        label={panelLabel}
        groups={panelGroups}
        activeItemId={activePanelItemId}
        onSelectItem={onSelectPanelItem}
        headerAction={panelHeaderAction}
        footer={panelFooter}
      />
    </Sidebar>
  );
}
