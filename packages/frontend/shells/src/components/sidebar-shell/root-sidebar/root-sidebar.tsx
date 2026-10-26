'use client';
import * as React from 'react';

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
import { ChevronDown, Cog } from 'lucide-react';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import { ShellLink } from '../../../providers/shell-navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@synapcity/frontend-ui/components';

/** One destination in a sidebar section. */
export type RootSidebarItem = {
  title: string;
  /** Where it leads. `#` for a destination that is not built yet. */
  href: string;
  /** Marks the current page. */
  isActive?: boolean;
};

/** One labelled section of sidebar destinations. */
export type RootSidebarGroup = {
  title: string;
  items: RootSidebarItem[];
};

/** The content a host gives the signed-in sidebar. */
export type RootSidebarContent = {
  /** Shown above the sections, such as a context switcher and search. */
  header?: React.ReactNode;
  groups: RootSidebarGroup[];
};

const RootSidebarHeader = () => {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton />}>
              Select Workspace
              <ChevronDown className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <span>Acme Inc</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};

export function RootSidebar({
  settingsHref,
  header,
  groups,
  ...props
}: React.ComponentProps<typeof Sidebar> &
  RootSidebarContent & { settingsHref: string }) {
  return (
    <Sidebar {...props}>
      <RootSidebarHeader />
      {/* {header && <SidebarHeader>{header}</SidebarHeader>} */}
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={`${item.title}${item.href}`}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      render={(props) => {
                        return (
                          <ShellLink href={item.href} {...props}>
                            {item.title}
                          </ShellLink>
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
                  <ShellLink href={settingsHref} {...props}>
                    <Cog />
                    Settings
                  </ShellLink>
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
