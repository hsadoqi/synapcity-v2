'use client';

import { Command, type LucideIcon } from 'lucide-react';
import { NamedIcon } from '../icon-by-name';
import { Workspace } from '../types';
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
import { UserAvatar } from '../main-sidebar/user-avatar';
import Link from 'next/link';
import React from 'react';

export const user = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: 'https://github.com/shadcn.png',
};

type MenuItem = {
  name?: string;
  label?: string;
  subtitle?: string;
  className?: string;
  icon?: string | LucideIcon;
};

export const SidebarIconHeading = ({
  label,
  icon: Icon,
  subtitle,
}: {
  icon?: string | LucideIcon;
  label: string;
  subtitle?: string;
}) => (
  <Link href="#">
    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
      {Icon && typeof Icon !== 'string' && <Icon className="size-4" />}
    </div>
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{label}</span>

      {subtitle && <span className="truncate text-xs">{subtitle}</span>}
    </div>
  </Link>
);

export function SidebarIconRail({
  workspaces,
  activeId,
  onSelect,
  setOpen,
  item,
}: {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (workspace: Workspace) => void;
  setOpen: (open: boolean) => void;
  item: MenuItem;
}) {
  const ResolvedIcon = (
    typeof item.icon === 'string' ? NamedIcon : (item.icon ?? Command)
  ) as React.ElementType;
  const iconProps = typeof item.icon === 'string' ? { name: item.icon } : {};

  return (
    <Sidebar
      collapsible="none"
      className="h-full w-[calc(var(--sidebar-width-icon)+1px)]! shrink-0 border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-8 p-0"
              render={
                <Link href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <ResolvedIcon {...iconProps} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{item.label}</span>

                    {item.subtitle && (
                      <span className="truncate text-xs">{item.subtitle}</span>
                    )}
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {workspaces.map((item) => {
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.name,
                        hidden: false,
                      }}
                      onClick={() => {
                        onSelect(item);
                        setOpen(true);
                      }}
                      isActive={activeId === item.id}
                      className="px-2"
                    >
                      <NamedIcon name={item.icon} aria-hidden="true" />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserAvatar user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
