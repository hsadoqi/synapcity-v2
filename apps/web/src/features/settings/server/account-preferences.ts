import { logFailure, type Supabase } from '@/features/account/server/caller';
import {
  readAccountPreferences,
  type AccountPreferences,
} from '../lib/scope';

/** What the settings page loads from `user_preferences` (ADR-0010). */
export type StoredAccountPreferences = {
  /** null: signed in, but nothing saved to the account yet. */
  preferences: AccountPreferences | null;
  deviceTimezone: string | null;
};

/**
 * Reads the caller's own preferences row. Returns undefined when the read
 * fails, so the page still works from browser storage alone.
 */
export async function loadAccountPreferences(
  supabase: Supabase,
  userId: string,
): Promise<StoredAccountPreferences | undefined> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preferences, device_timezone')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logFailure('loadAccountPreferences', error);
    return undefined;
  }
  if (!data) return { preferences: null, deviceTimezone: null };
  return {
    preferences: readAccountPreferences(data.preferences),
    deviceTimezone:
      typeof data.device_timezone === 'string' ? data.device_timezone : null,
  };
}
