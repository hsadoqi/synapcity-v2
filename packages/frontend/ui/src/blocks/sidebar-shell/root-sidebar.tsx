'use client';
import * as React from 'react';

import { SearchForm } from '../../blocks/search-form';
import { ContextSwitcher } from '../../blocks/context-switcher';
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
} from '../../components/ui/sidebar';
import Link from 'next/link';
import { Cog } from 'lucide-react';
import { ModeToggle } from '../../components/mode-toggle';
import { data } from './sidebar-data';

export function RootSidebar({
  userId,
  ...props
}: React.ComponentProps<typeof Sidebar> & { userId: string }) {
  return (
    <Sidebar {...props} key={userId}>
      <SidebarHeader key={'sidebar-header-' + userId}>
        <ContextSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]!}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent key={'sidebar-content-' + userId}>
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
                          <Link
                            href={item.url}
                            {...props}
                            ref={props.ref as React.Ref<HTMLAnchorElement>}
                          >
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
      <SidebarFooter className="md:hidden" key={'sidebar-footer-' + userId}>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              className="flex-1"
              render={(props) => {
                return (
                  <Link
                    href={`/${userId}/settings`}
                    {...props}
                    ref={props.ref as React.Ref<HTMLAnchorElement>}
                  >
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
      <SidebarRail key={'sidebar-rail-' + userId} />
    </Sidebar>
  );
}
