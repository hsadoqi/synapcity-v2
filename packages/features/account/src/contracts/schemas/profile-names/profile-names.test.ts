import { describe, expect, it } from 'vitest';

import { profileNamesSchema } from './profile-names';

describe('profileNamesSchema', () => {
  it('trims, and leaves blank optional names out', () => {
    expect(
      profileNamesSchema.parse({
        firstName: '  Ada ',
        lastName: '   ',
        displayName: '',
      }),
    ).toEqual({
      firstName: 'Ada',
      lastName: undefined,
      displayName: undefined,
    });
  });

  it('keeps a last name and a display name when given', () => {
    expect(
      profileNamesSchema.parse({
        firstName: 'Ada',
        lastName: 'Lovelace',
        displayName: ' Countess ',
      }),
    ).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      displayName: 'Countess',
    });
  });

  it('requires a first name, in the domain rule’s words', () => {
    const result = profileNamesSchema.safeParse({ firstName: '  ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ['firstName'],
      message: 'Enter your first name.',
    });
  });

  it('refuses a display name over the length limit', () => {
    const result = profileNamesSchema.safeParse({
      firstName: 'Ada',
      displayName: 'x'.repeat(81),
    });
    expect(result.error?.issues[0]?.path).toEqual(['displayName']);
  });

  it('refuses a first name with characters no name uses', () => {
    expect(profileNamesSchema.safeParse({ firstName: 'Ada1' }).success).toBe(
      false,
    );
  });
});
