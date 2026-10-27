'use server';

import { baseRecordSchema } from '@synapcity/domain-records';
import { createRecord as insertRecord } from '@synapcity/server-data';
import { revalidatePath } from 'next/cache';

import { getCallerIdentity, SAVE_FAILED } from '@/lib/access/caller';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';

/** The table each creatable kind is saved in (ADR-0012, ADR-0013). */
const TABLES = {
  space: 'spaces',
  document: 'documents',
  dashboard: 'dashboards',
} as const;

type CreatableKind = keyof typeof TABLES;

const NAME_NEEDED = 'Give it a name.';

/** What creating reports back: the new record's id, or the message to show. */
export type CreateRecordResult =
  { ok: true; id: string } | { ok: false; error: string; signedOut?: boolean };

const isCreatableKind = (kind: unknown): kind is CreatableKind =>
  typeof kind === 'string' && Object.hasOwn(TABLES, kind);

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

  const result = await insertRecord(supabase, TABLES[kind], {
    name: parsed.data,
  });
  if (!result.ok) {
    logFailure('createRecord', result.error, { kind });
    return { ok: false, error: SAVE_FAILED };
  }

  // The sidebar and the index pages list it.
  revalidatePath('/', 'layout');
  return { ok: true, id: result.id };
}
