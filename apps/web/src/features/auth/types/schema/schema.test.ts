import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
  emailRequestSchema,
  everyRefusal,
  firstRefusal,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './schema';

const refusal = <T>(
  schema: z.ZodType<T>,
  value: unknown,
  pick: typeof firstRefusal = firstRefusal,
) => {
  const result = schema.safeParse(value);
  if (result.success) throw new Error('Expected the parse to fail.');
  return pick(result.error);
};

describe('password rule', () => {
  it('states its own minimum in the reply', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(PASSWORD_TOO_SHORT_MESSAGE).toContain(String(MIN_PASSWORD_LENGTH));
  });
});

describe('signInSchema', () => {
  it('marks every empty field, with one message', () => {
    expect(
      refusal(signInSchema, { email: '  ', password: '' }, everyRefusal),
    ).toEqual({
      message: 'Enter your email and password.',
      fields: ['email', 'password'],
    });
    expect(
      refusal(signInSchema, { email: 'a@b.co', password: '' }, everyRefusal)
        .fields,
    ).toEqual(['password']);
  });

  it('does not apply the new-password length rule to someone signing in', () => {
    expect(
      signInSchema.safeParse({ email: 'a@b.co', password: 'x' }).success,
    ).toBe(true);
  });

  it('trims the email but keeps the password exactly as typed', () => {
    expect(
      signInSchema.parse({ email: ' a@b.co ', password: ' pass ' }),
    ).toEqual({ email: 'a@b.co', password: ' pass ' });
  });
});

describe('signUpSchema', () => {
  const valid = { email: 'a@b.co', name: 'Ada', password: 'long-enough' };

  it('reports one problem at a time, in the order email, name, password', () => {
    expect(
      refusal(signUpSchema, { email: '', name: '', password: '' }),
    ).toEqual({ message: 'Enter your email.', fields: ['email'] });
    expect(
      refusal(signUpSchema, { ...valid, name: '  ', password: '' }),
    ).toEqual({ message: 'Enter your name.', fields: ['name'] });
    expect(refusal(signUpSchema, { ...valid, password: 'short' })).toEqual({
      message: PASSWORD_TOO_SHORT_MESSAGE,
      fields: ['password'],
    });
  });

  it('uses the account feature name rule, so sign-up and the profile agree', () => {
    expect(
      refusal(signUpSchema, { ...valid, name: 'x'.repeat(81) }).message,
    ).toBe('Use a name of at most 80 characters.');
  });

  it('trims email and name, and accepts a password at exactly the minimum', () => {
    expect(
      signUpSchema.parse({
        email: ' a@b.co ',
        name: ' Ada ',
        password: 'x'.repeat(MIN_PASSWORD_LENGTH),
      }),
    ).toEqual({
      email: 'a@b.co',
      name: 'Ada',
      password: 'x'.repeat(MIN_PASSWORD_LENGTH),
    });
  });

  it('leaves the format of an address to the provider', () => {
    expect(
      signUpSchema.safeParse({ ...valid, email: 'not-an-address' }).success,
    ).toBe(true);
  });
});

describe('emailRequestSchema', () => {
  it('asks for an email, and trims it', () => {
    expect(refusal(emailRequestSchema, { email: '   ' })).toEqual({
      message: 'Enter your email.',
      fields: ['email'],
    });
    expect(emailRequestSchema.parse({ email: ' a@b.co ' }).email).toBe(
      'a@b.co',
    );
  });
});

describe('updatePasswordSchema', () => {
  it('points a short password at the password field', () => {
    expect(
      refusal(updatePasswordSchema, { password: 'short', confirm: 'short' }),
    ).toEqual({ message: PASSWORD_TOO_SHORT_MESSAGE, fields: ['password'] });
  });

  it('points a mismatch at the confirm field', () => {
    expect(
      refusal(updatePasswordSchema, {
        password: 'long-enough',
        confirm: 'different-one',
      }),
    ).toEqual({ message: 'The passwords do not match.', fields: ['confirm'] });
  });

  it('reports the short password first when both are wrong', () => {
    expect(
      refusal(updatePasswordSchema, { password: 'short', confirm: 'other' })
        .fields,
    ).toEqual(['password']);
  });

  it('accepts matching passwords of enough length', () => {
    expect(
      updatePasswordSchema.parse({
        password: 'long-enough',
        confirm: 'long-enough',
      }).password,
    ).toBe('long-enough');
  });
});

describe('the refusal helpers', () => {
  it('give a generic message and no field when there is nothing to point at', () => {
    expect(firstRefusal(new z.ZodError([]))).toEqual({
      message: 'Check what you entered and try again.',
      fields: [],
    });
  });

  it('list each field once', () => {
    const error = new z.ZodError([
      { code: 'custom', message: 'a', path: ['email'], input: '' },
      { code: 'custom', message: 'b', path: ['email'], input: '' },
      { code: 'custom', message: 'c', path: ['other'], input: '' },
    ]);
    expect(everyRefusal(error)).toEqual({ message: 'a', fields: ['email'] });
  });
});
