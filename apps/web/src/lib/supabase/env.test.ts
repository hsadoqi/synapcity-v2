import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSupabaseEnv } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSupabaseEnv', () => {
  it('returns the URL and the publishable key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');

    expect(getSupabaseEnv()).toEqual({
      url: 'https://abc.supabase.co',
      publishableKey: 'sb_publishable_x',
    });
  });

  it('names NEXT_PUBLIC_SUPABASE_URL when it is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x');

    expect(() => getSupabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL is not set/,
    );
  });

  it('names NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY when it is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

    expect(() => getSupabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set/,
    );
  });

  it('says where to set the variable', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');

    expect(() => getSupabaseEnv()).toThrow(/\.env\.local/);
  });

  it('never echoes the key value in an error', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'sb_publishable_secretish',
    );

    expect(() => getSupabaseEnv()).not.toThrow(/secretish/);
  });
});
