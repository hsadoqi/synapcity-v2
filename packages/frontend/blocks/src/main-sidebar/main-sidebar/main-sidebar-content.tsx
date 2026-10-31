'use client';

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';
import { NamedIcon } from '../../icon-by-name';

/** A presentation-only destination. Product records are mapped to this in their host. */
export interface MainSidebarItem {
  id: string;
  label: string;
  href?: string;
  /** A Lucide name resolved by the existing icon registry. */
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
}

/** A labelled set of destinations in the wider sidebar panel. */
export interface MainSidebarGroup {
  id: string;
  label: string;
  items: MainSidebarItem[];
  empty?: string;
}

export interface MainSidebarContentProps {
  groups: MainSidebarGroup[];
  activeItemId?: string;
  label: string;
  onSelectItem: (item: MainSidebarItem) => void;
}

export function MainSidebarContent({
  groups,
  activeItemId,
  label,
  onSelectItem,
}: MainSidebarContentProps) {
  return (
    <SidebarContent role="navigation" aria-label={label}>
      {groups.map((group) => (
        <SidebarGroup key={group.id}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            {group.items.length > 0 ? (
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = activeItemId === item.id;
                  const content = (
                    <>
                      {item.icon ? (
                        <NamedIcon name={item.icon} aria-hidden="true" />
                      ) : null}
                      <span className="min-w-0 truncate">{item.label}</span>
                    </>
                  );

                  return (
                    <SidebarMenuItem key={item.id}>
                      {item.href ? (
                        <SidebarMenuButton
                          render={
                            <a
                              href={item.href}
                              aria-current={active ? 'page' : undefined}
                              onClick={() => onSelectItem(item)}
                            />
                          }
                          isActive={active}
                          tooltip={item.label}
                        >
                          {content}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          type="button"
                          isActive={active}
                          disabled={item.disabled}
                          aria-current={active ? 'page' : undefined}
                          tooltip={item.label}
                          onClick={() => onSelectItem(item)}
                        >
                          {content}
                        </SidebarMenuButton>
                      )}
                      {item.badge !== undefined ? (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            ) : (
              <p className="text-muted-foreground px-2 py-1 text-xs">
                {group.empty ?? 'No items yet'}
              </p>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
