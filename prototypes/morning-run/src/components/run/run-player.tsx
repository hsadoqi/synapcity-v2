'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useView } from '@/components/view-provider';
import { useClockRunning, useClockSeconds } from '@/hooks/use-step-clock';
import { useHydrated } from '@/hooks/use-hydrated';
import { useRunById } from '@/hooks/use-runs';
import { classifyTarget, interpretKey } from '@/lib/keys';
import type { PickStep, Run } from '@/lib/runs/schema';
import {
  addCustomOption,
  advance,
  canContinue as canContinueStep,
  goTo,
  hasProgress,
  newSession,
  setNote,
  setRating,
  setText,
  skip,
  togglePick,
  type Advance,
  type RunSession,
} from '@/lib/session/model';
import { completeRun, discardSession, startRun } from '@/lib/storage/actions';
import { useStore } from '@/lib/storage/persisted-store';
import { sessionStore } from '@/lib/storage/stores';
import { StepClock } from '@/lib/timing/clock';
import { ConfirmDialogs, type Confirm } from './confirm-dialogs';
import { RunScreen } from './run-layouts';
import { stepTiming } from './run-parts';

export function RunPlayer({ runId }: { runId: string }) {
  const hydrated = useHydrated();
  const run = useRunById(runId);
  const [session] = useStore(sessionStore);
  // Set when this page ends the run itself (finished or discarded), so the empty
  // session left behind is not mistaken for someone arriving and starting a new run.
  const ended = useRef(false);

  useEffect(() => {
    if (hydrated && run && !session && !ended.current) startRun(run);
  }, [hydrated, run, session]);

  if (!hydrated || (run && !session)) return <PlayerSkeleton />;
  if (!run) return <RunNotFound />;
  if (!session) return <PlayerSkeleton />;
  if (session.runId !== run.id)
    return <SessionConflict run={run} active={session} />;
  return (
    <ActiveRun
      key={session.startedAt}
      run={run}
      session={session}
      onEnd={() => {
        ended.current = true;
      }}
    />
  );
}

function PlayerSkeleton() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center text-muted-foreground"
      role="status"
    >
      Loading your run...
    </div>
  );
}

function RunNotFound() {
  const router = useRouter();
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-4xl font-light">That run is not on this device.</h1>
      <p className="text-muted-foreground">
        Custom runs live in this browser only. It may have been deleted.
      </p>
      <Button size="touch" onClick={() => router.push('/')}>
        All runs
      </Button>
    </div>
  );
}

/** A different run is already in progress: resume it, or drop it and start this one. */
function SessionConflict({ run, active }: { run: Run; active: RunSession }) {
  const router = useRouter();
  const activeRun = useRunById(active.runId);
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-5 px-6">
      <h1 className="text-4xl font-light">
        You are partway through another run.
      </h1>
      <p className="text-lg text-muted-foreground">
        {activeRun?.name ?? 'A run'} is at step {active.stepIndex + 1}. Starting{' '}
        {run.name} will discard it.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="xl" onClick={() => router.push(`/run/${active.runId}`)}>
          Resume {activeRun?.name ?? 'it'}
        </Button>
        <Button
          variant="outline"
          size="xl"
          onClick={() => {
            startRun(run);
          }}
        >
          Start {run.name}
        </Button>
      </div>
    </div>
  );
}

const PERSIST_EVERY_MS = 2_000;

