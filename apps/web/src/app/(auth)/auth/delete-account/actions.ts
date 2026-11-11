'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { DeleteAccountState } from '@synapcity/features-auth/contracts';
import { deleteOwnAccount } from '@synapcity/server-account';
import { createClient } from '@/lib/supabase/server';
import { logFailure } from '@/lib/log-failure';
import { withNotice } from '@/lib/routing/notices';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';

const PHOTO_REMOVED = 'Your uploaded photo was removed from your profile.';

/**
 * The last step of deleting an account, and the one that cannot be undone.
 * Every check that matters is in `deleteOwnAccount` and the database function
 * behind it; this turns the outcome into words and, on success, a destination.
 * Each failure says plainly whether the account still exists and whether the
 * uploaded photo was already removed.
 *
 * It takes no input: it can only ever delete the caller's own account.
 */
export async function confirmAccountDeletion(
  _previous: DeleteAccountState,
  _formData: FormData,
): Promise<DeleteAccountState> {
  if (fixtureModeEnabled()) return { error: FIXTURE_MESSAGE };
  const outcome = await deleteOwnAccount(await createClient());

  switch (outcome.kind) {
    case 'deleted':
      if (outcome.cleanupFailure) {
        logFailure('confirmAccountDeletion.cleanup', outcome.cleanupFailure);
      }
      revalidatePath('/', 'layout');
      return redirect(withNotice('/auth/login', 'account-deleted'));
    case 'link-required':
      return {
        linkRequired: true,
        error: outcome.photoRemoved
          ? `This confirmation has expired, so your account was not deleted. ${PHOTO_REMOVED} Ask for a new link from your settings.`
          : 'This confirmation has expired, so nothing was deleted. Ask for a new link from your settings.',
      };
    case 'signed-out':
      return {
        error:
          'You are signed out, so nothing was deleted. Sign in and try again.',
      };
    case 'unavailable':
      logFailure('confirmAccountDeletion', outcome.failure);
      return {
        error: 'Something went wrong. Nothing was deleted. Try again.',
      };
    case 'failed':
      logFailure('confirmAccountDeletion', outcome.failure, {
        step: outcome.step,
      });
      if (outcome.step === 'files') {
        return {
          error: outcome.photoRemoved
            ? `Your account was not deleted. ${PHOTO_REMOVED} Some of its files could not be removed yet. Try again in a moment.`
            : 'Your account was not deleted. Some stored files could not be removed yet. Try again in a moment.',
        };
      }
      return {
        error: outcome.photoRemoved
          ? `Your account was not deleted. ${PHOTO_REMOVED} Try again in a moment.`
          : 'Could not delete your account. Nothing was deleted. Try again in a moment.',
      };
    case 'unconfirmed':
      logFailure('confirmAccountDeletion.unconfirmed', outcome.failure);
      return {
        error:
          'We could not confirm whether your account was deleted. Try again to finish.',
      };
  }
}
