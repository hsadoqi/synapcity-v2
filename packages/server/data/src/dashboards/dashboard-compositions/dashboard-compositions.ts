import {
  toProviderFailure,
  type Json,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';
import { z } from 'zod';

import { readError } from '../../read-error';

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
 * write was based on: nothing was written and the caller should reload.
 * `failed` carries the database's code and status, never its message.
 */
export type SaveCompositionOutcome =
  | { ok: true; revision: number }
  | { ok: false; reason: 'conflict' }
  | { ok: false; reason: 'failed'; error: ProviderFailure };

const idSchema = z.uuid();

/**
 * One dashboard's stored composition, or null when none was saved yet (the
 * first save creates the row). Row-level security scopes the query to the
 * session, so another person's dashboard reads as no composition. Throws on a
 * failed read, and on a document version this code does not know, rather than
 * guess at its shape.
 */
export async function loadComposition(
  client: SupabaseServerClient,
  dashboardId: string,
): Promise<StoredComposition | null> {
  if (!idSchema.safeParse(dashboardId).success) return null;

  const { data, error } = await client
    .from('dashboard_compositions')
    .select('composition, schema_version, revision')
    .eq('dashboard_id', dashboardId)
    .maybeSingle();

  if (error) throw readError(`composition of dashboard ${dashboardId}`, error);
  if (!data) return null;
  if (data.schema_version !== COMPOSITION_SCHEMA_VERSION) {
    throw readError(`composition of dashboard ${dashboardId}`, {
      code: 'unsupported_schema_version',
    });
  }
  return { composition: data.composition, revision: data.revision };
}

/**
 * Saves a composition, based on `expectedRevision` (0 when none exists yet).
 * The write is conditional: the first save inserts at revision 1, and a later
 * one updates only the row still at `expectedRevision`, setting the next
 * revision. A write that affects no row is never reported as saved: a
 * follow-up read tells a revision that moved (`conflict`) from a row the
 * caller cannot see or change (`failed`).
 */
export async function saveComposition(
  client: SupabaseServerClient,
  dashboardId: string,
  composition: NonNullable<Json>,
  expectedRevision: number,
): Promise<SaveCompositionOutcome> {
  const next = expectedRevision + 1;

  if (expectedRevision === 0) {
    const { error, status } = await client
      .from('dashboard_compositions')
      .insert({
        dashboard_id: dashboardId,
        composition,
        schema_version: COMPOSITION_SCHEMA_VERSION,
        revision: next,
      });
    // A row appeared since the page was read: the other tab saved first.
    if (error?.code === '23505') return { ok: false, reason: 'conflict' };
    if (error) {
      return {
        ok: false,
        reason: 'failed',
        error: toProviderFailure({ ...error, status }),
      };
    }
    return { ok: true, revision: next };
  }

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

  if (error) {
    return {
      ok: false,
      reason: 'failed',
      error: toProviderFailure({ ...error, status }),
    };
  }
  if (data.length) return { ok: true, revision: next };

  const current = await client
    .from('dashboard_compositions')
    .select('revision')
    .eq('dashboard_id', dashboardId)
    .maybeSingle();
  if (current.error) {
    return {
      ok: false,
      reason: 'failed',
      error: toProviderFailure({ ...current.error, status: current.status }),
    };
  }
  if (current.data && current.data.revision !== expectedRevision) {
    return { ok: false, reason: 'conflict' };
  }
  return { ok: false, reason: 'failed', error: { code: 'row_not_written' } };
}
