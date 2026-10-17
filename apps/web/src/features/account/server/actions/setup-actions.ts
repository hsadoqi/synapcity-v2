'use server';

import { revalidatePath } from 'next/cache';

import { checkName } from '@/features/account/shared/name';
import type { ProfileState } from '@/features/account/types';
import {
  getCaller,
  mirrorToSession,
  SAVE_FAILED,
  SHOWS_LATER,
  type MetadataPatch,
} from '../caller';
import { saveAvatar } from '../save-avatar';
import { saveName } from '../save-name';
import { createClient } from '@/lib/supabase/server';

/**
 * Confirms the name and photo a new account starts with. The name may come
 * from Google or GitHub, and the photo defaults to theirs, so the avatar file
 * is optional: choosing none keeps the current picture. Both changes reach the
 * session in one update. Where to go afterwards is the caller's decision.
 */
export async function completeProfile(
  previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const shown = previous.avatarUrl;
  const raw = formData.get('name');
  const { name, error } = checkName(typeof raw === 'string' ? raw : '');
  if (error) return { error, fields: ['name'], name, avatarUrl: shown };

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return { error: found.failure, name, avatarUrl: shown };
  }
  const { caller } = found;

  const patches: MetadataPatch[] = [];
  let avatarUrl = shown;

  // An empty file input still submits an empty file: that means "no change".
  const file = formData.get('avatar');
  if (file instanceof File && file.size > 0) {
    const avatar = await saveAvatar(supabase, caller, {
      kind: 'upload',
      file,
    });
    if (!avatar.ok) {
      return {
        error: avatar.error,
        fields: avatar.fields,
        name,
        avatarUrl: shown,
      };
    }
    patches.push(avatar.patch);
    avatarUrl = avatar.avatarUrl;
  }

  const saved = await saveName(supabase, caller, name);
  if (!saved.ok) return { error: SAVE_FAILED, name, avatarUrl };
  patches.push(saved.patch);

  const mirrored = await mirrorToSession(supabase, caller, patches);
  revalidatePath('/', 'layout');

  return {
    saved: true,
    name,
    avatarUrl,
    message: mirrored ? 'Profile saved.' : `Profile saved. ${SHOWS_LATER}`,
  };
}
