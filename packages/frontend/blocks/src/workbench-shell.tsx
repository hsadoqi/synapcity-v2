'use client';

import { Sidebar, SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { useState } from 'react';
import { Workspace, WorkspaceResource } from './types';
import { WorkbenchHeader } from './main-header';
import { WorkbenchContent } from './workbench-content';
import type { User } from '@synapcity/domain-identity';
/** The resource the panel shows for a workspace: the one chosen there, else its first document. */
function activeResourceOf(
  workspace: Workspace,
  chosenId?: string,
): WorkspaceResource | undefined {
  const resources = workspace.resources ?? [];
  return (
    resources.find((r) => r.id === chosenId) ??
    resources.find((r) => r.kind === 'document') ??
    resources[0]
  );
}

export function WorkbenchShell({
  workspaces,
  initialWorkspaceId,
  initialResourceId,
  defaultOpen = false,
  renderResource,
  user,
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, 'children'> & {
  workspaces: Workspace[];
  user?: User;
  initialWorkspaceId?: string;
  initialResourceId?: string;
  /** Whether the contextual panel starts open next to the rail. */
  defaultOpen?: boolean;
  /** The resource view for the selected resource. The shell only decides which one. */
  renderResource?: (selection: {
    workspace: Workspace;
    resource: WorkspaceResource;
  }) => React.ReactNode;
}) {
  const [workspaceId, setWorkspaceId] = useState(
    () =>
      workspaces.find((w) => w.id === initialWorkspaceId)?.id ??
      workspaces[0]!.id,
  );
  // The resource last chosen in each workspace. Selection only; nothing is written.
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    initialResourceId ? { [workspaceId]: initialResourceId } : {},
  );
  const [open, setOpen] = useState(defaultOpen);

  const workspace = workspaces.find((w) => w.id === workspaceId)!;
  const resource = activeResourceOf(workspace, chosen[workspace.id]);

  return (
    <SidebarProvider
      open={open}
      onOpenChange={setOpen}
      contained
      className="h-svh flex-col overflow-hidden"
    >
      <WorkbenchHeader
        workspaceName={workspace.name}
        workspace={workspace}
        workspaces={workspaces}
        resourceName={resource?.name}
        onSelect={(next) => setWorkspaceId(next.id)}
      />
      <WorkbenchContent
        {...props}
        workspace={workspace}
        workspaces={workspaces}
        activeResourceId={resource?.id}
        setOpen={(open?: boolean) => setOpen(open ?? true)}
        onSelectWorkspace={(next) => setWorkspaceId(next.id)}
        onSelectResource={(next) =>
          setChosen((prev) => ({ ...prev, [workspace.id]: next.id }))
        }
        user={user}
      >
        {resource ? renderResource?.({ workspace, resource }) : null}
      </WorkbenchContent>
    </SidebarProvider>
  );
}
