'use client';

import { ArrowRight, Check, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DestinationIcon } from '@/components/icons';
import { PageFrame } from '@/components/shared/site-nav';
import { IntentionCard } from '@/components/shared/intention-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { useView } from '@/components/view-provider';
import type { View } from '@/lib/view';
import { useHydrated } from '@/hooks/use-hydrated';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { HistoryEntry } from '@/lib/history/model';
import { startRun } from '@/lib/storage/actions';
import { useStore } from '@/lib/storage/persisted-store';
import { historyStore } from '@/lib/storage/stores';
import { findBuiltInRun } from '@/lib/runs/catalog';
import { customRunsStore } from '@/lib/storage/stores';
import { cn } from '@/lib/utils';

function doneTitle(made: number) {
  if (made === 0) return 'Nothing was set up this time';
  if (made === 1) return 'One thing set up for you';
  return `${made} things set up for you`;
}

function RoutedList({
  entry,
  view,
  shown,
}: {
  entry: HistoryEntry;
  view: View;
  shown: number;
}) {
  const visible = entry.cards.slice(0, shown);
  return (
    <ul
      className={cn(
        'flex flex-col',
        view === 'stage' && 'gap-3',
        view === 'workbench' && 'gap-2',
      )}
    >
      {visible.map((card) => (
        <li
          key={card.dest}
          className={cn(
            'flex gap-4 motion-safe:animate-rise',
            view === 'focus' && 'flex-wrap gap-x-8 border-t py-5',
            view === 'stage' && 'rounded-lg border bg-muted p-4',
            view === 'workbench' && 'rounded-md border bg-card p-4',
            card.empty && 'opacity-60',
          )}
        >
          {view === 'focus' ? null : (
            <span
              className={cn(
                'flex size-11 shrink-0 items-center justify-center bg-card text-primary',
                view === 'stage' ? 'rounded-lg' : 'rounded-sm bg-secondary',
              )}
            >
              <DestinationIcon
                dest={card.dest}
                className="size-5"
                strokeWidth={1.8}
              />
            </span>
          )}
          <div
            className={cn(
              'flex flex-col gap-1',
              view === 'focus' ? 'w-40 shrink-0' : 'hidden',
            )}
          >
            <span className="text-[0.8125rem] font-semibold tracking-wide text-primary uppercase">
              {card.title}
            </span>
            <span className="text-xs text-muted-foreground">
              from {card.from}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
            {view === 'focus' ? null : (
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-[0.8125rem] font-semibold tracking-wide text-primary uppercase">
                  {card.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  from {card.from}
                </span>
              </div>
            )}
            <p className="text-xl leading-tight sm:text-2xl">{card.headline}</p>
            <p className="text-[0.9375rem] leading-normal break-words text-muted-foreground">
              {card.detail}
            </p>
            {card.note ? (
              <p className="text-[0.9375rem]">Your note: {card.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompletionScreen({ entryId }: { entryId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { view } = useView();
  const [history] = useStore(historyStore);
  const [custom] = useStore(customRunsStore);
  const reduced = useReducedMotion();
  const entry = history.find((e) => e.id === entryId);
  const total = entry?.cards.length ?? 0;
  const [count, setCount] = useState(0);
  const shown = reduced ? total : Math.min(count, total);

  useEffect(() => {
    if (reduced || count >= total) return;
    const id = setTimeout(() => setCount((c) => c + 1), 450);
    return () => clearTimeout(id);
  }, [reduced, count, total]);

  if (!hydrated) {
    return (
      <PageFrame>
        <p role="status" className="text-muted-foreground">
          Loading...
        </p>
      </PageFrame>
    );
  }

  if (!entry) {
    return (
      <PageFrame>
        <h1 className="text-4xl font-light">We could not find that run.</h1>
        <p className="text-muted-foreground">
          It may have been cleared from this device.
        </p>
        <ButtonLink href="/" size="touch" className="self-start">
          All runs
        </ButtonLink>
      </PageFrame>
    );
  }

  const made = entry.cards.filter((c) => !c.empty).length;
  const run =
    findBuiltInRun(entry.runId) ?? custom.find((r) => r.id === entry.runId);

  return (
    <PageFrame>
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3 font-mono text-[0.8125rem] text-primary">
          <span
            aria-hidden="true"
            className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground motion-safe:animate-pop"
          >
            <Check className="size-4" strokeWidth={3} />
          </span>
          {entry.runName} / complete
        </div>
        <h1 className="text-4xl leading-[1.05] font-light tracking-tight sm:text-6xl">
          {doneTitle(made)}
        </h1>
        <p className="text-lg text-muted-foreground">
          Every answer went somewhere. Change any of it later; nothing is locked
          in.
        </p>
      </header>

      <div className="motion-safe:animate-rise">
        <IntentionCard intention={entry.intention} />
      </div>

      <RoutedList entry={entry} view={view} shown={shown} />

      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href="/" size="xl">
          All runs
        </ButtonLink>
        <ButtonLink href="/today" variant="outline" size="xl">
          <LayoutGrid data-icon="inline-start" />
          Open today
        </ButtonLink>
        {run ? (
          <Button
            variant="ghost"
            size="touch"
            className="text-muted-foreground"
            onClick={() => {
              startRun(run);
              router.push(`/run/${run.id}`);
            }}
          >
            Run it again
            <ArrowRight data-icon="inline-end" />
          </Button>
        ) : null}
      </div>
    </PageFrame>
  );
}
