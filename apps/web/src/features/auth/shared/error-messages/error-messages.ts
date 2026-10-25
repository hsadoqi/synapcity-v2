import {
  PASSWORD_REQUIREMENTS,
  type AuthFieldName,
} from '@synapcity/domain-identity';

/**
 * Turns a Supabase Auth error code (`error.code`, for example
 * `invalid_credentials`) into text shown to the user. Never pass `error.message`
 * through: it can reveal whether an account exists.
 *
 * Codes that confirm whether an account exists (`user_not_found`,
 * `user_already_exists`, `email_exists`) are deliberately left to the default
 * reply, so the forms cannot be used to discover registered emails.
 * Codes are from https://supabase.com/docs/guides/auth/debugging/error-codes.
 */
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Confirm your email first. Check your inbox for the link.';
    case 'weak_password':
      // Also what the provider says when it rejects a common or leaked password.
      return `That password is not allowed. ${PASSWORD_REQUIREMENTS} Avoid passwords that are common or have appeared in a data breach.`;
    case 'same_password':
      return 'Choose a password different from your current one.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Check the email address and try again.';
    case 'email_address_not_authorized':
      return 'We cannot send email to that address yet.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a few minutes and try again.';
    // Both are about the project, not the person: sign-ups, or email sign-ups
    // in particular, are switched off.
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Sign-ups are closed right now.';
    case 'reauthentication_needed':
    case 'session_expired':
    case 'session_not_found':
      // Changing a password needs a recent sign-in. The app does not run
      // Supabase's reauthentication (nonce) step, so signing in again is the fix.
      return 'For your security, sign out, sign in again, then try once more.';
    case 'current_password_required':
      // Supabase's "Require current password" setting. This form has no
      // current-password field, and a Google or GitHub account has no password
      // to give, so the setting must stay off for this page to work (ADR-0006).
      return 'Password changes are unavailable right now. Try again later.';
    default:
      return 'Something went wrong. Try again.';
  }
}

/**
 * Which fields a Supabase Auth error code is about. The form marks these
 * `aria-invalid` and links them to the message; an empty list means the error
 * is about the request as a whole (rate limits, outages), not what was typed.
 */
export function authErrorFields(code: string | undefined): AuthFieldName[] {
  switch (code) {
    // The reply must not say which of the two was wrong, so both are marked.
    case 'invalid_credentials':
      return ['email', 'password'];
    case 'weak_password':
    case 'same_password':
      return ['password'];
    case 'email_address_invalid':
    case 'validation_failed':
    case 'email_address_not_authorized':
      return ['email'];
    // Everything else is about the request, or deliberately says nothing about
    // the input: marking `email` for an account-discovery code would hint that
    // the account exists.
    default:
      return [];
  }
}

/**
 * The wording for changing an email, where the person is already signed in.
 * An address that cannot be used is worded so it does not say whether another
 * account has it; everything else is the ordinary wording.
 */
export function emailChangeErrorMessage(code: string | undefined): string {
  if (code === 'email_exists' || code === 'user_already_exists') {
    return 'That address cannot be used. Try a different one.';
  }
  return authErrorMessage(code);
}

/** The field to mark for an email-change error: the new address, for one it cannot use. */
export function emailChangeErrorFields(
  code: string | undefined,
): AuthFieldName[] {
  if (code === 'email_exists' || code === 'user_already_exists') {
    return ['email'];
  }
  return authErrorFields(code);
}

/** The wording for connecting a Google or GitHub account to the signed-in one. */
/** Said when disconnecting would leave no way to sign in. */
export const LAST_SIGN_IN =
  'That is your only way to sign in. Add a password or connect another account first.';

export function linkErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'manual_linking_disabled':
      // A project setting, not something the person did.
      return 'Connecting accounts is not turned on for this app yet.';
    case 'provider_disabled':
    case 'oauth_provider_not_supported':
      return 'That sign-in method is not available right now.';
    case 'identity_already_exists':
      return 'That account is already connected.';
    case 'identity_not_found':
      return 'That account is no longer connected.';
    case 'single_identity_not_deletable':
      return LAST_SIGN_IN;
    case 'email_conflict_identity_not_deletable':
      // Removing it would leave the account's address attached to nothing.
      return 'That account supplies your email address, so it cannot be disconnected.';
    default:
      return authErrorMessage(code);
  }
}
