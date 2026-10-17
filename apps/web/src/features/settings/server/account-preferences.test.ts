import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({ createClient }));

import {
  getAccountPreferences,
  loadAccountPreferences,
} from './account-preferences';
import type { Supabase } from '@/features/account/server/caller';
import { settingsDefaults } from '../types/settings';

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const supabase = { from } as unknown as Supabase;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('loadAccountPreferences', () => {
  it("reads the caller's own row", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        preferences: { regional: { language: 'de' } },
        device_timezone: 'Europe/Berlin',
      },
      error: null,
    });
    const loaded = await loadAccountPreferences(supabase, 'user-1');
    expect(from).toHaveBeenCalledWith('user_preferences');
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(loaded?.preferences?.regional).toEqual({
      ...settingsDefaults.regional,
      language: 'de',
    });
    expect(loaded?.deviceTimezone).toBe('Europe/Berlin');
  });

  it('reports a missing row as nothing saved yet', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(loadAccountPreferences(supabase, 'user-1')).resolves.toEqual({
      preferences: null,
      deviceTimezone: null,
    });
  });

  it('returns undefined when the read fails, so the page falls back to the browser', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: '42501' } });
    await expect(
      loadAccountPreferences(supabase, 'user-1'),
    ).resolves.toBeUndefined();
  });
});

describe('getAccountPreferences in development fixture mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('SYNAPCITY_DEV_AUTH', 'fixture');
  });
  afterEach(() => vi.unstubAllEnvs());

  // The root layout asks on every page, so this must not reach Supabase.
  it('is undefined without building a Supabase client', async () => {
    await expect(
      getAccountPreferences('fixture-user'),
    ).resolves.toBeUndefined();
    expect(createClient).not.toHaveBeenCalled();
  });
});
