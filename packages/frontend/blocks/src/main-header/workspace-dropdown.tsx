'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import { SidebarSeparator } from '@synapcity/frontend-ui/core/sidebar';
import { ChevronsUpDownIcon, CheckIcon, PlusIcon } from 'lucide-react';
import { NamedIcon } from '../icon-by-name';
import { Workspace } from '../types';
import { UserAvatar } from '../main-sidebar';

export function WorkspaceDropdown({
  workspace,
  workspaces,
  onSelect,
}: {
  workspace: Workspace;
  workspaces: Workspace[];
  onSelect: (workspace: Workspace) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<ActiveWorkspace workspace={workspace} />}
      ></DropdownMenuTrigger>
      <SidebarSeparator orientation="vertical" />
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => onSelect(item)}>
              {item.avatar && (
                <UserAvatar
                  user={{
                    name: item.name,
                    avatar: item.avatar,
                  }}
                />
              )}
              <span className="truncate">{item.name}</span>
              {item.id === workspace.id ? (
                <CheckIcon className="ml-auto size-3.5" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PlusIcon aria-hidden="true" />
            New workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const ActiveWorkspace = ({ workspace }: { workspace: Workspace }) => {
  return (
    <span className="min-w-0 flex-1 flex text-left leading-tight items-center justify-around ">
      <NamedIcon
        name={workspace.icon}
        className="size-4 shrink-0"
        aria-hidden="true"
      />
      <span className="truncate text-sm font-medium">{workspace.name}</span>
      <ChevronsUpDownIcon
        className="ml-auto opacity-60 hidden group-hover:block"
        aria-hidden="true"
      />
    </span>
  );
};
