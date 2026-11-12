import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
  row: null as Record<string, unknown> | null,
}));

// The profile row the page reads its names from.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: mocks.row, error: null }),
        }),
      }),
    }),
  }),
}));
const row = (names: Record<string, string | null>) => ({
  first_name: null,
  last_name: null,
  display_name: null,
  avatar_url: null,
  profile_completed_at: null,
  profile_setup_skipped_at: null,
  ...names,
});

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
    mocks.row = row({ display_name: 'Ada' });
  });

  it('hands the card the names from the profile row and the photo from the claims', async () => {
    mocks.row = row({
      first_name: 'Ada',
      last_name: 'Lovelace',
      display_name: 'Countess',
    });
    const element = await page('/u1/settings');

    expect(element.props).toMatchObject({
      defaultFirstName: 'Ada',
      defaultLastName: 'Lovelace',
      defaultName: 'Countess',
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
    mocks.row = row({});

    const element = await page();

    expect(element.props).toMatchObject({
      defaultFirstName: '',
      defaultLastName: '',
      defaultName: '',
      imageUrl: null,
    });
  });

  it('prefills the first name from an explicit given_name only, never by splitting a full name', async () => {
    mocks.row = row({ display_name: 'Ada Lovelace' });
    mocks.claims = {
      sub: 'u1',
      user_metadata: { full_name: 'Ada Lovelace', given_name: 'Ada' },
    };
    expect((await page()).props.defaultFirstName).toBe('Ada');

    mocks.claims = { sub: 'u1', user_metadata: { full_name: 'Ada Lovelace' } };
    expect((await page()).props.defaultFirstName).toBe('');
  });

  it('prefers the stored first name to the provider’s', async () => {
    mocks.row = row({ first_name: 'Augusta' });
    mocks.claims = { sub: 'u1', user_metadata: { given_name: 'Ada' } };

    expect((await page()).props.defaultFirstName).toBe('Augusta');
  });

  it('still renders, with the provider prefill, when the profile cannot be read', async () => {
    mocks.row = null;
    mocks.claims = { sub: 'u1', user_metadata: { given_name: 'Ada' } };

    expect((await page()).props).toMatchObject({
      defaultFirstName: 'Ada',
      defaultName: '',
    });
  });

  it('does not offer an email registrant their first name as a display name', async () => {
    // Email registration stores first_name, not a display name. Completing
    // this step saves the field as the display name, so it must start empty.
    mocks.claims = {
      sub: 'u1',
      email: 'ada@example.com',
      user_metadata: { first_name: 'Ada', last_name: 'Lovelace' },
    };
    mocks.row = row({ first_name: 'Ada', last_name: 'Lovelace' });

    const element = await page();

    expect(element.props.defaultName).toBe('');
    expect(element.props.defaultFirstName).toBe('Ada');
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
