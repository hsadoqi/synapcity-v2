import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@synapcity/frontend-ui/core/sidebar';
import {
  PlusIcon,
  FolderIcon,
  MoreHorizontalIcon,
  CopyIcon,
  ArchiveIcon,
} from 'lucide-react';
import { PROJECTS } from '../data';

export function ProjectNav() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupAction type="button">
        <PlusIcon aria-hidden="true" />
        <span className="sr-only">New project</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu>
          {PROJECTS.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton render={<a href="#" />}>
                <FolderIcon aria-hidden="true" />
                <span>{project.name}</span>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuAction
                      showOnHover
                      aria-label={`Actions for ${project.name}`}
                    />
                  }
                >
                  <MoreHorizontalIcon aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>
                      <CopyIcon aria-hidden="true" />
                      Duplicate
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <ArchiveIcon aria-hidden="true" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
