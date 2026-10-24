import { describe, expect, it } from 'vitest';

import { checkName } from './name';
import { MAX_NAME_LENGTH, profileSchema } from '@synapcity/domain-identity';

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
