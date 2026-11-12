import { describe, expect, it } from 'vitest';

import { RECORD_KINDS, isRecordKind, recordKindSchema } from './kinds';

describe('record kinds', () => {
  it('lists the three persisted kinds, singular', () => {
    expect(RECORD_KINDS).toEqual(['space', 'document', 'dashboard']);
  });

  it.each(['space', 'document', 'dashboard'])('accepts %s', (kind) => {
    expect(isRecordKind(kind)).toBe(true);
    expect(recordKindSchema.parse(kind)).toBe(kind);
  });

  it.each(['spaces', 'task', '', null, 1])('refuses %j', (kind) => {
    expect(isRecordKind(kind)).toBe(false);
    expect(recordKindSchema.safeParse(kind).success).toBe(false);
  });
});
