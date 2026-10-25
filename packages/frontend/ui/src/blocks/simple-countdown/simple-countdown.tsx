'use client';

import { useCountdown } from '@synapcity/frontend-ui/hooks/use-countdown';
import { padTwo } from '@synapcity/frontend-ui/lib/duration';
import { cn } from '@synapcity/frontend-ui/lib/utils';

export interface SimpleCountdownProps {
  label?: string;
  /** The moment to count down to. Without one the time shows as dashes. */
  target?: Date | number;
  className?: string;
}

/** Hours, minutes and seconds left to `target`, ticking once a second. */
export function SimpleCountdown({
  label,
  target,
  className,
}: SimpleCountdownProps) {
  const { hours, minutes, seconds, ready } = useCountdown(target ?? Number.NaN);
  const parts =
    ready && target !== undefined
      ? [hours, minutes, seconds].map(padTwo)
      : ['--', '--', '--'];

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1">
        {label && (
          <span className="text-xs font-semibold text-muted-foreground">
            {label}
          </span>
        )}
        {/* A timer is not announced as it changes: a live region would read every second. */}
        <div
          role="timer"
          aria-label={label}
          className="text-3xl font-bold tabular-nums text-card-foreground"
        >
          {parts.map((part, index) => (
            <span key={index}>
              {index > 0 && (
                <span className="mx-1 text-muted-foreground">:</span>
              )}
              {part}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
