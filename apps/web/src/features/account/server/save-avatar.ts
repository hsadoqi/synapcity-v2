import {
  saveAvatar as saveProfileAvatar,
  type AvatarRequest,
} from '@synapcity/server-account';

import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { SAVE_FAILED } from '@/lib/access/caller';
import { logFailure } from '@/lib/log-failure';

import type { Caller, MetadataPatch } from './caller';

export type { AvatarRequest };

const UNSUPPORTED_TYPE = 'Use a PNG, JPEG or WebP image.';
const ACCOUNT_DELETING =
  'Your account is being deleted, so the photo was not saved.';
const CONFLICT =
  'Your photo was changed somewhere else at the same time. Try again.';
const UNCONFIRMED =
  'We could not confirm that your photo was saved. Reload the page to check.';

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
  supabase: SupabaseServerClient,
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
    case 'account-deleting':
      return { ok: false, error: ACCOUNT_DELETING };
    case 'conflict':
      return { ok: false, error: CONFLICT };
    case 'unconfirmed':
      logFailure('saveAvatar.unconfirmed', saved.failure);
      return { ok: false, error: UNCONFIRMED };
  }
}
