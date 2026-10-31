import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { isRateLimited, type OAuthProvider } from '@synapcity/domain-identity';

import { classifyAuthError } from '../auth-errors';
import { toProviderFailure, type ProviderFailure } from '../provider-failure';
import { readProviderUser } from '../provider-user';
import type { SupabaseServerClient } from '../request-client';

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
 * are not client-callable. Each operation takes the caller's request-bound Supabase
 * client as its first argument; nothing is cached between requests or users.
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
  supabase: SupabaseServerClient,
  input: RegistrationInput,
): Promise<RegistrationOutcome> {
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

export type PasswordUpdateOutcome =
  | { kind: 'updated'; userId: string }
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
  if (error)
    return { kind: 'provider-error', failure: toProviderFailure(error) };
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
  supabase: SupabaseServerClient,
  input: EmailChangeInput,
): Promise<EmailChangeOutcome> {
  const found = await readProviderUser(supabase);
  if (found.kind !== 'user') return { kind: found.kind };
  const { user } = found;
  if (user.email?.toLowerCase() === input.newEmail.toLowerCase()) {
    return { kind: 'same-email' };
  }

  const { data: updated, error } = await supabase.auth.updateUser(
    { email: input.newEmail },
    { emailRedirectTo: input.redirectTo },
  );
  if (error) return { kind: 'provider-error', code: error.code };

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
  | { kind: 'unavailable' }
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
  if (found.kind !== 'user') return { kind: found.kind };
  const { user } = found;
  const pending = user.new_email;
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
export async function sendOwnPasswordReset(
  supabase: SupabaseServerClient,
  input: {
    resetRedirect: string;
  },
): Promise<OwnPasswordResetOutcome> {
  const found = await readProviderUser(supabase);
  if (found.kind !== 'user') return { kind: found.kind };
  const { user } = found;
  const email = user.email;
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

export type AccountLinkOutcome =
  /** Send the browser to the provider; it brings the person back to `redirectTo`. */
  | { kind: 'redirect'; url: string }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Starts linking a Google or GitHub account to the signed-in person's account.
 * The provider only links an account the person signs in to, and refuses one
 * that already belongs to this or another account. Linking has to be switched
 * on in the project's settings; when it is not, the code says so.
 */
export async function startAccountLink(
  supabase: SupabaseServerClient,
  input: {
    provider: OAuthProvider;
    redirectTo: string;
  },
): Promise<AccountLinkOutcome> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: input.provider,
    options: { redirectTo: input.redirectTo },
  });
  if (error) return classifyAuthError(error);
  if (!data?.url) return { kind: 'provider-error', code: undefined };
  return { kind: 'redirect', url: data.url };
}

export type DisconnectOutcome =
  | { kind: 'disconnected' }
  /** It is not linked (any more), so there is nothing to remove. */
  | { kind: 'not-connected' }
  /** Removing it would leave no way to sign in. Nothing was changed. */
  | { kind: 'last-sign-in' }
  | { kind: 'signed-out' }
  | { kind: 'unavailable' }
  | { kind: 'provider-error'; code: string | undefined };

/**
 * Unlinks a Google or GitHub account from the signed-in person's account. The
 * caller names only the provider; the identity record the SDK needs is looked
 * up here, from the person's own identities, so nothing the browser sends can
 * point at another account. The last remaining way to sign in is never removed.
 */
export async function disconnectAccount(
  supabase: SupabaseServerClient,
  input: {
    provider: OAuthProvider;
  },
): Promise<DisconnectOutcome> {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) return classifyAuthError(error);
  const identities = data?.identities ?? [];
  const identity = identities.find((item) => item.provider === input.provider);
  if (!identity) return { kind: 'not-connected' };
  if (identities.length < 2) return { kind: 'last-sign-in' };

  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
  if (unlinkError) {
    if (unlinkError.code === 'single_identity_not_deletable') {
      return { kind: 'last-sign-in' };
    }
    if (unlinkError.code === 'identity_not_found') {
      return { kind: 'not-connected' };
    }
    if (isAuthRetryableFetchError(unlinkError)) return { kind: 'unavailable' };
    return { kind: 'provider-error', code: unlinkError.code };
  }
  return { kind: 'disconnected' };
}
