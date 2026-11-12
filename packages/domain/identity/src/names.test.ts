import { describe, expect, it } from 'vitest';

import {
  MAX_NAME_LENGTH,
  checkName,
  displayNameOf,
  initialsOf,
  nameSchema,
} from './names';
import { profileSchema } from './profile';

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

describe('checkName', () => {
  it('accepts a name and trims it', () => {
    expect(checkName('  Ada Lovelace ')).toEqual({ name: 'Ada Lovelace' });
  });

  it.each(['', '   ', '\t\n'])('rejects a blank name (%j)', (raw) => {
    expect(checkName(raw)).toEqual({ name: '', error: 'Enter your name.' });
  });

  it('accepts exactly the maximum length and rejects one more', () => {
    expect(checkName('x'.repeat(MAX_NAME_LENGTH)).error).toBeUndefined();
    expect(checkName('x'.repeat(MAX_NAME_LENGTH + 1)).error).toBe(
      `Use a name of at most ${MAX_NAME_LENGTH} characters.`,
    );
  });

  it('keeps non-latin names intact', () => {
    expect(checkName('أحمد المنصوري')).toEqual({ name: 'أحمد المنصوري' });
  });
});

describe('profileSchema', () => {
  it('is the single source of the name rule', () => {
    expect(profileSchema.safeParse({ name: ' Ada ' })).toMatchObject({
      success: true,
      data: { name: 'Ada' },
    });
    expect(profileSchema.safeParse({ name: '' }).success).toBe(false);
    expect(profileSchema.safeParse({}).success).toBe(false);
  });
});

describe('initialsOf', () => {
  it('takes up to two capitals from the first words', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('ada king lovelace')).toBe('AK');
    expect(initialsOf('  grace ')).toBe('G');
  });

  it('is empty without a name, so the avatar shows its default image', () => {
    expect(initialsOf(null)).toBe('');
    expect(initialsOf('')).toBe('');
  });
});

describe('initialsOf with any script', () => {
  it('never cuts an emoji or a combined letter in half', () => {
    // Before the grapheme fix this gave a lone surrogate followed by "A".
    expect(initialsOf('😀 Ada')).toBe('A');
    expect(initialsOf('😀 Ada Lovelace')).toBe('AL');
    expect(initialsOf('🇫🇷')).toBe('');
    // "é" written as "e" plus a combining accent stays one letter.
    expect(initialsOf('émile zola')).toBe('ÉZ');
  });

  it('reads letters from any script', () => {
    expect(initialsOf('أحمد المنصوري')).toBe('أا');
    expect(initialsOf('王 小明')).toBe('王小');
    expect(initialsOf('Łukasz Żak')).toBe('ŁŻ');
  });

  it('skips words with no letter or digit and keeps the word rule', () => {
    expect(initialsOf('(Ada) Lovelace')).toBe('AL');
    expect(initialsOf('- Grace Hopper')).toBe('GH');
    expect(initialsOf('R2 D2')).toBe('RD');
  });
});

describe('displayNameOf', () => {
  it.each([
    [{ displayName: 'Ada L.', firstName: 'Ada' }, 'Ada L.'],
    [{ displayName: null, firstName: 'Ada' }, 'Ada'],
    [{ displayName: '   ', firstName: ' Ada ' }, 'Ada'],
    [{ firstName: 'Ada' }, 'Ada'],
    [{ displayName: 'Ada Lovelace' }, 'Ada Lovelace'],
    [{ displayName: null, firstName: null }, null],
    [{}, null],
  ])('resolves %j to %j', (profile, expected) => {
    expect(displayNameOf(profile)).toBe(expected);
  });
});
