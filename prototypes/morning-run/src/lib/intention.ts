import { z } from 'zod';

import type { Run } from '@/lib/runs/schema';
import { wordFor } from '@/lib/runs/words';
import { paceFor } from '@/lib/pace';
import { energyOf, type RoutedCard } from '@/lib/routing';
import type { RunSession } from '@/lib/session/model';

export const intentionSchema = z.object({
  dateLabel: z.string(),
  runName: z.string(),
  headline: z.string(),
  lines: z.array(z.object({ label: z.string(), text: z.string() })),
  pace: z.string().optional(),
});

/** The shareable summary of a finished run. */
export type Intention = z.infer<typeof intentionSchema>;

const LABELS: Partial<Record<RoutedCard['dest'], string>> = {
  Focus: 'Focus',
  Tasks: 'Priorities',
  Schedule: 'Schedule',
  Journal: 'On my mind',
  Notes: 'Remember',
  Habits: 'Habits',
  Health: 'Body',
  People: 'People',
  Money: 'Money',
  Home: 'Home',
  Documents: 'Starting',
  Dashboard: 'Dashboard',
  Archive: 'Letting go',
};

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function headlineFor(cards: RoutedCard[], run: Run): string {
  const focus = cards.find((c) => c.dest === 'Focus' && !c.empty);
  if (focus) return `Today I am focusing on ${focus.items[0]?.toLowerCase()}.`;
  const tasks = cards.find((c) => c.dest === 'Tasks' && !c.empty);
  if (tasks)
    return `Today I am getting ${list(tasks.items.slice(0, 3).map((t) => t.toLowerCase()))} done.`;
  const first = cards.find((c) => !c.empty && c.dest !== 'Archive');
  if (first) return `${first.headline}.`;
  return `I took a moment: ${run.name.toLowerCase()}.`;
}

export function buildIntention(
  run: Run,
  session: RunSession,
  cards: RoutedCard[],
  date: Date,
): Intention {
  const lines: Intention['lines'] = [];

  const energy = energyOf(run, session);
  if (energy !== null) {
    const step = run.steps.find((s) => s.kind === 'scale' && s.energy);
    const word =
      step && step.kind === 'scale' ? wordFor(step.wordSet, energy) : '';
    lines.push({
      label: 'Energy',
      text: `${energy}/10${word ? `, ${word.toLowerCase()}` : ''}`,
    });
  }

  for (const card of cards) {
    if (card.empty || card.dest === 'Schedule' || card.dest === 'Archive')
      continue;
    const label = LABELS[card.dest] ?? card.title;
    // The energy rating already has its own line.
    const items =
      card.dest === 'Journal' && energy !== null
        ? card.items.filter((item) => !/ \d+\/10$/.test(item))
        : card.items;
    const text = card.dest === 'Focus' ? (items[0] ?? '') : list(items);
    if (text)
      lines.push({
        label,
        text: text.length > 160 ? `${text.slice(0, 157)}...` : text,
      });
  }

  const hasSchedule = cards.some((c) => c.dest === 'Schedule' && !c.empty);
  return {
    dateLabel: formatDateLabel(date),
    runName: run.name,
    headline: headlineFor(cards, run),
    lines,
    pace: energy !== null || hasSchedule ? paceFor(energy).note : undefined,
  };
}

export function intentionText(i: Intention): string {
  const body = i.lines.map((l) => `${l.label}: ${l.text}`);
  return [
    `Intention for ${i.dateLabel}`,
    '',
    i.headline,
    '',
    ...body,
    ...(i.pace ? ['', i.pace] : []),
    '',
    `From my ${i.runName} run.`,
  ].join('\n');
}

export function intentionMarkdown(i: Intention): string {
  const body = i.lines.map((l) => `- **${l.label}:** ${l.text}`);
  return [
    `# Intention for ${i.dateLabel}`,
    '',
    `> ${i.headline}`,
    '',
    ...body,
    ...(i.pace ? ['', `_${i.pace}_`] : []),
    '',
    `From my ${i.runName} run.`,
    '',
  ].join('\n');
}
