import type { BaseRecord, OwnedRecordSummary } from '@synapcity/domain-records';
import {
  findRecord,
  listRecordSummaries,
  setRecordPinned,
  type RecordKind,
} from '@synapcity/server-data';
import { cache } from 'react';
import { z } from 'zod';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';

/** What pinning a record reports back; `pinnedAt` is the server's own time. */
export type SetRecordPinnedResult =
  | { ok: true; pinnedAt: string | null }
  | { ok: false; error: string; signedOut?: boolean };

const idSchema = z.uuid();

/**
 * The body of the document and dashboard pin Server Actions. The browser asks
 * for a change; the database stamps the time. The id and flag come from the
 * browser, so both are checked; the caller is verified with a fresh lookup
 * (ADR-0006), and row-level security limits the write to their own records.
 * `operation` names the action in the log.
 */
export async function setRecordPinnedFor(
  kind: RecordKind,
  operation: string,
  recordId: unknown,
  pinned: unknown,
): Promise<SetRecordPinnedResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const id = idSchema.safeParse(recordId);
  if (!id.success || typeof pinned !== 'boolean') {
    return { ok: false, error: SAVE_FAILED };
  }

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  const result = await setRecordPinned(supabase, kind, id.data, pinned);
  if (!result.ok) {
    logFailure(operation, result.error);
    return { ok: false, error: SAVE_FAILED };
  }
  return result;
}

/**
 * The signed-in owner's records of one kind with how many spaces each is in.
 * Row-level security scopes the query to the session, so no owner id is
 * passed. Development fixture mode has no session or database and reads the
 * sample records instead.
 */
export async function loadRecordSummaries(
  kind: RecordKind,
  fixtures: readonly OwnedRecordSummary[],
): Promise<OwnedRecordSummary[]> {
  if (fixtureModeEnabled()) return [...fixtures];
  return listRecordSummaries(await createClient(), kind);
}

/**
 * One of the signed-in owner's records of one kind, or null when it does not
 * exist or is not theirs (row-level security makes the two look the same).
 * Development fixture mode reads the sample records instead.
 *
 * Memoized with React's `cache`, which lasts for one request only: a page and
 * its `generateMetadata` read the same record once, and nothing is shared
 * between requests or people. The key is the arguments, so `fixtures` must be a
 * stable module constant (every caller passes one).
 */
export const loadRecord = cache(
  async (
    kind: RecordKind,
    id: string,
    fixtures: readonly OwnedRecordSummary[],
  ): Promise<BaseRecord | null> => {
    if (fixtureModeEnabled()) {
      return fixtures.find((record) => record.id === id) ?? null;
    }
    return findRecord(await createClient(), kind, id);
  },
);
