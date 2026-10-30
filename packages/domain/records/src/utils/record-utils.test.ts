import { describe, expect, it } from 'vitest';

import { RECORD_KINDS } from '../constants';
import { record } from '../defaults';
import { baseRecordInputSchema, recordKindSchema } from '../schemas';
import { editableFieldsOf } from './editable-fields-of';
import { isRecordKind } from './is-record-kind';

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

describe('editableFieldsOf', () => {
  it('keeps the editable fields of a saved record and drops the rest', () => {
    expect(editableFieldsOf(record)).toEqual({
      name: 'Launch plan',
      icon: 'file-text',
      tags: ['work'],
    });
  });

  it('keeps a description when there is one', () => {
    expect(editableFieldsOf({ ...record, description: 'About' })).toEqual({
      name: 'Launch plan',
      description: 'About',
      icon: 'file-text',
      tags: ['work'],
    });
  });

  it('gives what the strict write schema accepts', () => {
    expect(
      baseRecordInputSchema.safeParse(editableFieldsOf(record)).success,
    ).toBe(true);
  });

  it('copies the tags, so editing the result leaves the record alone', () => {
    const fields = editableFieldsOf(record);
    fields.tags.push('more');
    expect(record.tags).toEqual(['work']);
  });
});
