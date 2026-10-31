import { describe, expect, it } from 'vitest';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@synapcity/domain-identity';
import {
  authErrorFields,
  authErrorMessage,
  emailChangeErrorFields,
  emailChangeErrorMessage,
  linkErrorMessage,
} from './error-messages';

const GENERIC = 'Something went wrong. Try again.';

describe('PASSWORD_TOO_SHORT_MESSAGE', () => {
  it('states the real minimum', () => {
    expect(PASSWORD_TOO_SHORT_MESSAGE).toContain(String(MIN_PASSWORD_LENGTH));
  });
});

describe('authErrorMessage', () => {
  it.each([
    ['invalid_credentials', 'Email or password is incorrect.'],
    [
      'email_not_confirmed',
      'Confirm your email first. Check your inbox for the link.',
    ],
    ['same_password', 'Choose a password different from your current one.'],
    ['email_address_invalid', 'Check the email address and try again.'],
    ['validation_failed', 'Check the email address and try again.'],
    [
      'email_address_not_authorized',
      'We cannot send email to that address yet.',
    ],
    [
      'over_email_send_rate_limit',
      'Too many attempts. Wait a few minutes and try again.',
    ],
    [
      'over_request_rate_limit',
      'Too many attempts. Wait a few minutes and try again.',
    ],
    ['signup_disabled', 'Sign-ups are closed right now.'],
    // The provider-level switch for email sign-ups says the same thing.
    ['email_provider_disabled', 'Sign-ups are closed right now.'],
  ])('maps %s to its own message', (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });

  describe.each([
    'reauthentication_needed',
    'session_expired',
    'session_not_found',
  ])('password-change code %s', (code) => {
    it('tells the user to sign in again, the only fix this app supports', () => {
      expect(authErrorMessage(code)).toMatch(/sign in again/i);
    });
  });

  it('does not ask for a current password the form cannot take', () => {
    const message = authErrorMessage('current_password_required');
    expect(message).not.toBe(GENERIC);
    expect(message).not.toMatch(/current password/i);
  });
  it('states the whole password rule for a weak password, without quoting a server message', () => {
    const message = authErrorMessage('weak_password');

    expect(message).toMatch(/not allowed/i);
    expect(message).toContain(PASSWORD_REQUIREMENTS);
    // The provider also refuses common and leaked passwords.
    expect(message).toMatch(/common|data breach/i);
  });

  it('answers wrong password and unknown email identically', () => {
    // Supabase reports both as invalid_credentials. The message must name both
    // fields and blame neither, or the sign-in form reveals which emails exist.
    const message = authErrorMessage('invalid_credentials');
    expect(message).toMatch(/email/i);
    expect(message).toMatch(/password/i);
    expect(message).not.toMatch(/no account|not found|exist|unknown|register/i);
  });

  describe.each([
    'user_not_found',
    'user_already_exists',
    'email_exists',
    'identity_already_exists',
  ])('account-discovery code %s', (code) => {
    it('gets the generic reply, so it cannot reveal whether an account exists', () => {
      expect(authErrorMessage(code)).toBe(GENERIC);
    });
  });

  it('gives codes this app has never heard of the generic reply', () => {
    expect(authErrorMessage('some_future_code')).toBe(GENERIC);
    expect(authErrorMessage('')).toBe(GENERIC);
  });

  it('gives a missing code the generic reply', () => {
    expect(authErrorMessage(undefined)).toBe(GENERIC);
  });

  it('never mentions an account existing or not in any known message', () => {
    const codes = [
      'invalid_credentials',
      'email_not_confirmed',
      'weak_password',
      'same_password',
      'email_address_invalid',
      'validation_failed',
      'email_address_not_authorized',
      'over_email_send_rate_limit',
      'over_request_rate_limit',
      'signup_disabled',
      'email_provider_disabled',
      'user_not_found',
      'user_already_exists',
      'email_exists',
      undefined,
    ];
    for (const code of codes) {
      expect(authErrorMessage(code)).not.toMatch(
        /already (exists|registered|in use)|no (such )?(user|account)|not found/i,
      );
    }
  });
});

describe('authErrorFields', () => {
  it.each([
    ['invalid_credentials', ['email', 'password']],
    ['weak_password', ['password']],
    ['same_password', ['password']],
    ['email_address_invalid', ['email']],
    ['validation_failed', ['email']],
    ['email_address_not_authorized', ['email']],
  ])('marks the fields %s is about', (code, fields) => {
    expect(authErrorFields(code)).toEqual(fields);
  });

  it.each([
    // About the request, not the input.
    'email_not_confirmed',
    'over_email_send_rate_limit',
    'over_request_rate_limit',
    'signup_disabled',
    'email_provider_disabled',
    // Would confirm whether an account exists, so they must not mark `email`.
    'user_not_found',
    'user_already_exists',
    'email_exists',
    'something_unknown',
    undefined,
  ])('marks nothing for %s', (code) => {
    expect(authErrorFields(code)).toEqual([]);
  });
});

describe('changing an email', () => {
  it.each(['email_exists', 'user_already_exists'])(
    'says %s cannot be used, without saying another account has it',
    (code) => {
      const message = emailChangeErrorMessage(code);

      expect(message).toBe('That address cannot be used. Try a different one.');
      expect(message).not.toMatch(
        /already|exists|account|registered|taken|in use/i,
      );
      expect(emailChangeErrorFields(code)).toEqual(['email']);
    },
  );

  it.each([
    'over_email_send_rate_limit',
    'email_address_invalid',
    'validation_failed',
    'session_expired',
    'something_unknown',
    undefined,
  ])('uses the ordinary wording and fields for %j', (code) => {
    expect(emailChangeErrorMessage(code)).toBe(authErrorMessage(code));
    expect(emailChangeErrorFields(code)).toEqual(authErrorFields(code));
  });
});

describe('connecting an account', () => {
  it.each([
    [
      'manual_linking_disabled',
      'Connecting accounts is not turned on for this app yet.',
    ],
    ['provider_disabled', 'That sign-in method is not available right now.'],
    [
      'oauth_provider_not_supported',
      'That sign-in method is not available right now.',
    ],
    ['identity_already_exists', 'That account is already connected.'],
    ['identity_not_found', 'That account is no longer connected.'],
    [
      'single_identity_not_deletable',
      'That is your only way to sign in. Add a password or connect another account first.',
    ],
    [
      'email_conflict_identity_not_deletable',
      'That account supplies your email address, so it cannot be disconnected.',
    ],
  ])('words %s for the person', (code, message) => {
    expect(linkErrorMessage(code)).toBe(message);
  });

  it.each([
    'over_request_rate_limit',
    'session_expired',
    'something_unknown',
    undefined,
  ])('uses the ordinary wording for %j', (code) => {
    expect(linkErrorMessage(code)).toBe(authErrorMessage(code));
  });
});
