import type { LucideIcon } from 'lucide-react';

import { EntityIcon } from '../entity-icon';

type ItemIconProps = {
  /** The consumer's resource icon, used when the item has no icon of its own. */
  icon: LucideIcon;
  /** The item's own stored icon name, such as 'pen-line'. */
  name?: string;
};

/** The item's icon in a muted tile, at the start of a card or row. */
export function ItemIcon({ icon: Icon, name }: ItemIconProps) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
    >
      {name ? (
        <EntityIcon name={name} className="size-4" />
      ) : (
        <Icon className="size-4" />
      )}
    </span>
  );
}
