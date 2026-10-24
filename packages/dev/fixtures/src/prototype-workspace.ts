import {
  createComposition,
  layoutsForWidgets,
  type DashboardComposition,
  type Widget,
} from '@synapcity/domain-dashboards';
import {
  dayKey,
  emptyRecords,
  newRecord,
  putRecord,
  weekDayStarts,
  type Note,
  type PrototypeRecords,
  type RecordContext,
} from '@synapcity/domain-prototypes';

/*
 * The responsive-grid prototype's sample workspace and its mock live data,
 * for tests, stories and local development. Built on the prototype record
 * kinds in @synapcity/domain-prototypes.
 */

export const PROTOTYPE_OWNER_ID = '00000000-0000-4000-8000-000000000001';

/** The workspace-level scratch note shown in the sidebar Notes panel. */
export const WORKSPACE_NOTE_ID = 'nte_workspace';

export function workspaceNote(ctx: RecordContext): Note {
  return {
    ...newRecord('note', 'Workspace notes', ctx),
    id: WORKSPACE_NOTE_ID,
    body: '',
  };
}

/**
 * Mock live-data behaviour for a seeded record. Kept beside the records, not
 * on them, so the mock feed can never drift a record the user created.
 */
export type Simulation = {
  /** Probability (0–1) that a tick changes the value. */
  chancePerTick: number;
  /** Upper bound of a single increment; increments are at least 1. */
  maxIncrement: number;
};

/** Simulations keyed by metric or goal id. */
export type Simulations = Record<string, Simulation>;

export type PrototypeWorkspace = {
  records: PrototypeRecords;
  composition: DashboardComposition;
  simulations: Simulations;
};

const MINUTE = 60_000;

/**
 * The prototype's curated first-run dashboard: fitness, reading and a side
 * project. Dates fall in the week containing `now`, so the schedule and
 * habit widgets are populated whenever it runs.
 */
