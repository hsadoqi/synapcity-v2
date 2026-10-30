'use server';

import {
  baseRecordCreateSchema,
  boundedNameSchema,
  isRecordKind,
} from '@synapcity/domain-records';
import { serverSpaceSource } from '@synapcity/features-spaces/server';
import {
  createRecord as insertRecord,
  RECORD_TABLES,
} from '@synapcity/server-data';
import type { ProviderFailure } from '@synapcity/server-supabase';
import { revalidatePath } from 'next/cache';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';

const NAME_NEEDED = 'Give it a name.';
/**
 * What Quick Create sends: a name only. The record contract's create input,
 * with this form's wording for a blank name; the database fills the rest.
 */
const quickCreateSchema = baseRecordCreateSchema.pick({ name: true }).extend({
  name: boundedNameSchema(NAME_NEEDED),
});

/**
 * What creating reports back: the new record's id, or the message to show.
 * `unconfirmed` means the save may have gone through (the request was cut
 * off before the database answered), so the person should look before trying
 * again rather than risk a second copy.
 */
export type CreateRecordResult =
  | { ok: true; id: string }
  | { ok: false; error: string; signedOut?: boolean; unconfirmed?: boolean };

/** A failure the database or PostgREST answered has a code; anything else is unknown. */
const isUnconfirmed = (failure: ProviderFailure) => !failure.code;

/**
 * Creates one of the caller's Spaces, documents or dashboards from its name.
 * The kind and name come from the browser, so both are checked: the kind
 * against this app's creatable table map, the name with the record contract's
 * create input.
 * Spaces go through the Space source, the feature's port for them; the other
 * kinds are inserted straight into their table. The caller is verified with a
 * fresh lookup (ADR-0006); the owner is the session's user, set by the
 * database.
 */
export async function createRecord(
  kind: unknown,
  name: unknown,
): Promise<CreateRecordResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  if (!isRecordKind(kind)) return { ok: false, error: SAVE_FAILED };
  const parsed = quickCreateSchema.safeParse({ name });
  if (!parsed.success) {
    // A string that fails the contract says why (blank, too long, a character
    // that cannot be saved); anything else is not something a form sends.
    return {
      ok: false,
      error:
        typeof name === 'string'
          ? (parsed.error.issues[0]?.message ?? NAME_NEEDED)
          : SAVE_FAILED,
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

  const input = parsed.data;
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
