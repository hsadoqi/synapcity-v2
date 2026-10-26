'use client';

import { cn } from '@synapcity/frontend-ui/lib/utils';
import { CSSProperties, useState } from 'react';

export interface HalfDigitProps {
  pos: 'top' | 'bottom';
  digit: string;
  className?: string;
  style?: CSSProperties;
}

export function HalfDigit({ pos, digit, className, style }: HalfDigitProps) {
  return (
    <span
      className={cn(
        'absolute inset-x-0 h-5 overflow-hidden bg-card',
        pos === 'top' ? 'top-0 rounded-t-md' : 'bottom-0 rounded-b-md',
        className,
      )}
      style={style}
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

export function FlipDigit({ value }: { value: string }) {
  const [pair, setPair] = useState({ cur: value, prev: value });
  if (pair.cur !== value) setPair({ cur: value, prev: pair.cur });
  const flipping = pair.cur !== pair.prev;

  return (
    <span
      className="relative block h-10 w-7 rounded-md bg-card text-card-foreground shadow-sm"
      style={{ perspective: '8rem' }}
      aria-hidden="true"
    >
      <HalfDigit pos="top" digit={pair.cur} />
      <HalfDigit pos="bottom" digit={pair.prev} />
      {flipping && (
        <>
          <HalfDigit
            key={`top-${pair.cur}`}
            pos="top"
            digit={pair.prev}
            className="origin-bottom backface-hidden motion-reduce:hidden"
            style={{ animation: 'event13-flip-top 280ms ease-in forwards' }}
          />
          <HalfDigit
            key={`bottom-${pair.cur}`}
            pos="bottom"
            digit={pair.cur}
            className="origin-top backface-hidden motion-reduce:hidden"
            style={{
              animation: 'event13-flip-bottom 280ms ease-out 280ms both',
            }}
          />
        </>
      )}
      <span className="absolute inset-x-0 top-1/2 z-10 h-px bg-border" />
    </span>
  );
}
