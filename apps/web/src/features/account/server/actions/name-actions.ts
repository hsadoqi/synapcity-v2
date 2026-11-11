'use server';

import { revalidatePath } from 'next/cache';

import type { ProfileState } from '@synapcity/features-account/contracts';
import { getCaller, mirrorToSession, SHOWS_LATER } from '../caller';
import { parseNames, saveNames } from '../save-name';
import { createClient } from '../../../../lib/supabase/server';
import {
  FIXTURE_MESSAGE,
  fixtureModeEnabled,
} from '../../../../lib/access/dev-fixture';

/**
 * Updates the signed-in user's first, last and display names. Saving a valid
 * first name also completes profile setup, so someone who skipped it can
 * finish here. A name change needs no re-verification; email and password
 * changes would.
 */
export async function updateName(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  if (fixtureModeEnabled()) return { error: FIXTURE_MESSAGE, name: '' };
  const parsed = parseNames(formData);
  if (!parsed.ok) return parsed.state;
  const { names, echo } = parsed;

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return { error: found.failure, signedOut: found.signedOut, ...echo };
  }
  const { caller } = found;

  const saved = await saveNames(supabase, caller, names, echo);
  if (!saved.ok) return saved.state;

  const mirrored = await mirrorToSession(supabase, caller, [saved.patch]);
  revalidatePath('/', 'layout');

  return {
    saved: true,
    firstName: names.firstName,
    lastName: names.lastName ?? '',
    name: names.displayName ?? '',
    message: mirrored ? 'Name updated.' : `Name saved. ${SHOWS_LATER}`,
  };
}
