'use server';

import { revalidatePath } from 'next/cache';

import type { ProfileState } from '@synapcity/features-account/contracts';
import { getCaller, mirrorToSession, SHOWS_LATER } from '../caller';
import { saveAvatar } from '../save-avatar';
import { createClient } from '../../../../lib/supabase/server';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '../../../../lib/access/dev-fixture';

/**
 * Uploads a new avatar, or removes the uploaded one when the submit came from
 * the remove button (`intent=remove`).
 */
export async function updateAvatar(
  previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  // A failed submit keeps showing the picture the person already has.
  const shown = previous.avatarUrl;
  if (fixtureModeEnabled()) return { error: FIXTURE_MESSAGE, avatarUrl: shown };
  const removing = formData.get('intent') === 'remove';

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return {
      error: found.failure,
      signedOut: found.signedOut,
      avatarUrl: shown,
    };
  }
  const { caller } = found;

  const saved = await saveAvatar(
    supabase,
    caller,
    removing
      ? { kind: 'remove' }
      : { kind: 'upload', file: formData.get('avatar') },
  );
  if (!saved.ok) {
    return { error: saved.error, fields: saved.fields, avatarUrl: shown };
  }

  const mirrored = await mirrorToSession(supabase, caller, [saved.patch]);
  revalidatePath('/', 'layout');

  const done = removing ? 'Photo removed.' : 'Photo updated.';
  return {
    saved: true,
    avatarUrl: saved.avatarUrl,
    message: mirrored ? done : `${done} ${SHOWS_LATER}`,
  };
}
