import {
  toProviderFailure,
  type MetadataPatch,
  type ProviderFailure,
  type ProviderUser,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { withFullName } from '../profile-metadata';

export type NameSaved =
  { ok: true; patch: MetadataPatch } | { ok: false; failure: ProviderFailure };

/**
 * Saves an already-validated name to the caller's own profile row.
 * `profiles.display_name` is the canonical copy; the returned patch mirrors it
 * into `user_metadata.full_name` for the header once the host applies it.
 * Failures carry a code and status only; the host decides what to log and say.
 */
export async function saveName(
  client: SupabaseServerClient,
  user: ProviderUser,
  name: string,
): Promise<NameSaved> {
  // `select` returns the changed rows: an update that matches nothing is not
  // an error to Postgres, but nothing was saved, so it must not look saved.
  const { data, error } = await client
    .from('profiles')
    .update({ display_name: name })
    .eq('id', user.id)
    .select('id');
  if (error || !data?.length) {
    return {
      ok: false,
      failure: error
        ? toProviderFailure(error)
        : { code: 'profile_row_missing' },
    };
  }
  return { ok: true, patch: (existing) => withFullName(existing, name) };
}
