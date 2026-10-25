import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createBrowserSupabaseClient: vi.fn(),
  getSupabaseEnv: vi.fn(),
}));

vi.mock('@synapcity/frontend-supabase', () => ({
  createBrowserSupabaseClient: mocks.createBrowserSupabaseClient,
}));
vi.mock('./env', () => ({ getSupabaseEnv: mocks.getSupabaseEnv }));

import { createClient } from './client';

describe('createClient', () => {
  beforeEach(() => {
    mocks.createBrowserSupabaseClient.mockReset();
    mocks.getSupabaseEnv.mockReset();
  });

  it('passes the host environment into the package factory', () => {
    const env = { url: 'https://example.supabase.co', publishableKey: 'key' };
    const client = { auth: {} };
    mocks.getSupabaseEnv.mockReturnValue(env);
    mocks.createBrowserSupabaseClient.mockReturnValue(client);

    expect(createClient()).toBe(client);
    expect(mocks.createBrowserSupabaseClient).toHaveBeenCalledWith(env);
  });

  it('lets a missing environment value surface instead of building a client', () => {
    mocks.getSupabaseEnv.mockImplementation(() => {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
    });

    expect(() => createClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL');
    expect(mocks.createBrowserSupabaseClient).not.toHaveBeenCalled();
  });
});
