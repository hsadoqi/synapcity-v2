import type {
  AccountPreferences,
  StoredAccountPreferences,
} from '@synapcity/domain-preferences';
import { readAccountPreferences } from '@synapcity/domain-preferences';
import {
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

export type ReadAccountPreferencesResult =
  | { ok: true; value: StoredAccountPreferences }
  | { ok: false; failure: ProviderFailure };

export type WriteAccountPreferencesResult =
  { ok: true } | { ok: false; failure: ProviderFailure };

/** Reads the preference row for the already-verified caller. */
export async function readAccountPreferenceRow(
  client: SupabaseServerClient,
  userId: string,
): Promise<ReadAccountPreferencesResult> {
  const { data, error } = await client
    .from('user_preferences')
    .select('preferences, device_timezone')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { ok: false, failure: toProviderFailure(error) };
  if (!data) {
    return {
      ok: true,
      value: { preferences: null, deviceTimezone: null },
    };
  }

  return {
    ok: true,
    value: {
      preferences: readAccountPreferences(data.preferences),
      deviceTimezone:
        typeof data.device_timezone === 'string' ? data.device_timezone : null,
    },
  };
}

/** Writes the already-validated account preferences for the verified caller. */
export async function writeAccountPreferenceRow(
  client: SupabaseServerClient,
  userId: string,
  preferences: AccountPreferences,
  deviceTimezone?: string,
): Promise<WriteAccountPreferencesResult> {
  const { data, error } = await client
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preferences,
        // The row's shape version (`user_preferences.schema_version`, added in
        // migration 20261017160000). Raise it when the stored document changes
        // in a way old readers cannot follow.
        schema_version: 1,
        ...(deviceTimezone && { device_timezone: deviceTimezone }),
      },
      { onConflict: 'user_id' },
    )
    .select('user_id');

  if (error) return { ok: false, failure: toProviderFailure(error) };
  if (!data?.length) {
    return { ok: false, failure: { code: 'row_not_written' } };
  }
  return { ok: true };
}
