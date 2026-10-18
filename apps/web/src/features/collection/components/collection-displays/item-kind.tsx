import { File, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { CollectionItem } from '../../shared';

/** How a consumer shows one kind of item: its icon and its name. */
export type CollectionKind = { icon: LucideIcon; label: string };

/** The consumer's kinds, keyed by `CollectionItem.kind`. */
export type CollectionKinds = Record<string, CollectionKind>;

const UNKNOWN_KIND: CollectionKind = { icon: File, label: 'Item' };

/** The item's kind, or a neutral one when the consumer did not describe it. */
export function kindOf(item: CollectionItem, kinds: CollectionKinds) {
  return (item.kind && kinds[item.kind]) || UNKNOWN_KIND;
}

export function ItemKindIcon({
  kind,
  className,
}: {
  kind: CollectionKind;
  className?: string;
}) {
  const Icon = kind.icon;
  return (
    <Icon
      aria-hidden="true"
      className={cn('size-4 text-muted-foreground', className)}
    />
  );
}

/** The kind's icon in a bordered tile, with its name for screen readers. */
export function ItemKindTile({
  kind,
  size = 'sm',
}: {
  kind: CollectionKind;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-sm border border-border bg-background',
        size === 'sm' && 'size-8',
        size === 'md' && 'size-10',
      )}
    >
      <ItemKindIcon kind={kind} />
      <span className="sr-only">{kind.label}</span>
    </span>
  );
}
