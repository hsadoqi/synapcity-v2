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

interface EntityHeaderProps {
  name: string;
  description?: string;
  onNewDocument?: () => void;
  onNewDashboard?: () => void;
  onRename?: () => void;
  onArchive?: () => void;
}

export function EntityHeader({
  name,
  description,
  onNewDocument,
  onNewDashboard,
  onRename,
  onArchive,
}: EntityHeaderProps) {
  // Only actions the caller can carry out; a button that does nothing is worse than none.
  const quickActions = [
    {
      label: 'New document',
      onNew: onNewDocument,
      icon: FileText,
      variant: 'default' as const,
    },
    {
      label: 'New dashboard',
      onNew: onNewDashboard,
      icon: LayoutDashboard,
      variant: 'outline' as const,
    },
  ].filter(
    (action): action is typeof action & { onNew: () => void } =>
      action.onNew !== undefined,
  );
  const hasMoreActions = onRename !== undefined || onArchive !== undefined;

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

      {(quickActions.length > 0 || hasMoreActions) && (
      <div className="flex flex-wrap items-center gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            onClick={action.onNew}
          >
            <action.icon data-icon="inline-start" aria-hidden="true" />
            {action.label}
          </Button>
        ))}
        <EntityMoreActions onRename={onRename} onArchive={onArchive} />
      </div>
      )}
    </header>
  );
}

export function EntityMoreActions({
  onRename,
  onArchive,
}: {
  onRename?: () => void;
  onArchive?: () => void;
}) {
  // Only actions the caller can carry out; a menu item that does nothing is worse than none.
  const moreActions = [
    { label: 'Rename', onClick: onRename, icon: Pencil },
    { label: 'Archive', onClick: onArchive, icon: Archive },
  ].filter(
    (action): action is typeof action & { onClick: () => void } =>
      action.onClick !== undefined,
  );

  if (moreActions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="More actions"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        }
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {moreActions.map((action) => (
          <DropdownMenuItem key={action.label} onClick={action.onClick}>
            <action.icon aria-hidden="true" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
