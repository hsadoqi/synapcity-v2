'use client';

import type { User } from '@synapcity/domain-identity';
import { Sidebar } from '@synapcity/frontend-ui/core/sidebar';
import { Workbench } from './main-content';
import { MainCombinedSidebar, UserAvatar } from './main-sidebar';
import type {
  MainSidebarGroup,
  MainSidebarItem,
  ResourceKind,
  Workspace,
  WorkspaceResource,
} from './types';

const RESOURCE_GROUPS: Array<{ kind: ResourceKind; label: string }> = [
  { kind: 'document', label: 'Documents' },
  { kind: 'dashboard', label: 'Dashboards' },
];

/**
 * Compatibility adapter for the existing WorkbenchShell preview. The generic
 * sidebar stays unaware of the older workspace/resource demonstration model.
 */
export function WorkbenchContent({
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
}) {
  const railItems: MainSidebarItem[] = workspaces.map((item) => ({
    id: item.id,
    label: item.name,
    icon: item.icon,
  }));
  const panelGroups: MainSidebarGroup[] = RESOURCE_GROUPS.map(
    ({ kind, label }) => ({
      id: kind,
      label,
      items: (workspace.resources ?? [])
        .filter((resource) => resource.kind === kind)
        .map((resource) => ({
          id: resource.id,
          label: resource.name,
          icon: resource.icon,
          badge: resource.alsoIn ? `+${resource.alsoIn}` : undefined,
        })),
      empty: `No ${label.toLowerCase()} yet`,
    }),
  );

  return (
    <div className="relative flex min-h-0 flex-1">
      <MainCombinedSidebar
        {...props}
        railItems={railItems}
        activeRailItemId={workspace.id}
        railLabel="Workspaces"
        onSelectRailItem={(item) => {
          const selected = workspaces.find(({ id }) => id === item.id);
          if (!selected) return;
          onSelectWorkspace(selected);
          setOpen(true);
        }}
        panelLabel={workspace.name}
        panelGroups={panelGroups}
        activePanelItemId={activeResourceId}
        onSelectPanelItem={(item) => {
          const selected = workspace.resources?.find(
            ({ id }) => id === item.id,
          );
          if (selected) onSelectResource(selected);
        }}
        panelFooter={user ? <UserAvatar user={user} /> : undefined}
      />
      <Workbench
        empty={workspace.resources?.length === 0 ? workspace : undefined}
      >
        {children}
      </Workbench>
    </div>
  );
}
