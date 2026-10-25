'use client';

import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useClockRunning } from '@/hooks/use-step-clock';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  BREATH_478,
  MIN_SCALE,
  PHASE_LABEL,
  breathCycles,
  breathFrame,
  cycleSec,
  type BreathFrame,
} from '@/lib/timing/breathing';
import type { StepClock } from '@/lib/timing/clock';

type Props = {
  clock: StepClock;
  durationSec: number;
  expired: boolean;
};

const sameFrame = (a: BreathFrame, b: BreathFrame) =>
  a.phase === b.phase && a.count === b.count && a.cycle === b.cycle;

/**
 * The 4-7-8 breathing circle. It reads the same clock as the step timer, so pausing the timer
 * pauses the breath, and the count, label and circle can never disagree.
 */
export function BreathingControl({ clock, durationSec, expired }: Props) {
  const running = useClockRunning(clock);
  const reduced = useReducedMotion();
  const circle = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<BreathFrame>(() =>
    breathFrame(clock.elapsedMs()),
  );
  const cycles = breathCycles(durationSec);

  useEffect(() => {
    let raf = 0;
    const paint = () => {
      const next = breathFrame(clock.elapsedMs());
      if (circle.current) {
        circle.current.style.transform = reduced
          ? 'scale(1)'
          : `scale(${next.scale})`;
      }
      setFrame((prev) => (sameFrame(prev, next) ? prev : next));
    };
    const loop = () => {
      paint();
      if (clock.running) raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [clock, running, reduced]);

  const cycle = Math.min(frame.cycle + 1, cycles);
  const label = expired ? 'Done' : PHASE_LABEL[frame.phase];

  return (
    <div className="flex flex-wrap items-center gap-8 sm:gap-10">
      <div className="relative flex size-56 shrink-0 items-center justify-center sm:size-64">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-border"
        />
        <div
          ref={circle}
          aria-hidden="true"
          style={{ transform: `scale(${MIN_SCALE})` }}
          className="absolute inset-0 rounded-full border border-primary bg-primary/10 will-change-transform"
        />
        <div className="relative flex flex-col items-center" aria-hidden="true">
          <span className="text-xl">{label}</span>
          {expired ? (
            <Check className="size-10 text-primary" strokeWidth={2} />
          ) : (
            <span className="font-mono text-5xl font-medium tabular-nums">
              {frame.count}
            </span>
          )}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {expired
            ? 'Breathing complete.'
            : running
              ? PHASE_LABEL[frame.phase]
              : 'Paused.'}
        </span>
      </div>
      <div className="flex flex-col gap-1 text-muted-foreground">
        <p className="text-base">
          In for {BREATH_478.inhale} · hold for {BREATH_478.hold} · out for{' '}
          {BREATH_478.exhale}
        </p>
        <p className="text-sm">
          Breath {cycle} of {cycles} · {cycleSec(BREATH_478)} seconds each
          {!running && !expired ? ' · paused' : ''}
        </p>
      </div>
    </div>
  );
}
