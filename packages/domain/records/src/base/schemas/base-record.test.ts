import { describe, expect, it } from 'vitest';

import { baseRecordSchema } from './index';

const record = {
  id: 'opaque/id',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Launch plan',
  icon: 'file-text',
  tags: ['work'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
  pinnedAt: '2026-10-04T09:00:00Z',
  lastViewedAt: '2026-10-05T18:00:00+00:00',
};

describe('baseRecordSchema', () => {
  it('parses a full record and keeps the pinned and last-viewed times', () => {
    expect(baseRecordSchema.parse(record)).toEqual(record);
  });

  it('defaults the pinned and last-viewed times to null when absent', () => {
    const { pinnedAt, lastViewedAt, ...withoutState } = record;
    void pinnedAt;
    void lastViewedAt;

    expect(baseRecordSchema.parse(withoutState)).toMatchObject({
      pinnedAt: null,
      lastViewedAt: null,
    });
  });

  it('trims the name', () => {
    expect(
      baseRecordSchema.parse({ ...record, name: '  Launch plan  ' }).name,
    ).toBe('Launch plan');
  });

  it.each([
    { name: '  ' },
    { icon: 'Pen' },
    { ownerId: 'x' },
    { createdAt: '2026-10-01' },
  ])('rejects invalid fields: %j', (fields) => {
    const result = baseRecordSchema.safeParse({ ...record, ...fields });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe(Object.keys(fields)[0]);
    }
  });

  it('carries no Space copy: a blank name does not report the Space message', () => {
    const result = baseRecordSchema.safeParse({ ...record, name: '  ' });

    expect(result.error?.issues.map((i) => i.message)).not.toContain(
      'Enter a space name.',
    );
  });
});
