import { cache } from 'react';

import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { logFailure } from '@/lib/log-failure';
import { createClient } from '@/lib/supabase/server';
import { fixtureModeEnabled } from '@/lib/access/dev-fixture';
import type { StoredAccountPreferences } from '@synapcity/domain-preferences';
import { loadSettingsAccountPreferences } from '@synapcity/features-settings/server';

/**
 * Reads the caller's own preferences row. Returns undefined when the read
 * fails, so the page still works from browser storage alone.
 */
export async function loadAccountPreferences(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<StoredAccountPreferences | undefined> {
  return loadSettingsAccountPreferences(supabase, userId, (failure) =>
    logFailure('loadAccountPreferences', failure),
  );
}

/**
 * The signed-in user's row, read once per request however many readers ask:
 * the root layout (page language, and the account copy applied on every page)
 * and the settings page share one query.
 *
 * Development fixture mode has no account to read (its user is not a session),
 * so it is undefined there: every page then works from browser storage alone.
 */
export const getAccountPreferences = cache(
  async (userId: string): Promise<StoredAccountPreferences | undefined> => {
    if (fixtureModeEnabled()) return undefined;
    return loadAccountPreferences(await createClient(), userId);
  },
);
