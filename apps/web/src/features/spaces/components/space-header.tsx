'use client';

import {
  Archive,
  FileText,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

interface SpaceHeaderProps {
  name: string;
  description?: string;
  onNewDocument?: () => void;
  onNewDashboard?: () => void;
  onRename?: () => void;
  onArchive?: () => void;
}

export function SpaceHeader({
  name,
  description,
  onNewDocument,
  onNewDashboard,
  onRename,
  onArchive,
}: SpaceHeaderProps) {
  const spaceQuickActions = [
    {
      label: 'New document',
      onNew: onNewDocument || (() => {}),
      icon: FileText,
    },
    {
      label: 'New dashboard',
      onNew: onNewDashboard || (() => {}),
      icon: LayoutDashboard,
    },
  ];

  const spaceMoreActions = [
    {
      label: 'Rename',
      onClick: onRename || (() => {}),
      icon: Pencil,
    },
    {
      label: 'Archive',
      onClick: onArchive || (() => {}),
      icon: Archive,
    },
  ];
  return (
    <header className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          {name}
        </h1>
        {description && (
          <p className="text-muted-foreground text-pretty">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {spaceQuickActions.map((action) => (
          <Button key={action.label} onClick={action.onNew}>
            <action.icon data-icon="inline-start" aria-hidden="true" />
            {action.label}
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="More space actions"
              />
            }
          >
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {spaceMoreActions.map((action) => (
              <DropdownMenuItem key={action.label} onClick={action.onClick}>
                <action.icon aria-hidden="true" />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
