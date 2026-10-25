'use client';

import { useRef, type KeyboardEvent } from 'react';

import { wordFor } from '@/lib/runs/words';
import type { ScaleStep } from '@/lib/runs/schema';
import { cn } from '@/lib/utils';

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Props = {
  step: ScaleStep;
  value: number | undefined;
  onChange: (value: number) => void;
};

/** A 1 to 10 rating. Click, arrow through it, or press 1 to 9 (0 for 10) from anywhere on the step. */
export function ScaleControl({ step, value, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabStop = value ?? 1;

  const move = (to: number) => {
    const next = Math.min(10, Math.max(1, to));
    onChange(next);
    refs.current[next - 1]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const current = value ?? 0;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault();
        move(current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault();
        move(current === 0 ? 1 : current - 1);
        break;
      case 'Home':
        event.preventDefault();
        move(1);
        break;
      case 'End':
        event.preventDefault();
        move(10);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-baseline gap-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="font-light text-primary tabular-nums text-7xl leading-none sm:text-8xl">
          {value ?? '–'}
        </span>
        <span className="text-lg text-muted-foreground">
          {value
            ? wordFor(step.wordSet, value)
            : 'Pick a number, or press 1 to 0'}
          {value ? <span className="sr-only"> out of 10</span> : null}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={`${step.label}, 1 to 10`}
        onKeyDown={onKeyDown}
        className="grid max-w-[34rem] grid-cols-5 gap-1 sm:grid-cols-10"
      >
        {NUMBERS.map((n) => {
          const checked = value === n;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={`${n} of 10`}
              tabIndex={n === tabStop ? 0 : -1}
              onClick={() => onChange(n)}
              className={cn(
                'sweep h-12 rounded-sm border text-lg font-medium tabular-nums transition-colors',
                checked
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-transparent text-foreground hover:border-primary',
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
