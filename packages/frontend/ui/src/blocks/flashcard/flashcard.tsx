'use client';

import { Brain } from 'lucide-react';
import { cn } from '@synapcity/frontend-ui/lib/utils';

interface Flashcard {
  front: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

interface FlashcardProps {
  deck?: string;
  due?: string;
  cards?: Flashcard[];
  bordered?: boolean;
  className?: string;
}

/* Each status is a tint of its token with ordinary text on it: `warning` and
   `info` are too light to be read as text on a pale tint. */
const statusClasses: Record<
  Flashcard['status'],
  { pill: string; label: string }
> = {
  new: {
    pill: 'bg-info/20 text-foreground',
    label: 'New',
  },
  learning: {
    pill: 'bg-warning/30 text-foreground',
    label: 'Learning',
  },
  review: {
    pill: 'bg-accent/30 text-foreground',
    label: 'Review',
  },
  mastered: {
    pill: 'bg-success/20 text-foreground',
    label: 'Mastered',
  },
};

export function Flashcard({
  deck,
  due,
  cards = [],
  bordered = false,
  className,
}: FlashcardProps) {
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
        <div className="flex items-center gap-2">
          <Brain className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col">
            {deck && (
              <span className="truncate text-sm font-semibold text-card-foreground">
                {deck}
              </span>
            )}
            {due && (
              <span className="truncate text-xs tabular-nums text-muted-foreground">
                {due}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col divide-y divide-border">
          {cards.map((c, idx) => {
            const s = statusClasses[c.status];
            return (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 text-xs"
              >
                <span className="font-serif text-sm italic text-card-foreground">
                  {c.front}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 font-semibold',
                    s.pill,
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
