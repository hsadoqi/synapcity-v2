import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => {
    mocks.createClient();
    return { auth: { getUser: mocks.getUser }, from: mocks.from };
  },
}));

import { saveAccountPreferences } from './preferences-actions';
import { accountPart } from '@synapcity/domain-preferences';
import { settingsDefaults } from '@synapcity/domain-preferences';

const preferences = accountPart({
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'fr' },
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.select.mockResolvedValue({
    data: [{ user_id: 'user-1' }],
    error: null,
  });
  mocks.upsert.mockReturnValue({ select: mocks.select });
  mocks.from.mockReturnValue({ upsert: mocks.upsert });
});

describe('saveAccountPreferences', () => {
  it("upserts the caller's own row with the validated preferences", async () => {
    await expect(
      saveAccountPreferences(preferences, 'Europe/Paris'),
    ).resolves.toEqual({ ok: true });
    expect(mocks.from).toHaveBeenCalledWith('user_preferences');
    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        preferences,
        schema_version: 1,
        device_timezone: 'Europe/Paris',
      },
      { onConflict: 'user_id' },
    );
  });

  it('takes the user id from the session, never from the input', async () => {
    await saveAccountPreferences(
      { ...preferences, user_id: 'someone-else' },
      'UTC',
    );
    const [row] = mocks.upsert.mock.calls[0]!;
    expect(row.user_id).toBe('user-1');
    expect(row.preferences).not.toHaveProperty('user_id');
  });

  it('rejects invalid preferences without calling Supabase', async () => {
    const result = await saveAccountPreferences(
      {
        ...preferences,
        regional: { ...preferences.regional, timezone: 'Invalid/Zone' },
      },
      'UTC',
    );
    expect(result).toMatchObject({ ok: false });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it.each([['Invalid/Zone'], [42], ['x'.repeat(65)], [null]])(
    'leaves out an unusable device timezone (%j)',
    async (timezone) => {
      await saveAccountPreferences(preferences, timezone);
      expect(mocks.upsert.mock.calls[0]![0]).not.toHaveProperty(
        'device_timezone',
      );
    },
  );

  it('asks a signed-out caller to sign in again', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'session_not_found', status: 401 },
    });
    await expect(
      saveAccountPreferences(preferences, 'UTC'),
    ).resolves.toMatchObject({ ok: false, signedOut: true });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['a database error', { data: null, error: { code: '42501' } }],
    ['no row written', { data: [], error: null }],
  ])('reports a failed save on %s', async (_case, response) => {
    mocks.select.mockResolvedValue(response);
    await expect(saveAccountPreferences(preferences, 'UTC')).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
  });
});

describe('saveAccountPreferences in development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is rejected before a Supabase client is built', async () => {
    const result = await saveAccountPreferences(preferences, 'Europe/Paris');

    expect(result).toMatchObject({ ok: false });
    expect(!result.ok && result.error).toContain('Fixture mode');
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

describe('saveAccountPreferences caller identity', () => {
  it('tells the caller to try again when the provider is unreachable', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(saveAccountPreferences(preferences, 'UTC')).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('asks a signed-out caller to sign in again and logs it by code only', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(saveAccountPreferences(preferences, 'UTC')).resolves.toEqual({
      ok: false,
      error: 'Sign in again to update your profile.',
      signedOut: true,
    });
    expect(console.warn).toHaveBeenCalledWith('getCallerIdentity failed', {
      code: undefined,
      status: undefined,
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
