import { describe, expect, it } from 'vitest';

describe('@synapcity/server-auth root entry', () => {
  it('loads behind its server-only guard and exposes the boundary', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'isOwner',
      'verifyIdentity',
      'verifyIdentityWithProvider',
    ]);
  });
});
