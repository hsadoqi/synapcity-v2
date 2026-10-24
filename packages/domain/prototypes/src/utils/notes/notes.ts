import type { Note, PrototypeRecords } from '../../types';
import { putRecord, touchRecord } from '../record-tables';

/** Writes a note body; a write that changes nothing returns `records` unchanged. */
export function updateNoteBody(
  records: PrototypeRecords,
  noteId: string,
  body: string,
  now: number,
): PrototypeRecords {
  const note = records.note[noteId];
  if (!note || note.body === body) return records;
  return putRecord(records, 'note', { ...touchRecord(note, now), body });
}

/** Adds `note` unless a note with its id already exists. */
export function ensureNote(
  records: PrototypeRecords,
  note: Note,
): PrototypeRecords {
  return records.note[note.id] ? records : putRecord(records, 'note', note);
}
