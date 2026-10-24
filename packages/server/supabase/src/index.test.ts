import { describe, expect, it } from 'vitest';

describe('@synapcity/server-supabase root entry', () => {
  it('loads behind its server-only guard and exposes the adapter', async () => {
    const entry = await import('./index');

    expect(Object.keys(entry).sort()).toEqual([
      'createRequestClient',
      'outcomeFromClaims',
      'supabaseIdentityProvider',
    ]);
  });
});
