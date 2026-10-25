import { z } from 'zod';

import {
  DESTINATION_META,
  destinationSchema,
  type DestinationId,
} from '@/lib/runs/destinations';
import { dateKey } from '@/lib/history/stats';
import type { HistoryEntry } from '@/lib/history/model';
import { focusPlanSchema } from '@/lib/focus';
import { intentionSchema } from '@/lib/intention';

const boardItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  source: z.string(),
});

export type BoardItem = z.infer<typeof boardItemSchema>;

/** Today's board: what this day's runs set up, with room to tick things off and write. */
export const boardSchema = z.object({
  date: z.string(),
  intention: intentionSchema.nullable(),
  focus: focusPlanSchema.nullable().optional(),
  items: z.partialRecord(destinationSchema, z.array(boardItemSchema)),
  journal: z.string(),
});

export type Board = z.infer<typeof boardSchema>;

export const emptyBoard = (date: string): Board => ({
  date,
  intention: null,
  focus: null,
  items: {},
  journal: '',
});

export const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
});
export const layoutSchema = z.array(layoutItemSchema);

function timeLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Fold a finished run into today's board. A board from an earlier day starts fresh; yesterday
 * lives on in history. Items already on the board are not added twice.
 */
export function applyRunToBoard(
  board: Board,
  entry: HistoryEntry,
  now: Date,
): Board {
  const base = board.date === dateKey(now) ? board : emptyBoard(dateKey(now));
  const items = { ...base.items };
  let journal = base.journal;

  for (const card of entry.cards) {
    if (card.empty || card.items.length === 0) continue;

    if (card.dest === 'Journal') {
      const block = [
        `${entry.runName}, ${timeLabel(now)}`,
        ...card.items.map((t) => `- ${t}`),
      ];
      if (card.note) block.push(card.note);
      journal = journal
        ? `${journal}\n\n${block.join('\n')}`
        : block.join('\n');
      continue;
    }

    const existing = items[card.dest] ?? [];
    const known = new Set(existing.map((i) => i.text));
    const added: BoardItem[] = card.items
      .filter((t) => !known.has(t))
      .map((text, n) => ({
        id: `${entry.id}.${card.dest}.${n}`,
        text,
        done: false,
        source: entry.runName,
      }));
    if (added.length > 0) items[card.dest] = [...existing, ...added];
  }

  return {
    ...base,
    intention: entry.intention,
    focus: entry.focusPlan ?? base.focus,
    items,
    journal,
  };
}

export function toggleBoardItem(
  board: Board,
  dest: DestinationId,
  id: string,
): Board {
  if (!DESTINATION_META[dest].checkable) return board;
  const list = board.items[dest] ?? [];
  return {
    ...board,
    items: {
      ...board.items,
      [dest]: list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    },
  };
}

/** Widgets the board can show, in their default order. Journal has its own editor widget. */
export const WIDGET_ORDER: DestinationId[] = [
  'Focus',
  'Tasks',
  'Schedule',
  'Health',
  'People',
  'Money',
  'Home',
  'Habits',
  'Notes',
  'Documents',
  'Dashboard',
  'Archive',
];
