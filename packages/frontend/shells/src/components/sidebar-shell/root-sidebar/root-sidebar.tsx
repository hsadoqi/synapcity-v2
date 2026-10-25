'use client';
import * as React from 'react';

import { SearchForm } from '../../search-form';
import { ContextSwitcher } from '../../context-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@synapcity/frontend-ui/core/sidebar';
import Link from 'next/link';
import { Cog } from 'lucide-react';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import { data } from '@synapcity/frontend-ui/lib/sidebar-data';

export function RootSidebar({
  settingsHref,
  ...props
}: React.ComponentProps<typeof Sidebar> & { settingsHref: string }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ContextSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]!}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={(props) => {
                        return (
                          <Link href={item.url} {...props}>
                            {item.title}
                          </Link>
                        );
                      }}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {/* The header carries these from md up; below md they live here, so the
          sheet is the one place a phone user can reach them. */}
      <SidebarFooter className="md:hidden">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              className="flex-1"
              render={(props) => {
                return (
                  <Link href={settingsHref} {...props}>
                    <Cog />
                    Settings
                  </Link>
                );
              }}
            />
            <ModeToggle variant="ghost" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
