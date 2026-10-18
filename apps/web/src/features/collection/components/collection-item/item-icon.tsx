import type { LucideIcon } from 'lucide-react';

/** The consumer's resource icon in a muted tile, at the start of a card or row. */
export function ItemIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
    >
      <Icon className="size-4" />
    </span>
  );
}
