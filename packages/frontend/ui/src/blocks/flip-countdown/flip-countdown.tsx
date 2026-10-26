'use client';

import { useEffect, useState } from 'react';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { padTime, parseDuration } from '@synapcity/frontend-ui/lib/countdown';
import { LABELS } from './flip-countdown.utils';
import { FlipDigit } from './flip-countdown-digit';
import type { FlipCountdownProps } from './flip-countdown.types';

export function FlipCountdown({
  title = 'Starts in',
  start,
  caption,
  holdMs = 2500,
  className,
}: FlipCountdownProps) {
  const curTime = new Date().toTimeString().split(' ')[0];
  const timeStr = ((start && typeof start === 'string') ?? curTime) as string;
  // TODO: Extract into reusable hook date-time functionality across similar components.
  const total = parseDuration(timeStr);
  const [remaining, setRemaining] = useState(total);

  useEffect(() => {
    const id = setTimeout(
      () => setRemaining((r) => (r > 0 ? r - 1 : total)),
      remaining === 0 ? holdMs : 1000,
    );
    return () => clearTimeout(id);
  }, [remaining, total, holdMs]);

  const digits = [
    padTime(remaining / 3600),
    padTime((remaining % 3600) / 60),
    padTime(remaining % 60),
  ];

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div className="flex w-full max-w-80 flex-col items-center gap-3 rounded-xl bg-foreground p-4 text-background shadow-md">
        <p className="text-sm opacity-70">{title}</p>
        <span className="sr-only">{digits.join(':')}</span>

        <div className="flex items-start gap-2" aria-hidden="true">
          {digits.map((group, gi) => (
            <div key={gi} className="contents">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex gap-0.5">
                  {group.split('').map((d, di) => (
                    <FlipDigit key={di} value={d} />
                  ))}
                </div>
                <span className="text-xs opacity-60">{LABELS[gi]}</span>
              </div>
              {gi < digits.length - 1 && (
                <span className="flex h-10 items-center text-xl font-semibold opacity-60">
                  :
                </span>
              )}
            </div>
          ))}
        </div>

        {caption && (
          <p className="text-center text-xs leading-relaxed opacity-60">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
