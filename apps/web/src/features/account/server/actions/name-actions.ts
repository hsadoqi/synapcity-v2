'use server';

import { revalidatePath } from 'next/cache';

import { checkName } from '@/features/account/shared/name';
import type { ProfileState } from '@/features/account/types';
import {
  getCaller,
  mirrorToSession,
  SAVE_FAILED,
  SHOWS_LATER,
  SIGN_IN_AGAIN,
} from '../caller';
import { saveName } from '../save-name';
import { createClient } from '@/lib/supabase/server';

/**
 * Updates the signed-in user's display name. A name change needs no
 * re-verification; email and password changes would.
 */
export async function updateName(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const raw = formData.get('name');
  const { name, error } = checkName(typeof raw === 'string' ? raw : '');
  if (error) return { error, fields: ['name'], name };

  const supabase = await createClient();
  const caller = await getCaller(supabase);
  if (!caller) return { error: SIGN_IN_AGAIN, name };

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
