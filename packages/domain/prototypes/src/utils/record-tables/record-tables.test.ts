import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import {
  emptyRecords,
  getRecord,
  putRecord,
  removeRecord,
  touchRecord,
} from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

describe('record tables', () => {
  const project = newRecord('project', 'Launch', ctx);
  const records = putRecord(emptyRecords(), 'project', project);

  it('reads a record through its reference', () => {
    expect(getRecord(records, { kind: 'project', id: project.id })).toBe(
      project,
    );
    expect(
      getRecord(records, { kind: 'project', id: 'missing' }),
    ).toBeUndefined();
  });

  it('removes a record and ignores unknown ids', () => {
    expect(removeRecord(records, 'project', project.id).project).toEqual({});
    expect(removeRecord(records, 'project', 'missing')).toBe(records);
  });

  it('moves updatedAt only', () => {
    const touched = touchRecord(project, Date.UTC(2026, 0, 2));
    expect(touched).toEqual({
      ...project,
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });
});
