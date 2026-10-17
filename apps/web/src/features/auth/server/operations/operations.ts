import { isAuthRetryableFetchError } from '@supabase/supabase-js';

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

export type EmailChangeInput = {
  newEmail: string;
  /** Where the confirmation link returns to. Built by the action from configured origin. */
  redirectTo: string;
};

export type EmailChangeOutcome =
  /** A confirmation link is on its way; the address changes only once it is used. */
  | { kind: 'requested' }
  /** The project confirms without email, so the address is already the new one. */
  | { kind: 'changed' }
  /** Nothing to do: it is already the address on the account. */
  | { kind: 'same-email' }
  /** There is no session, so there is no account to change. */
  | { kind: 'signed-out' }
  /** The auth service could not be reached; trying again may work. */
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Asks to change the signed-in person's email. The provider changes nothing
 * until a link is confirmed, and depending on the project's "Secure email
 * change" setting that is the new address alone or both addresses. The current
 * address is read fresh from the provider: the token's copy can be an hour old.
 */
export async function changeEmail(
  input: EmailChangeInput,
): Promise<EmailChangeOutcome> {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return isAuthRetryableFetchError(userError)
      ? { kind: 'unavailable' }
      : { kind: 'signed-out' };
  }
  if (data.user.email?.toLowerCase() === input.newEmail.toLowerCase()) {
    return { kind: 'same-email' };
  }

  const { data: updated, error } = await supabase.auth.updateUser(
    { email: input.newEmail },
    { emailRedirectTo: input.redirectTo },
  );
  if (error) return { kind: 'provider-error', code: error.code };

  // Without email confirmation the provider applies the change at once, and
  // nothing is left pending. Saying a link was sent would then be untrue.
  const user = updated?.user;
  if (
    user &&
    !user.new_email &&
    user.email?.toLowerCase() === input.newEmail.toLowerCase()
  ) {
    return { kind: 'changed' };
  }
  return { kind: 'requested' };
}

export type ResendEmailChangeOutcome =
  | { kind: 'sent'; email: string }
  /** There is no change waiting, so there is nothing to send again. */
  | { kind: 'nothing-pending' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sends the confirmation for a pending email change again. The address comes
 * from the provider's record of the pending change, never from the caller, so
 * this cannot be pointed at an address the person has not asked to change to.
 */
export async function resendEmailChange(input: {
  redirectTo: string;
}): Promise<ResendEmailChangeOutcome> {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return isAuthRetryableFetchError(userError)
      ? { kind: 'unavailable' }
      : { kind: 'signed-out' };
  }
  const pending = data.user.new_email;
  if (!pending) return { kind: 'nothing-pending' };

  const { error } = await supabase.auth.resend({
    type: 'email_change',
    email: pending,
    options: { emailRedirectTo: input.redirectTo },
  });
  if (error) return { kind: 'provider-error', code: error.code };
  return { kind: 'sent', email: pending };
}

export type OwnPasswordResetOutcome =
  | { kind: 'sent'; email: string }
  /** The account has no email address to send a link to. */
  | { kind: 'no-email' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'rate-limited'; code: string }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sends the password-reset link to the signed-in person's own address. The
 * address is read from the provider, never taken from the caller, so this
 * cannot be pointed at anyone else's inbox. Unlike the public reset form it
 * can say when something failed: the address is the person's own, so there is
 * no account to hide.
 */
export async function sendOwnPasswordReset(input: {
  resetRedirect: string;
}): Promise<OwnPasswordResetOutcome> {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return isAuthRetryableFetchError(userError)
      ? { kind: 'unavailable' }
      : { kind: 'signed-out' };
  }
  const email = data.user.email;
  if (!email) return { kind: 'no-email' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: input.resetRedirect,
  });
  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  if (error) return { kind: 'provider-error', code: error.code };
  return { kind: 'sent', email };
}
