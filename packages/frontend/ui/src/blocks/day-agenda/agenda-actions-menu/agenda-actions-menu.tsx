import type { DialogContainerTarget } from '@synapcity/frontend-ui/blocks/dialog-portal-container';
import { AgendaDialog } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dialog';
import {
  AgendaDropdownMenu,
  defaultAgendaMenuItems,
  type AgendaMenuItem,
} from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dropdown-menu';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import { useRender } from '@base-ui/react/use-render';
import { Cog } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import type { ReactElement, ReactNode } from 'react';

export interface AgendaActionsMenuProps {
  /** @default true, the same as DayAgenda and AgendaDialog */
  modal?: boolean;
  /** @default 'body' */
  container?: DialogContainerTarget;
  title: string;
  description: string;
  /** Opens the settings dialog. @default a ghost cog icon button */
  trigger?: ReactElement;
  /** Settings dialog body. */
  children?: ReactNode;
  /** Toolbar and "More actions" items. @default Theme, Settings and Help */
  menuItems?: readonly AgendaMenuItem[];
  /**
   * How the settings trigger opens settings.
   * - `'dialog'` (default): opens the settings dialog.
   * - `'view'`: calls `onOpenSettingsView`, so the owner can show settings in place.
   * - `'auto'`: in place while the agenda is narrower than `@sm` (24rem), a dialog from there up.
   */
  settingsPresentation?: 'dialog' | 'view' | 'auto';
  /** Required for `'view'` and `'auto'`. */
  onOpenSettingsView?: () => void;
}

/** The trigger element with an added click handler, merged rather than replaced (Base UI `useRender`). */
function ViewTrigger({
  trigger,
  onOpen,
}: {
  trigger: ReactElement;
  onOpen?: () => void;
}) {
  return useRender({ render: trigger, props: { onClick: onOpen } });
}

/*
 * A toolbar that adapts to the width of the agenda it sits in, not the window:
 * the agenda card is an `@container/agenda`, so the same card in a narrow
 * dashboard cell and a wide page behaves correctly in both.
 *
 * - From `@sm` (24rem) up: items with an icon are icon buttons, and "More
 *   actions" holds only the items without one (and is left out if none).
 * - Below `@sm`: every item is in "More actions".
 *
 * The menu content is portaled to `body`, outside the container, so a
 * container query cannot hide items inside it. Instead there are two menus,
 * and the query shows one trigger: a hidden (`display: none`) trigger is out of
 * the accessibility tree and the tab order, so only one is ever reachable.
 *
 * The settings cog stays in the toolbar at every width.
 */
export const AgendaActionsMenu = ({
  modal = true,
  container = 'body',
  trigger = (
    <IconButton size="sm" variant="ghost" aria-label="Agenda settings">
      <Cog className="size-4" />
    </IconButton>
  ),
  menuItems = defaultAgendaMenuItems,
  settingsPresentation = 'dialog',
  onOpenSettingsView,
  ...props
}: AgendaActionsMenuProps) => {
  const toolbarItems = menuItems.filter((item) => item.icon);
  const overflowItems = menuItems.filter((item) => !item.icon);
  return (
    <div className="flex items-center gap-1">
      {toolbarItems.map((item) => (
        <IconButton
          key={item.label}
          size="sm"
          variant={item.variant === 'destructive' ? 'destructive' : 'ghost'}
          aria-label={item.label}
          disabled={item.disabled}
          onClick={item.onSelect}
          className="hidden @sm/agenda:inline-flex"
        >
          {item.icon}
        </IconButton>
      ))}
      {settingsPresentation !== 'view' && (
        // In `'auto'`, the dialog is the wide trigger; below `@sm` the view
        // trigger shows instead. Only one is displayed, so only one is reachable.
        <div
          className={cn(
            settingsPresentation === 'auto' && 'hidden @sm/agenda:block',
          )}
        >
          <AgendaDialog
            {...props}
            trigger={trigger}
            modal={modal}
            container={container}
          />
        </div>
      )}
      {settingsPresentation !== 'dialog' && (
        <div
          className={cn(settingsPresentation === 'auto' && '@sm/agenda:hidden')}
        >
          <ViewTrigger trigger={trigger} onOpen={onOpenSettingsView} />
        </div>
      )}
      <div data-slot="agenda-menu-compact" className="@sm/agenda:hidden">
        <AgendaDropdownMenu items={menuItems} />
      </div>
      {overflowItems.length > 0 && (
        <div data-slot="agenda-menu-wide" className="hidden @sm/agenda:block">
          <AgendaDropdownMenu items={overflowItems} />
        </div>
      )}
    </div>
  );
};
