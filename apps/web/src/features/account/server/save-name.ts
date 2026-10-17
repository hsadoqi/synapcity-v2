import { withFullName } from './profile-metadata';
import {
  logFailure,
  type Caller,
  type MetadataPatch,
  type Supabase,
} from './caller';

export type NameSaved = { ok: true; patch: MetadataPatch } | { ok: false };

/**
 * Saves an already-validated name to the caller's own profile row.
 * `profiles.display_name` is the canonical copy; the returned patch mirrors it
 * into `user_metadata.full_name` for the header once the caller applies it.
 */
export async function saveName(
  supabase: Supabase,
  caller: Caller,
  name: string,
): Promise<NameSaved> {
  // `select` returns the changed rows: an update that matches nothing is not
  // an error to Postgres, but nothing was saved, so it must not look saved.
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', caller.id)
    .select('id');
  if (error || !data?.length) {
    logFailure('saveName', error ?? { code: 'profile_row_missing' });
    return { ok: false };
  }
  return { ok: true, patch: (existing) => withFullName(existing, name) };
}
