'use client';

import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { ReactNode, Ref } from 'react';

import { Button } from '@/components/ui/button';
import { isRequired } from '@/lib/session/model';
import type { RunSession } from '@/lib/session/model';
import { optionsFor } from '@/lib/session/model';
import type { Run, Step } from '@/lib/runs/schema';
import type { StepClock } from '@/lib/timing/clock';
import { formatClock } from '@/lib/timing/format';
import { cn } from '@/lib/utils';
import { BreathingControl } from './breathing-control';
import { NoteEditor } from './note-editor';
import { PickControl } from './pick-control';
import { ScaleControl } from './scale-control';

/** Everything a layout needs to draw one step. The player owns the state; layouts only draw. */
export type RunScreenProps = {
  run: Run;
  session: RunSession;
  step: Step;
  stepIndex: number;
  clock: StepClock;
  seconds: number;
  running: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  canContinue: boolean;
  onRate: (value: number) => void;
  onToggle: (option: string) => void;
  onAddCustom: (option: string) => void;
  onText: (text: string) => void;
  onNote: (text: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  onGoTo: (index: number) => void;
  onTogglePause: () => void;
  onExit: () => void;
  onRestart: () => void;
};

export function stepTiming(
  props: Pick<RunScreenProps, 'run' | 'step' | 'stepIndex' | 'seconds'>,
) {
  const { run, step, stepIndex, seconds } = props;
  const remaining = Math.max(0, step.durationSec - seconds);
  const later = run.steps
    .slice(stepIndex + 1)
    .reduce((sum, s) => sum + s.durationSec, 0);
  return {
    remaining,
    runRemaining: remaining + later,
    expired: seconds >= step.durationSec,
  };
}

export function ProgressSegments({
  count,
  index,
  className,
}: {
  count: number;
  index: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label="Run progress"
      aria-valuemin={1}
      aria-valuemax={count}
      aria-valuenow={index + 1}
      aria-valuetext={`Step ${index + 1} of ${count}`}
      className={cn('flex gap-1', className)}
    >
      {Array.from({ length: count }, (_, k) => (
        <span
          key={k}
          className={cn(
            'h-[3px] flex-1 transition-colors duration-500',
            k < index
              ? 'bg-primary'
              : k === index
                ? 'bg-progress-now'
                : 'bg-border',
          )}
        />
      ))}
    </div>
  );
}

export function TimerReadout({
  remaining,
  runRemaining,
  running,
  expired,
  onToggle,
}: {
  remaining: number;
  runRemaining: number;
  running: boolean;
  expired: boolean;
  onToggle: () => void;
}) {
  const stepPulse = running && !expired && remaining <= 10;
  const runPulse = running && runRemaining > 0 && runRemaining < 60;
  return (
    <div className="flex items-center gap-1">
      <div className="flex flex-col items-end leading-tight">
        <span
          role="timer"
          aria-label="Time left on this step"
          className={cn(
            'font-mono text-base font-semibold tabular-nums',
            expired ? 'text-warn' : 'text-primary',
            stepPulse && 'origin-right motion-safe:animate-timer-pulse',
          )}
        >
          {formatClock(remaining)}
        </span>
        <span
          aria-label="Time left in the whole run"
          className={cn(
            'font-mono text-[0.6875rem] whitespace-nowrap text-muted-foreground tabular-nums',
            runPulse &&
              'origin-right text-warn motion-safe:animate-timer-pulse',
          )}
        >
          run {formatClock(runRemaining)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-touch"
        onClick={onToggle}
        disabled={expired}
        aria-label={running ? 'Pause timer' : 'Resume timer'}
        aria-keyshortcuts="P"
      >
        {running ? <Pause /> : <Play />}
      </Button>
    </div>
  );
}

export function RestartButton({
  onRestart,
  className,
}: {
  onRestart: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="touch"
      onClick={onRestart}
      className={cn('text-muted-foreground', className)}
    >
      <RotateCcw data-icon="inline-start" />
      <span className="max-sm:sr-only">Restart</span>
    </Button>
  );
}

export function TimeUpNotice({
  expired,
  kind,
}: {
  expired: boolean;
  kind: Step['kind'];
}) {
  if (!expired) return null;
  return (
    <p className="text-sm text-warn">
      {kind === 'breathe'
        ? 'That is the last breath. Continue when you are ready.'
        : 'Time is up. Take your time, though.'}
    </p>
  );
}

export function StepHeading({
  step,
  headingRef,
  className,
}: {
  step: Step;
  headingRef: Ref<HTMLHeadingElement>;
  className?: string;
}) {
  const required = isRequired(step);
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-4xl leading-[1.05] font-light tracking-tight outline-none sm:text-5xl lg:text-6xl"
      >
        {step.label}
      </h2>
      <p className="max-w-xl text-lg leading-snug text-muted-foreground sm:text-xl">
        {step.prompt}
      </p>
      {step.kind !== 'breathe' ? (
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
          {required ? 'Required' : 'Optional'}
          {step.kind === 'pick'
            ? ` · ${step.max === 1 ? 'Choose one' : `Choose up to ${step.max}`}`
            : null}
        </p>
      ) : null}
    </div>
  );
}

export function StepBody({
  step,
  session,
  clock,
  expired,
  ...handlers
}: Pick<
  RunScreenProps,
  | 'step'
  | 'session'
  | 'clock'
  | 'onRate'
  | 'onToggle'
  | 'onAddCustom'
  | 'onText'
  | 'onNote'
  | 'onContinue'
> & { expired: boolean }) {
  const answer = session.answers[step.id];
  const note = session.notes[step.id] ?? '';

  const noteEditor = (
    <div className="flex max-w-xl flex-col gap-1">
      <span className="text-sm text-muted-foreground">
        Anything to add? Optional.
      </span>
      <NoteEditor
        key={`note-${step.id}`}
        initialValue={note}
        onChange={handlers.onNote}
        onSubmit={handlers.onContinue}
        ariaLabel={`Note for ${step.label}`}
        placeholder={step.notePlaceholder ?? 'Write a thought...'}
      />
    </div>
  );

  switch (step.kind) {
    case 'scale':
      return (
        <div className="flex flex-col gap-8">
          <ScaleControl
            step={step}
            value={typeof answer === 'number' ? answer : undefined}
            onChange={handlers.onRate}
          />
          {noteEditor}
        </div>
      );
    case 'pick':
      return (
        <div className="flex flex-col gap-8">
          <PickControl
            key={step.id}
            step={step}
            options={optionsFor(step, session)}
            picked={Array.isArray(answer) ? answer : []}
            onToggle={handlers.onToggle}
            onAddCustom={handlers.onAddCustom}
          />
          {noteEditor}
        </div>
      );
    case 'breathe':
      return (
        <BreathingControl
          clock={clock}
          durationSec={step.durationSec}
          expired={expired}
        />
      );
    case 'text':
      return (
        <div className="flex max-w-2xl flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            Only you see this. Ctrl or Cmd + Enter to continue.
          </span>
          <NoteEditor
            key={`text-${step.id}`}
            initialValue={typeof answer === 'string' ? answer : ''}
            onChange={handlers.onText}
            onSubmit={handlers.onContinue}
            ariaLabel={step.label}
            placeholder={step.notePlaceholder ?? 'Start anywhere'}
            minHeight="min-h-40"
            autoFocus
          />
        </div>
      );
  }
}

function stepHelp(step: Step, canContinue: boolean): string | null {
  if (canContinue) return null;
  if (step.kind === 'scale') return 'Pick a number to continue, or skip.';
  if (step.kind === 'pick')
    return step.max === 1
      ? 'Choose one to continue, or skip.'
      : 'Choose at least one to continue, or skip.';
  if (step.kind === 'text') return 'Write something to continue, or skip.';
  return null;
}

export function StepActions({
  step,
  stepIndex,
  total,
  canContinue,
  onBack,
  onSkip,
  onContinue,
  className,
  leading,
}: Pick<
  RunScreenProps,
  'step' | 'stepIndex' | 'canContinue' | 'onBack' | 'onSkip' | 'onContinue'
> & {
  total: number;
  className?: string;
  leading?: ReactNode;
}) {
  const last = stepIndex === total - 1;
  const help = stepHelp(step, canContinue);
  return (
    <footer
      className={cn('mt-auto flex flex-col gap-2 border-t pt-4', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        {leading}
        {stepIndex > 0 ? (
          <Button
            variant="ghost"
            size="touch"
            onClick={onBack}
            aria-keyshortcuts="B"
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="touch"
          onClick={onSkip}
          className="text-muted-foreground"
          aria-keyshortcuts="S"
        >
          Skip
        </Button>
        <Button
          size="xl"
          onClick={onContinue}
          disabled={!canContinue}
          aria-describedby={help ? 'continue-help' : undefined}
          aria-keyshortcuts="Enter"
          className="ml-auto"
        >
          {last ? 'Finish run' : 'Continue'}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
      {help ? (
        <p
          id="continue-help"
          className="text-right text-sm text-muted-foreground"
        >
          {help}
        </p>
      ) : null}
    </footer>
  );
}

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground">
    {children}
  </kbd>
);

export function ShortcutHint({ kind }: { kind: Step['kind'] }) {
  return (
    <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground md:flex [@media(pointer:coarse)]:hidden">
      {kind === 'scale' ? (
        <span>
          <Kbd>1</Kbd>–<Kbd>0</Kbd> rate
        </span>
      ) : null}
      {kind === 'pick' ? (
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> move · <Kbd>Space</Kbd> select
        </span>
      ) : null}
      <span>
        <Kbd>Enter</Kbd> continue
      </span>
      <span>
        <Kbd>S</Kbd> skip
      </span>
      <span>
        <Kbd>B</Kbd> back
      </span>
      <span>
        <Kbd>P</Kbd> pause
      </span>
      <span>
        <Kbd>Esc</Kbd> exit
      </span>
    </p>
  );
}