function ActiveRun({
  run,
  session,
  onEnd,
}: {
  run: Run;
  session: RunSession;
  onEnd: () => void;
}) {
  const router = useRouter();
  const { view } = useView();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [clock] = useState(() => new StepClock());
  // A run opened with progress already in it waits, paused, until the person
  // presses resume or moves on.
  const hold = useRef(hasProgress(session) || session.elapsedMs > 0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const latest = useRef(session);
  const startedAt = session.startedAt;

  const stepIndex = Math.min(session.stepIndex, run.steps.length - 1);
  const step = run.steps[stepIndex]!;
  const seconds = useClockSeconds(clock);
  const running = useClockRunning(clock);

  useEffect(() => {
    latest.current = session;
  });

  const persistElapsed = useCallback(() => {
    const elapsedMs = Math.round(clock.elapsedMs());
    sessionStore.set((s) =>
      s && s.startedAt === startedAt ? { ...s, elapsedMs } : s,
    );
  }, [clock, startedAt]);

  // Each step gets its own limit and starts from the time it already had. Coming back to a run
  // never burns time you were not there for.
  useEffect(() => {
    clock.setLimit(step.durationSec * 1000);
    clock.reset(latest.current.elapsedMs);
    if (hold.current) clock.pause();
    else clock.start();
    headingRef.current?.focus({ preventScroll: true });
  }, [clock, step.id, step.durationSec]);

  useEffect(() => {
    const id = setInterval(persistElapsed, PERSIST_EVERY_MS);
    const flush = () => persistElapsed();
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
      persistElapsed();
    };
  }, [persistElapsed]);

  const update = useCallback((fn: (s: RunSession) => RunSession) => {
    sessionStore.set((s) => (s ? fn(s) : s));
  }, []);

  const finish = useCallback(
    (final: RunSession) => {
      onEnd();
      const entry = completeRun(run, final);
      router.push(`/done/${entry.id}`);
    },
    [run, router, onEnd],
  );

  const applyAdvance = useCallback(
    (result: Advance) => {
      if (result.finished) finish(result.session);
      else sessionStore.set(result.session);
    },
    [finish],
  );

  const withElapsed = useCallback(
    (s: RunSession): RunSession => ({
      ...s,
      elapsedMs: Math.round(clock.elapsedMs()),
    }),
    [clock],
  );

  const onContinue = useCallback(() => {
    hold.current = false;
    const s = withElapsed(latest.current);
    if (!canContinueStep(step, s)) return;
    applyAdvance(advance(run, s));
  }, [applyAdvance, run, step, withElapsed]);

  const onSkip = useCallback(() => {
    hold.current = false;
    applyAdvance(skip(run, withElapsed(latest.current)));
  }, [applyAdvance, run, withElapsed]);

  const onBack = useCallback(() => {
    if (stepIndex > 0)
      sessionStore.set(goTo(run, withElapsed(latest.current), stepIndex - 1));
  }, [run, stepIndex, withElapsed]);

  const onGoTo = useCallback(
    (index: number) =>
      sessionStore.set(goTo(run, withElapsed(latest.current), index)),
    [run, withElapsed],
  );

  const onTogglePause = useCallback(() => {
    hold.current = false;
    if (clock.expired) return;
    if (clock.running) {
      clock.pause();
      persistElapsed();
    } else {
      clock.start();
    }
  }, [clock, persistElapsed]);

  const onExit = useCallback(() => {
    if (hasProgress(latest.current)) {
      persistElapsed();
      setConfirm('leave');
      return;
    }
    onEnd();
    discardSession();
    router.push('/');
  }, [persistElapsed, router, onEnd]);

  const onRestart = useCallback(() => {
    if (hasProgress(latest.current)) setConfirm('restart');
    else sessionStore.set(newSession(run));
  }, [run]);

  // Keyboard map. The pure rules live in lib/keys.ts; this only wires them to the step.
  const handlers = useRef({
    onContinue,
    onSkip,
    onBack,
    onTogglePause,
    onExit,
  });
  useEffect(() => {
    handlers.current = { onContinue, onSkip, onBack, onTogglePause, onExit };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const action = interpretKey(event, {
        kind: step.kind,
        target: classifyTarget(document.activeElement),
        dialogOpen:
          document.querySelector('[role="alertdialog"], [role="dialog"]') !==
          null,
      });
      if (!action) return;
      const h = handlers.current;
      switch (action.type) {
        case 'rate':
          update((s) => setRating(s, step.id, action.value));
          break;
        case 'continue': {
          // On a pick-one list, Enter on an option that is not chosen yet chooses it.
          // A second Enter continues.
          const el = document.activeElement;
          if (
            step.kind === 'pick' &&
            step.max === 1 &&
            el?.getAttribute('role') === 'radio' &&
            el.getAttribute('aria-checked') === 'false'
          ) {
            (el as HTMLElement).click();
          } else {
            h.onContinue();
          }
          break;
        }
        case 'exit':
          h.onExit();
          break;
        case 'togglePause':
          h.onTogglePause();
          break;
        case 'back':
          h.onBack();
          break;
        case 'skip':
          h.onSkip();
          break;
        case 'focusOptions':
          document
            .querySelector<HTMLElement>(
              '[role="radio"][tabindex="0"], [role="checkbox"][tabindex="0"]',
            )
            ?.focus();
          break;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, update]);

  const timing = stepTiming({ run, step, stepIndex, seconds });
  const timerMessage = timing.expired
    ? 'Time is up. Take your time, though.'
    : !running
      ? 'Timer paused.'
      : timing.remaining === 10 && step.kind !== 'breathe'
        ? '10 seconds left.'
        : '';

  return (
    <>
      <RunScreen
        view={view}
        run={run}
        session={session}
        step={step}
        stepIndex={stepIndex}
        clock={clock}
        seconds={seconds}
        running={running}
        headingRef={headingRef}
        canContinue={canContinueStep(step, session)}
        onRate={(value) => update((s) => setRating(s, step.id, value))}
        onToggle={(option) =>
          update((s) => togglePick(s, step as PickStep, option))
        }
        onAddCustom={(option) =>
          update((s) => addCustomOption(s, step as PickStep, option))
        }
        onText={(text) => update((s) => setText(s, step.id, text))}
        onNote={(text) => update((s) => setNote(s, step.id, text))}
        onContinue={onContinue}
        onSkip={onSkip}
        onBack={onBack}
        onGoTo={onGoTo}
        onTogglePause={onTogglePause}
        onExit={onExit}
        onRestart={onRestart}
      />
      <div role="status" aria-live="polite" className="sr-only">
        {timerMessage}
      </div>
      <ConfirmDialogs
        open={confirm}
        onClose={() => setConfirm(null)}
        onLeaveKeep={() => {
          setConfirm(null);
          router.push('/');
        }}
        onDiscard={() => {
          setConfirm(null);
          onEnd();
          discardSession();
          router.push('/');
        }}
        onRestart={() => {
          setConfirm(null);
          sessionStore.set(newSession(run));
        }}
      />
    </>
  );
}
