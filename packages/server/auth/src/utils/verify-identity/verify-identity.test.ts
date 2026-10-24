import { describe, expect, it } from 'vitest';

import { fakeIdentityProvider } from '../../testing';
import { verifyIdentity, verifyIdentityWithProvider } from './index';

const verified = { status: 'verified', identity: { userId: 'u1' } } as const;

describe('verifyIdentity (claims path)', () => {
  it('verifies a user the provider vouches for', async () => {
    const provider = fakeIdentityProvider({
      claims: { kind: 'user', userId: 'u1' },
    });

    await expect(verifyIdentity(provider)).resolves.toEqual({
      result: verified,
    });
  });

  it('treats an empty user id as signed out', async () => {
    const provider = fakeIdentityProvider({
      claims: { kind: 'user', userId: '' },
    });

    await expect(verifyIdentity(provider)).resolves.toEqual({
      result: { status: 'signed-out' },
    });
  });

  it('treats no session as signed out, with no failure detail', async () => {
    const verification = await verifyIdentity(fakeIdentityProvider());

    expect(verification).toEqual({ result: { status: 'signed-out' } });
    expect(verification).not.toHaveProperty('failure');
  });

  it.each([
    { kind: 'refused', code: 'bad_jwt', status: 401 },
    { kind: 'unreachable', status: 0 },
  ] as const)(
    'reads a $kind provider as signed out, never unavailable',
    async (outcome) => {
      const { kind, ...failure } = outcome;
      void kind;

      await expect(
        verifyIdentity(fakeIdentityProvider({ claims: outcome })),
      ).resolves.toEqual({ result: { status: 'signed-out' }, failure });
    },
  );

  it('asks the provider for claims only, once', async () => {
    const provider = fakeIdentityProvider({
      claims: { kind: 'user', userId: 'u1' },
    });

    await verifyIdentity(provider);

    expect(provider.calls).toEqual({ claims: 1, user: 0 });
  });
});

describe('verifyIdentityWithProvider (fresh path)', () => {
  it('verifies a user the provider vouches for', async () => {
    const provider = fakeIdentityProvider({
      user: { kind: 'user', userId: 'u1' },
    });

    await expect(verifyIdentityWithProvider(provider)).resolves.toEqual({
      result: verified,
    });
  });

  it('treats no user as signed out, with no failure detail', async () => {
    const verification = await verifyIdentityWithProvider(
      fakeIdentityProvider(),
    );

    expect(verification).toEqual({ result: { status: 'signed-out' } });
    expect(verification).not.toHaveProperty('failure');
  });

  it('treats a refused session as signed out and keeps the detail', async () => {
    const provider = fakeIdentityProvider({
      user: { kind: 'refused', code: 'user_not_found', status: 403 },
    });

    await expect(verifyIdentityWithProvider(provider)).resolves.toEqual({
      result: { status: 'signed-out' },
      failure: { code: 'user_not_found', status: 403 },
    });
  });

  it('reports an unreachable provider as unavailable, not signed out', async () => {
    const provider = fakeIdentityProvider({
      user: { kind: 'unreachable', status: 0 },
    });

    await expect(verifyIdentityWithProvider(provider)).resolves.toEqual({
      result: { status: 'unavailable' },
      failure: { status: 0 },
    });
  });

  it('treats an empty user id as signed out', async () => {
    const provider = fakeIdentityProvider({
      user: { kind: 'user', userId: '' },
    });

    await expect(verifyIdentityWithProvider(provider)).resolves.toEqual({
      result: { status: 'signed-out' },
    });
  });

  it('asks the provider for the user only, once', async () => {
    const provider = fakeIdentityProvider({
      user: { kind: 'user', userId: 'u1' },
    });

    await verifyIdentityWithProvider(provider);

    expect(provider.calls).toEqual({ claims: 0, user: 1 });
  });
});
