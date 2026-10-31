import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mocks.createBrowserClient,
}));

import { createBrowserSupabaseClient } from '.';

describe('createBrowserSupabaseClient', () => {
  beforeEach(() => {
    mocks.createBrowserClient.mockReset();
  });

  it('builds the browser client from the host-supplied url and key', () => {
    const client = { auth: {} };
    mocks.createBrowserClient.mockReturnValue(client);

    const result = createBrowserSupabaseClient({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test',
    });

    expect(mocks.createBrowserClient).toHaveBeenCalledTimes(1);
    expect(mocks.createBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_test',
    );
    expect(result).toBe(client);
  });

  it('reads no environment: a different call gets different values', () => {
    createBrowserSupabaseClient({ url: 'https://a.test', publishableKey: 'a' });
    createBrowserSupabaseClient({ url: 'https://b.test', publishableKey: 'b' });

    expect(mocks.createBrowserClient).toHaveBeenNthCalledWith(
      1,
      'https://a.test',
      'a',
    );
    expect(mocks.createBrowserClient).toHaveBeenNthCalledWith(
      2,
      'https://b.test',
      'b',
    );
  });
});
