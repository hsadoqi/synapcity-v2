'use client';

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
import { SynapcityMark } from '@synapcity/frontend-ui/components/logo-mark';

import { ShellLink } from '../../providers/shell-navigation';

/** A place the switcher can take someone to. */
export type ContextOption = { label: string; href: string };

/**
 * The top of the sidebar: shows the context the page is in and opens a menu of
 * the places to switch to. The host decides both, usually from the page's
 * breadcrumb trail (see `activeContext`).
 */
export function ContextSwitcher({
  current,
  options,
}: {
  /** The active context's name, such as Home or a Space's name. */
  current: string;
  options: ContextOption[];
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={(props) => (
              <SidebarMenuButton
                size="lg"
                aria-label={`Switch context: ${current}`}
                {...props}
              >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center text-sidebar-primary">
                  <SynapcityMark className="size-4" />
                </div>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {current}
                </span>
                <ChevronsUpDown className="ml-auto shrink-0" />
              </SidebarMenuButton>
            )}
          />
          <DropdownMenuContent align="start">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.href}
                render={<ShellLink href={option.href} />}
              >
                {option.label}
                {option.label === current && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
