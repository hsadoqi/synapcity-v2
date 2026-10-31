'use client';

import type { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';
import { NamedIcon } from '../icon-by-name';
import type { MainSidebarItem } from '../main-sidebar/main-sidebar/main-sidebar-content';

/**
 * The always-visible level of the two-part sidebar. It knows only generic
 * destinations; a host decides what kind of product context they represent.
 */
export function SidebarIconRail({
  items,
  activeItemId,
  label,
  onSelectItem,
  header,
  footer,
}: {
  items: MainSidebarItem[];
  activeItemId?: string;
  label: string;
  onSelectItem: (item: MainSidebarItem) => void;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sidebar
      collapsible="none"
      className="w-(--sidebar-width-icon) shrink-0 border-r"
    >
      {header ? <SidebarHeader>{header}</SidebarHeader> : null}
      <SidebarContent role="navigation" aria-label={label}>
        <SidebarGroup>
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    type="button"
                    tooltip={{ children: item.label, hidden: false }}
                    onClick={() => onSelectItem(item)}
                    isActive={activeItemId === item.id}
                    aria-current={activeItemId === item.id ? 'page' : undefined}
                    className="px-2"
                  >
                    {item.icon ? (
                      <NamedIcon name={item.icon} aria-hidden="true" />
                    ) : (
                      <span aria-hidden="true">{item.label.slice(0, 1)}</span>
                    )}
                    <span className="sr-only">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter>{footer}</SidebarFooter> : null}
    </Sidebar>
  );
}
