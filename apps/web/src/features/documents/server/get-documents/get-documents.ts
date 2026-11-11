import type { BaseRecord } from '@synapcity/domain-records';

import {
  loadLatestRecords,
  loadRecord,
  loadRecordSummaries,
} from '@/lib/records';
import type { RecordSummary } from '@/lib/records/record-summary';

import { DOCUMENT_FIXTURES } from '../../lib/fixtures';

/**
 * The signed-in owner's documents with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export function getDocuments(): Promise<RecordSummary[]> {
  return loadRecordSummaries('documents', DOCUMENT_FIXTURES);
}

/**
 * At most `limit` of the signed-in owner's documents in the sidebar's order,
 * without participation counts. Fixture mode orders the sample records.
 */
export function getLatestDocuments(limit: number): Promise<BaseRecord[]> {
  return loadLatestRecords('documents', DOCUMENT_FIXTURES, limit);
}

/**
 * One of the signed-in owner's documents, or null when it does not exist or is
 * not theirs. Fixture mode reads the sample records.
 */
export function getDocument(id: string): Promise<BaseRecord | null> {
  return loadRecord('documents', id, DOCUMENT_FIXTURES);
}
