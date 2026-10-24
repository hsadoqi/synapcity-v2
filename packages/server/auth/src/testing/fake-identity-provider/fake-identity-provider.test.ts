import { describe, expect, it } from 'vitest';

import { fakeIdentityProvider } from './index';

describe('fakeIdentityProvider', () => {
  it('reports no session by default', async () => {
    const provider = fakeIdentityProvider();

    await expect(provider.claims()).resolves.toEqual({ kind: 'none' });
    await expect(provider.user()).resolves.toEqual({ kind: 'none' });
  });

  it('answers with the outcomes it was given and counts each question', async () => {
    const provider = fakeIdentityProvider({
      claims: { kind: 'user', userId: 'u1' },
      user: { kind: 'unreachable', status: 0 },
    });

    await expect(provider.claims()).resolves.toEqual({
      kind: 'user',
      userId: 'u1',
    });
    await expect(provider.user()).resolves.toEqual({
      kind: 'unreachable',
      status: 0,
    });
    await provider.user();
    expect(provider.calls).toEqual({ claims: 1, user: 2 });
  });
});