export function createPrototypeWorkspace(
  now: number,
  ownerId: string = PROTOTYPE_OWNER_ID,
): PrototypeWorkspace {
  const ctx = { ownerId, now };
  const at = (date: number) => new Date(date).toISOString();
  const week = weekDayStarts(now);
  // Built from calendar parts, not midnight plus milliseconds, so a daylight
  // saving change earlier in the day cannot shift the wall-clock time.
  const weekAt = (weekday: number, hours: number, minutes = 0) => {
    const day = new Date(week[weekday] ?? now);
    return new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hours,
      minutes,
    ).getTime();
  };
  let r = emptyRecords();
  const simulations: Simulations = {};

  const workouts = {
    ...newRecord('metric', 'Workouts this week', ctx),
    value: 4,
    unit: 'sessions logged',
    note: '+1 vs last week',
  };
  const steps = {
    ...newRecord('metric', 'Steps today', ctx),
    value: 8214,
    unit: 'steps',
    note: '68% of goal',
  };
  r = putRecord(putRecord(r, 'metric', workouts), 'metric', steps);
  simulations[workouts.id] = { chancePerTick: 0.15, maxIncrement: 1 };
  simulations[steps.id] = { chancePerTick: 0.5, maxIncrement: 40 };

  const books = {
    ...newRecord('goal', 'Read 24 books', ctx),
    current: 14,
    target: 24,
    unit: 'books',
  };
  r = putRecord(r, 'goal', books);
  simulations[books.id] = { chancePerTick: 0.15, maxIncrement: 1 };

  const today = dayKey(now);
  const pattern = [true, true, false, true, true, false, false];
  const meditate = {
    ...newRecord('habit', 'Meditate daily', ctx),
    completedDays: week
      .map((start) => dayKey(start))
      .filter((key, i) => pattern[i] && key <= today),
  };
  r = putRecord(r, 'habit', meditate);

  for (const [weekday, h, m, name] of [
    [0, 7, 0, 'Morning run'],
    [2, 18, 30, 'Gym — legs'],
    [3, 9, 0, 'Project review'],
    [5, 10, 0, 'Meal prep'],
  ] as const) {
    r = putRecord(r, 'event', {
      ...newRecord('event', name, ctx),
      startsAt: at(weekAt(weekday, h, m)),
    });
  }

  for (const [minutesAgo, name] of [
    [4, 'Completed "Draft outline"'],
    [12, 'Logged 5k run'],
    [32, 'Added new vision board image'],
  ] as const) {
    r = putRecord(r, 'activity', {
      ...newRecord('activity', name, ctx),
      occurredAt: at(now - minutesAgo * MINUTE),
    });
  }

  const habitApp = newRecord('project', 'Side project: Habit app', ctx);
  r = putRecord(r, 'project', habitApp);
  [
    'Sketch onboarding flow',
    'Wire up habit streaks',
    'Write launch notes',
  ].forEach((name, order) => {
    r = putRecord(r, 'task', {
      ...newRecord('task', name, ctx),
      projectId: habitApp.id,
      done: order === 0,
      order,
    });
  });

  const ideas = {
    ...newRecord('note', 'Ideas', ctx),
    body: 'Vision board: morning routine, 5k pace goal, side project launch checklist.',
  };
  r = putRecord(r, 'note', ideas);
  r = putRecord(r, 'note', workspaceNote(ctx));

  for (const [name, url] of [
    ['Design system', 'https://lucide.dev/'],
    ['Personal wiki', 'https://example.com/'],
  ] as const) {
    r = putRecord(r, 'link', { ...newRecord('link', name, ctx), url });
  }

  let widgetCount = 0;
  const w = (title: string, highlight: Widget['highlight'] = 'none') => ({
    id: `wgt_seed${++widgetCount}`,
    title,
    collapsed: false,
    highlight,
    status: 'active' as const,
  });
  const widgets: Widget[] = [
    {
      ...w('Workouts this week', 'accent'),
      type: 'stat',
      source: { kind: 'metric', id: workouts.id },
    },
    {
      ...w('Steps today'),
      type: 'stat',
      source: { kind: 'metric', id: steps.id },
    },
    {
      ...w('Read 24 books', 'accent'),
      type: 'progress',
      source: { kind: 'goal', id: books.id },
    },
    {
      ...w('Meditate daily'),
      type: 'habit',
      source: { kind: 'habit', id: meditate.id },
    },
    { ...w('This week'), type: 'calendar', query: { range: 'week' } },
    { ...w('Recent activity'), type: 'feed', query: { limit: 6 } },
    {
      ...w('Side project: Habit app', 'accent'),
      type: 'tasks',
      source: { kind: 'project', id: habitApp.id },
    },
    { ...w('Ideas'), type: 'notes', source: { kind: 'note', id: ideas.id } },
  ];

  const { settings } = createComposition();
  return {
    records: r,
    composition: {
      settings,
      widgets,
      layouts: layoutsForWidgets(widgets, settings),
    },
    simulations,
  };
}

function simulatedIncrement(
  simulation: Simulation,
  random: () => number,
): number {
  if (random() >= simulation.chancePerTick) return 0;
  return Math.max(1, Math.round(random() * simulation.maxIncrement));
}

/**
 * One tick of the mock live-data source. Only records with a simulation
 * change; goals never pass their target.
 */
export function simulateTick(
  records: PrototypeRecords,
  simulations: Simulations,
  now: number,
  random: () => number = Math.random,
): PrototypeRecords {
  const updatedAt = new Date(now).toISOString();
  let next = records;
  for (const metric of Object.values(records.metric)) {
    const simulation = simulations[metric.id];
    if (!simulation) continue;
    const inc = simulatedIncrement(simulation, random);
    if (inc)
      next = putRecord(next, 'metric', {
        ...metric,
        value: metric.value + inc,
        updatedAt,
      });
  }
  for (const goal of Object.values(records.goal)) {
    const simulation = simulations[goal.id];
    if (!simulation || goal.current >= goal.target) continue;
    const inc = simulatedIncrement(simulation, random);
    if (inc)
      next = putRecord(next, 'goal', {
        ...goal,
        current: Math.min(goal.target, goal.current + inc),
        updatedAt,
      });
  }
  return next;
}
