import { ActionsToolbar } from '@synapcity/frontend-ui/blocks/actions-toolbar';
import type { DialogContainerTarget } from '@synapcity/frontend-ui/blocks/dialog-portal-container';
import {
  defaultAgendaMenuItems,
  type AgendaMenuItem,
} from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dropdown-menu';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import { Cog } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export interface AgendaActionsMenuProps {
  /** @default true, the same as DayAgenda and AgendaDialog */
  modal?: boolean;
  /** @default 'body' */
  container?: DialogContainerTarget;
  title: string;
  description: string;
  /** Opens settings. @default a ghost cog icon button named "Agenda settings" */
  trigger?: ReactElement;
  /** Settings body. */
  children?: ReactNode;
  /** Toolbar and "More actions" items. @default Theme, Settings and Help */
  menuItems?: readonly AgendaMenuItem[];
  /**
   * How the settings trigger opens settings.
   * - `'dialog'` (default): opens the settings dialog.
   * - `'view'`: calls `onOpenSettingsView`, so the owner can show settings in place.
   * - `'auto'`: in place while the toolbar is cramped (under 16rem), a dialog once it has room.
   */
  settingsPresentation?: 'dialog' | 'view' | 'auto';
  /** Required for `'view'` and `'auto'`. */
  onOpenSettingsView?: () => void;
}

/**
 * The agenda's toolbar: the shared ActionsToolbar with the agenda's defaults
 * (its cog, its menu items). It takes the space left in the header row and
 * folds by that space, so it needs no container from its host.
 */
export const AgendaActionsMenu = ({
  modal = true,
  container = 'body',
  title,
  description,
  trigger = (
    <IconButton size="sm" variant="ghost" aria-label="Agenda settings">
      <Cog className="size-4" />
    </IconButton>
  ),
  children,
  menuItems = defaultAgendaMenuItems,
  settingsPresentation = 'dialog',
  onOpenSettingsView,
}: AgendaActionsMenuProps) => (
  <ActionsToolbar
    className="flex-1"
    actions={menuItems}
    settings={{
      title,
      description,
      // Without a body, the same placeholder rows as AgendaDialog, so the
      // scrolling layout still shows.
      content: (
        <div
          data-testid="day-agenda-content"
          className="flex flex-col gap-2 pr-3 text-sm font-medium text-muted-foreground"
        >
          {children ??
            Array.from({ length: 24 }, (_, i) => (
              <p key={i}>Settings content goes here.</p>
            ))}
        </div>
      ),
      trigger,
      presentation: settingsPresentation,
      onOpenView: onOpenSettingsView,
      modal,
      container,
    }}
  />
);
