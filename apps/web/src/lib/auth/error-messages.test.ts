import { describe, expect, it } from 'vitest';

import { authErrorMessage } from './error-messages';

const GENERIC = 'Something went wrong. Try again.';

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
  ])('maps %s to its own message', (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });

  it('gives weak passwords a hint without quoting a server message', () => {
    expect(authErrorMessage('weak_password')).toMatch(/too weak/i);
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
