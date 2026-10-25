import {
  removeOldAvatars,
  saveAvatar as saveProfileAvatar,
  type AvatarRequest,
} from '@synapcity/server-account';

import {
  logFailure,
  SAVE_FAILED,
  type Caller,
  type MetadataPatch,
  type Supabase,
} from './caller';

export { removeOldAvatars, type AvatarRequest };

const UNSUPPORTED_TYPE = 'Use a PNG, JPEG or WebP image.';

export type AvatarSaved =
  | {
      ok: true;
      /** The picture to show now: the upload, or the default after a removal. */
      avatarUrl: string | null;
      patch: MetadataPatch;
    }
  | { ok: false; error: string; fields?: ['avatar'] };

/**
 * Uploads a new avatar, or removes the uploaded one, through the package. The
 * package returns why it failed; the words and the log lines are owned here.
 */
export async function saveAvatar(
  supabase: Supabase,
  caller: Caller,
  request: AvatarRequest,
): Promise<AvatarSaved> {
  const saved = await saveProfileAvatar(supabase, caller, request);
  if (saved.ok) return saved;

  switch (saved.reason) {
    case 'invalid-file':
      return {
        ok: false,
        error: saved.message ?? 'Choose an image.',
        fields: ['avatar'],
      };
    case 'unsupported-type':
      return { ok: false, error: UNSUPPORTED_TYPE, fields: ['avatar'] };
    case 'upload-failed':
      logFailure('saveAvatar.upload', saved.failure);
      return { ok: false, error: SAVE_FAILED };
    case 'profile-not-saved':
      logFailure('saveAvatar.profile', saved.failure);
      return { ok: false, error: SAVE_FAILED };
  }
}
