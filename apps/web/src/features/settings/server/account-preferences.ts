import { cache } from 'react';

import { logFailure, type Supabase } from '@/features/account/server/caller';
import { createClient } from '@/lib/supabase/server';
import type { StoredAccountPreferences } from '../lib/account-sync';
import { readAccountPreferences } from '../lib/scope';

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

/**
 * The signed-in user's row, read once per request however many readers ask:
 * the root layout (page language, and the account copy applied on every page)
 * and the settings page share one query.
 */
export const getAccountPreferences = cache(async (userId: string) =>
  loadAccountPreferences(await createClient(), userId),
);
