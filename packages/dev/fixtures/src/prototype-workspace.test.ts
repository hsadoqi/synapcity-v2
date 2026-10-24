import {
  emptyRecords,
  eventsThisWeek,
  getRecord,
  newRecord,
  prototypeRecordSchemas,
  putRecord,
  type PrototypeRecordKind,
} from '@synapcity/domain-prototypes';
import { describe, expect, it } from 'vitest';

import {
  PROTOTYPE_OWNER_ID,
  WORKSPACE_NOTE_ID,
  createPrototypeWorkspace,
  simulateTick,
} from './prototype-workspace.ts';

describe('createPrototypeWorkspace', () => {
  const now = new Date(2026, 9, 23, 9, 0).getTime();
  const { records, composition, simulations } = createPrototypeWorkspace(now);

  it("matches the prototype's eight curated widgets", () => {
    expect(composition.widgets.map((w) => w.type)).toEqual([
      'stat',
      'stat',
      'progress',
      'habit',
      'calendar',
      'feed',
      'tasks',
      'notes',
    ]);
    expect(composition.layouts.lg).toHaveLength(8);
  });

  it('only references records that exist', () => {
    for (const w of composition.widgets) {
      if ('source' in w) expect(getRecord(records, w.source)).toBeDefined();
    }
    expect(records.note[WORKSPACE_NOTE_ID]).toBeDefined();
  });

  it('builds records that pass their schemas', () => {
    for (const kind of Object.keys(records) as PrototypeRecordKind[]) {
      for (const record of Object.values(records[kind])) {
        expect(prototypeRecordSchemas[kind].parse(record)).toEqual(record);
        expect(record.ownerId).toBe(PROTOTYPE_OWNER_ID);
      }
    }
  });

  it('places the schedule in the current week', () => {
    expect(eventsThisWeek(records.event, now).map((e) => e.name)).toEqual([
      'Morning run',
      'Gym — legs',
      'Project review',
      'Meal prep',
    ]);
  });

  it('schedules events at their local wall-clock times', () => {
    const times = eventsThisWeek(records.event, now).map((e) => {
      const d = new Date(e.startsAt);
      return [d.getHours(), d.getMinutes()];
    });
    expect(times).toEqual([
      [7, 0],
      [18, 30],
      [9, 0],
      [10, 0],
    ]);
  });

  it('never marks future habit days complete', () => {
    const habit = Object.values(records.habit)[0]!;
    expect(habit.completedDays.every((d) => d <= '2026-10-23')).toBe(true);
  });

  it('simulates the seeded metrics and goal only', () => {
    expect(Object.keys(simulations).sort()).toEqual(
      [...Object.keys(records.metric), ...Object.keys(records.goal)].sort(),
    );
  });
});

describe('simulateTick', () => {
  const ctx = { ownerId: PROTOTYPE_OWNER_ID, now: 0 };
  const metric = (id: string, value: number) => ({
    ...newRecord('metric', id, ctx),
    id,
    value,
    unit: '',
    note: '',
  });

  it('changes only simulated records and never passes a goal target', () => {
    let r = emptyRecords();
    r = putRecord(r, 'metric', metric('sim', 0));
    r = putRecord(r, 'metric', metric('real', 0));
    r = putRecord(r, 'goal', {
      ...newRecord('goal', 'g', ctx),
      id: 'g',
      current: 9,
      target: 10,
      unit: '',
    });
    const sims = {
      sim: { chancePerTick: 1, maxIncrement: 40 },
      g: { chancePerTick: 1, maxIncrement: 5 },
    };
    const next = simulateTick(r, sims, 1000, () => 0.5);
    expect(next.metric.sim).toMatchObject({
      value: 20,
      updatedAt: '1970-01-01T00:00:01.000Z',
    });
    expect(next.metric.real).toBe(r.metric.real);
    expect(next.goal.g?.current).toBe(10);
    expect(simulateTick(next, sims, 2000, () => 0.5).goal.g).toBe(next.goal.g);
  });

  it('does nothing when the chance roll fails', () => {
    const r = putRecord(emptyRecords(), 'metric', metric('m', 1));
    const sims = { m: { chancePerTick: 0.2, maxIncrement: 1 } };
    expect(simulateTick(r, sims, 0, () => 0.9)).toBe(r);
  });
});
