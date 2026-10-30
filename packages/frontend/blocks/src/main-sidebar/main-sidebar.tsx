'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
} from '@synapcity/frontend-ui/core/sidebar';
import { Workspace, WorkspaceResource } from '../types';
import { ResourceNav } from './resource-nav';
import { UserAvatar } from './user-avatar';
import type { User } from '@synapcity/domain-identity';
export const MainSidebar = ({
  workspace,
  activeResourceId,
  onSelectResource,
  user,
}: {
  workspace: Workspace;
  activeResourceId?: string;
  onSelectResource: (resource: WorkspaceResource) => void;
  user?: User;
}) => {
  return (
    <Sidebar collapsible="none" className="min-w-0 flex-1">
      <SidebarHeader>
        <span className="truncate px-2 text-sm font-medium">
          {workspace.name}
        </span>
      </SidebarHeader>
      <SidebarContent role="navigation" aria-label={workspace.name}>
        <ResourceNav
          resources={workspace.resources ?? []}
          activeResourceId={activeResourceId}
          onSelect={onSelectResource}
        />
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <SidebarSeparator className="mx-0" />
          <UserAvatar user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  );
};
