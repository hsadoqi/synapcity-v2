'use client';

import type { ReactNode } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';

import { ShellLink } from '../../providers/shell-navigation';

/** A place the switcher can take someone to. */
export type ContextOption = {
  label: string;
  href: string;
  /** The context the page is in. Set by the host, since two can share a name. */
  active?: boolean;
};

/**
 * The top of the sidebar: shows the context the page is in and opens a menu of
 * the contexts to switch to (working globally, or inside one Space). The host
 * decides both, usually from the page's breadcrumb trail (see `activeContext`).
 * It shows the context's own icon, not the brand: the global header carries
 * the logo.
 */
export function ContextSwitcher({
  current,
  icon,
  options,
  more,
}: {
  /** The active context's name, such as a Space's name. */
  current: string;
  /**
   * The active context's icon, such as a Space's stored icon, sized by the
   * host (`size-4`). Decorative: the trigger's name already says the context.
   */
  icon: ReactNode;
  options: ContextOption[];
  /** A link after the options, such as to every Space. */
  more?: ContextOption;
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
                <div
                  aria-hidden="true"
                  data-slot="context-switcher-icon"
                  className="flex aspect-square size-8 shrink-0 items-center justify-center"
                >
                  {icon}
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
                aria-current={option.active ? 'page' : undefined}
                render={<ShellLink href={option.href} />}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.active && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
            {more && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<ShellLink href={more.href} />}>
                  {more.label}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
