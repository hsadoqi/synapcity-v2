import type { StoredAccountPreferences } from '@synapcity/domain-preferences';
import type { SupabaseServerClient } from '@synapcity/server-supabase';
import {
  readAccountPreferenceRow,
  type AccountPreferencesFailure,
} from '@synapcity/server-account';

/** Loads the current caller's row; the host supplies identity and failure policy. */
export async function loadSettingsAccountPreferences(
  client: SupabaseServerClient,
  userId: string,
  onFailure?: (failure: AccountPreferencesFailure) => void,
): Promise<StoredAccountPreferences | undefined> {
  const result = await readAccountPreferenceRow(client, userId);
  if (!result.ok) {
    onFailure?.(result.failure);
    return undefined;
  }
  return result.value;
}
