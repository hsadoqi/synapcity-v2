import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadAccountPreferences } from './account-preferences';
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
