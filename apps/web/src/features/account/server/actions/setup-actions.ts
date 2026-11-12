'use server';

import { revalidatePath } from 'next/cache';

import type { ProfileState } from '@synapcity/features-account/contracts';
import { skipProfileSetup as recordProfileSetupSkipped } from '@synapcity/server-account';
import {
  getCaller,
  mirrorToSession,
  SHOWS_LATER,
  type MetadataPatch,
} from '../caller';
import { saveAvatar } from '../save-avatar';
import { parseNames, saveNames } from '../save-name';
import { logFailure } from '@/lib/log-failure';
import { createClient } from '../../../../lib/supabase/server';
import {
  FIXTURE_MESSAGE,
  fixtureModeEnabled,
} from '../../../../lib/access/dev-fixture';

/**
 * Completes the profile-setup step: a first name (required), an optional last
 * and display name, and an optional photo (choosing none keeps the current
 * picture). The names and the completion are saved first, in one statement;
 * then the photo; then one session update with whatever was saved. Each
 * partial outcome says what was and was not saved. Where to go afterwards is
 * the caller's decision.
 */
export async function completeProfile(
  previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const shown = previous.avatarUrl;
  if (fixtureModeEnabled()) {
    return { error: FIXTURE_MESSAGE, name: '', avatarUrl: shown };
  }
  const parsed = parseNames(formData);
  if (!parsed.ok) return { ...parsed.state, avatarUrl: shown };
  const { names, echo } = parsed;

  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) {
    return {
      error: found.failure,
      signedOut: found.signedOut,
      ...echo,
      avatarUrl: shown,
    };
  }
  const { caller } = found;

  // Nothing is saved yet: a failure here leaves everything as it was.
  const saved = await saveNames(supabase, caller, names, echo);
  if (!saved.ok) return { ...saved.state, avatarUrl: shown };
  const patches: MetadataPatch[] = [saved.patch];

  // An empty file input still submits an empty file: that means "no change".
  const file = formData.get('avatar');
  if (file instanceof File && file.size > 0) {
    const avatar = await saveAvatar(supabase, caller, {
      kind: 'upload',
      file,
    });
    if (!avatar.ok) {
      // The names are saved and setup is complete; only the photo is not.
      // Mirror what was saved, and keep the person here to try the photo
      // again or carry on.
      await mirrorToSession(supabase, caller, patches);
      revalidatePath('/', 'layout');
      return {
        error: `Your name was saved, but your photo was not. ${avatar.error}`,
        fields: avatar.fields,
        ...echo,
        avatarUrl: shown,
      };
    }
    patches.push(avatar.patch);
    const mirrored = await mirrorToSession(supabase, caller, patches);
    revalidatePath('/', 'layout');
    return {
      saved: true,
      ...echo,
      avatarUrl: avatar.avatarUrl,
      message: mirrored ? 'Profile saved.' : `Profile saved. ${SHOWS_LATER}`,
    };
  }

  const mirrored = await mirrorToSession(supabase, caller, patches);
  revalidatePath('/', 'layout');
  return {
    saved: true,
    ...echo,
    avatarUrl: shown,
    message: mirrored ? 'Profile saved.' : `Profile saved. ${SHOWS_LATER}`,
  };
}

/**
 * Records that the person skipped the profile-setup step, without changing
 * anything else. Only an incomplete setup is marked; a completed one stays
 * completed. Where to go afterwards is the caller's decision, and it should go
 * there whether or not this saved: a failure here only means the step may be
 * offered once more at the next sign-in.
 */
export async function skipProfileSetup(): Promise<{ saved: boolean }> {
  if (fixtureModeEnabled()) return { saved: false };
  const supabase = await createClient();
  const found = await getCaller(supabase);
  if (!('caller' in found)) return { saved: false };

  const skipped = await recordProfileSetupSkipped(supabase, found.caller.id);
  if (skipped.kind === 'failed') {
    logFailure('skipProfileSetup', skipped.failure);
    return { saved: false };
  }
  revalidatePath('/', 'layout');
  return { saved: true };
}
