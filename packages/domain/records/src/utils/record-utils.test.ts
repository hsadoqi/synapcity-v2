import { describe, expect, it } from 'vitest';

import { baseRecordMetadataSchema } from '../schemas';
import { editableFieldsOf } from './editable-fields-of';

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
      baseRecordMetadataSchema.safeParse(editableFieldsOf(record)).success,
    ).toBe(true);
  });

  it('copies the tags, so editing the result leaves the record alone', () => {
    const fields = editableFieldsOf(record);
    fields.tags.push('more');
    expect(record.tags).toEqual(['work']);
  });
});
