'use client';

import { Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PageFrame } from '@/components/shared/site-nav';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, ButtonLink } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import { emptyBoard } from '@/lib/board/model';
import type { HistoryEntry } from '@/lib/history/model';
import {
  averageEnergy,
  currentStreak,
  dateKey,
  energySeries,
  runCounts,
  totalMinutes,
  weeklyCounts,
} from '@/lib/history/stats';
import { downloadBlob } from '@/lib/share';
import { useStore } from '@/lib/storage/persisted-store';
import {
  boardStore,
  customRunsStore,
  historyStore,
  layoutStore,
} from '@/lib/storage/stores';
import { EnergyTrend, WeeklyBars } from './charts';

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-3xl font-light tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

function groupByDay(entries: HistoryEntry[]) {
  const days = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const key = dateKey(new Date(e.completedAt));
    days.set(key, [...(days.get(key) ?? []), e]);
  }
  return [...days.entries()];
}

export function HistoryScreen() {
  const hydrated = useHydrated();
  const [history, setHistory] = useStore(historyStore);
  const [custom] = useStore(customRunsStore);
  const [confirmClear, setConfirmClear] = useState(false);
  const now = useMemo(() => new Date(), []);

  const energy = useMemo(() => energySeries(history), [history]);
  const weeks = useMemo(() => weeklyCounts(history, now), [history, now]);
  const days = useMemo(() => groupByDay(history), [history]);
  const top = useMemo(() => runCounts(history).slice(0, 3), [history]);

  if (!hydrated) {
    return (
      <PageFrame>
        <p role="status" className="text-muted-foreground">
          Loading...
        </p>
      </PageFrame>
    );
  }

  const exportAll = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      history,
      customRuns: custom,
    };
    downloadBlob(
      'runs-history.json',
      new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      }),
    );
  };

  return (
    <PageFrame>
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[0.8125rem] text-primary">HISTORY</p>
        <h1 className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
          Your runs, kept private.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Stored in this browser only. Nothing is uploaded, and clearing it here
          removes it for good.
        </p>
      </header>

      {history.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-lg text-muted-foreground">
            No runs yet. Finish one and it shows up here, with trends once you
            have a few.
          </p>
          <ButtonLink href="/" size="xl">
            Pick a run
          </ButtonLink>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="Streak"
              value={`${currentStreak(history, now)}`}
              hint="days in a row"
            />
            <Stat
              label="Runs"
              value={`${history.length}`}
              hint={`${weeks[weeks.length - 1]?.count ?? 0} this week`}
            />
            <Stat
              label="Time"
              value={`${totalMinutes(history)}`}
              hint="minutes in total"
            />
            <Stat
              label="Energy"
              value={averageEnergy(energy)?.toString() ?? '–'}
              hint={
                energy.length > 0
                  ? `average of ${energy.length}`
                  : 'rate it in a run'
              }
            />
          </dl>

          <div className="grid gap-4 lg:grid-cols-2">
            <section
              aria-labelledby="trend-energy"
              className="flex flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <h2 id="trend-energy" className="text-sm font-semibold">
                Energy over time
              </h2>
              {energy.length > 0 ? (
                <EnergyTrend points={energy} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Runs with an energy check, like Quick morning, draw this line.
                </p>
              )}
            </section>
            <section
              aria-labelledby="trend-weeks"
              className="flex flex-col gap-2 rounded-lg border bg-card p-4"
            >
              <h2 id="trend-weeks" className="text-sm font-semibold">
                Runs per week
              </h2>
              <WeeklyBars weeks={weeks} />
            </section>
          </div>

          {top.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Most used: {top.map((t) => `${t.name} (${t.count})`).join(', ')}.
            </p>
          ) : null}

          <div className="flex flex-col gap-8">
            {days.map(([key, entries]) => (
              <section
                key={key}
                aria-label={dayFormat.format(new Date(entries[0]!.completedAt))}
                className="flex flex-col gap-1"
              >
                <h2 className="text-xs font-semibold tracking-wider text-primary uppercase">
                  {dayFormat.format(new Date(entries[0]!.completedAt))}
                </h2>
                <ul className="border-b">
                  {entries.map((e) => (
                    <li key={e.id} className="border-t">
                      <Link
                        href={`/done/${e.id}`}
                        className="sweep flex min-h-16 flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
                      >
                        <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
                          {timeFormat.format(new Date(e.completedAt))}
                        </span>
                        <span className="text-lg font-medium">{e.runName}</span>
                        <span className="min-w-0 flex-1 basis-60 text-[0.9375rem] text-muted-foreground">
                          {e.intention.headline}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {Math.max(1, Math.round(e.durationSec / 60))} min ·{' '}
                          {e.answered}/{e.totalSteps} answered
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-6">
            <Button variant="outline" size="touch" onClick={exportAll}>
              <Download data-icon="inline-start" />
              Export as JSON
            </Button>
            <Button
              variant="ghost"
              size="touch"
              className="text-muted-foreground"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 data-icon="inline-start" />
              Clear history
            </Button>
          </div>
        </>
      )}

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your run history?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every saved run and today&apos;s board from this
              device. It cannot be undone. Export first if you want a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="touch">Keep it</AlertDialogCancel>
            <Button
              variant="destructive"
              size="touch"
              onClick={() => {
                setHistory([]);
                boardStore.set(emptyBoard(''));
                layoutStore.set([]);
                setConfirmClear(false);
              }}
            >
              Clear everything
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  );
}
