'use server';

import { setRecordPinnedFor, type SetRecordPinnedResult } from '@/lib/records';

/**
 * Pins or unpins one of the caller's documents. The browser asks for a change;
 * the database stamps the time. Row-level security limits the write to the
 * caller's own documents.
 */
export async function setDocumentPinned(
  documentId: unknown,
  pinned: unknown,
): Promise<SetRecordPinnedResult> {
  return setRecordPinnedFor(
    'documents',
    'setDocumentPinned',
    documentId,
    pinned,
  );
}
