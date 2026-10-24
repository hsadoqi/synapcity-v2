'use server';

import {
  getCallerIdentity,
  logFailure,
  SAVE_FAILED,
} from '@/features/account/server/caller';
import { createClient } from '@/lib/supabase/server';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';
import type { SavePreferencesResult } from '../../lib/account-sync';
import { accountPreferencesSchema } from '@synapcity/domain-preferences';
import { isSupportedTimezone } from '@synapcity/domain-preferences';

const INVALID = 'Preferences could not be saved. Check the selected values.';

/**
 * Saves the account part of the caller's preferences (ADR-0010). Acts on the
 * caller's own row only: the user id comes from their session, never from the
 * browser. `deviceTimezone` is the browser's own zone, kept for server work
 * when the chosen timezone is "system"; an unusable value is left out.
 */
export async function saveAccountPreferences(
  input: unknown,
  deviceTimezone: unknown,
): Promise<SavePreferencesResult> {
  if (fixtureModeEnabled()) return { ok: false, error: FIXTURE_MESSAGE };
  const parsed = accountPreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID };
  const timezone =
    typeof deviceTimezone === 'string' &&
    deviceTimezone.length <= 64 &&
    isSupportedTimezone(deviceTimezone)
      ? deviceTimezone
      : undefined;

  const supabase = await createClient();
  const found = await getCallerIdentity(supabase);
  if (!('identity' in found)) {
    return { ok: false, error: found.failure, signedOut: found.signedOut };
  }

  // `select` returns the written row: an upsert that RLS turns away writes
  // nothing, and that must not look saved.
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: found.identity.userId,
        preferences: parsed.data,
        schema_version: 1,
        ...(timezone && { device_timezone: timezone }),
      },
      { onConflict: 'user_id' },
    )
    .select('user_id');
  if (error || !data?.length) {
    logFailure('saveAccountPreferences', error ?? { code: 'row_not_written' });
    return { ok: false, error: SAVE_FAILED };
  }
  return { ok: true };
}
