import { isRateLimited } from '../../auth-errors';
import { SupabaseServerClient } from '../../request-client';

export type RecoveryInput = {
  email: string;
  /** Where the reset email returns to. Built by the action from configured origin. */
  resetRedirect: string;
};

export type RecoveryOutcome =
  | { kind: 'accepted' }
  /** The only failure the form may tell apart; it says nothing about any account. */
  | { kind: 'rate-limited'; code: string };

/**
 * Asks for a password-reset email. Every outcome except a rate limit is
 * `accepted`, including provider errors, so the reply cannot be used to learn
 * which addresses have an account.
 */
export async function requestRecoveryEmail(
  supabase: SupabaseServerClient,
  input: RecoveryInput,
): Promise<RecoveryOutcome> {
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.resetRedirect,
  });

  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  return { kind: 'accepted' };
}

/**
 * Sends the sign-up confirmation email again. Like the recovery request, every
 * outcome except a rate limit is `accepted`, so the reply cannot be used to
 * learn which addresses have a pending sign-up.
 */
export async function resendSignupConfirmation(
  supabase: SupabaseServerClient,
  input: {
    email: string;
    /** Where the confirmation email returns to. Built by the action from configured origin. */
    confirmationRedirect: string;
  },
): Promise<RecoveryOutcome> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: input.email,
    options: { emailRedirectTo: input.confirmationRedirect },
  });

  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  return { kind: 'accepted' };
}
