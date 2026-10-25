'use client';

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  DESTINATIONS,
  DESTINATION_META,
  type DestinationId,
} from '@/lib/runs/destinations';
import type { Step } from '@/lib/runs/schema';
import { breathCycles, cycleSec, BREATH_478 } from '@/lib/timing/breathing';
import { cn } from '@/lib/utils';

export const fieldClass =
  'min-h-11 w-full border-0 border-b border-input bg-transparent text-base outline-none focus:border-primary focus-visible:outline-none';

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const DURATIONS = [15, 20, 30, 45, 60, 90, 120, 180, 300, 600];
const KIND_LABEL: Record<Step['kind'], string> = {
  scale: 'Rating',
  pick: 'List',
  breathe: 'Breathing',
  text: 'Free text',
};

type Props = {
  step: Step;
  index: number;
  total: number;
  onChange: (step: Step) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

function parseOptions(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split('\n')) {
    const option = line.trim().slice(0, 60);
    if (option) seen.add(option);
  }
  return [...seen].slice(0, 10);
}

export function StepEditor({
  step,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const uid = useId();
  const [optionsText, setOptionsText] = useState(
    step.kind === 'pick' ? step.options.join('\n') : '',
  );
  const id = (name: string) => `${uid}-${name}`;

  const toggleDest = (dest: DestinationId) => {
    const current = step.dest ?? [];
    const next = current.includes(dest)
      ? current.filter((d) => d !== dest)
      : [...current, dest].slice(0, 4);
    onChange({ ...step, dest: next });
  };

  return (
    <li className="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary font-mono text-xs text-secondary-foreground">
          {index + 1}
        </span>
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          {KIND_LABEL[step.kind]}
        </span>
        <div className="ml-auto flex items-center">
          <Button
            variant="ghost"
            size="icon-touch"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={`Move step ${index + 1} up`}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-touch"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={`Move step ${index + 1} down`}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon-touch"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor={id('label')}>
          <input
            id={id('label')}
            className={fieldClass}
            value={step.label}
            maxLength={60}
            onChange={(e) => onChange({ ...step, label: e.target.value })}
          />
        </Field>
        <Field label="Question or instruction" htmlFor={id('prompt')}>
          <input
            id={id('prompt')}
            className={fieldClass}
            value={step.prompt}
            maxLength={140}
            onChange={(e) => onChange({ ...step, prompt: e.target.value })}
          />
        </Field>
      </div>

      {step.kind === 'scale' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Words under the number" htmlFor={id('words')}>
            <select
              id={id('words')}
              className={fieldClass}
              value={step.wordSet}
              onChange={(e) =>
                onChange({
                  ...step,
                  wordSet: e.target.value === 'energy' ? 'energy' : 'general',
                })
              }
            >
              <option value="general">Very low to Great</option>
              <option value="energy">Running on fumes to Buzzing</option>
            </select>
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={step.energy === true}
              onChange={(e) => onChange({ ...step, energy: e.target.checked })}
            />
            Use this to pace the schedule and focus sessions
          </label>
        </div>
      ) : null}

      {step.kind === 'pick' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Options, one per line"
            hint="Between 2 and 10."
            htmlFor={id('options')}
          >
            <textarea
              id={id('options')}
              rows={5}
              className={cn(fieldClass, 'min-h-28 resize-y py-2')}
              value={optionsText}
              onChange={(e) => {
                setOptionsText(e.target.value);
                const options = parseOptions(e.target.value);
                onChange({
                  ...step,
                  options,
                  max: Math.min(step.max, Math.max(1, options.length)),
                });
              }}
            />
          </Field>
          <Field label="How many can be chosen" htmlFor={id('max')}>
            <select
              id={id('max')}
              className={fieldClass}
              value={step.max}
              onChange={(e) =>
                onChange({ ...step, max: Number(e.target.value) })
              }
            >
              <option value={1}>Just one</option>
              {Array.from(
                { length: Math.max(0, Math.min(step.options.length, 10) - 1) },
                (_, k) => k + 2,
              ).map((n) => (
                <option key={n} value={n}>
                  Up to {n}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {step.kind === 'breathe' ? (
        <Field
          label="Breaths"
          hint={`4-7-8 breathing, ${cycleSec(BREATH_478)} seconds per breath.`}
          htmlFor={id('cycles')}
        >
          <select
            id={id('cycles')}
            className={fieldClass}
            value={breathCycles(step.durationSec)}
            onChange={(e) =>
              onChange({
                ...step,
                durationSec: cycleSec(BREATH_478) * Number(e.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'breath' : 'breaths'}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Time for this step" htmlFor={id('duration')}>
            <select
              id={id('duration')}
              className={fieldClass}
              value={step.durationSec}
              onChange={(e) =>
                onChange({ ...step, durationSec: Number(e.target.value) })
              }
            >
              {[...new Set([...DURATIONS, step.durationSec])]
                .sort((a, b) => a - b)
                .map((s) => (
                  <option key={s} value={s}>
                    {s < 60
                      ? `${s} seconds`
                      : `${s / 60} ${s === 60 ? 'minute' : 'minutes'}`}
                  </option>
                ))}
            </select>
          </Field>
          <label className="flex min-h-11 items-center gap-3 self-end text-sm">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={step.optional === true}
              onChange={(e) =>
                onChange({ ...step, optional: e.target.checked })
              }
            />
            Optional (Continue works without an answer)
          </label>
        </div>
      )}

      {step.kind !== 'breathe' ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-muted-foreground">
            Where the answer goes (up to 4)
          </legend>
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map((dest) => {
              const on = step.dest?.includes(dest) ?? false;
              return (
                <button
                  key={dest}
                  type="button"
                  aria-pressed={on}
                  title={DESTINATION_META[dest].description}
                  onClick={() => toggleDest(dest)}
                  className={cn(
                    'min-h-9 rounded-sm border px-3 text-sm transition-colors',
                    on
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input text-foreground hover:border-primary',
                  )}
                >
                  {dest}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
    </li>
  );
}
