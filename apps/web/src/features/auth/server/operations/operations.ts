import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { hasRecentLinkSignIn } from '@synapcity/server-supabase';

import { createClient } from '@/lib/supabase/server';

/*
 * The account-deletion operation (ADR-0008). The other provider operations,
 * including sending the deletion link, are in `@synapcity/server-supabase`.
 */

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
