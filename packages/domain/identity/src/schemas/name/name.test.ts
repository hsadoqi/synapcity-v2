import { describe, expect, it } from 'vitest';

import { MAX_NAME_LENGTH, nameSchema } from './name';

describe('nameSchema', () => {
  it('matches the database length check', () => {
    expect(MAX_NAME_LENGTH).toBe(80);
  });

  it('accepts a name and trims the surrounding whitespace', () => {
    expect(nameSchema.parse('  Ada Lovelace  ')).toBe('Ada Lovelace');
  });

  it('accepts a name of exactly the maximum length', () => {
    expect(nameSchema.safeParse('a'.repeat(MAX_NAME_LENGTH)).success).toBe(
      true,
    );
  });

  it.each(['', '   ', '\t\n'])('asks for a name when given %j', (value) => {
    const result = nameSchema.safeParse(value);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter your name.');
  });

  it('refuses a name one character over the maximum', () => {
    const result = nameSchema.safeParse('a'.repeat(MAX_NAME_LENGTH + 1));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      `Use a name of at most ${MAX_NAME_LENGTH} characters.`,
    );
  });

  it('measures the length after trimming', () => {
    const padded = ` ${'a'.repeat(MAX_NAME_LENGTH)} `;

    expect(nameSchema.safeParse(padded).success).toBe(true);
  });

  it('refuses a value that is not a string', () => {
    expect(nameSchema.safeParse(42).success).toBe(false);
    expect(nameSchema.safeParse(undefined).success).toBe(false);
  });

  it('trims and accepts up to the limit', () => {
    expect(nameSchema.parse('  Ada  ')).toBe('Ada');
    expect(nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH)).success).toBe(
      true,
    );
  });

  it('measures the limit after trimming, as the database does', () => {
    expect(
      nameSchema.safeParse(` ${'x'.repeat(MAX_NAME_LENGTH)} `).success,
    ).toBe(true);
    expect(nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH + 1)).success).toBe(
      false,
    );
  });

  it('says what is wrong in the words the form shows', () => {
    expect(nameSchema.safeParse('  ').error?.issues[0]?.message).toBe(
      'Enter your name.',
    );
    expect(
      nameSchema.safeParse('x'.repeat(MAX_NAME_LENGTH + 1)).error?.issues[0]
        ?.message,
    ).toBe(`Use a name of at most ${MAX_NAME_LENGTH} characters.`);
  });
});
