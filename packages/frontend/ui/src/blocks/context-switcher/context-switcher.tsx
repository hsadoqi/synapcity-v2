'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';
import {
  SynapcityMark,
  SynapcityWordmark,
} from '@synapcity/frontend-ui/components/logo-mark';

export function ContextSwitcher({
  versions,
  defaultVersion,
}: {
  versions: string[];
  defaultVersion: string;
}) {
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuButton
                size="lg"
                {...props}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <SynapcityMark className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 items-center leading-none">
                  <SynapcityWordmark
                    size="md"
                    title={null}
                    className="text-sidebar-foreground"
                  />
                </div>
                <ChevronsUpDown className="ml-auto shrink-0" />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent align="start">
            {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onClick={() => setSelectedVersion(version)}
              >
                v{version}{' '}
                {version === selectedVersion && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
