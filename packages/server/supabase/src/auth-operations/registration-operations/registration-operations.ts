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

import { classifyAuthError } from '../../auth-errors';
import type { ProviderFailure } from '../../provider-failure';
import { SupabaseServerClient } from '../../request-client';

export type RegistrationInput = {
  email: string;
  password: string;
  /** Sent as `first_name`; the signup trigger copies it to `profiles.first_name`. */
  firstName: string;
  /** Sent as `last_name` only when given; the trigger copies it to `profiles.last_name`. */
  lastName?: string;
  /** Where the confirmation email returns to. Built by the action from configured origin. */
  confirmationRedirect: string;
};

export type RegistrationOutcome =
  /** The expected case: a confirmation email is pending (or the address already exists). */
  | { kind: 'confirmation-required' }
  /** The project does not require confirmation, so a session exists already. */
  | { kind: 'signed-in'; userId: string }
  /** The auth service did not answer; trying again may work. */
  | { kind: 'unavailable'; failure: ProviderFailure }
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
      // Structured names only. No `full_name`, so the trigger leaves
      // `display_name` empty: it is the person's own choice, not derived.
      data: {
        first_name: input.firstName,
        ...(input.lastName ? { last_name: input.lastName } : {}),
      },
    },
  });
  if (error) {
    const outcome = classifyAuthError(error);
    if (outcome.kind === 'unavailable') return outcome;
    return {
      kind: 'provider-error',
      code: outcome.kind === 'provider-error' ? outcome.code : error.code,
    };
  }

  if (data.session && data.user) {
    return { kind: 'signed-in', userId: data.user.id };
  }
  return { kind: 'confirmation-required' };
}
