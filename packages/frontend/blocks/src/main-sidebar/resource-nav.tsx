'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { PinIcon } from 'lucide-react';
import { NamedIcon } from '../icon-by-name';
import type { ResourceKind, WorkspaceResource } from '../types';

const SECTIONS: { kind: ResourceKind; label: string }[] = [
  { kind: 'document', label: 'Documents' },
  { kind: 'dashboard', label: 'Dashboards' },
];

export function ResourceNav({
  resources,
  activeResourceId,
  onSelect,
}: {
  resources: WorkspaceResource[];
  activeResourceId?: string;
  onSelect: (resource: WorkspaceResource) => void;
}) {
  return (
    <>
      {SECTIONS.map(({ kind, label }) => {
        const rows = resources.filter((r) => r.kind === kind);
        if (rows.length === 0) return null;
        return (
          <SidebarGroup key={kind}>
            <SidebarGroupLabel>
              {label} ({rows.length})
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {rows.map((resource) => (
                  <SidebarMenuItem key={resource.id}>
                    <SidebarMenuButton
                      isActive={activeResourceId === resource.id}
                      onClick={() => onSelect(resource)}
                      tooltip={resource.name}
                      className={cn(resource.alsoIn && 'pr-8')}
                    >
                      <NamedIcon name={resource.icon} aria-hidden="true" />
                      <span className="min-w-0 truncate">{resource.name}</span>
                      {resource.pinned ? (
                        <PinIcon
                          className="ml-auto size-3 shrink-0 opacity-60"
                          aria-label="Pinned"
                        />
                      ) : null}
                    </SidebarMenuButton>
                    {resource.alsoIn ? (
                      <SidebarMenuBadge
                        aria-label={`Also in ${resource.alsoIn} other workspace${resource.alsoIn === 1 ? '' : 's'}`}
                      >
                        +{resource.alsoIn}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
      {resources.length === 0 ? (
        <p className="text-muted-foreground px-4 py-2 text-xs">
          Nothing is filed here yet.
        </p>
      ) : null}
    </>
  );
}
