/** The backdrop a block sits on: a solid card or translucent glass. */
export type Surface = 'card' | 'glass';

/* The block sets the colour and everything inside it is drawn in `current`, so
   inverting is two classes rather than a condition on every element.
   `glass` is a deliberate exception to the solid-surface rule: these pieces sit
   over section background images, and a frosted panel is the point of it. */
export const surfaceClasses: Record<
  Surface,
  { plain: string; inverted: string }
> = {
  card: {
    plain: 'bg-card text-card-foreground',
    inverted: 'bg-foreground text-background',
  },
  glass: {
    plain: 'bg-card/60 text-card-foreground backdrop-blur-md',
    inverted: 'bg-foreground/60 text-background backdrop-blur-md',
  },
};
