import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRequestClient: vi.fn((_options: unknown) => ({ client: true })),
  getAll: vi.fn(() => [{ name: 'sb-access', value: 'token' }]),
  set: vi.fn(),
}));

vi.mock('@synapcity/server-supabase', () => ({
  createRequestClient: mocks.createRequestClient,
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }),
}));
vi.mock('./env', () => ({
  getSupabaseEnv: () => ({
    url: 'https://project.supabase.test',
    publishableKey: 'publishable',
  }),
}));

import { createClient } from './server';

type Options = {
  url: string;
  publishableKey: string;
  cookies: {
    getAll: () => unknown;
    set: (name: string, value: string, options: object) => void;
  };
};

const lastOptions = () =>
  mocks.createRequestClient.mock.calls.at(-1)![0] as Options;

describe('createClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds a request client for the configured project', async () => {
    await expect(createClient()).resolves.toEqual({ client: true });
    expect(lastOptions()).toMatchObject({
      url: 'https://project.supabase.test',
      publishableKey: 'publishable',
    });
  });

  it("reads and writes this request's Next.js cookies", async () => {
    await createClient();
    const { cookies } = lastOptions();

    expect(cookies.getAll()).toEqual([{ name: 'sb-access', value: 'token' }]);
    cookies.set('sb-access', 'next', { path: '/' });
    expect(mocks.set).toHaveBeenCalledWith('sb-access', 'next', { path: '/' });
  });

  it('builds a new client on every call, never a shared one', async () => {
    await createClient();
    await createClient();

    expect(mocks.createRequestClient).toHaveBeenCalledTimes(2);
  });
});
