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

const ALL_ACTIONS: CollectionItemAction[] = [
  'open',
  'rename',
  'toggle-pin',
  'duplicate',
  'delete',
];

type ItemActionsMenuProps = {
  item: CollectionItem;
  singular: string;
  onAction: (action: CollectionItemAction, item: CollectionItem) => void;
  /** Which actions to offer. Omit for all of them; an empty list hides the menu. */
  actions?: CollectionItemAction[];
};

export function ItemActionsMenu({
  item,
  singular,
  onAction,
  actions = ALL_ACTIONS,
}: ItemActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const offers = (action: CollectionItemAction) => actions.includes(action);
  const offersEdits =
    offers('open') ||
    offers('rename') ||
    offers('toggle-pin') ||
    offers('duplicate');

  if (actions.length === 0) return null;

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
          {offersEdits && (
            <DropdownMenuGroup>
              {offers('open') && (
                <DropdownMenuItem onClick={() => onAction('open', item)}>
                  <ExternalLink aria-hidden="true" />
                  Open
                </DropdownMenuItem>
              )}
              {offers('rename') && (
                <DropdownMenuItem onClick={() => onAction('rename', item)}>
                  <Pencil aria-hidden="true" />
                  Rename
                </DropdownMenuItem>
              )}
              {offers('toggle-pin') && (
                <DropdownMenuItem
                  onClick={() => onAction('toggle-pin', item)}
                >
                  {item.pinned ? (
                    <PinOff aria-hidden="true" />
                  ) : (
                    <Pin aria-hidden="true" />
                  )}
                  {item.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
              )}
              {offers('duplicate') && (
                <DropdownMenuItem onClick={() => onAction('duplicate', item)}>
                  <Copy aria-hidden="true" />
                  Duplicate
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          )}
          {offersEdits && offers('delete') && <DropdownMenuSeparator />}
          {offers('delete') && (
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {offers('delete') && (
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
      )}
    </>
  );
}
