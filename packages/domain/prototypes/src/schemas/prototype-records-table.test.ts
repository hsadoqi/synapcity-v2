import { describe, expect, it } from 'vitest';

import { newRecord } from '../utils/new-record';
import { emptyRecords } from '../utils/record-tables';
import { prototypeRecordsSchema } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };

describe('prototypeRecordsSchema', () => {
  it('accepts every table empty', () => {
    expect(prototypeRecordsSchema.parse(emptyRecords())).toEqual(
      emptyRecords(),
    );
  });

  it('rejects a table with an invalid record', () => {
    const habit = {
      ...newRecord('habit', 'Run', ctx),
      completedDays: ['monday'],
    };
    const records = { ...emptyRecords(), habit: { [habit.id]: habit } };
    expect(prototypeRecordsSchema.safeParse(records).success).toBe(false);
  });

  it('rejects a record stored under another id', () => {
    const note = { ...newRecord('note', 'Ideas', ctx), id: 'b', body: '' };
    const records = { ...emptyRecords(), note: { a: note } };
    expect(prototypeRecordsSchema.safeParse(records).success).toBe(false);
  });
});
