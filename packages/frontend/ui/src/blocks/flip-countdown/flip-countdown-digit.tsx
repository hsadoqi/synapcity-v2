'use client';

import { useState } from 'react';
import type { AnimationEventHandler } from 'react';

import { cn } from '@synapcity/frontend-ui/lib/utils';

export interface HalfDigitProps {
  pos: 'top' | 'bottom';
  digit: string;
  /** Marks the half that folds, as opposed to the two that stay put. */
  flap?: boolean;
  className?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLSpanElement>;
}

export function HalfDigit({
  pos,
  digit,
  flap = false,
  className,
  onAnimationEnd,
}: HalfDigitProps) {
  return (
    <span
      data-flap={flap ? pos : undefined}
      className={cn(
        'absolute inset-x-0 h-5 overflow-hidden bg-card',
        pos === 'top' ? 'top-0 rounded-t-md' : 'bottom-0 rounded-b-md',
        className,
      )}
      onAnimationEnd={onAnimationEnd}
    >
      <span
        className={cn(
          'absolute inset-x-0 flex h-10 items-center justify-center text-2xl font-semibold tabular-nums',
          pos === 'top' ? 'top-0' : 'bottom-0',
        )}
      >
        {digit}
      </span>
    </span>
  );
}

/**
 * One digit that folds to its next value. The bottom half keeps the old digit
 * until the fold lands, and the digit settles when that fold ends. Reduced
 * motion shortens the fold (see motion.css) rather than removing it, so the
 * end event still arrives and the bottom half never stays on the old digit.
 */
export function FlipDigit({ value }: { value: string }) {
  const [pair, setPair] = useState({ cur: value, prev: value });
  if (pair.cur !== value) setPair({ cur: value, prev: pair.cur });
  const flipping = pair.cur !== pair.prev;

  const settle = () => setPair((p) => ({ cur: p.cur, prev: p.cur }));

  return (
    <span
      className="perspective-flip relative block h-10 w-7 rounded-md bg-card text-card-foreground shadow-sm"
      aria-hidden="true"
    >
      <HalfDigit pos="top" digit={pair.cur} />
      <HalfDigit pos="bottom" digit={pair.prev} />
      {flipping && (
        <>
          <HalfDigit
            key={`top-${pair.cur}`}
            flap
            pos="top"
            digit={pair.prev}
            className="origin-bottom animate-flip-top backface-hidden"
          />
          <HalfDigit
            key={`bottom-${pair.cur}`}
            flap
            pos="bottom"
            digit={pair.cur}
            className="origin-top animate-flip-bottom backface-hidden"
            onAnimationEnd={settle}
          />
        </>
      )}
      <span className="absolute inset-x-0 top-1/2 z-10 h-px bg-border" />
    </span>
  );
}

/** An empty digit, shown until the browser clock is known. */
export function BlankDigit() {
  return (
    <span
      className="block h-10 w-7 rounded-md bg-card shadow-sm"
      aria-hidden="true"
    />
  );
}
