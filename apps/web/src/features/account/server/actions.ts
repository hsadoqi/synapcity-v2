'use server';

import { revalidatePath } from 'next/cache';

import { authErrorMessage } from '@/features/auth/shared/error-messages';
import { checkName } from '@/features/account/shared/name';
import type { ProfileState } from '@/features/account/shared/form-state';
import { withFullName } from './profile-metadata';
import { createClient } from '@/lib/supabase/server';

/**
 * Updates the signed-in user's display name. It only ever acts on the caller's
 * own session, so there is no user id to forge. A name change needs no
 * re-verification; email and password changes would.
 */
export async function updateProfile(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const raw = formData.get('name');
  const { name, error } = checkName(typeof raw === 'string' ? raw : '');
  if (error) return { error, name };

  const supabase = await createClient();
  const { data: current, error: userError } = await supabase.auth.getUser();
  if (userError || !current.user) {
    return { error: 'Sign in again to update your profile.', name };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: withFullName(current.user.user_metadata, name),
  });
  if (updateError) return { error: authErrorMessage(updateError.code), name };

  // updateUser keeps the old access token, and the header reads the name from
  // that token's claims. Refresh it, or the old name shows for up to an hour.
  const { error: refreshError } = await supabase.auth.refreshSession();
  revalidatePath('/', 'layout');

  if (refreshError) {
    return {
      message: 'Name saved. It may take a little while to show everywhere.',
      name,
    };
  }
  return { message: 'Name updated.', name };
}
