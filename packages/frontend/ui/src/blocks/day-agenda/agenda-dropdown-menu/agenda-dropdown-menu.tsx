import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import { IconButton } from '@synapcity/frontend-ui/components/icon-button';
import { Ellipsis } from 'lucide-react';
import type { ReactElement } from 'react';

export interface AgendaMenuItem {
  /** Also the accessible name of the item's toolbar button. */
  label: string;
  /**
   * With an icon, the item is a toolbar button once the agenda is wide enough
   * and folds into "More actions" below that. Without one, it is always in the menu.
   */
  icon?: ReactElement;
  onSelect?: () => void;
  disabled?: boolean;
  /** @default 'default' */
  variant?: 'default' | 'destructive';
}

/** The items shown when none are passed. They do nothing until given an `onSelect`. */
export const defaultAgendaMenuItems: readonly AgendaMenuItem[] = [
  { label: 'Theme' },
  { label: 'Settings' },
  { label: 'Help' },
];

export interface AgendaDropdownMenuProps {
  /** @default defaultAgendaMenuItems */
  items?: readonly AgendaMenuItem[];
  /** Opens the menu. @default a ghost "More actions" icon button */
  trigger?: ReactElement;
}

export const AgendaDropdownMenu = ({
  items = defaultAgendaMenuItems,
  trigger = (
    <IconButton size="sm" variant="ghost" aria-label="More actions">
      <Ellipsis className="size-4" />
    </IconButton>
  ),
}: AgendaDropdownMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={trigger} />
    <DropdownMenuContent align="end" sideOffset={8} side="right">
      {items.map((item) => (
        <DropdownMenuItem
          key={item.label}
          disabled={item.disabled}
          variant={item.variant}
          onClick={item.onSelect}
        >
          {item.icon}
          {item.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
