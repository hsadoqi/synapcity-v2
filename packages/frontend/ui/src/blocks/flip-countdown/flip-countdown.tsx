'use client';

import { useState } from 'react';

import { useCountdown } from '@synapcity/frontend-ui/hooks/use-countdown';
import { useNow } from '@synapcity/frontend-ui/hooks/use-now';
import {
  padTwo,
  parseClockDuration,
} from '@synapcity/frontend-ui/lib/duration';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { BlankDigit, FlipDigit } from './flip-countdown-digit';

const LABELS = ['hours', 'minutes', 'seconds'] as const;
const DEFAULT_START_SECONDS = 15 * 60;

export interface FlipCountdownProps {
  title?: string;
  /**
   * `HH:MM:SS`. Counts down, holds at zero for `holdMs`, then starts over.
   * Ignored when `target` is set. Anything unreadable, or nothing, is fifteen minutes.
   */
  start?: string;
  /** A moment to count down to. Counts once and stays at zero. */
  target?: Date | number;
  caption?: string;
  /** How long the loop holds at zero, rounded up to a whole second. */
  holdMs?: number;
  className?: string;
}

/**
 * The moment the current lap of a looping countdown ends. Laps are whole seconds
 * long, counted from when the clock first became known.
 */
function useLoopTarget(durationMs: number, holdMs: number): number {
  const now = useNow();
  const [anchor, setAnchor] = useState<number | null>(null);
  if (anchor === null && now !== null) setAnchor(now);
  if (anchor === null || now === null) return 0;

  const hold = Number.isFinite(holdMs) ? Math.max(0, holdMs) : 0;
  const lapMs = durationMs + Math.ceil(hold / 1000) * 1000;
  if (lapMs === 0) return anchor;
  return anchor + Math.floor((now - anchor) / lapMs) * lapMs + durationMs;
}

export function FlipCountdown({
  title = 'Starts in',
  start,
  target,
  caption,
  holdMs = 2500,
  className,
}: FlipCountdownProps) {
  const startSeconds =
    (start === undefined ? null : parseClockDuration(start)) ??
    DEFAULT_START_SECONDS;
  const loopTarget = useLoopTarget(startSeconds * 1000, holdMs);
  const { hours, minutes, seconds, ready } = useCountdown(target ?? loopTarget);
  const digits = [hours, minutes, seconds].map(padTwo);

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <div
        role="timer"
        aria-label={title}
        className="flex w-full max-w-80 flex-col items-center gap-3 rounded-xl bg-foreground p-4 text-background shadow-md"
      >
        <p className="text-sm opacity-70">{title}</p>
        <span className="sr-only">{ready ? digits.join(':') : ''}</span>

        <div className="flex items-start gap-2" aria-hidden="true">
          {digits.map((group, gi) => (
            <div key={LABELS[gi]} className="contents">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex gap-0.5">
                  {group
                    .split('')
                    .map((d, di) =>
                      ready ? (
                        <FlipDigit key={di} value={d} />
                      ) : (
                        <BlankDigit key={di} />
                      ),
                    )}
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
