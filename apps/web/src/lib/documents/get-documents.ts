import type { DocumentSummary } from '@synapcity/domain-documents';
import { listDocumentSummaries } from '@synapcity/server-data';

import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { DEMO_DOCUMENTS } from '@/lib/demo/documents';
import { createClient } from '@/lib/supabase/server';

/**
 * The signed-in owner's documents with how many spaces each is in. Row-level
 * security scopes the query to the session, so no owner id is passed.
 * Development fixture mode has no session or database and reads sample records.
 */
export async function getDocuments(): Promise<DocumentSummary[]> {
  if (fixtureModeEnabled()) return [...DEMO_DOCUMENTS];

  return listDocumentSummaries(await createClient());
}
