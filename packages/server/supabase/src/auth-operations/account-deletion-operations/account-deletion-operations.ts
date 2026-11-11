import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { isRateLimited } from '../../auth-errors';
import type { SupabaseServerClient } from '../../request-client';

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
export async function sendAccountDeletionLink(
  supabase: SupabaseServerClient,
  input: {
    typedEmail: string;
    redirectTo: string;
  },
): Promise<DeletionLinkOutcome> {
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
