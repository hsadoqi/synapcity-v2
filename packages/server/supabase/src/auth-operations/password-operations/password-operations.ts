import { classifyAuthError, isRateLimited } from '../../auth-errors';
import { ProviderFailure, toProviderFailure } from '../../provider-failure';
import { readProviderUser } from '../../provider-user';
import { SupabaseServerClient } from '../../request-client';

export type PasswordUpdateOutcome =
  | { kind: 'updated'; userId: string }
  | { kind: 'unavailable'; failure: ProviderFailure }
  | { kind: 'provider-error'; failure: ProviderFailure };

/**
 * Sets a new password for the signed-in person, as the reset link or the
 * settings page leaves them. The failure carries its code and status only.
 */
export async function updateOwnPassword(
  supabase: SupabaseServerClient,
  input: { password: string },
): Promise<PasswordUpdateOutcome> {
  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  });
  if (error) {
    const outcome = classifyAuthError(error);
    if (outcome.kind === 'unavailable') return outcome;
    return { kind: 'provider-error', failure: toProviderFailure(error) };
  }
  if (!data.user) return { kind: 'provider-error', failure: {} };
  return { kind: 'updated', userId: data.user.id };
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
  /** The auth service could not be reached; trying again may work. The failure is for the log. */
  | { kind: 'unavailable'; failure: ProviderFailure }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Asks to change the signed-in person's email. The provider changes nothing
 * until a link is confirmed, and depending on the project's "Secure email
 * change" setting that is the new address alone or both addresses. The current
 * address is read fresh from the provider: the token's copy can be an hour old.
 */
export async function changeEmail(
  supabase: SupabaseServerClient,
  input: EmailChangeInput,
): Promise<EmailChangeOutcome> {
  const found = await readProviderUser(supabase);
  if (found.kind === 'signed-out') return { kind: 'signed-out' };
  if (found.kind === 'unavailable') return found;
  const { user } = found;
  if (user.email?.toLowerCase() === input.newEmail.toLowerCase()) {
    return { kind: 'same-email' };
  }

  const { data: updated, error } = await supabase.auth.updateUser(
    { email: input.newEmail },
    { emailRedirectTo: input.redirectTo },
  );
  // A lost session or an outage on this second call is not the provider
  // refusing the change; only a refusal keeps its code.
  if (error) return classifyAuthError(error);

  // Without email confirmation the provider applies the change at once, and
  // nothing is left pending. Saying a link was sent would then be untrue.
  const updatedUser = updated?.user;
  if (
    updatedUser &&
    !updatedUser.new_email &&
    updatedUser.email?.toLowerCase() === input.newEmail.toLowerCase()
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
  /** The failure is for the log: code and status only. */
  | { kind: 'unavailable'; failure: ProviderFailure }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sends the confirmation for a pending email change again. The address comes
 * from the provider's record of the pending change, never from the caller, so
 * this cannot be pointed at an address the person has not asked to change to.
 */
export async function resendEmailChange(
  supabase: SupabaseServerClient,
  input: {
    redirectTo: string;
  },
): Promise<ResendEmailChangeOutcome> {
  const found = await readProviderUser(supabase);
  if (found.kind === 'signed-out') return { kind: 'signed-out' };
  if (found.kind === 'unavailable') return found;
  const { user } = found;
  const pending = user.new_email;
  if (!pending) return { kind: 'nothing-pending' };

  const { error } = await supabase.auth.resend({
    type: 'email_change',
    email: pending,
    options: { emailRedirectTo: input.redirectTo },
  });
  if (error) return classifyAuthError(error);
  return { kind: 'sent', email: pending };
}

export type OwnPasswordResetOutcome =
  | { kind: 'sent'; email: string }
  /** The account has no email address to send a link to. */
  | { kind: 'no-email' }
  | { kind: 'signed-out' }
  /** The failure is for the log: code and status only. */
  | { kind: 'unavailable'; failure: ProviderFailure }
  | { kind: 'rate-limited'; code: string }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Sends the password-reset link to the signed-in person's own address. The
 * address is read from the provider, never taken from the caller, so this
 * cannot be pointed at anyone else's inbox. Unlike the public reset form it
 * can say when something failed: the address is the person's own, so there is
 * no account to hide.
 */
export async function sendOwnPasswordReset(
  supabase: SupabaseServerClient,
  input: {
    resetRedirect: string;
  },
): Promise<OwnPasswordResetOutcome> {
  const found = await readProviderUser(supabase);
  if (found.kind === 'signed-out') return { kind: 'signed-out' };
  if (found.kind === 'unavailable') return found;
  const { user } = found;
  const email = user.email;
  if (!email) return { kind: 'no-email' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: input.resetRedirect,
  });
  if (error?.code && isRateLimited(error.code)) {
    return { kind: 'rate-limited', code: error.code };
  }
  if (error) return classifyAuthError(error);
  return { kind: 'sent', email };
}
