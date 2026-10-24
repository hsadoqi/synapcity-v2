import { describe, expect, it } from 'vitest';

import { profileSchema } from './user';

const png = new File([new Uint8Array(10)], 'avatar.png', {
  type: 'image/png',
});

describe('profileSchema', () => {
  it('accepts a name alone', () => {
    expect(profileSchema.parse({ name: '  Ada  ' })).toEqual({ name: 'Ada' });
  });

  it('accepts a name with an avatar', () => {
    const parsed = profileSchema.parse({ name: 'Ada', avatar: png });

    expect(parsed.name).toBe('Ada');
    expect(parsed.avatar).toBe(png);
  });

  it('requires a name', () => {
    const result = profileSchema.safeParse({ avatar: png });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['name']);
  });

  it('points an invalid avatar at the avatar field', () => {
    const gif = new File([new Uint8Array(10)], 'a.gif', { type: 'image/gif' });
    const result = profileSchema.safeParse({ name: 'Ada', avatar: gif });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['avatar']);
  });

  it('drops fields it does not know', () => {
    const parsed = profileSchema.parse({ name: 'Ada', userId: 'someone-else' });

    expect(parsed).toEqual({ name: 'Ada' });
  });
});
