'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  surfaceClasses,
  type Surface,
} from '@synapcity/frontend-ui/lib/surface';

type StyleProps = {
  surface?: Surface;
  bordered?: boolean;
  inverted?: boolean;
};

export interface DatePillProps extends StyleProps {
  className?: string;
  relative?: string;
  weekday?: string;
  date?: string;
  time?: string;
}

/* The card sets the colour and everything inside it is drawn in `current`, so
   inverting is two classes rather than a condition on every element.
   `glass` is a deliberate exception to the solid-surface rule: these pieces sit
   over section background images, and a frosted panel is the point of it. */

export const datePillDemo: DatePillProps = {
  surface: 'card',
  bordered: false,
  inverted: false,
  weekday: 'Thu',
  date: 'Apr 23',
  time: '14:00',
  relative: 'Today',
};

export function DatePill({
  weekday,
  date,
  time,
  relative,
  surface = 'card',
  bordered = false,
  inverted = false,
  className,
}: DatePillProps) {
  const surfaceTone = surfaceClasses[surface][inverted ? 'inverted' : 'plain'];

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div
        className={cn(
          'truncate inline-flex items-center gap-3 rounded-full px-4 py-1.5 pl-2 shadow-sm',
          surfaceTone,
          bordered && 'border border-current/15',
        )}
      >
        {relative && (
          <>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {relative}
            </span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
          </>
        )}
        {weekday && (
          <span className="text-xs font-semibold text-current/60">
            {weekday}
          </span>
        )}
        {date && <span className="text-sm font-bold">{date}</span>}
        {time && (
          <>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="text-sm text-current/60">{time}</span>
          </>
        )}
      </div>
    </div>
  );
}
