import { withFullName } from './profile-metadata';
import type { Caller, MetadataPatch, Supabase } from './caller';

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
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: name })
    .eq('id', caller.id);
  if (error) return { ok: false };
  return { ok: true, patch: (existing) => withFullName(existing, name) };
}
