'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { Workspace } from '../types';
import { WorkspaceDropdown } from './workspace-dropdown';
import {
  BreadcrumbList,
  BreadcrumbLink,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@synapcity/frontend-ui/core/breadcrumb';
import { SidebarTrigger } from '@synapcity/frontend-ui/core/sidebar';

export function WorkbenchHeader({
  workspaceName,
  workspace,
  workspaces,
  resourceName,
  onSelect,
}: {
  workspaceName: string;
  workspace: Workspace;
  workspaces: Workspace[];
  resourceName?: string;
  onSelect: (workspace: Workspace) => void;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b p-4">
      <div className="flex gap-2 items-center w-40">
        <SidebarTrigger />
        <WorkspaceDropdown
          workspace={workspace}
          workspaces={workspaces}
          onSelect={onSelect}
        />
      </div>
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbLink href="#" className="truncate">
              {workspaceName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {resourceName ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">
                  {resourceName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <Button variant="outline" size="sm" className="ml-auto">
        Invite
      </Button>
    </header>
  );
}
