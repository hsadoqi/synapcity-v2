import { describe, expect, it } from 'vitest';

import { newRecord } from '../new-record';
import { emptyRecords, putRecord } from '../record-tables';
import { ensureNote, updateNoteBody } from './index';

const ctx = { ownerId: '11111111-1111-4111-8111-111111111111', now: 0 };
const NOW = Date.UTC(2026, 9, 21);

describe('notes', () => {
  const note = { ...newRecord('note', 'Ideas', ctx), id: 'n', body: 'a' };
  const r = putRecord(emptyRecords(), 'note', note);

  it('updates body and timestamp, ignoring no-op writes', () => {
    expect(updateNoteBody(r, 'n', 'a', NOW)).toBe(r);
    expect(updateNoteBody(r, 'n', 'b', NOW).note.n).toMatchObject({
      body: 'b',
      updatedAt: '2026-10-21T00:00:00.000Z',
    });
  });

  it('adds a missing note and keeps an existing one', () => {
    expect(ensureNote(r, { ...note, body: 'other' })).toBe(r);
    expect(ensureNote(emptyRecords(), note).note.n).toBe(note);
  });
});
