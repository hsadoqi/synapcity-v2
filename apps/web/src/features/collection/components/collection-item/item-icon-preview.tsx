'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@synapcity/frontend-ui/core/hover-card';

import type { CollectionItem } from '../../shared';
import { ItemIcon } from './item-icon';

type ItemIconPreviewProps = {
  item: CollectionItem;
  icon: LucideIcon;
  /** Without it this is just the icon. */
  renderPreview?: (item: CollectionItem) => ReactNode;
};

/**
 * The item's icon, which shows a preview card when hovered. The preview only
 * repeats what the card or row and its page already say, so it is a
 * convenience for the mouse and nothing a keyboard or screen reader needs.
 */
export function ItemIconPreview({
  item,
  icon,
  renderPreview,
}: ItemIconPreviewProps) {
  const iconTile = <ItemIcon icon={icon} name={item.icon} />;
  if (!renderPreview) return iconTile;

  return (
    <HoverCard>
      <HoverCardTrigger render={<span className="shrink-0" />}>
        {iconTile}
      </HoverCardTrigger>
      <HoverCardContent align="start">{renderPreview(item)}</HoverCardContent>
    </HoverCard>
  );
}
