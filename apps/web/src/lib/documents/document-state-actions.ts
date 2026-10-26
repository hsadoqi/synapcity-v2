'use server';

import { z } from 'zod';

import {
  getCallerIdentity,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { createClient } from '@/lib/supabase/server';

import type { SetDocumentPinnedResult } from '@synapcity/features-documents/contracts';
import { setDocumentPinned as writeDocumentPinned } from '@synapcity/server-data';

const idSchema = z.uuid();

/**
 * Pins or unpins one of the caller's documents. The browser asks for a change;
 * the database stamps the time. Row-level security limits the write to the
 * caller's own documents.
 */
export async function setDocumentPinned(
  documentId: unknown,
  pinned: unknown,
): Promise<SetDocumentPinnedResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const id = idSchema.safeParse(documentId);
  if (!id.success || typeof pinned !== 'boolean') {
    return { ok: false, error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const result = await writeDocumentPinned(supabase, id.data, pinned);
  if (!result.ok) {
    logFailure('setDocumentPinned', result.error as { code?: string });
    return { ok: false, error: SAVE_FAILED };
  }
  return result;
}
