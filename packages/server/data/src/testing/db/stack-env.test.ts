import { describe, expect, it } from 'vitest';

import { stackEnv } from './stack-env';

const FULL = {
  SUPABASE_DB_URL: 'postgresql://postgres:secret@127.0.0.1:56221/postgres',
  DB_TEST_API_URL: 'http://127.0.0.1:56220',
  DB_TEST_PUBLISHABLE_KEY: 'pk',
  DB_TEST_SERVICE_KEY: 'sk',
};

describe('stackEnv', () => {
  it('reads a loopback stack', () => {
    expect(stackEnv(FULL)).toEqual({
      dbUrl: FULL.SUPABASE_DB_URL,
      apiUrl: FULL.DB_TEST_API_URL,
      publishableKey: 'pk',
      serviceKey: 'sk',
    });
  });

  it.each([
    [
      'database',
      {
        SUPABASE_DB_URL:
          'postgresql://u:secret@db.abcdefghijklmnopqrst.supabase.co:5432/postgres',
      },
    ],
    ['API', { DB_TEST_API_URL: 'https://abcdefghijklmnopqrst.supabase.co' }],
  ])('refuses a hosted %s address without printing its credentials', (_name, override) => {
    try {
      stackEnv({ ...FULL, ...override });
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/not a loopback address/);
      expect(message).not.toContain('secret');
    }
  });

  it('says how to start the stack when it is not described', () => {
    expect(() => stackEnv({})).toThrow(/test:db/);
  });
});
