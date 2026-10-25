'use client';

import { ArrowRight, Pin, PinOff, Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { RunIcon } from '@/components/icons';
import { PageFrame } from '@/components/shared/site-nav';
import { Button, ButtonLink } from '@/components/ui/button';
import { useView } from '@/components/view-provider';
import type { View } from '@/lib/view';
import { CUSTOM_GROUP, useAllRuns, useRunById } from '@/hooks/use-runs';
import { GROUPS } from '@/lib/runs/catalog';
import type { Run } from '@/lib/runs/schema';
import { discardSession, togglePin } from '@/lib/storage/actions';
import { useStore } from '@/lib/storage/persisted-store';
import { prefsStore, sessionStore } from '@/lib/storage/stores';
import { runMeta } from '@/lib/timing/format';
import { cn } from '@/lib/utils';

type EntryProps = { run: Run; index: number; pinned: boolean; view: View };

function PinButton({ run, pinned }: { run: Run; pinned: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon-touch"
      aria-pressed={pinned}
      aria-label={`${pinned ? 'Unpin' : 'Pin'} ${run.name}`}
      onClick={() => togglePin(run.id)}
      className={cn(pinned ? 'text-primary' : 'text-muted-foreground')}
    >
      {pinned ? <PinOff /> : <Pin />}
    </Button>
  );
}

/** C. Focus: a numbered list. Nothing but the name, the line and the time. */
function FocusEntry({ run, index, pinned }: EntryProps) {
  return (
    <li className="flex items-center border-t">
      <Link
        href={`/run/${run.id}`}
        className="sweep flex min-h-14 min-w-0 flex-1 items-baseline gap-3 py-3.5 sm:gap-5"
      >
        <span className="w-7 shrink-0 font-mono text-[0.8125rem] text-muted-foreground">
          {String(index + 1).padStart(2, '0')}
        </span>
        <strong className="shrink-0 text-xl font-medium sm:basis-64 sm:text-[1.375rem]">
          {run.name}
        </strong>
        <span className="hidden min-w-0 flex-1 truncate text-[0.9375rem] text-muted-foreground sm:block">
          {run.tagline}
        </span>
        <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
          {runMeta(run)}
        </span>
      </Link>
      <PinButton run={run} pinned={pinned} />
    </li>
  );
}

/** A. Stage: a card with an icon tile. */
function StageEntry({ run, pinned }: EntryProps) {
  return (
    <li className="group relative flex min-w-0 basis-72 grow">
      <Link
        href={`/run/${run.id}`}
        className="flex min-h-24 w-full gap-3.5 rounded-lg border bg-muted p-4 pr-12 transition-colors hover:border-primary"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
          <RunIcon
            name={run.icon}
            className="size-[1.375rem]"
            strokeWidth={1.8}
          />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-base font-semibold">{run.name}</span>
          <span className="text-sm text-muted-foreground">{run.tagline}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {runMeta(run)}
          </span>
        </span>
      </Link>
      <div className="absolute top-1 right-1">
        <PinButton run={run} pinned={pinned} />
      </div>
    </li>
  );
}

/** B. Workbench: a dense, ruled list on a white panel. */
function WorkbenchEntry({ run, pinned }: EntryProps) {
  return (
    <li className="flex items-center border-b last:border-b-0">
      <Link
        href={`/run/${run.id}`}
        className="sweep flex min-h-14 min-w-0 flex-1 items-center gap-4 px-4 py-3"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
          <RunIcon name={run.icon} className="size-5" strokeWidth={1.8} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[0.9375rem] font-semibold">{run.name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {run.tagline}
          </span>
        </span>
        <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">
          {runMeta(run)}
        </span>
      </Link>
      <PinButton run={run} pinned={pinned} />
    </li>
  );
}

function Entry(props: EntryProps) {
  if (props.view === 'stage') return <StageEntry {...props} />;
  if (props.view === 'workbench') return <WorkbenchEntry {...props} />;
  return <FocusEntry {...props} />;
}

function Section({
  title,
  runs,
  pinned,
  view,
  startIndex = 0,
}: {
  title: string;
  runs: Run[];
  pinned: Set<string>;
  view: View;
  startIndex?: number;
}) {
  if (runs.length === 0) return null;
  const headingId = `group-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2
        id={headingId}
        className={cn(
          'text-xs font-semibold tracking-wider uppercase',
          view === 'focus'
            ? 'font-mono font-normal text-primary'
            : 'text-primary',
        )}
      >
        {title}
      </h2>
      <ul
        className={cn(
          view === 'stage' && 'flex flex-wrap gap-3',
          view === 'workbench' && 'overflow-hidden rounded-sm border bg-card',
          view === 'focus' && 'border-b',
        )}
      >
        {runs.map((run, index) => (
          <Entry
            key={run.id}
            run={run}
            index={startIndex + index}
            pinned={pinned.has(run.id)}
            view={view}
          />
        ))}
      </ul>
    </section>
  );
}

function ResumeBanner() {
  const [session] = useStore(sessionStore);
  const run = useRunById(session?.runId ?? '');
  if (!session || !run) return null;
  const step = Math.min(session.stepIndex, run.steps.length - 1);
  return (
    <section
      aria-label="Run in progress"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-primary/60 bg-primary/5 p-4"
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs tracking-wide text-primary uppercase">
          In progress
        </p>
        <p className="text-lg font-medium">
          {run.name}, step {step + 1} of {run.steps.length}
        </p>
        <p className="text-sm text-muted-foreground">
          Your answers are saved. The timer waits for you.
        </p>
      </div>
      <ButtonLink size="xl" href={`/run/${run.id}`}>
        Resume
        <ArrowRight data-icon="inline-end" />
      </ButtonLink>
      <Button variant="ghost" size="touch" onClick={discardSession}>
        <RotateCcw data-icon="inline-start" />
        Discard
      </Button>
    </section>
  );
}

const COPY: Record<View, { eyebrow: string; title: string; body: string }> = {
  focus: {
    eyebrow: 'RUNS',
    title: 'Pick a run.',
    body: 'A few minutes. Then your day is set up.',
  },
  stage: {
    eyebrow: 'Runs',
    title: 'Pick a run. A few minutes, then your day is set up.',
    body: 'Each run asks a few easy questions and sets things up across work, body, people and home. It all stays on this device.',
  },
  workbench: {
    eyebrow: 'Runs',
    title: 'Pick a run',
    body: 'A few easy questions, then things are set up across your day.',
  },
};

export function HomeScreen() {
  const { view } = useView();
  const runs = useAllRuns();
  const [prefs] = useStore(prefsStore);
  const pinned = useMemo(() => new Set(prefs.pinned), [prefs.pinned]);
  const pinnedRuns = useMemo(
    () =>
      prefs.pinned
        .map((id) => runs.find((r) => r.id === id))
        .filter((r): r is Run => r !== undefined),
    [prefs.pinned, runs],
  );
  const copy = COPY[view];
  const sections = useMemo(() => {
    let next = 0;
    return [...GROUPS, CUSTOM_GROUP].map((title) => {
      const inGroup = runs.filter((r) => r.group === title);
      const section = { title, runs: inGroup, startIndex: next };
      next += inGroup.length;
      return section;
    });
  }, [runs]);

  return (
    <PageFrame>
      <div className="flex flex-col gap-2.5">
        <p
          className={cn(
            'text-[0.8125rem] font-medium text-primary',
            view === 'focus' && 'font-mono',
          )}
        >
          {copy.eyebrow}
        </p>
        <h1
          className={cn(
            'max-w-3xl leading-[1.05] tracking-tight',
            view === 'focus' && 'text-5xl font-light sm:text-[3.5rem]',
            view === 'stage' && 'text-3xl font-bold sm:text-4xl',
            view === 'workbench' && 'text-3xl font-bold',
          )}
        >
          {copy.title}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{copy.body}</p>
      </div>

      <ResumeBanner />

      <Section title="Pinned" runs={pinnedRuns} pinned={pinned} view={view} />
      {sections.map((section) => (
        <Section
          key={section.title}
          title={section.title}
          runs={section.runs}
          pinned={pinned}
          view={view}
          startIndex={section.startIndex}
        />
      ))}

      <div className="flex flex-wrap items-center gap-4 border-t pt-6">
        <ButtonLink href="/builder" variant="outline" size="touch">
          <Plus data-icon="inline-start" />
          Build your own run
        </ButtonLink>
        <p className="text-sm text-muted-foreground">
          Combine steps like a rating, a breath, a pick-list or a free note,
          then pin it here.
        </p>
      </div>
    </PageFrame>
  );
}
