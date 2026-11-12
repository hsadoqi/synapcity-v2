import { isUploadedAvatar } from '@synapcity/domain-identity';
import {
  hasRecentLinkSignIn,
  providerImageFrom,
  readProviderUser,
  toProviderFailure,
  type ProviderFailure,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';
import { readClaims } from '@synapcity/server-supabase/claims';

import { removeAllAvatarObjects } from '../profile/save-avatar/avatar-objects';

/** The step a failed deletion stopped at. Each leaves the account consistent. */
export type DeletionStep = 'detach' | 'files' | 'delete';

export type AccountDeletionOutcome =
  | {
      kind: 'deleted';
      /** The best-effort sweep after deletion failed; for the host's log only. */
      cleanupFailure?: ProviderFailure;
    }
  /**
   * No emailed-link sign-in in the last few minutes: the link must be used
   * again. `photoRemoved` says whether the uploaded picture was already taken
   * off the profile before the database refused.
   */
  | { kind: 'link-required'; photoRemoved: boolean }
  | { kind: 'signed-out' }
  | { kind: 'unavailable'; failure?: ProviderFailure }
  /**
   * The account still exists. `detach`: nothing changed. `files` and
   * `delete`: the uploaded picture was taken off the profile
   * (`photoRemoved`), and some or all of its files were removed.
   */
  | {
      kind: 'failed';
      step: DeletionStep;
      photoRemoved: boolean;
      failure?: ProviderFailure;
    }
  /** It could not be confirmed whether the account was deleted. Retrying is safe. */
  | { kind: 'unconfirmed'; failure?: ProviderFailure };

/** Postgres `insufficient_privilege`: the database function's own link check. */
const REFUSED_BY_DATABASE = '42501';

/** Auth's answer for a token whose user no longer exists. */
const USER_NOT_FOUND = 'user_not_found';

/**
 * Whether the caller's account still exists, asked of Auth directly. The
 * token itself stays valid after deletion, so only Auth can tell.
 */
async function accountExists(
  client: SupabaseServerClient,
): Promise<'exists' | 'gone' | 'unknown'> {
  const read = await readProviderUser(client);
  if (read.kind === 'user') return 'exists';
  if (read.failure.code === USER_NOT_FOUND) return 'gone';
  return 'unknown';
}

/**
 * Permanently deletes the signed-in person's own account. IRREVERSIBLE.
 *
 * The database part is one transaction: `delete_own_account()` deletes the
 * Auth user and, by cascade, every row they own, or nothing. Stored files
 * cannot join that transaction, so the steps are ordered so that every way
 * this can stop leaves a consistent account, and `deleted` is reported only
 * when the account is confirmed gone:
 *
 * 1. Verified claims, and an emailed-link sign-in in the last few minutes
 *    (the database function checks the same again; that check is the one
 *    that cannot be skipped).
 * 2. Mark the profile as being deleted (stamped by the database, active for
 *    15 minutes, so a deletion that dies part-way never blocks the account
 *    for long) and take the uploaded picture off it, in one write. New
 *    avatars are refused while the marker is active.
 * 3. Remove every file in the caller's avatar folder, until it lists empty.
 * 4. Delete through the database function.
 * 5. One more sweep, in case a file arrived after step 3, then sign this
 *    browser out. Neither changes the outcome.
 *
 * A lost or ambiguous answer is resolved, never assumed: the function is
 * called again (it is safe to repeat), and if that does not settle it, Auth is
 * asked whether the account still exists.
 *
 * There is no id argument: only the caller's own account can be deleted.
 */
export async function deleteOwnAccount(
  client: SupabaseServerClient,
  clock: () => number = Date.now,
): Promise<AccountDeletionOutcome> {
  const claims = await readClaims(client);
  if (claims.status === 'signed-out') return { kind: 'signed-out' };
  if (claims.status === 'unavailable') {
    return { kind: 'unavailable', failure: claims.failure };
  }
  const userId = claims.claims.sub;
  if (!hasRecentLinkSignIn(claims.claims.amr, Math.floor(clock() / 1000))) {
    return { kind: 'link-required', photoRemoved: false };
  }

  // The picture to fall back to comes from the linked accounts. A token whose
  // user is gone means an earlier attempt already deleted the account (its
  // answer was lost): that is a success, not a signed-out session.
  const provider = await readProviderUser(client);
  if (provider.kind === 'signed-out') {
    return provider.failure.code === USER_NOT_FOUND
      ? { kind: 'deleted' }
      : { kind: 'signed-out' };
  }
  if (provider.kind === 'unavailable') {
    return { kind: 'unavailable', failure: provider.failure };
  }

  const { data: before, error: readError } = await client
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (readError) {
    return {
      kind: 'failed',
      step: 'detach',
      photoRemoved: false,
      failure: toProviderFailure(readError),
    };
  }
  if (!before) return resolveMissingProfile(client);
  const photoRemoved = isUploadedAvatar(before.avatar_url);

  const { data: marked, error: markError } = await client
    .from('profiles')
    .update({
      // The database replaces this value with its own clock.
      account_deletion_started_at: new Date(clock()).toISOString(),
      ...(photoRemoved
        ? { avatar_url: providerImageFrom(provider.user.identities) }
        : {}),
    })
    .eq('id', userId)
    .select('id');
  if (markError) {
    return {
      kind: 'failed',
      step: 'detach',
      photoRemoved: false,
      failure: toProviderFailure(markError),
    };
  }
  if (!marked?.length) return resolveMissingProfile(client);

  const swept = await removeAllAvatarObjects(client, userId);
  if (!swept.ok) {
    return {
      kind: 'failed',
      step: 'files',
      photoRemoved,
      failure: swept.failure,
    };
  }

  const deleted = await callDelete(client, photoRemoved);
  if (deleted.kind !== 'deleted') return deleted;

  const after = await removeAllAvatarObjects(client, userId);
  try {
    // The account is gone, so the session is too. Clear this browser's
    // cookies; the server has nothing left to revoke.
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // Changes nothing: the account is deleted either way.
  }
  return after.ok
    ? { kind: 'deleted' }
    : { kind: 'deleted', cleanupFailure: after.failure };
}

/**
 * Calls the database function, and resolves any answer that is neither a
 * success nor its own refusal.
 */
async function callDelete(
  client: SupabaseServerClient,
  photoRemoved: boolean,
): Promise<AccountDeletionOutcome> {
  const first = await client.rpc('delete_own_account');
  if (!first.error) return { kind: 'deleted' };
  if (first.error.code === REFUSED_BY_DATABASE) {
    return { kind: 'link-required', photoRemoved };
  }
  const failure = toProviderFailure(first.error);

  // A timeout rolled back; a lost answer may have committed. Both look alike
  // here, so ask again: the function deletes the caller's account or, if it
  // is already gone, nothing, and succeeds either way.
  const again = await client.rpc('delete_own_account');
  if (!again.error) return { kind: 'deleted' };

  switch (await accountExists(client)) {
    case 'gone':
      return { kind: 'deleted' };
    case 'exists':
      return { kind: 'failed', step: 'delete', photoRemoved, failure };
    case 'unknown':
      return { kind: 'unconfirmed', failure };
  }
}

/**
 * The profile row was not there to mark. Either the account is already gone
 * (a retry after a deletion whose answer was lost), or the row is missing for
 * an account that still exists, which deletion must not paper over.
 */
async function resolveMissingProfile(
  client: SupabaseServerClient,
): Promise<AccountDeletionOutcome> {
  switch (await accountExists(client)) {
    case 'gone':
      return { kind: 'deleted' };
    case 'exists':
      return {
        kind: 'failed',
        step: 'detach',
        photoRemoved: false,
        failure: { code: 'profile_row_missing' },
      };
    case 'unknown':
      return { kind: 'unconfirmed' };
  }
}
