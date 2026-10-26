'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';

interface Highlight {
  text: string;
  /** What the highlight marks, shown as a tint of the matching token. */
  tone: 'warning' | 'info' | 'success' | 'destructive';
}

interface LessonHighlightsProps {
  lesson?: string;
  highlights?: Highlight[];
  note?: string;
  bordered?: boolean;
  className?: string;
}

const toneClasses: Record<Highlight['tone'], string> = {
  warning: 'bg-warning/30 text-foreground',
  info: 'bg-info/20 text-foreground',
  success: 'bg-success/20 text-foreground',
  destructive: 'bg-destructive/15 text-foreground',
};

export function LessonHighlights({
  lesson,
  highlights = [],
  note,
  bordered = false,
  className,
}: LessonHighlightsProps) {
  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-80 flex-col gap-2 rounded-xl bg-card p-3 shadow-sm',
          bordered && 'border border-border',
        )}
      >
        {lesson && (
          <span className="text-xs font-semibold text-muted-foreground">
            {lesson}
          </span>
        )}
        <div className="flex flex-col gap-1.5">
          {highlights.map((h, idx) => (
            <span
              key={idx}
              className={cn(
                'rounded px-2 py-1 text-xs leading-snug',
                toneClasses[h.tone],
              )}
            >
              {h.text}
            </span>
          ))}
        </div>
        {note && (
          <span className="border-t border-dashed border-border pt-2 text-xs italic text-muted-foreground">
            {note}
          </span>
        )}
      </div>
    </div>
  );
}
