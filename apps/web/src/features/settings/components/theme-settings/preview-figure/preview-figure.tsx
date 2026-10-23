import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/**
 * The frame every Theme row sample sits in: dashed, indented and captioned
 * "Preview", so it reads as a sample of the choice above it, not content. The
 * caption stays outside `sampleProps`, so a sample that scales its own text
 * (text size) never scales the caption with it.
 */
export function PreviewFigure({
  label,
  style,
  sampleProps,
  children,
}: {
  /** The figure's accessible name, e.g. "Body font preview". */
  label: string;
  /** Runtime values the sample needs (a chosen font), set on the frame. */
  style?: CSSProperties;
  /** Attributes for the sample's own box, e.g. a draft text size. */
  sampleProps?: HTMLAttributes<HTMLDivElement> &
    Record<`data-${string}`, string>;
  children: ReactNode;
}) {
  return (
    <figure
      aria-label={label}
      className="ms-4 flex flex-col gap-1.5 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3"
      style={style}
    >
      <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </figcaption>
      <div className="flex flex-col gap-1.5" {...sampleProps}>
        {children}
      </div>
    </figure>
  );
}
