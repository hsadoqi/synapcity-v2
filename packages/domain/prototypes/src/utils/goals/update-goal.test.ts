import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { updateGoal } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const base = () =>
  putRecord(emptyRecords(), 'goal', {
    ...newRecord('goal', 'Read', ctx),
    id: 'g1',
    current: 3,
    target: 10,
    unit: 'books',
  });

describe('updateGoal', () => {
  it('writes current and target and touches the record', () => {
    const r = updateGoal(base(), 'g1', { current: 4, target: 12 }, 1000);
    expect(r.goal.g1).toMatchObject({ current: 4, target: 12 });
    expect(r.goal.g1?.updatedAt).toBe('1970-01-01T00:00:01.000Z');
  });

  it('refuses negative or non-finite values', () => {
    const r = base();
    expect(updateGoal(r, 'g1', { current: -1 }, 1)).toBe(r);
    expect(updateGoal(r, 'g1', { target: Number.NaN }, 1)).toBe(r);
  });

  it('returns the same records when nothing changes or the goal is unknown', () => {
    const r = base();
    expect(updateGoal(r, 'g1', { current: 3 }, 1)).toBe(r);
    expect(updateGoal(r, 'missing', { current: 1 }, 1)).toBe(r);
  });
});
