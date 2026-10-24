import type { StoredAccountPreferences } from '@synapcity/domain-preferences';
import { readAccountPreferences } from '@synapcity/domain-preferences';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

export type AccountPreferencesFailure = {
  code?: string;
  status?: number;
};

export type ReadAccountPreferencesResult =
  | { ok: true; value: StoredAccountPreferences }
  | { ok: false; failure: AccountPreferencesFailure };

export type WriteAccountPreferencesResult =
  { ok: true } | { ok: false; failure: AccountPreferencesFailure };

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

  if (error) return { ok: false, failure: error };
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
  preferences: unknown,
  deviceTimezone?: string,
): Promise<WriteAccountPreferencesResult> {
  const { data, error } = await client
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preferences,
        schema_version: 1,
        ...(deviceTimezone && { device_timezone: deviceTimezone }),
      },
      { onConflict: 'user_id' },
    )
    .select('user_id');

  if (error) return { ok: false, failure: error };
  if (!data?.length) {
    return { ok: false, failure: { code: 'row_not_written' } };
  }
  return { ok: true };
}
