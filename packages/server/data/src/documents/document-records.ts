import { documentSchema } from '@synapcity/domain-documents';
import type { DocumentSummary } from '@synapcity/domain-documents';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { fieldsFromRow } from '../owned-row';
import {
  listOwnedRecordSummaries,
  setOwnedRecordPinned,
} from '../records/owned-records';

/** The signed-in owner's documents with how many Spaces each is in, newest first. */
export function listDocumentSummaries(
  client: SupabaseServerClient,
): Promise<DocumentSummary[]> {
  return listOwnedRecordSummaries(client, 'documents', (row) =>
    documentSchema.parse(fieldsFromRow(row)),
  );
}

/** Pins or unpins one of the caller's documents; the database stamps the time. */
export function setDocumentPinned(
  client: SupabaseServerClient,
  documentId: string,
  pinned: boolean,
) {
  return setOwnedRecordPinned(client, 'documents', documentId, pinned);
}
