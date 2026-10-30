import { recordIdSchema } from '@synapcity/domain-records';
import {
  toProviderFailure,
  type Json,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { readError } from '../../read-error';
import { jsonEqual } from './json-equal';

/** The only document version this code reads and writes (ADR-0016, decision 3). */
export const COMPOSITION_SCHEMA_VERSION = 1;

/**
 * A stored composition as the database holds it. The document is `unknown`:
 * the host validates it with the dashboard contract, so this package does not
 * depend on the dashboard domain.
 */
export type StoredComposition = {
  composition: unknown;
  revision: number;
};

/**
 * What a save reports. `conflict` means the stored revision is not the one the
 * write was based on: nothing was written (or another writer's state holds the
 * next revision) and the caller should reload. `failed` carries the database's
 * code and status, never its message.
 */
export type SaveCompositionOutcome =
  | { ok: true; revision: number }
  | { ok: false; reason: 'conflict' }
  | { ok: false; reason: 'failed'; error: ProviderFailure };

/** The SQLSTATE the database raises when `revision` does not rise by exactly 1. */
const REVISION_CONFLICT_CODE = 'PT409';

/**
 * One dashboard's stored composition. Every Dashboard has exactly one from the
 * moment it exists (the database creates it), so a missing row is a failure,
 * never an empty canvas that a save would then overwrite: it throws. Null means
 * only that `dashboardId` is not a uuid. Row-level security scopes the query to
 * the session; the caller has already read the Dashboard, so a composition it
 * cannot see is as unexpected as a missing one. Also throws on a failed read,
 * and on a document version this code does not know, rather than guess at its
 * shape.
 */
export async function loadComposition(
  client: SupabaseServerClient,
  dashboardId: string,
): Promise<StoredComposition | null> {
  if (!recordIdSchema.safeParse(dashboardId).success) return null;

  const { data, error } = await client
    .from('dashboard_compositions')
    .select('composition, schema_version, revision')
    .eq('dashboard_id', dashboardId)
    .maybeSingle();

  if (error) throw readError(`composition of dashboard ${dashboardId}`, error);
  if (!data) {
    throw readError(`composition of dashboard ${dashboardId}`, {
      code: 'composition_missing',
    });
  }
  if (data.schema_version !== COMPOSITION_SCHEMA_VERSION) {
    throw readError(`composition of dashboard ${dashboardId}`, {
      code: 'unsupported_schema_version',
    });
  }
  return { composition: data.composition, revision: data.revision };
}

/**
 * Saves a composition, based on `expectedRevision` (at least 1: the database
 * creates the row at revision 1 with the Dashboard). The one write path is a
 * conditional update that matches only the row still at `expectedRevision` and
 * sets the next one; the database also refuses any revision that is not exactly
 * the next. A write that affects no row is never reported as saved. A read-back
 * tells the cases apart:
 *
 *   - the stored revision is the next one and its document equals the one
 *     submitted: the write already happened (a retry after a lost response), so
 *     it is a success;
 *   - the revision moved otherwise: another writer got there first (`conflict`);
 *   - the row is not visible or still at the expected revision: `failed`.
 */
export async function saveComposition(
  client: SupabaseServerClient,
  dashboardId: string,
  composition: NonNullable<Json>,
  expectedRevision: number,
): Promise<SaveCompositionOutcome> {
  if (!Number.isInteger(expectedRevision) || expectedRevision < 1) {
    return { ok: false, reason: 'failed', error: { code: 'invalid_revision' } };
  }
  const next = expectedRevision + 1;

  const { data, error, status } = await client
    .from('dashboard_compositions')
    .update({
      composition,
      schema_version: COMPOSITION_SCHEMA_VERSION,
      revision: next,
    })
    .eq('dashboard_id', dashboardId)
    .eq('revision', expectedRevision)
    .select('revision');

  if (error && error.code !== REVISION_CONFLICT_CODE) {
    return {
      ok: false,
      reason: 'failed',
      error: toProviderFailure({ ...error, status }),
    };
  }
  if (!error && data.length) return { ok: true, revision: next };

  const current = await client
    .from('dashboard_compositions')
    .select('composition, revision')
    .eq('dashboard_id', dashboardId)
    .maybeSingle();
  if (current.error) {
    return {
      ok: false,
      reason: 'failed',
      error: toProviderFailure({ ...current.error, status: current.status }),
    };
  }
  const stored = current.data;
  if (
    stored &&
    stored.revision === next &&
    jsonEqual(stored.composition, composition)
  ) {
    return { ok: true, revision: next };
  }
  if (stored && stored.revision !== expectedRevision) {
    return { ok: false, reason: 'conflict' };
  }
  // The conflict code means the stored revision was not the one expected.
  if (error) return { ok: false, reason: 'conflict' };
  return { ok: false, reason: 'failed', error: { code: 'row_not_written' } };
}
