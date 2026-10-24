import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

const createServerClient = vi.hoisted(() =>
  vi.fn((_url: string, _key: string, _options: unknown) => ({ client: true })),
);
vi.mock('@supabase/ssr', () => ({ createServerClient }));

import { createRequestClient, type SupabaseServerClient } from './index';

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: object }[]) => void;
};

function cookieMethods(): CookieMethods {
  const options = createServerClient.mock.calls[0]![2] as {
    cookies: CookieMethods;
  };
  return options.cookies;
}

describe('createRequestClient', () => {
  beforeEach(() => createServerClient.mockClear());

  it('builds a client for the given project and key', () => {
    const client = createRequestClient({
      url: 'https://project.supabase.test',
      publishableKey: 'publishable',
      cookies: { getAll: () => [], set: vi.fn() },
    });

    expect(client).toEqual({ client: true });
    expect(createServerClient).toHaveBeenCalledWith(
      'https://project.supabase.test',
      'publishable',
      expect.objectContaining({ cookies: expect.any(Object) }),
    );
  });

  it('reads the host’s cookies', () => {
    const cookies = [{ name: 'sb-access', value: 'token' }];
    createRequestClient({
      url: 'u',
      publishableKey: 'k',
      cookies: { getAll: () => cookies, set: vi.fn() },
    });

    expect(cookieMethods().getAll()).toEqual(cookies);
  });

  it('writes each cookie through the host', () => {
    const set = vi.fn();
    createRequestClient({
      url: 'u',
      publishableKey: 'k',
      cookies: { getAll: () => [], set },
    });

    cookieMethods().setAll([
      { name: 'a', value: '1', options: { path: '/' } },
      { name: 'b', value: '2', options: {} },
    ]);

    expect(set.mock.calls).toEqual([
      ['a', '1', { path: '/' }],
      ['b', '2', {}],
    ]);
  });

  it('ignores a host that cannot write cookies (a Server Component render)', () => {
    createRequestClient({
      url: 'u',
      publishableKey: 'k',
      cookies: {
        getAll: () => [],
        set: () => {
          throw new Error('Cookies can only be modified in a Server Action');
        },
      },
    });

    expect(() =>
      cookieMethods().setAll([{ name: 'a', value: '1', options: {} }]),
    ).not.toThrow();
  });
});

describe('SupabaseServerClient', () => {
  it('is the type of the client a request builds', () => {
    expectTypeOf<SupabaseServerClient>().toEqualTypeOf<
      ReturnType<typeof createRequestClient>
    >();
  });
});
