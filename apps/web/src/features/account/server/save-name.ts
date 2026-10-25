import { saveName as saveProfileName } from '@synapcity/server-account';

import {
  logFailure,
  type Caller,
  type MetadataPatch,
  type Supabase,
} from './caller';

export type NameSaved = { ok: true; patch: MetadataPatch } | { ok: false };

/**
 * Saves an already-validated name to the caller's own profile row, through the
 * package. The failure is logged here by code and status only.
 */
export async function saveName(
  supabase: Supabase,
  caller: Caller,
  name: string,
): Promise<NameSaved> {
  const saved = await saveProfileName(supabase, caller, name);
  if (saved.ok) return saved;
  logFailure('saveName', saved.failure);
  return { ok: false };
}
