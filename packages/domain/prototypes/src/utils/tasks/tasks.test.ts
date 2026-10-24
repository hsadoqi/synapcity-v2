import { describe, expect, it } from 'vitest';

import { recentActivity } from '../activity';
import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { tasksForProject, toggleTask } from './index';

const ctx = {
  ownerId: '11111111-1111-4111-8111-111111111111',
  now: Date.UTC(2026, 9, 21, 12),
};
const task = (id: string, projectId: string, name: string, order: number) => ({
  ...newRecord('task', name, ctx),
  id,
  projectId,
  done: false,
  order,
});

describe('toggleTask', () => {
  it('records an activity only when a task is completed', () => {
    let r = putRecord(emptyRecords(), 'task', task('t1', 'p', 'Ship', 0));
    r = toggleTask(r, 't1', ctx);
    expect(r.task.t1?.done).toBe(true);
    expect(recentActivity(r.activity, 5)).toEqual([
      expect.objectContaining({
        name: 'Completed "Ship"',
        occurredAt: '2026-10-21T12:00:00.000Z',
        subject: { kind: 'task', id: 't1' },
      }),
    ]);
    r = toggleTask(r, 't1', { ...ctx, now: ctx.now + 1 });
    expect(r.task.t1?.done).toBe(false);
    expect(r.task.t1?.updatedAt).toBe('2026-10-21T12:00:00.001Z');
    expect(Object.keys(r.activity)).toHaveLength(1);
  });

  it('ignores unknown tasks', () => {
    const r = emptyRecords();
    expect(toggleTask(r, 'missing', ctx)).toBe(r);
  });
});

describe('tasksForProject', () => {
  it('orders tasks within a project', () => {
    let r = emptyRecords();
    r = putRecord(r, 'task', task('b', 'p', 'B', 1));
    r = putRecord(r, 'task', task('a', 'p', 'A', 0));
    r = putRecord(r, 'task', task('x', 'other', 'X', 0));
    expect(tasksForProject(r.task, 'p').map((t) => t.id)).toEqual(['a', 'b']);
  });
});
