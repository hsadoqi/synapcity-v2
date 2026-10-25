import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_REQUIREMENTS,
  PASSWORD_TOO_SHORT_MESSAGE,
  emailRequestSchema,
  missingCharactersMessage,
  newPasswordSchema,
  everyRefusal,
  firstRefusal,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from './credentials';

/** Meets the whole rule. */
const STRONG = 'Str0ng-Passw0rd!';
/** Exactly the minimum length, with every kind of character. */
const EXACTLY_MINIMUM = 'Aa1!aaaa';

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
  const valid = { email: 'a@b.co', name: 'Ada', password: STRONG };

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
        password: EXACTLY_MINIMUM,
      }),
    ).toEqual({
      email: 'a@b.co',
      name: 'Ada',
      password: EXACTLY_MINIMUM,
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
        password: STRONG,
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
        password: STRONG,
        confirm: STRONG,
      }).password,
    ).toBe(STRONG);
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

describe('the new-password rule', () => {
  const message = (password: string) =>
    newPasswordSchema.safeParse(password).error?.issues[0]?.message;

  it('accepts a password with every kind of character, at the minimum length', () => {
    expect(newPasswordSchema.safeParse(EXACTLY_MINIMUM).success).toBe(true);
    expect(EXACTLY_MINIMUM).toHaveLength(MIN_PASSWORD_LENGTH);
    expect(newPasswordSchema.safeParse(STRONG).success).toBe(true);
  });

  it('reports length first, even when other kinds of character are missing too', () => {
    expect(message('Aa1!')).toBe(PASSWORD_TOO_SHORT_MESSAGE);
    expect(message('')).toBe(PASSWORD_TOO_SHORT_MESSAGE);
  });

  it.each([
    ['no lowercase letter', 'AAAA1111!', 'Add a lowercase letter.'],
    ['no uppercase letter', 'aaaa1111!', 'Add an uppercase letter.'],
    ['no number', 'Aaaaaaaa!', 'Add a number.'],
    ['no symbol', 'Aaaaaaa1', 'Add a symbol such as ! # or ?.'],
    [
      'no uppercase letter or symbol',
      'aaaaaaa1',
      'Add an uppercase letter and a symbol such as ! # or ?.',
    ],
    [
      'only lowercase letters',
      'aaaaaaaa',
      'Add an uppercase letter, a number and a symbol such as ! # or ?.',
    ],
    [
      'only digits',
      '12345678',
      'Add a lowercase letter, an uppercase letter and a symbol such as ! # or ?.',
    ],
  ])('names only what is missing: %s', (_label, password, expected) => {
    expect(message(password)).toBe(expected);
  });

  it('counts each symbol Supabase documents, and only those', () => {
    const documented = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~'.split('');
    expect(documented).toHaveLength(32);
    for (const symbol of documented) {
      expect(missingCharactersMessage(`Aa1${symbol}aaaa`)).toBeNull();
    }
  });

  it.each([
    ['a space', 'Aa1 aaaa'],
    ['an accented letter', 'Aa1éaaaa'],
    ['a currency sign', 'Aa1€aaaa'],
    ['an emoji', 'Aa1😀aaaa'],
    ['a non-Latin letter', 'Aa1ыaaaa'],
  ])(
    'does not count %s as a symbol, as Supabase would not',
    (_label, password) => {
      expect(missingCharactersMessage(password)).toBe(
        'Add a symbol such as ! # or ?.',
      );
    },
  );

  it('states the rule in words for the form to show', () => {
    expect(PASSWORD_REQUIREMENTS).toBe(
      'At least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.',
    );
  });

  it('is not applied to signing in, where an older password may predate it', () => {
    expect(
      signInSchema.safeParse({ email: 'a@b.co', password: 'weak' }).success,
    ).toBe(true);
  });
});
