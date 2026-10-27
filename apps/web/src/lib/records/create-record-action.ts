'use server';

import { baseRecordSchema } from '@synapcity/domain-records';
import { serverSpaceSource } from '@synapcity/features-spaces/server';
import {
  createRecord as insertRecord,
  type RecordKind,
} from '@synapcity/server-data';
import type { ProviderFailure } from '@synapcity/server-supabase';
import { revalidatePath } from 'next/cache';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';

/**
 * The kinds created straight in their table. Spaces go through the Space
 * source instead, the feature's port for reading and writing them.
 */
const RECORD_TABLES = {
  document: 'documents',
  dashboard: 'dashboards',
} as const satisfies Record<string, RecordKind>;

type CreatableKind = 'space' | keyof typeof RECORD_TABLES;

const NAME_NEEDED = 'Give it a name.';

/**
 * What creating reports back: the new record's id, or the message to show.
 * `unconfirmed` means the save may have gone through (the request was cut
 * off before the database answered), so the person should look before trying
 * again rather than risk a second copy.
 */
export type CreateRecordResult =
  | { ok: true; id: string }
  | { ok: false; error: string; signedOut?: boolean; unconfirmed?: boolean };

const isCreatableKind = (kind: unknown): kind is CreatableKind =>
  kind === 'space' ||
  (typeof kind === 'string' && Object.hasOwn(RECORD_TABLES, kind));

/** A failure the database or PostgREST answered has a code; anything else is unknown. */
const isUnconfirmed = (failure: ProviderFailure) => !failure.code;

/**
 * Creates one of the caller's Spaces, documents or dashboards from its name.
 * The kind and name come from the browser, so both are checked, the name with
 * the record contract's own rule. The caller is verified with a fresh lookup
 * (ADR-0006); the owner is the session's user, set by the database.
 */
export async function createRecord(
  kind: unknown,
  name: unknown,
): Promise<CreateRecordResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  if (!isCreatableKind(kind)) return { ok: false, error: SAVE_FAILED };
  const parsed = baseRecordSchema.shape.name.safeParse(name);
  if (!parsed.success) {
    return {
      ok: false,
      error: typeof name === 'string' ? NAME_NEEDED : SAVE_FAILED,
    };
  }

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return {
      ok: false,
      error: found.failure,
      ...(found.signedOut && { signedOut: true }),
    };
  }

  const input = { name: parsed.data };
  const result =
    kind === 'space'
      ? await serverSpaceSource(supabase).create(input)
      : await insertRecord(supabase, RECORD_TABLES[kind], input);
  if (!result.ok) {
    logFailure('createRecord', result.error, { kind });
    if (!isUnconfirmed(result.error)) return { ok: false, error: SAVE_FAILED };
    // It may exist: refresh the lists so it shows if it does.
    revalidatePath('/', 'layout');
    return { ok: false, error: SAVE_FAILED, unconfirmed: true };
  }

  // The sidebar and the index pages list it.
  revalidatePath('/', 'layout');
  return { ok: true, id: result.id };
}
