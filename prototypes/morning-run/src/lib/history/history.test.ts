import { describe, expect, it } from 'vitest';

import {
  applyRunToBoard,
  emptyBoard,
  toggleBoardItem,
} from '@/lib/board/model';
import type { HistoryEntry } from './model';
import {
  averageEnergy,
  currentStreak,
  energySeries,
  runCounts,
  weeklyCounts,
} from './stats';

const entry = (
  completedAt: string,
  extra: Partial<HistoryEntry> = {},
): HistoryEntry => ({
  id: completedAt,
  runId: 'morning',
  runName: 'Quick morning',
  group: 'Daily',
  startedAt: completedAt,
  completedAt,
  durationSec: 180,
  totalSteps: 5,
  answered: 4,
  skipped: 1,
  energy: null,
  intention: {
    dateLabel: 'Sunday',
    runName: 'Quick morning',
    headline: 'Today.',
    lines: [],
  },
  cards: [],
  ...extra,
});

describe('stats', () => {
  const today = new Date(2026, 9, 25, 12);

  it('counts a streak that ends yesterday', () => {
    const entries = [
      entry(new Date(2026, 9, 24, 9).toISOString()),
      entry(new Date(2026, 9, 23, 9).toISOString()),
    ];
    expect(currentStreak(entries, today)).toBe(2);
  });

  it('breaks the streak after a missed day', () => {
    expect(
      currentStreak([entry(new Date(2026, 9, 22, 9).toISOString())], today),
    ).toBe(0);
  });

  it('buckets runs by week, ending with this week', () => {
    const entries = [
      entry(new Date(2026, 9, 25, 9).toISOString()),
      entry(new Date(2026, 9, 20, 9).toISOString()),
      entry(new Date(2026, 9, 14, 9).toISOString()),
    ];
    const weeks = weeklyCounts(entries, today, 3);
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 2]);
  });

  it('collects the energy series oldest first and averages it', () => {
    const entries = [
      entry('2026-10-24T09:00:00.000Z', { energy: 4 }),
      entry('2026-10-23T09:00:00.000Z', { energy: 8 }),
      entry('2026-10-22T09:00:00.000Z'),
    ];
    const series = energySeries(entries);
    expect(series.map((p) => p.value)).toEqual([8, 4]);
    expect(averageEnergy(series)).toBe(6);
    expect(averageEnergy([])).toBeNull();
  });

  it('ranks the most used runs', () => {
    const entries = [
      entry('a'),
      entry('b'),
      entry('c', { runName: 'Weekly review' }),
    ];
    expect(runCounts(entries)[0]).toEqual({ name: 'Quick morning', count: 2 });
  });
});

describe('board', () => {
  const now = new Date(2026, 9, 25, 9, 5);
  const e = entry(now.toISOString(), {
    cards: [
      {
        dest: 'Tasks',
        title: 'Tasks',
        from: 'x',
        headline: '2 tasks added',
        detail: '',
        note: '',
        empty: false,
        items: ['A', 'B'],
      },
      {
        dest: 'Journal',
        title: 'Journal',
        from: 'x',
        headline: 'Entry started',
        detail: '',
        note: 'Slept badly',
        empty: false,
        items: ['Energy Check 3/10'],
      },
      {
        dest: 'Notes',
        title: 'Notes',
        from: 'x',
        headline: '',
        detail: '',
        note: '',
        empty: true,
        items: [],
      },
    ],
  });

  it('files items, writes the journal and skips empty cards', () => {
    const board = applyRunToBoard(emptyBoard(''), e, now);
    expect(board.date).toBe('2026-10-25');
    expect(board.items.Tasks?.map((i) => i.text)).toEqual(['A', 'B']);
    expect(board.items.Notes).toBeUndefined();
    expect(board.journal).toContain('- Energy Check 3/10');
    expect(board.journal).toContain('Slept badly');
  });

  it('does not duplicate items when a run repeats on the same day', () => {
    const once = applyRunToBoard(emptyBoard(''), e, now);
    const twice = applyRunToBoard(once, e, now);
    expect(twice.items.Tasks).toHaveLength(2);
  });

  it('starts fresh on a new day', () => {
    const old = applyRunToBoard(emptyBoard(''), e, new Date(2026, 9, 24, 9));
    const next = applyRunToBoard(old, e, now);
    expect(next.date).toBe('2026-10-25');
    expect(next.journal.match(/Quick morning/g)).toHaveLength(1);
  });

  it('ticks off checkable items only', () => {
    const board = applyRunToBoard(emptyBoard(''), e, now);
    const id = board.items.Tasks![0]!.id;
    expect(toggleBoardItem(board, 'Tasks', id).items.Tasks![0]!.done).toBe(
      true,
    );
    expect(toggleBoardItem(board, 'Schedule', id)).toBe(board);
  });
});
