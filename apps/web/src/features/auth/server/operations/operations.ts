import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { isRateLimited } from '@synapcity/domain-identity';

import { hasRecentLinkSignIn } from '@/features/auth/shared/recent-link-sign-in';
import { createClient } from '@/lib/supabase/server';

/*
 * The account-deletion operations (ADR-0008). The other provider operations
 * moved to `@synapcity/server-supabase`; these two stay until the delete-account
 * flow moves with `features-auth` (M7.5), because they use the recent-sign-in
 * check (M7 design Q5) and `deleteOwnAccount` logs.
 */

export type DeletionLinkOutcome =
  | { kind: 'sent'; email: string }
  /** What was typed is not this account's address. Nothing was sent. */
  | { kind: 'wrong-email' }
  /** The account has no email address to send a link to. */
  | { kind: 'no-email' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'rate-limited'; code: string }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sends the link that lets the signed-in person finish deleting their account.
 * The address typed is only a check that the right person is at the screen; the
 * link goes to the address the provider holds, never to the typed one, and
 * `shouldCreateUser: false` means it can never make an account. Opening the link
 * signs in and deletes nothing: that takes a further button.
 */
export async function sendAccountDeletionLink(input: {
  typedEmail: string;
  redirectTo: string;
}): Promise<DeletionLinkOutcome> {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return isAuthRetryableFetchError(userError)
      ? { kind: 'unavailable' }
      : { kind: 'signed-out' };
  }
  const email = data.user.email;
  if (!email) return { kind: 'no-email' };
  if (email.toLowerCase() !== input.typedEmail.trim().toLowerCase()) {
    return { kind: 'wrong-email' };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: input.redirectTo },
  });
  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  if (error) return { kind: 'provider-error', code: error.code };
  return { kind: 'sent', email };
}

export type AccountDeletionOutcome =
  | { kind: 'deleted' }
  /** No emailed-link sign-in in the last few minutes: the link must be used again. */
  | { kind: 'link-required' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/** Postgres `insufficient_privilege`, raised by the database function. */
const REFUSED_BY_DATABASE = '42501';

/**
 * Permanently deletes the signed-in person's own account. IRREVERSIBLE.
 *
 * Two checks, because the first is only a courtesy: the verified token must
 * show an emailed-link sign-in in the last few minutes, and the database
 * function `delete_own_account()` checks the same again, which is the one that
 * cannot be skipped. There is no id argument, so only the caller's own account
 * can be deleted.
 *
 * `cleanup` removes what the database cannot (stored files). It runs after the
 * first check and before the deletion, while the session can still reach them,
 * and a failure in it does not stop the deletion: an orphaned file is better
 * than an account that cannot be deleted.
 */
export async function deleteOwnAccount(input: {
  cleanup: (
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
  ) => Promise<void>;
}): Promise<AccountDeletionOutcome> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return isAuthRetryableFetchError(error)
      ? { kind: 'unavailable' }
      : { kind: 'signed-out' };
  }
  const { claims } = data;
  if (!hasRecentLinkSignIn(claims.amr, Math.floor(Date.now() / 1000))) {
    return { kind: 'link-required' };
  }

  try {
    await input.cleanup(supabase, claims.sub);
  } catch {
    console.warn('deleteOwnAccount cleanup failed');
  }

  const { error: deleteError } = await supabase.rpc('delete_own_account');
  if (deleteError) {
    if (deleteError.code === REFUSED_BY_DATABASE) {
      return { kind: 'link-required' };
    }
    return { kind: 'provider-error', code: deleteError.code };
  }

  // The account is gone, so the session is too. Clear this browser's cookies;
  // the server has nothing left to revoke, so a failure here changes nothing.
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    console.warn('deleteOwnAccount signOut failed');
  }
  return { kind: 'deleted' };
}
