'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { removeOldAvatars } from '@/features/account/server/save-avatar';
import { deleteOwnAccount } from '@/features/auth/server/operations';
import { withNotice } from '@/lib/routing/notices';
import { FIXTURE_MESSAGE, fixtureModeEnabled } from '@/lib/access/dev-fixture';

export type DeleteAccountState = {
  error?: string;
  /** The emailed link is too old or was not used: the way forward is a new link. */
  linkRequired?: boolean;
};

/**
 * The last step of deleting an account, and the one that cannot be undone. It
 * wires auth's deletion to account's stored files, which neither feature may
 * import from the other (ADR-0007), so the app does it. All the checks that
 * matter are in `deleteOwnAccount` and the database function behind it; this
 * only turns the outcome into words and, on success, a destination.
 *
 * It takes no input: it can only ever delete the caller's own account.
 */
export async function confirmAccountDeletion(
  _previous: DeleteAccountState,
  _formData: FormData,
): Promise<DeleteAccountState> {
  if (fixtureModeEnabled()) return { error: FIXTURE_MESSAGE };
  const outcome = await deleteOwnAccount({
    // Best effort, and every file in the caller's own folder: that folder is
    // all the storage rules let this session reach.
    cleanup: (supabase, userId) => removeOldAvatars(supabase, userId),
  });

  switch (outcome.kind) {
    case 'deleted':
      revalidatePath('/', 'layout');
      return redirect(withNotice('/auth/login', 'account-deleted'));
    case 'link-required':
      return {
        linkRequired: true,
        error:
          'This confirmation has expired, so nothing was deleted. Ask for a new link from your settings.',
      };
    case 'signed-out':
      return {
        error:
          'You are signed out, so nothing was deleted. Sign in and try again.',
      };
    case 'unavailable':
      return {
        error: 'Something went wrong. Nothing was deleted. Try again.',
      };
    case 'provider-error':
      console.warn('confirmAccountDeletion failed', { code: outcome.code });
      return {
        error: 'Could not delete your account. Try again in a moment.',
      };
  }
}
