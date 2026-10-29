import { beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims } }),
}));

import Page from './page';

async function digestOf(userId: string): Promise<string> {
  try {
    await Page({ params: Promise.resolve({ userId }) });
  } catch (error) {
    return String((error as { digest?: unknown }).digest ?? '');
  }
  return 'did not throw';
}

describe('the bare /<userId> page', () => {
  beforeEach(() => getClaims.mockReset());

  it('sends a signed-out visitor to sign in with their home as the way back', async () => {
    getClaims.mockResolvedValue({ data: null });

    const digest = await digestOf('u1');

    expect(digest).toContain('NEXT_REDIRECT');
    expect(digest).toContain('/auth/login?next=%2Fu1%2Fhome');
  });

  it('sends the owner to their home', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });

    expect(await digestOf('u1')).toContain('/u1/home');
  });

  it('answers 404 for someone else’s id', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'other' } } });

    expect(await digestOf('u1')).toContain('404');
  });
});
