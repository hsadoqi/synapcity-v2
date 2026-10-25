import type { DestinationId } from '@/lib/runs/destinations';
import type { Run } from '@/lib/runs/schema';
import type { FocusPlan } from '@/lib/focus';
import { HOURS_BY_OPTION, formatHour, paceFor } from '@/lib/pace';
import type { RunSession } from '@/lib/session/model';

/** What one area of life receives from a run. */
export type RoutedCard = {
  dest: DestinationId;
  title: string;
  /** The steps that fed it. */
  from: string;
  headline: string;
  detail: string;
  note: string;
  empty: boolean;
  items: string[];
};

type Bucket = { items: string[]; notes: string[]; from: string[] };

const join = (items: string[]) => items.join('  ·  ');
const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** The energy rating given in this run, if it asked for one. */
export function energyOf(run: Run, session: RunSession): number | null {
  for (const step of run.steps) {
    const answer = session.answers[step.id];
    if (step.kind === 'scale' && step.energy && typeof answer === 'number')
      return answer;
  }
  return null;
}

function hoursOf(run: Run, session: RunSession): number {
  for (const step of run.steps) {
    const answer = session.answers[step.id];
    if (
      step.kind === 'pick' &&
      step.hours &&
      Array.isArray(answer) &&
      answer[0]
    ) {
      return HOURS_BY_OPTION[answer[0]] ?? 2;
    }
  }
  return 2;
}

/**
 * Every answer goes somewhere. Steps name their destinations; this folds the answers into one
 * card per destination, in the order destinations first appear.
 */
export function routeAnswers(run: Run, session: RunSession): RoutedCard[] {
  const energy = energyOf(run, session);
  const hours = hoursOf(run, session);
  const pace = paceFor(energy);
  const buckets = new Map<DestinationId, Bucket>();

  const add = (
    dest: DestinationId,
    items: string[],
    note: string,
    from: string,
  ) => {
    const bucket = buckets.get(dest) ?? { items: [], notes: [], from: [] };
    bucket.items.push(...items);
    if (note) bucket.notes.push(note);
    if (!bucket.from.includes(from)) bucket.from.push(from);
    buckets.set(dest, bucket);
  };

  for (const step of run.steps) {
    const answer = session.answers[step.id];
    const note = (session.notes[step.id] ?? '').trim();

    if (step.kind === 'pick' && step.destMap) {
      const choice = Array.isArray(answer) ? answer[0] : undefined;
      const dest = choice ? step.destMap[choice] : undefined;
      if (dest) add(dest, [step.label], note, 'Sweep');
      continue;
    }

    for (const dest of step.dest ?? []) {
      let items: string[] = [];
      if (step.kind === 'scale' && typeof answer === 'number')
        items = [`${step.label} ${answer}/10`];
      else if (step.kind === 'pick' && Array.isArray(answer))
        items = [...answer];
      else if (
        step.kind === 'text' &&
        typeof answer === 'string' &&
        answer.trim()
      )
        items = [answer.trim()];

      const pacingOnly =
        step.kind === 'scale'
          ? step.energy
          : step.kind === 'pick' && step.hours;
      if (dest === 'Schedule' && pacingOnly) continue;
      if (dest === 'Focus') items = items.slice(0, 1);
      add(dest, items, note, step.label);
    }
  }

  return [...buckets.entries()].map(([dest, bucket]) => {
    const n = bucket.items.length;
    const first = bucket.items[0] ?? '';
    let display = bucket.items;
    let headline = 'Nothing to add';
    let detail = 'You skipped the steps that feed this.';

    if (n > 0) {
      switch (dest) {
        case 'Tasks':
          headline = `${plural(n, 'task', 'tasks')} added`;
          detail = join(bucket.items);
          break;
        case 'Schedule': {
          const start = pace.startHour;
          const lines = bucket.items.map((item, k) =>
            n === 1
              ? `${formatHour(start)} to ${formatHour(start + hours)}: ${item}`
              : `${formatHour(start + k)}: ${item}`,
          );
          display = lines;
          headline = lines[0] ?? '';
          detail = `${n > 1 ? `${lines.slice(1).join('  ·  ')}. ` : ''}${energy !== null ? pace.note : 'Times are a starting point.'}`;
          break;
        }
        case 'Focus': {
          const sessions = Math.max(
            1,
            Math.floor((hours * 60) / (pace.sessionMin + pace.breakMin)),
          );
          headline = `Focus: ${first}`;
          detail = `${plural(sessions, 'session', 'sessions')} of ${pace.sessionMin} minutes with ${pace.breakMin} minute breaks, ready to start.`;
          break;
        }
        case 'Journal':
          headline = 'Entry started';
          detail = join(bucket.items);
          break;
        case 'Notes':
          headline = n === 1 ? 'Note created' : `${n} notes created`;
          detail = join(bucket.items);
          break;
        case 'Documents':
          headline = `Document created: ${first}`;
          detail = 'A starter outline is ready to edit.';
          break;
        case 'Dashboard':
          headline = `Dashboard set up: ${first}`;
          detail = 'A blank dashboard is ready for its first widgets.';
          break;
        case 'Habits':
          headline = `${plural(n, 'habit', 'habits')} logged`;
          detail = join(bucket.items);
          break;
        case 'Archive':
          headline = `${plural(n, 'item', 'items')} let go`;
          detail = `${join(bucket.items)}. Archived, not deleted.`;
          break;
        case 'Health':
          headline = plural(n, 'thing for your body', 'things for your body');
          detail = join(bucket.items);
          break;
        case 'People':
          headline = plural(n, 'reach-out', 'reach-outs') + ' lined up';
          detail = join(bucket.items);
          break;
        case 'Money':
          headline = plural(n, 'money item', 'money items') + ' to look at';
          detail = join(bucket.items);
          break;
        case 'Home':
          headline = plural(n, 'home job', 'home jobs') + ' lined up';
          detail = join(bucket.items);
          break;
      }
    }

    return {
      dest,
      title: dest,
      from: bucket.from.slice(0, 2).join(' + ') || run.name,
      headline,
      detail,
      note: bucket.notes.join('  ·  '),
      empty: n === 0,
      items: display,
    };
  });
}

/** The pacing for a focus session, when the run chose something to focus on. */
export function focusPlanOf(
  run: Run,
  session: RunSession,
  cards: RoutedCard[],
): FocusPlan | null {
  const focus = cards.find((c) => c.dest === 'Focus' && !c.empty);
  if (!focus) return null;
  const pace = paceFor(energyOf(run, session));
  const hours = hoursOf(run, session);
  return {
    label: focus.items[0] ?? '',
    sessionMin: pace.sessionMin,
    breakMin: pace.breakMin,
    sessions: Math.max(
      1,
      Math.floor((hours * 60) / (pace.sessionMin + pace.breakMin)),
    ),
  };
}
