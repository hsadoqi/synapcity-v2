'use client';

import { Pause, Play, SkipForward, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PageFrame } from '@/components/shared/site-nav';
import { Button, ButtonLink } from '@/components/ui/button';
import { useClockRunning, useClockSeconds } from '@/hooks/use-step-clock';
import { useHydrated } from '@/hooks/use-hydrated';
import { dateKey } from '@/lib/history/stats';
import { DEFAULT_FOCUS_PLAN, phasesFor, type FocusPlan } from '@/lib/focus';
import { useStore } from '@/lib/storage/persisted-store';
import { boardStore } from '@/lib/storage/stores';
import { StepClock } from '@/lib/timing/clock';
import { formatClock } from '@/lib/timing/format';
import { cn } from '@/lib/utils';

/** Today's plan from the board, or a plain 25 minute session when no run set one up. */
function usePlan(): FocusPlan {
  const hydrated = useHydrated();
  const [board] = useStore(boardStore);
  return useMemo(() => {
    if (hydrated && board.date === dateKey(new Date()) && board.focus) {
      return board.focus;
    }
    return DEFAULT_FOCUS_PLAN;
  }, [hydrated, board]);
}

export function FocusSession() {
  const hydrated = useHydrated();
  const plan = usePlan();
  if (!hydrated) {
    return (
      <PageFrame>
        <p role="status" className="text-muted-foreground">
          Loading...
        </p>
      </PageFrame>
    );
  }
  return (
    <Session
      key={`${plan.label}-${plan.sessionMin}-${plan.sessions}`}
      plan={plan}
    />
  );
}

function Session({ plan }: { plan: FocusPlan }) {
  const phases = useMemo(() => phasesFor(plan), [plan]);
  const [label, setLabel] = useState(plan.label);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [clock] = useState(() => new StepClock());
  const seconds = useClockSeconds(clock);
  const running = useClockRunning(clock);
  const phase = phases[index];
  const finished = index >= phases.length;
  const duration = phase ? phase.minutes * 60 : 0;
  const remaining = Math.max(0, duration - seconds);
  const expired = started && !finished && seconds >= duration;
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (!phase || lastIndex.current === index) return;
    lastIndex.current = index;
    clock.setLimit(phase.minutes * 60_000);
    clock.reset(0);
    if (started) clock.start();
  }, [clock, phase, index, started]);

  // Show the countdown in the tab title so it is visible from another tab.
  useEffect(() => {
    if (!started || finished) return;
    const previous = document.title;
    document.title = `${formatClock(remaining)} · ${phase?.kind === 'break' ? 'Break' : 'Focus'}`;
    return () => {
      document.title = previous;
    };
  }, [started, finished, remaining, phase?.kind]);

  const start = () => {
    setStarted(true);
    clock.start();
  };
  const next = () => setIndex((i) => i + 1);

  const status = finished
    ? 'All sessions done. Well done.'
    : expired
      ? phase?.kind === 'focus'
        ? 'Session complete.'
        : 'Break is over.'
      : '';

  return (
    <PageFrame>
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[0.8125rem] text-primary">FOCUS</p>
        <h1 className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
          {finished
            ? 'That is the work done.'
            : phase?.kind === 'break'
              ? 'Break'
              : 'Focus session'}
        </h1>
        {!finished ? (
          <p className="text-lg text-muted-foreground">
            Session {phase?.session} of {plan.sessions}
            {phase?.kind === 'break' ? ' · step away from the screen' : ''}
          </p>
        ) : null}
      </header>

      {!started ? (
        <div className="flex max-w-xl flex-col gap-1">
          <label
            htmlFor="focus-label"
            className="text-sm text-muted-foreground"
          >
            What are you working on?
          </label>
          <input
            id="focus-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="One thing"
            maxLength={80}
            className="min-h-12 border-0 border-b border-input bg-transparent text-2xl outline-none focus:border-primary focus-visible:outline-none"
          />
        </div>
      ) : label ? (
        <p className="text-2xl">{label}</p>
      ) : null}

      {!finished ? (
        <div className="flex flex-col gap-6">
          <p
            role="timer"
            aria-label={
              phase?.kind === 'break'
                ? 'Time left in this break'
                : 'Time left in this session'
            }
            className={cn(
              'font-mono text-7xl leading-none font-light tabular-nums sm:text-9xl',
              phase?.kind === 'break'
                ? 'text-muted-foreground'
                : 'text-primary',
              started &&
                !expired &&
                remaining <= 10 &&
                'origin-left motion-safe:animate-timer-pulse',
            )}
          >
            {formatClock(started ? remaining : duration)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {!started ? (
              <Button size="xl" onClick={start}>
                <Play data-icon="inline-start" />
                Start
              </Button>
            ) : expired ? (
              <Button size="xl" onClick={next}>
                {index === phases.length - 1
                  ? 'Finish'
                  : phase?.kind === 'focus'
                    ? 'Start break'
                    : 'Next session'}
                <SkipForward data-icon="inline-end" />
              </Button>
            ) : (
              <Button
                size="xl"
                variant="outline"
                onClick={() => (clock.running ? clock.pause() : clock.start())}
              >
                {running ? (
                  <Pause data-icon="inline-start" />
                ) : (
                  <Play data-icon="inline-start" />
                )}
                {running ? 'Pause' : 'Resume'}
              </Button>
            )}
            {started && !expired ? (
              <Button
                variant="ghost"
                size="touch"
                className="text-muted-foreground"
                onClick={next}
              >
                <SkipForward data-icon="inline-start" />
                {phase?.kind === 'break' ? 'Skip break' : 'End session early'}
              </Button>
            ) : null}
            {started ? (
              <Button
                variant="ghost"
                size="touch"
                className="text-muted-foreground"
                onClick={() => {
                  clock.pause();
                  setIndex(phases.length);
                }}
              >
                <Square data-icon="inline-start" />
                Stop
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/today" size="xl">
            Back to today
          </ButtonLink>
          <ButtonLink href="/" size="xl" variant="outline">
            All runs
          </ButtonLink>
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </PageFrame>
  );
}
