import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { addTask } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const withProject = () =>
  putRecord(emptyRecords(), 'project', {
    ...newRecord('project', 'Launch', ctx),
    id: 'p1',
  });

describe('addTask', () => {
  it('appends a trimmed, open task after the last one in the project', () => {
    let r = addTask(withProject(), 'p1', '  Write docs  ', ctx);
    r = addTask(r, 'p1', 'Ship', ctx);
    const tasks = Object.values(r.task);
    expect(tasks.map((t) => [t.name, t.done, t.order])).toEqual([
      ['Write docs', false, 0],
      ['Ship', false, 1],
    ]);
    expect(tasks.every((t) => t.projectId === 'p1')).toBe(true);
  });

  it('ignores blank names and unknown projects', () => {
    const r = withProject();
    expect(addTask(r, 'p1', '   ', ctx)).toBe(r);
    expect(addTask(r, 'missing', 'Ship', ctx)).toBe(r);
  });
});
