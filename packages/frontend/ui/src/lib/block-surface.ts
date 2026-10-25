import { cn } from '@synapcity/frontend-ui/lib/utils';

export type BlockSurface = 'card' | 'glass';

/* Inversion re-scopes the theme instead of swapping colours. `theme-dark` and
   `theme-light` redefine every semantic token on the element, so `bg-card`,
   `text-card-foreground` and `current` all resolve against the opposite mode
   inside it. `theme-dark dark:theme-light` is "the opposite of whatever mode
   this is": `dark:` matches a `.dark` ancestor or a dark system preference (see
   tokens/variants.css), so it stays CSS-only: no effect, no ref, no DOM writes.
   `glass` is a deliberate exception to the solid-surface rule: these pieces sit
   over section background images, and a frosted panel is the point of it. */
export const surfaceClasses: Record<BlockSurface, string> = {
  card: 'bg-card text-card-foreground',
  glass: 'bg-card/60 text-card-foreground backdrop-blur-md',
};

export const invertedClasses = 'theme-dark dark:theme-light';

export interface BlockSurfaceOptions {
  surface?: BlockSurface;
  inverted?: boolean;
  bordered?: boolean;
  className?: string;
}

/** The classes for one surface: the card or glass, optionally inverted and bordered. */
export function blockSurface({
  surface = 'card',
  inverted = false,
  bordered = false,
  className,
}: BlockSurfaceOptions) {
  return cn(
    inverted && invertedClasses,
    surfaceClasses[surface],
    bordered && 'border border-border/15',
    className,
  );
}
