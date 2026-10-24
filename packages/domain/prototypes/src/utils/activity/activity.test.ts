import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { recentActivity } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const activity = (name: string, occurredAt: string) => ({
  ...newRecord('activity', name, ctx),
  occurredAt,
});

describe('recentActivity', () => {
  it('sorts newest first and limits', () => {
    let r = emptyRecords();
    r = putRecord(r, 'activity', activity('old', '2026-10-21T09:00:00Z'));
    r = putRecord(r, 'activity', activity('new', '2026-10-21T11:00:00+01:00'));
    r = putRecord(r, 'activity', activity('mid', '2026-10-21T09:30:00Z'));
    expect(recentActivity(r.activity, 2).map((a) => a.name)).toEqual([
      'new',
      'mid',
    ]);
  });
});
