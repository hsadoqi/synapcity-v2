'use client';

import { useState } from 'react';
import {
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import type { CollectionItem, CollectionItemAction } from '../../shared';
import { ConfirmDialog } from '@synapcity/frontend-ui/components/confirm-dialog';

type ItemActionsMenuProps = {
  item: CollectionItem;
  singular: string;
  onAction: (action: CollectionItemAction, item: CollectionItem) => void;
};

export function ItemActionsMenu({
  item,
  singular,
  onAction,
}: ItemActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${item.title}`}
              className="relative"
            />
          }
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => onAction('open', item)}>
              <ExternalLink aria-hidden="true" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('rename', item)}>
              <Pencil aria-hidden="true" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('toggle-pin', item)}>
              {item.pinned ? (
                <PinOff aria-hidden="true" />
              ) : (
                <Pin aria-hidden="true" />
              )}
              {item.pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('duplicate', item)}>
              <Copy aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        variant="destructive"
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete “${item.title}”?`}
        description={`This ${singular} will be deleted permanently. This can’t be undone.`}
        confirmText={`Delete ${singular}`}
        cancelText="Keep it"
        onConfirm={() => onAction('delete', item)}
      />
    </>
  );
}
