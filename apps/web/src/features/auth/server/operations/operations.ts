import { isRateLimited } from '@/features/auth/shared/error-messages';
import { createClient } from '@/lib/supabase/server';

/*
 * Provider workflows behind the auth Server Actions (ADR-0008).
 *
 * An action owns the form: FormData, validation, the user-facing message,
 * revalidation and navigation. An operation owns one provider call: it takes
 * typed, already-validated input, sets the SDK options, and reduces the result
 * to a small outcome. That reduction is the contract. Outcomes are plain
 * scalars, never an SDK user, session, token or error object, so nothing a
 * caller does with an outcome can leak one to the browser.
 *
 * Operations are ordinary module functions. They are not Server Actions and
 * are not client-callable. Each call builds its own request-bound Supabase
 * client; nothing is cached between requests or users.
 */

export type RegistrationInput = {
  email: string;
  password: string;
  /** Stored as `full_name`, the key OAuth providers fill, so one reader covers both. */
  name: string;
  /** Where the confirmation email returns to. Built by the action from configured origin. */
  confirmationRedirect: string;
};

export type RegistrationOutcome =
  /** The expected case: a confirmation email is pending (or the address already exists). */
  | { kind: 'confirmation-required' }
  /** The project does not require confirmation, so a session exists already. */
  | { kind: 'signed-in'; userId: string }
  | { kind: 'provider-error'; code: string | undefined };

/** Creates a password account. Supabase hides whether the address was taken. */
export async function registerWithPassword(
  input: RegistrationInput,
): Promise<RegistrationOutcome> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: input.confirmationRedirect,
      data: { full_name: input.name },
    },
  });
  if (error) return { kind: 'provider-error', code: error.code };

  if (data.session && data.user) {
    return { kind: 'signed-in', userId: data.user.id };
  }
  return { kind: 'confirmation-required' };
}

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
  input: RecoveryInput,
): Promise<RecoveryOutcome> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.resetRedirect,
  });

  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  return { kind: 'accepted' };
}
