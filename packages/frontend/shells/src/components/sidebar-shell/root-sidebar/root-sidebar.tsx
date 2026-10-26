'use client';
import * as React from 'react';
import { Plus } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@synapcity/frontend-ui/core/sidebar';
import { ModeToggle } from '@synapcity/frontend-ui/components/mode-toggle';
import { ShellLink } from '../../../providers/shell-navigation';

type IconComponent = React.ComponentType<{ className?: string }>;

/** One entry in a sidebar section: a link, or a button that runs an action. */
export type RootSidebarItem = {
  title: string;
  /** Where it leads. `#` for a destination that is not built yet. */
  href?: string;
  /** Runs instead of navigating, such as opening a command palette. Used when there is no `href`. */
  onSelect?: () => void;
  /** Shown before the title, and alone when the sidebar is collapsed to icons. */
  icon?: IconComponent;
  /** Marks the current page. */
  isActive?: boolean;
};

/** One section of the sidebar. */
export type RootSidebarGroup = {
  /** Shown above the items. A group without one, such as the core links, has no label. */
  title?: string;
  /** Makes the title a link, such as to the collection the group lists. */
  href?: string;
  /** A button beside the title, such as "New space". */
  action?: { label: string; onSelect: () => void; icon?: IconComponent };
  items?: RootSidebarItem[];
  /** Shown in place of the items when there are none. */
  empty?: string;
  /** Rendered in the group instead of items, such as a search form. */
  content?: React.ReactNode;
};

/** The content a host gives the signed-in sidebar. */
export type RootSidebarContent = {
  /** Shown above the sections, such as a context switcher. */
  header?: React.ReactNode;
  groups: RootSidebarGroup[];
  /** Pinned below the sections, such as an account menu. */
  footer?: React.ReactNode;
};

const SidebarItem = ({ item }: { item: RootSidebarItem }) => {
  const Icon = item.icon;
  const body = (
    <>
      {Icon && <Icon />}
      <span>{item.title}</span>
    </>
  );

  return (
    <SidebarMenuItem>
      {item.href !== undefined || !item.onSelect ? (
        <SidebarMenuButton
          isActive={item.isActive}
          tooltip={item.title}
          render={(props) => (
            <ShellLink href={item.href ?? '#'} {...props}>
              {body}
            </ShellLink>
          )}
        />
      ) : (
        <SidebarMenuButton tooltip={item.title} onClick={item.onSelect}>
          {body}
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  );
};

const SidebarSection = ({ group }: { group: RootSidebarGroup }) => {
  const ActionIcon = group.action?.icon ?? Plus;
  const items = group.items ?? [];

  return (
    <SidebarGroup>
      {group.title &&
        (group.href ? (
          <SidebarGroupLabel
            render={(props) => (
              <ShellLink href={group.href!} {...props}>
                {group.title}
              </ShellLink>
            )}
          />
        ) : (
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
        ))}
      {group.action && (
        <SidebarGroupAction
          aria-label={group.action.label}
          title={group.action.label}
          onClick={group.action.onSelect}
        >
          <ActionIcon />
        </SidebarGroupAction>
      )}
      <SidebarGroupContent>
        {group.content ?? (
          <SidebarMenu>
            {items.map((item) => (
              <SidebarItem
                key={`${item.title}${item.href ?? ''}`}
                item={item}
              />
            ))}
            {items.length === 0 && group.empty && (
              <li className="px-2 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                {group.empty}
              </li>
            )}
          </SidebarMenu>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

/**
 * The signed-in sidebar. The host decides every section; the shell lays them
 * out with the header and footer fixed and the sections scrolling between
 * them, and collapses to icons when there is little room.
 */
export function RootSidebar({
  header,
  groups,
  footer,
  ...props
}: React.ComponentProps<typeof Sidebar> & RootSidebarContent) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {header && <SidebarHeader>{header}</SidebarHeader>}
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarSection key={group.title ?? index} group={group} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {footer}
        {/* The header carries the theme toggle from md up; below md it lives
            here, so the sheet is the one place a phone user can reach it. */}
        <div className="md:hidden">
          <ModeToggle variant="ghost" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
