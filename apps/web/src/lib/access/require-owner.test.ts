import { beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims } }),
}));

import { requireOwner } from './require-owner';

function digestOf(error: unknown): string {
  return String((error as { digest?: unknown }).digest ?? '');
}

async function failure(userId: string): Promise<string> {
  try {
    await requireOwner(userId);
  } catch (error) {
    return digestOf(error);
  }
  return 'did not throw';
}

describe('requireOwner', () => {
  beforeEach(() => getClaims.mockReset());

  it('returns the claims when the signed-in user owns the route', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });

    await expect(requireOwner('u1')).resolves.toEqual({ sub: 'u1' });
  });

  it('sends a signed-out visitor to sign in, then back to that home', async () => {
    getClaims.mockResolvedValue({ data: null });

    const digest = await failure('u1');

    expect(digest).toContain('NEXT_REDIRECT');
    expect(digest).toContain('/auth/login?next=%2Fu1%2Fhome');
  });

  it('answers 404, not 403, for someone else’s id so ids are not confirmed', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'someone-else' } } });

    expect(await failure('u1')).toContain('404');
  });
});
