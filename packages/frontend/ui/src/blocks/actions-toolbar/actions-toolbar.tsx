'use client';

import { useRender } from '@base-ui/react/use-render';
import {
  DialogPortalContainer,
  type DialogContainerTarget,
} from '@synapcity/frontend-ui/blocks/dialog-portal-container';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { Cog, Ellipsis } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export interface ToolbarAction {
  /** The item's text, and the accessible name of its toolbar button. */
  label: string;
  /**
   * With an icon, the action is a toolbar button while the toolbar has room
   * and folds into "More actions" when it does not. Without one, it is always
   * in the menu.
   */
  icon?: ReactElement;
  onSelect?: () => void;
  disabled?: boolean;
  /** @default 'default' */
  variant?: 'default' | 'destructive';
}

export interface ToolbarSettings {
  title: string;
  description?: string;
  /** The settings body. */
  content?: ReactNode;
  /** Opens settings. @default a ghost cog icon button named "Settings" */
  trigger?: ReactElement;
  /**
   * - `'dialog'` (default): a dialog.
   * - `'view'`: calls `onOpenView`, so the host can show settings in place.
   * - `'auto'`: in place while the toolbar is cramped (under 16rem), a dialog
   *   once it has room: a cramped toolbar means a small host, where a dialog
   *   inside it would be cramped too.
   */
  presentation?: 'dialog' | 'view' | 'auto';
  /** Required for `'view'` and `'auto'`. */
  onOpenView?: () => void;
  /** Dialog only. @default true */
  modal?: boolean;
  /** Dialog only: where it renders. @default 'body' */
  container?: DialogContainerTarget;
}

export interface ActionsToolbarProps {
  actions?: readonly ToolbarAction[];
  settings?: ToolbarSettings;
  /** Host controls shown at every width, after the actions. */
  children?: ReactNode;
  /** Opens "More actions". @default a ghost ellipsis icon button */
  moreTrigger?: ReactElement;
  /** @default 'More actions' */
  moreLabel?: string;
  /** Layout classes for the toolbar's outer box. */
  className?: string;
}

/** The trigger with an added click handler, merged rather than replaced (Base UI `useRender`). */
function ViewTrigger({
  trigger,
  onOpen,
}: {
  trigger: ReactElement;
  onOpen?: () => void;
}) {
  return useRender({ render: trigger, props: { onClick: onOpen } });
}

function MoreMenu({
  actions,
  trigger,
}: {
  actions: readonly ToolbarAction[];
  trigger: ReactElement;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" sideOffset={8}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            variant={action.variant}
            onClick={action.onSelect}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/*
 * A toolbar that adapts to the room it is given, so any host (a dashboard
 * widget, the global panel, a page) gets the same behaviour without knowing
 * about it. Its outer box is the container (`@container/actions`), so it
 * measures its own space: give it `flex-1` in a header row.
 *
 * - From `@toolbar-icons` (8rem, a theme token: room for four icon buttons) up:
 *   actions with an icon are icon buttons, and "More actions" holds the rest
 *   (and is left out if there is none).
 * - Below: every action is in "More actions".
 * - Settings in `'auto'` is a separate question, whether the host is big enough
 *   for a dialog, so it keeps its own, larger threshold: `@3xs` (16rem).
 *
 * Menu content is portaled to `body`, outside the container, so a container
 * query cannot hide items inside an open menu. Instead there are two menus and
 * the query shows one trigger; a `display: none` trigger is out of the
 * accessibility tree and the tab order, so only one is ever reachable. The
 * same applies to the two settings triggers in `'auto'`.
 */
export function ActionsToolbar({
  actions = [],
  settings,
  children,
  moreTrigger,
  moreLabel = 'More actions',
  className,
}: ActionsToolbarProps) {
  const iconActions = actions.filter((action) => action.icon);
  const menuActions = actions.filter((action) => !action.icon);
  const more = moreTrigger ?? (
    <IconButton size="sm" variant="ghost" aria-label={moreLabel}>
      <Ellipsis className="size-4" />
    </IconButton>
  );
  const presentation = settings?.presentation ?? 'dialog';
  const settingsTrigger = settings?.trigger ?? (
    <IconButton size="sm" variant="ghost" aria-label="Settings">
      <Cog className="size-4" />
    </IconButton>
  );

  return (
    <div
      data-slot="actions-toolbar"
      className={cn('@container/actions min-w-0', className)}
    >
      <div className="flex items-center justify-end gap-1">
        {iconActions.map((action) => (
          <IconButton
            key={action.label}
            size="sm"
            variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
            aria-label={action.label}
            disabled={action.disabled}
            onClick={action.onSelect}
            className="hidden @toolbar-icons/actions:inline-flex"
          >
            {action.icon}
          </IconButton>
        ))}
        {settings && presentation !== 'view' && (
          <div
            data-slot="actions-toolbar-settings-dialog"
            className={cn(
              presentation === 'auto' && 'hidden @3xs/actions:block',
            )}
          >
            <DialogPortalContainer
              title={settings.title}
              description={settings.description}
              trigger={settingsTrigger}
              modal={settings.modal ?? true}
              container={settings.container ?? 'body'}
              scrollable
            >
              {settings.content}
            </DialogPortalContainer>
          </div>
        )}
        {settings && presentation !== 'dialog' && (
          <div
            data-slot="actions-toolbar-settings-view"
            className={cn(presentation === 'auto' && '@3xs/actions:hidden')}
          >
            <ViewTrigger
              trigger={settingsTrigger}
              onOpen={settings.onOpenView}
            />
          </div>
        )}
        {children}
        {actions.length > 0 && (
          <div
            data-slot="actions-toolbar-more-compact"
            className="@toolbar-icons/actions:hidden"
          >
            <MoreMenu actions={actions} trigger={more} />
          </div>
        )}
        {menuActions.length > 0 && (
          <div
            data-slot="actions-toolbar-more-wide"
            className="hidden @toolbar-icons/actions:block"
          >
            <MoreMenu actions={menuActions} trigger={more} />
          </div>
        )}
      </div>
    </div>
  );
}
