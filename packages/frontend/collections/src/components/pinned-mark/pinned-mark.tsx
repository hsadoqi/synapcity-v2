import { Pin } from 'lucide-react';

/** A quiet marker that the item is pinned; it is not a control. */
export function PinnedMark() {
  return (
    <Pin
      role="img"
      aria-label="Pinned"
      className="size-3.5 shrink-0 text-muted-foreground"
    />
  );
}
