'use client';

import { Workbench } from './main-content/workbench';
import { MainSidebar } from './main-sidebar/main-sidebar';
import { SidebarIconRail } from './sidebar-rail/sidebar-icon-rail';
import { Sidebar } from '@synapcity/frontend-ui/core/sidebar';
import { Workspace, WorkspaceResource } from './types';
import type { User } from '@synapcity/domain-identity';

export const WorkbenchContent = ({
  workspace,
  workspaces,
  activeResourceId,
  setOpen,
  onSelectWorkspace,
  onSelectResource,
  children,
  user,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, 'children'> & {
  workspace: Workspace;
  workspaces: Workspace[];
  activeResourceId?: string;
  setOpen: (open?: boolean) => void;
  onSelectWorkspace: (workspace: Workspace) => void;
  onSelectResource: (resource: WorkspaceResource) => void;
  children?: React.ReactNode;
  user?: User;
}) => {
  return (
    <div className="relative flex flex-1">
      <Sidebar
        collapsible="icon"
        className="overflow-hidden min-h-0 *:data-[sidebar=sidebar]:flex-row"
        {...props}
      >
        <SidebarIconRail
          workspaces={workspaces}
          activeId={workspace.id}
          onSelect={onSelectWorkspace}
          setOpen={setOpen}
          item={workspace}
        />
        <MainSidebar
          workspace={workspace}
          activeResourceId={activeResourceId}
          onSelectResource={onSelectResource}
          user={user}
        />
      </Sidebar>
      <Workbench
        empty={workspace.resources?.length === 0 ? workspace : undefined}
      >
        {children}
      </Workbench>
    </div>
  );
};
