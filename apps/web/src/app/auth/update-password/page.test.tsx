import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: mocks.claims ? { claims: mocks.claims } : null,
      }),
    },
  }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));

import UpdatePasswordPage from './page';

const page = (next?: string) =>
  UpdatePasswordPage({
    searchParams: Promise.resolve(next === undefined ? {} : { next }),
  });
const redirectedTo = async (run: Promise<unknown>) => {
  try {
    await run;
  } catch (error) {
    return (error as { url?: string }).url ?? null;
  }
  return null;
};

describe('the choose-a-password page', () => {
  beforeEach(() => {
    mocks.claims = { sub: 'u1' };
  });

  it('hands the card the place to go back to', async () => {
    const element = await page('/u1/settings');

    expect(element.props).toMatchObject({ next: '/u1/settings' });
  });

  it.each([
    ['no destination', undefined],
    ['an external URL', 'https://evil.test/steal'],
    ['a protocol-relative URL', '//evil.test/steal'],
    ['a script URL', 'javascript:alert(1)'],
  ])(
    'passes nothing on for %s, so the action picks home',
    async (_label, next) => {
      const element = await page(next);

      expect(element.props).toMatchObject({ next: '' });
    },
  );

  it('sends someone without a reset session back to start over', async () => {
    mocks.claims = null;

    expect(await redirectedTo(page('/u1/settings'))).toBe(
      '/auth/forgot-password?expired=1',
    );
  });
});
