'use client';

import { Check } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import type { PickStep } from '@/lib/runs/schema';
import { cn } from '@/lib/utils';

type Props = {
  step: PickStep;
  options: string[];
  picked: string[];
  onToggle: (option: string) => void;
  onAddCustom: (option: string) => void;
};

/**
 * Pick one is a radio group (arrows move and select). Pick several is a group of checkboxes
 * (arrows move focus, space toggles) with a visible count, so the two never look alike.
 */
export function PickControl({
  step,
  options,
  picked,
  onToggle,
  onAddCustom,
}: Props) {
  const single = step.max === 1;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstPicked = options.findIndex((o) => picked.includes(o));
  const [active, setActive] = useState(firstPicked >= 0 ? firstPicked : 0);
  const tabStop = Math.min(active, options.length - 1);
  const full = !single && picked.length >= step.max;
  const customId = useId();
  const hintId = useId();

  const focusAt = (index: number) => {
    const next = (index + options.length) % options.length;
    setActive(next);
    refs.current[next]?.focus();
    return next;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = refs.current.findIndex((el) => el === document.activeElement);
    if (index < 0) return;
    let next: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight')
      next = focusAt(index + 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
      next = focusAt(index - 1);
    else if (event.key === 'Home') next = focusAt(0);
    else if (event.key === 'End') next = focusAt(options.length - 1);
    else if (event.key === ' ') {
      event.preventDefault();
      const option = options[index];
      if (option) onToggle(option);
      return;
    }
    if (next === null) return;
    event.preventDefault();
    const option = options[next];
    if (single && option && !picked.includes(option)) onToggle(option);
  };

  const hint = single
    ? 'Choose one'
    : full
      ? `${picked.length} of ${step.max} chosen. Unselect one to change.`
      : `Choose up to ${step.max}. ${picked.length} of ${step.max} chosen.`;

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <div
        role={single ? 'radiogroup' : 'group'}
        aria-label={step.label}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
        className="flex flex-col"
      >
        {options.map((option, index) => {
          const checked = picked.includes(option);
          const blocked = full && !checked;
          return (
            <button
              key={option}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role={single ? 'radio' : 'checkbox'}
              aria-checked={checked}
              aria-disabled={blocked || undefined}
              tabIndex={index === tabStop ? 0 : -1}
              onFocus={() => setActive(index)}
              onClick={() => {
                if (!blocked) onToggle(option);
              }}
              className={cn(
                'sweep flex min-h-14 items-center gap-4 border-t px-1 text-left text-xl transition-colors last:border-b',
                checked ? 'text-primary' : 'text-foreground',
                blocked && 'text-muted-foreground',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center border transition-colors',
                  single ? 'rounded-full' : 'rounded-sm',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input',
                )}
              >
                {checked ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>
      <p
        id={hintId}
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {hint}
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const input = event.currentTarget.elements.namedItem(
            'custom',
          ) as HTMLInputElement;
          onAddCustom(input.value);
          input.value = '';
        }}
      >
        <label htmlFor={customId} className="sr-only">
          Add your own option
        </label>
        <input
          id={customId}
          name="custom"
          type="text"
          maxLength={60}
          autoComplete="off"
          placeholder="Something else? Add your own"
          className="min-h-12 min-w-0 flex-1 basis-60 border-0 border-b border-input bg-transparent text-lg outline-none focus:border-primary focus-visible:outline-none"
        />
        <Button
          type="submit"
          variant="ghost"
          size="touch"
          className="text-primary"
        >
          Add
        </Button>
      </form>
    </div>
  );
}
