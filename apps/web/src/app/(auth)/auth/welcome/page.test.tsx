import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
}));

vi.mock('@/features/auth/server/session', () => ({
  getVerifiedClaims: async () => mocks.claims,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));

import WelcomePage from './page';

const page = (next?: string) =>
  WelcomePage({
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

describe('the welcome page', () => {
  beforeEach(() => {
    mocks.claims = {
      sub: 'u1',
      email: 'ada@example.com',
      user_metadata: { full_name: 'Ada', avatar_url: 'https://gh.test/a.png' },
    };
  });

  it('hands the card the name and photo from the verified claims', async () => {
    const element = await page('/u1/settings');

    expect(element.props).toMatchObject({
      defaultName: 'Ada',
      imageUrl: 'https://gh.test/a.png',
      next: '/u1/settings',
    });
  });

  it('passes the card nothing a Server Component cannot hand to a Client Component', async () => {
    const element = await page('/u1/settings');

    // The sign-in route is a function; it is supplied inside the client card.
    expect(element.props.signInHref).toBeUndefined();
  });

  it('starts with an empty name when the account has none', async () => {
    mocks.claims = { sub: 'u1', user_metadata: {} };

    const element = await page();

    expect(element.props).toMatchObject({ defaultName: '', imageUrl: null });
  });

  it.each([
    ['no destination', undefined],
    ['an external URL', 'https://evil.test/steal'],
    ['a protocol-relative URL', '//evil.test/steal'],
    ['a script URL', 'javascript:alert(1)'],
  ])('continues to their own home for %s', async (_label, next) => {
    const element = await page(next);

    expect(element.props.next).toBe('/u1/home');
  });

  it('sends a signed-out visitor to sign in, then back here to the same place', async () => {
    mocks.claims = null;

    const url = await redirectedTo(page('/u1/settings'));

    expect(url).toBe(
      `/auth/login?next=${encodeURIComponent('/auth/welcome?next=%2Fu1%2Fsettings')}`,
    );
  });

  it('does not carry an unsafe destination through the sign-in', async () => {
    mocks.claims = null;

    const url = await redirectedTo(page('//evil.test/steal'));

    expect(url).not.toMatch(/evil/);
    expect(url).toBe(
      `/auth/login?next=${encodeURIComponent('/auth/welcome?next=%2F')}`,
    );
  });
});
