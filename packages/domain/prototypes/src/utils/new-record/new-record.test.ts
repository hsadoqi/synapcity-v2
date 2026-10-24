import { baseRecordSchema } from '@synapcity/domain-records';
import { describe, expect, it } from 'vitest';

import { PROTOTYPE_RECORD_KINDS } from '../../schemas';
import { newRecord } from './index';

const ctx = {
  ownerId: '11111111-1111-4111-8111-111111111111',
  now: Date.UTC(2026, 9, 21, 12),
};

describe('newRecord', () => {
  it.each(PROTOTYPE_RECORD_KINDS)(
    'builds a valid base record for %s',
    (kind) => {
      const record = newRecord(kind, 'Name', ctx);
      expect(baseRecordSchema.parse(record)).toEqual(record);
      expect(record.createdAt).toBe('2026-10-21T12:00:00.000Z');
    },
  );
});
