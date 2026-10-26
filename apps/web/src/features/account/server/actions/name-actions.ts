'use server';

import { revalidatePath } from 'next/cache';

import { checkName } from '@synapcity/domain-identity';
import type { ProfileState } from '@synapcity/features-account/contracts';
import {
  getCaller,
  mirrorToSession,
  SAVE_FAILED,
  SHOWS_LATER,
} from '../caller';
import { saveName } from '../save-name';
import { createClient } from '../../../../lib/supabase/server';
import {
  FIXTURE_MESSAGE,
  fixtureModeEnabled,
} from '../../../../lib/access/dev-fixture';

/**
 * Updates the signed-in user's display name. A name change needs no
 * re-verification; email and password changes would.
 */
export async function updateName(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  if (fixtureModeEnabled()) return { error: FIXTURE_MESSAGE, name: '' };
  const raw = formData.get('name');
  const { name, error } = checkName(typeof raw === 'string' ? raw : '');
  if (error) return { error, fields: ['name'], name };

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return { error: found.failure, signedOut: found.signedOut, name };
  }
  const { caller } = found;

  const saved = await saveName(supabase, caller, name);
  if (!saved.ok) return { error: SAVE_FAILED, name };

  const mirrored = await mirrorToSession(supabase, caller, [saved.patch]);
  revalidatePath('/', 'layout');

  return {
    saved: true,
    name,
    message: mirrored ? 'Name updated.' : `Name saved. ${SHOWS_LATER}`,
  };
}
