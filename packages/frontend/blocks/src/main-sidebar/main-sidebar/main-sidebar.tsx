'use client';

import type { ReactNode } from 'react';
import { Sidebar, SidebarSeparator } from '@synapcity/frontend-ui/core/sidebar';
import { MainSidebarContent } from './main-sidebar-content';
import type { MainSidebarGroup, MainSidebarItem } from '../../types';
import { MainSidebarFooter } from './main-sidebar-footer';
import { MainSidebarHeader } from './main-sidebar-header';

export function MainSidebar({
  label,
  groups,
  activeItemId,
  onSelectItem,
  headerAction,
  footer,
}: {
  label: string;
  groups: MainSidebarGroup[];
  activeItemId?: string;
  onSelectItem: (item: MainSidebarItem) => void;
  headerAction?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sidebar collapsible="none" className="min-w-0 flex-1">
      <MainSidebarHeader label={label} action={headerAction} />
      <SidebarSeparator className="mx-0" />
      <MainSidebarContent
        groups={groups}
        activeItemId={activeItemId}
        label={`${label} navigation`}
        onSelectItem={onSelectItem}
      />
      {footer ? <MainSidebarFooter>{footer}</MainSidebarFooter> : null}
    </Sidebar>
  );
}
