import { cn } from '@/lib/utils';
import type { FontRole } from '../../../types/fonts';

const roleStyles: Record<FontRole, string> = {
  heading: 'font-heading text-xl font-semibold tracking-tight',
  body: 'font-body text-base',
  code: 'font-code text-sm',
};

const roleNames: Record<FontRole, string> = {
  heading: 'Heading',
  body: 'Body',
  code: 'Code',
};

/**
 * One sentence set in the font the role currently uses. It reads the same
 * `--font-*` role tokens the rest of the app does, so it shows exactly what a
 * choice will look like. The dashed, indented frame and the "Preview" label
 * mark it as a sample, not content.
 */
export function FontPreview({
  role,
  children,
}: {
  role: FontRole;
  children: string;
}) {
  return (
    <figure
      aria-label={`${roleNames[role]} font preview`}
      className="ms-4 flex flex-col gap-1.5 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3"
    >
      <figcaption className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </figcaption>
      <p className={cn('text-foreground', roleStyles[role])}>{children}</p>
    </figure>
  );
}
