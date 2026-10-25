'use client';

import { Check } from 'lucide-react';
import { useMemo } from 'react';

import { DestinationIcon, RunIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { routeAnswers } from '@/lib/routing';
import { cn } from '@/lib/utils';
import type { View } from '@/lib/view';
import {
  ProgressSegments,
  RestartButton,
  ShortcutHint,
  StepActions,
  StepBody,
  StepHeading,
  TimeUpNotice,
  TimerReadout,
  stepTiming,
  type RunScreenProps,
} from './run-parts';

function useTiming(props: RunScreenProps) {
  return stepTiming(props);
}

function Body(props: RunScreenProps & { expired: boolean }) {
  return (
    <StepBody
      step={props.step}
      session={props.session}
      clock={props.clock}
      expired={props.expired}
      onRate={props.onRate}
      onToggle={props.onToggle}
      onAddCustom={props.onAddCustom}
      onText={props.onText}
      onNote={props.onNote}
      onContinue={props.onContinue}
    />
  );
}

/** C. Focus: one column, nothing but the step. */
function FocusRun(props: RunScreenProps) {
  const { run, step, stepIndex } = props;
  const t = useTiming(props);
  return (
    <div className="flex min-h-dvh flex-col">
      <ProgressSegments count={run.steps.length} index={stepIndex} />
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-8 px-5 py-6 sm:px-8 sm:py-7">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="touch"
            onClick={props.onExit}
            className="-ml-2.5 text-muted-foreground"
          >
            All runs
          </Button>
          <span>
            {run.name} · {stepIndex + 1}/{run.steps.length}
          </span>
          <RestartButton onRestart={props.onRestart} className="ml-auto" />
          <TimerReadout
            remaining={t.remaining}
            runRemaining={t.runRemaining}
            running={props.running}
            expired={t.expired}
            onToggle={props.onTogglePause}
          />
        </header>
        <TimeUpNotice expired={t.expired} kind={step.kind} />
        <StepHeading step={step} headingRef={props.headingRef} />
        <Body {...props} expired={t.expired} />
        <ShortcutHint kind={step.kind} />
        <StepActions {...props} total={run.steps.length} />
      </div>
    </div>
  );
}

/** A. Stage: one card, with the run's icon and a segmented header. */
function StageRun(props: RunScreenProps) {
  const { run, step, stepIndex } = props;
  const t = useTiming(props);
  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-8 sm:px-5 sm:py-10">
      <div className="w-full max-w-[760px] overflow-hidden rounded-xl border bg-card shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 border-b px-5 pt-5 pb-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
              <RunIcon
                name={step.icon ?? run.icon}
                className="size-6"
                strokeWidth={1.8}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {run.group}
              </p>
              <p className="truncate text-lg font-semibold">{run.name}</p>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              {stepIndex + 1} / {run.steps.length}
            </span>
          </div>
          <ProgressSegments
            count={run.steps.length}
            index={stepIndex}
            className="[&>span]:rounded-full"
          />
        </div>
        <div className="flex flex-col gap-7 px-5 py-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <TimeUpNotice expired={t.expired} kind={step.kind} />
            <div className="ml-auto">
              <TimerReadout
                remaining={t.remaining}
                runRemaining={t.runRemaining}
                running={props.running}
                expired={t.expired}
                onToggle={props.onTogglePause}
              />
            </div>
          </div>
          <StepHeading step={step} headingRef={props.headingRef} />
          <Body {...props} expired={t.expired} />
          <ShortcutHint kind={step.kind} />
          <StepActions
            {...props}
            total={run.steps.length}
            leading={
              <>
                <Button
                  variant="ghost"
                  size="touch"
                  onClick={props.onExit}
                  className="text-muted-foreground"
                >
                  All runs
                </Button>
                <RestartButton onRestart={props.onRestart} />
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}

/** B. Workbench: steps on the left, the step in the middle, what it will set up on the right. */
function WorkbenchRun(props: RunScreenProps) {
  const { run, session, step, stepIndex } = props;
  const t = useTiming(props);
  const live = useMemo(
    () => routeAnswers(run, session).filter((c) => !c.empty),
    [run, session],
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex min-h-14 items-center gap-3 border-b bg-card px-4 sm:px-7">
        <span aria-hidden="true" className="size-6 rounded-sm bg-primary" />
        <span className="text-[0.9375rem] font-semibold">Runs</span>
        <span className="truncate text-sm text-muted-foreground">
          / {run.name}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <RestartButton onRestart={props.onRestart} />
          <TimerReadout
            remaining={t.remaining}
            runRemaining={t.runRemaining}
            running={props.running}
            expired={t.expired}
            onToggle={props.onTogglePause}
          />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-7 lg:grid-cols-[13.5rem_minmax(0,1fr)_17rem]">
        <nav aria-label="Steps" className="flex flex-col gap-1 lg:pt-1">
          <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Steps
          </p>
          <ol className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {run.steps.map((s, k) => {
              const done = k < stepIndex;
              const current = k === stepIndex;
              return (
                <li key={s.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => props.onGoTo(k)}
                    aria-current={current ? 'step' : undefined}
                    className={cn(
                      'sweep flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors',
                      current
                        ? 'bg-secondary font-medium text-secondary-foreground'
                        : 'text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        current
                          ? 'border-primary bg-primary text-primary-foreground'
                          : done
                            ? 'border-primary text-primary'
                            : 'border-input text-muted-foreground',
                      )}
                    >
                      {done ? (
                        <Check className="size-3.5" strokeWidth={3} />
                      ) : (
                        k + 1
                      )}
                    </span>
                    <span className="whitespace-nowrap lg:whitespace-normal">
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <Button
            variant="ghost"
            size="touch"
            onClick={props.onExit}
            className="mt-3 justify-start text-muted-foreground"
          >
            All runs
          </Button>
        </nav>
        <section className="flex min-w-0 flex-col gap-7 rounded-lg border bg-card p-5 sm:p-7">
          <p className="font-mono text-xs text-muted-foreground">
            Step {stepIndex + 1} of {run.steps.length}
          </p>
          <TimeUpNotice expired={t.expired} kind={step.kind} />
          <StepHeading
            step={step}
            headingRef={props.headingRef}
            className="[&_h2]:text-4xl sm:[&_h2]:text-5xl"
          />
          <Body {...props} expired={t.expired} />
          <ShortcutHint kind={step.kind} />
          <StepActions {...props} total={run.steps.length} />
        </section>
        <aside
          aria-label="What this run will set up"
          className="flex flex-col gap-3 rounded-lg border bg-card p-4 lg:self-start"
        >
          <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            This run will set up
          </h3>
          {live.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Answer a step and you will see where it goes.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {live.map((card) => (
                <li
                  key={card.dest}
                  className="flex items-start gap-3 rounded-md bg-muted p-3 motion-safe:animate-rise"
                >
                  <DestinationIcon
                    dest={card.dest}
                    className="mt-0.5 size-[1.125rem] shrink-0 text-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{card.title}</p>
                    <p className="text-sm break-words text-muted-foreground">
                      {card.headline}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

export function RunScreen({ view, ...props }: RunScreenProps & { view: View }) {
  if (view === 'stage') return <StageRun {...props} />;
  if (view === 'workbench') return <WorkbenchRun {...props} />;
  return <FocusRun {...props} />;
}
